import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Keyboard,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { RootStackParamList } from '../types';
import { Colors } from '../constants/colors';
import ApiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useThemedStyles } from '../hooks/useThemedStyles';

type SignUpScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SignUp'>;

const SignUpScreen: React.FC = () => {
  const navigation = useNavigation<SignUpScreenNavigationProp>();
  const { login } = useAuth();
  const { colors, getFontSize, statusBarStyle } = useThemedStyles();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [nickname, setNickname] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 기본 프로필 이미지들
  const defaultProfiles = [
    require('../../assets/profiles/profile1.png'),
    require('../../assets/profiles/profile2.png'),
    require('../../assets/profiles/profile3.png'),
    require('../../assets/profiles/profile4.png'),
    require('../../assets/profiles/profile5.png'),
    require('../../assets/profiles/profile6.png'),
    require('../../assets/profiles/profile7.png'),
  ];

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const validateForm = () => {
    if (!email || !password || !confirmPassword || !name || !phone || !nickname || !bio) {
      const missing = [];
      if (!email) missing.push('이메일');
      if (!name) missing.push('이름');
      if (!phone) missing.push('전화번호');
      if (!nickname) missing.push('닉네임');
      if (!bio) missing.push('자기소개');
      if (!password) missing.push('비밀번호');
      if (!confirmPassword) missing.push('비밀번호 확인');

      Alert.alert('알림', `다음 필드를 입력해주세요: ${missing.join(', ')}`);
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('알림', '올바른 이메일 형식을 입력해주세요.');
      return false;
    }

    if (password.length < 8) {
      Alert.alert('알림', '비밀번호는 8자리 이상이어야 합니다.');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('알림', '비밀번호가 일치하지 않습니다.');
      return false;
    }

    const phoneRegex = /^010-\d{4}-\d{4}$/;
    if (!phoneRegex.test(phone)) {
      Alert.alert('알림', `전화번호는 010-1234-5678 형식으로 입력해주세요.\n현재 입력: ${phone}`);
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const signUpData = {
        email: email.trim(),
        password: password,
        name: name.trim(),
        phone: phone.trim(),
        nickname: nickname.trim(),
        imageUrl: profileImage || undefined,
        bio: bio.trim(),
        role: 'USER' as const
      };

      const response = await ApiService.signUp(signUpData);

      if (response.success) {
        console.log('✅ 회원가입 성공');
        Alert.alert('회원가입 성공', '회원가입이 완료되었습니다.', [
          { text: '확인', onPress: () => navigation.navigate('Login') }
        ]);
      } else {
        console.log('❌ 회원가입 실패:', response.message);

        // 에러 코드별 맞춤 메시지
        let errorTitle = '회원가입 실패';
        let errorMessage = response.message || '알 수 없는 오류가 발생했습니다.';

        if (response.code === 400) {
          if (response.message?.includes('이미 존재하는 이메일')) {
            errorTitle = '이메일 중복';
            errorMessage = '이미 사용 중인 이메일입니다. 다른 이메일을 사용해주세요.';
          } else if (response.message?.includes('이미 존재하는 닉네임')) {
            errorTitle = '닉네임 중복';
            errorMessage = '이미 사용 중인 닉네임입니다. 다른 닉네임을 사용해주세요.';
          } else if (response.message?.includes('이미 존재하는 전화번호')) {
            errorTitle = '전화번호 중복';
            errorMessage = '이미 등록된 전화번호입니다. 다른 전화번호를 사용해주세요.';
          } else if (response.message?.includes('유효하지 않은')) {
            errorTitle = '입력 오류';
            errorMessage = response.message;
          }
        } else if (response.code === 500) {
          errorTitle = '서버 오류';
          errorMessage = '서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
        }

        Alert.alert(errorTitle, errorMessage);
      }
    } catch (error: any) {
      console.error('❌ 회원가입 오류:', error);

      let errorMessage = '회원가입 중 오류가 발생했습니다.';

      if (error.message?.includes('네트워크 연결 오류')) {
        errorMessage = '인터넷 연결을 확인하고 다시 시도해주세요.';
      } else if (error.message?.includes('인증이 필요')) {
        errorMessage = '인증에 문제가 발생했습니다. 앱을 재시작해주세요.';
      }

      Alert.alert('연결 오류', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{4})(\d{4})$/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
    return text;
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhone(formatted);
  };

  const pickImage = async () => {
    // 권한 요청
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진을 선택하려면 갤러리 접근 권한이 필요합니다.');
      return;
    }

    // 이미지 선택
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    // 카메라 권한 요청
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진을 촬영하려면 카메라 접근 권한이 필요합니다.');
      return;
    }

    // 사진 촬영
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const showDefaultProfilePicker = () => {
    Alert.alert(
      '기본 프로필 선택',
      '사용할 기본 프로필을 선택하세요',
      [
        ...defaultProfiles.map((profile, index) => ({
          text: `프로필 ${index + 1}`,
          onPress: () => setProfileImage(`default_${index}`),
        })),
        { text: '취소', style: 'cancel' },
      ]
    );
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      '프로필 이미지 선택',
      '이미지를 선택하는 방법을 고르세요',
      [
        { text: '기본 프로필 선택', onPress: showDefaultProfilePicker },
        { text: '갤러리에서 선택', onPress: pickImage },
        { text: '사진 촬영', onPress: takePhoto },
        { text: '취소', style: 'cancel' },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity
              style={[styles.backButton, { top: Platform.OS === 'android' ? 40 : 20 }]}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
            </TouchableOpacity>

            <View style={styles.logoContainer}>
              <Image 
                source={require('../../assets/shympyo_logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <Text style={[styles.title, { fontSize: getFontSize(28) }]} numberOfLines={1}>회원가입</Text>
            
            <View style={styles.inputContainer}>
              {/* 이메일 입력 */}
              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, { fontSize: getFontSize(14) }]} numberOfLines={1}>이메일 *</Text>
                <TextInput
                  style={[styles.input, { fontSize: getFontSize(16) }]}
                  placeholder="user@example.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={true}
                  selectTextOnFocus={true}
                />
              </View>

              {/* 이름 입력 */}
              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, { fontSize: getFontSize(14) }]} numberOfLines={1}>이름 *</Text>
                <TextInput
                  style={[styles.input, { fontSize: getFontSize(16) }]}
                  placeholder="홍길동"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  editable={true}
                  selectTextOnFocus={true}
                />
              </View>

              {/* 전화번호 입력 */}
              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, { fontSize: getFontSize(14) }]} numberOfLines={1}>전화번호 *</Text>
                <TextInput
                  style={[styles.input, { fontSize: getFontSize(16) }]}
                  placeholder="010-1234-5678"
                  value={phone}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                  maxLength={13}
                  editable={true}
                  selectTextOnFocus={true}
                />
              </View>

              {/* 닉네임 입력 */}
              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, { fontSize: getFontSize(14) }]} numberOfLines={1}>닉네임 *</Text>
                <TextInput
                  style={[styles.input, { fontSize: getFontSize(16) }]}
                  placeholder="길동이"
                  value={nickname}
                  onChangeText={setNickname}
                  autoCapitalize="none"
                  editable={true}
                  selectTextOnFocus={true}
                />
              </View>

              {/* 프로필 이미지 선택 */}
              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, { fontSize: getFontSize(14) }]} numberOfLines={1}>프로필 이미지 (선택사항)</Text>
                <TouchableOpacity
                  style={styles.imagePickerContainer}
                  onPress={showImagePickerOptions}
                >
                  <View style={styles.imagePreviewContainer}>
                    {profileImage ? (
                      <Image
                        source={
                          profileImage.startsWith('default_')
                            ? defaultProfiles[parseInt(profileImage.split('_')[1])]
                            : { uri: profileImage }
                        }
                        style={styles.imagePreview}
                      />
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <Ionicons name="person" size={40} color={Colors.text.light} />
                      </View>
                    )}
                  </View>
                  <View style={styles.imagePickerTextContainer}>
                    <Text style={[styles.imagePickerText, { fontSize: getFontSize(16) }]}>
                      {profileImage ? '이미지 변경' : '이미지 선택'}
                    </Text>
                    <Text style={[styles.imagePickerSubtext, { fontSize: getFontSize(12) }]}>
                      기본 프로필, 갤러리, 카메라
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* 자기소개 입력 */}
              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, { fontSize: getFontSize(14) }]} numberOfLines={1}>자기소개 *</Text>
                <TextInput
                  style={[styles.input, styles.bioInput, { fontSize: getFontSize(16) }]}
                  placeholder="안녕하세요! 여행을 좋아하는 홍길동입니다."
                  value={bio}
                  onChangeText={setBio}
                  multiline={true}
                  numberOfLines={3}
                  textAlignVertical="top"
                  editable={true}
                  selectTextOnFocus={true}
                  maxLength={200}
                />
              </View>

              {/* 비밀번호 입력 */}
              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, { fontSize: getFontSize(14) }]} numberOfLines={1}>비밀번호 *</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.passwordInput, { fontSize: getFontSize(16) }]}
                    placeholder="P@ssw0rd! (8자리 이상)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={true}
                    selectTextOnFocus={true}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off" : "eye"}
                      size={20}
                      color={Colors.text.light}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* 비밀번호 확인 */}
              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, { fontSize: getFontSize(14) }]} numberOfLines={1}>비밀번호 확인 *</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.passwordInput, { fontSize: getFontSize(16) }]}
                    placeholder="비밀번호를 다시 입력하세요"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={true}
                    selectTextOnFocus={true}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons
                      name={showConfirmPassword ? "eye-off" : "eye"}
                      size={20}
                      color={Colors.text.light}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.signUpButton, isLoading && styles.signUpButtonDisabled]}
              onPress={() => {
                console.log('👆 회원가입 버튼 클릭됨');
                handleSignUp();
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={[styles.signUpButtonText, { fontSize: getFontSize(18) }]} numberOfLines={1}>회원가입</Text>
              )}
            </TouchableOpacity>


            <View style={styles.footer}>
              <Text style={[styles.copyright, { fontSize: getFontSize(12) }]}>© 2025. All rights reserved.</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingTop: 50,
  },
  backButton: {
    position: 'absolute',
    left: 30,
    zIndex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 40,
  },
  logo: {
    width: 150,
    height: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 30,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    paddingRight: 50,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  eyeButton: {
    position: 'absolute',
    right: 15,
    top: 17,
  },
  bioInput: {
    height: 80,
    paddingTop: 15,
  },
  imagePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  imagePreviewContainer: {
    marginRight: 15,
  },
  imagePreview: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  imagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerTextContainer: {
    flex: 1,
  },
  imagePickerText: {
    fontSize: 16,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  imagePickerSubtext: {
    fontSize: 12,
    color: Colors.text.light,
  },
  signUpButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 30,
  },
  signUpButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signUpButtonDisabled: {
    opacity: 0.6,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  copyright: {
    fontSize: 12,
    color: Colors.text.light,
  },
});

export default SignUpScreen;