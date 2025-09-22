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

import { RootStackParamList } from '../types';
import { Colors } from '../constants/colors';
import ApiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';

type SignUpScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SignUp'>;

const SignUpScreen: React.FC = () => {
  const navigation = useNavigation<SignUpScreenNavigationProp>();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const validateForm = () => {
    if (!email || !password || !confirmPassword || !name || !phone) {
      const missing = [];
      if (!email) missing.push('이메일');
      if (!name) missing.push('이름');
      if (!phone) missing.push('전화번호');
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
        role: 'USER' as const
      };

      const response = await ApiService.signUp(signUpData);

      if (response.success) {
        console.log('✅ 회원가입 성공');
        Alert.alert('회원가입 성공', '회원가입이 완료되었습니다.', [
          { text: '확인', onPress: () => navigation.navigate('Login') }
        ]);
      } else {
        console.log('❌ 회원가입 실패');
        Alert.alert('회원가입 실패', response.message || '알 수 없는 오류가 발생했습니다.');
      }
    } catch (error: any) {
      console.error('❌ 회원가입 오류:', error);
      Alert.alert('회원가입 실패', '회원가입 중 오류가 발생했습니다.');
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
              style={styles.backButton} 
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

            <Text style={styles.title} numberOfLines={1}>회원가입</Text>
            
            <View style={styles.inputContainer}>
              {/* 이메일 입력 */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel} numberOfLines={1}>이메일 *</Text>
                <TextInput
                  style={styles.input}
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
                <Text style={styles.fieldLabel} numberOfLines={1}>이름 *</Text>
                <TextInput
                  style={styles.input}
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
                <Text style={styles.fieldLabel} numberOfLines={1}>전화번호 *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="010-1234-5678"
                  value={phone}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                  maxLength={13}
                  editable={true}
                  selectTextOnFocus={true}
                />
              </View>
              
              {/* 비밀번호 입력 */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel} numberOfLines={1}>비밀번호 *</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
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
                <Text style={styles.fieldLabel} numberOfLines={1}>비밀번호 확인 *</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
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
                <Text style={styles.signUpButtonText} numberOfLines={1}>회원가입</Text>
              )}
            </TouchableOpacity>
            

            <View style={styles.footer}>
              <Text style={styles.copyright}>© 2025. All rights reserved.</Text>
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
    top: 20,
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