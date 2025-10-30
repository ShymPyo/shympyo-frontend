import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  Modal,
  FlatList,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '../types';
import { Colors } from '../constants/colors';
import ApiService, { User } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useThemedStyles } from '../hooks/useThemedStyles';

type ProfileEditScreenRouteProp = RouteProp<RootStackParamList, 'ProfileEdit'>;
type ProfileEditScreenNavigationProp = StackNavigationProp<RootStackParamList>;

// 로컬 프로필 이미지들
const profileImages = [
  { id: '1', image: require('../../assets/profiles/profile1.png') },
  { id: '2', image: require('../../assets/profiles/profile2.png') },
  { id: '3', image: require('../../assets/profiles/profile3.png') },
  { id: '4', image: require('../../assets/profiles/profile4.png') },
  { id: '5', image: require('../../assets/profiles/profile5.png') },
  { id: '6', image: require('../../assets/profiles/profile6.png') },
  { id: '7', image: require('../../assets/profiles/profile7.png') },
  { id: '8', image: require('../../assets/profiles/profile8.png') },
];

const ProfileEditScreen: React.FC = () => {
  const navigation = useNavigation<ProfileEditScreenNavigationProp>();
  const route = useRoute<ProfileEditScreenRouteProp>();
  const { user: initialUser } = route.params;
  const { accessToken, updateUser } = useAuth();
  const { colors, getFontSize, statusBarStyle } = useThemedStyles();

  const [name, setName] = useState(initialUser.name);
  const [phone, setPhone] = useState(initialUser.phone);
  const [nickname, setNickname] = useState(initialUser.nickname || '');
  const [bio, setBio] = useState(initialUser.bio || '');
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(profileImages[0].image);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isImageSourceModalVisible, setImageSourceModalVisible] = useState(false);
  const [statusBarKey, setStatusBarKey] = useState(0);

  // Refs for scrolling
  const scrollViewRef = React.useRef<ScrollView>(null);
  const nameInputRef = React.useRef<View>(null);
  const phoneInputRef = React.useRef<View>(null);
  const nicknameInputRef = React.useRef<View>(null);
  const bioInputRef = React.useRef<View>(null);

  useFocusEffect(
    React.useCallback(() => {
      setStatusBarKey(prev => prev + 1);
    }, [])
  );

  // 입력창 포커스 시 스크롤
  const scrollToInput = (inputRef: React.RefObject<View>) => {
    setTimeout(() => {
      inputRef.current?.measureLayout(
        scrollViewRef.current as any,
        (x, y) => {
          scrollViewRef.current?.scrollTo({
            y: y - 100,
            animated: true
          });
        },
        () => {}
      );
    }, 100);
  };

  const handleSave = async () => {
    if (!name.trim() || !phone.trim() || !nickname.trim() || !bio.trim()) {
      Alert.alert('오류', '모든 필드를 입력해주세요.');
      return;
    }
    if (!accessToken) {
      Alert.alert('오류', '로그인이 필요합니다.');
      return;
    }

    setLoading(true);

    try {
      let imageUrl = `default_${selectedImageIndex}`;

      // 사용자가 새 이미지를 선택한 경우, presigned URL 업로드 실행
      if (customImage) {
        console.log('커스텀 이미지 업로드 시작:', customImage);

        // 1. 파일 정보 추출
        const fileExtension = customImage.split('.').pop()?.toLowerCase() || 'jpg';
        const response = await fetch(customImage);
        const blob = await response.blob();
        const contentType = blob.type;

        // 2. Presigned URL 요청
        const presignResponse = await ApiService.getProfileImagePresignedUrl(accessToken, contentType, fileExtension);

        if (!presignResponse.success || !presignResponse.data) {
          throw new Error(presignResponse.message || 'Presigned URL을 받아오지 못했습니다.');
        }

        const { uploadUrl, publicUrl } = presignResponse.data;
        console.log('Presigned URL 수신 성공');

        // 3. NCP Object Storage로 직접 업로드 (PUT)
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': contentType,
            'x-amz-acl': 'public-read', 
          },
          body: blob,
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error('NCP 업로드 실패:', errorText);
          throw new Error('이미지 업로드에 실패했습니다.');
        }
        
        console.log('NCP 업로드 성공');
        imageUrl = publicUrl; // 최종 저장될 URL은 publicUrl
      }

      // 4. 백엔드 서버에 프로필 정보 업데이트
      const updateData = {
        name: name.trim(),
        phone: phone.trim(),
        nickname: nickname.trim(),
        bio: bio.trim(),
        imageUrl: imageUrl,
      };

      const finalResponse = await ApiService.updateMe(accessToken, updateData);

      if (finalResponse.success && finalResponse.data) {
        updateUser(finalResponse.data);
        setProfileImage({ uri: finalResponse.data.imageUrl }); // 이미지 상태를 새 URL로 즉시 업데이트
        Alert.alert('성공', '프로필이 업데이트되었습니다.', [
          { text: '확인', onPress: () => navigation.goBack() }
        ]);
      } else {
        throw new Error(finalResponse.message || '프로필 업데이트에 실패했습니다.');
      }

    } catch (error: any) {
      console.error('프로필 업데이트 에러:', error);
      Alert.alert('오류', error.message || '프로필 업데이트 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectImage = (image: any, index: number) => {
    setProfileImage(image);
    setSelectedImageIndex(index);
    setCustomImage(null); // 기본 이미지 선택 시 커스텀 이미지 초기화
    setModalVisible(false);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진을 선택하려면 갤러리 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setCustomImage(result.assets[0].uri);
      setProfileImage({ uri: result.assets[0].uri });
      setImageSourceModalVisible(false);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진을 촬영하려면 카메라 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setCustomImage(result.assets[0].uri);
      setProfileImage({ uri: result.assets[0].uri });
      setImageSourceModalVisible(false);
    }
  };

  const showImageSourceOptions = () => {
    Alert.alert(
      '프로필 이미지 선택',
      '이미지를 선택하는 방법을 고르세요',
      [
        { text: '기본 프로필 선택', onPress: () => setModalVisible(true) },
        { text: '갤러리에서 선택', onPress: pickImage },
        { text: '사진 촬영', onPress: takePhoto },
        { text: '취소', style: 'cancel' },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar key={statusBarKey} style={statusBarStyle as any} />

      {/* 헤더 */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { fontSize: getFontSize(18), color: colors.text.primary }]}>프로필 편집</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading} style={[styles.saveButton, loading && styles.saveButtonDisabled]}>
          <Text style={[styles.saveButtonText, { fontSize: getFontSize(16), color: loading ? colors.text.light : colors.primary }]}>
            {loading ? '저장 중...' : '저장'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        {/* 프로필 이미지 섹션 */}
        <View style={styles.profileImageSection}>
          <TouchableOpacity style={styles.profileImageContainer} onPress={showImageSourceOptions}>
            <Image source={profileImage} style={styles.profileImage} />
            <View style={styles.cameraIconContainer}>
              <Ionicons name="camera" size={20} color="white" />
            </View>
          </TouchableOpacity>
          <Text style={[styles.profileImageText, { fontSize: getFontSize(14), color: colors.text.secondary }]}>프로필 사진</Text>
        </View>

        {/* 정보 입력 섹션 */}
        <View style={styles.formSection}>
          {/* 이메일 (읽기 전용) */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { fontSize: getFontSize(14), color: colors.text.secondary }]}>이메일</Text>
            <View style={[styles.readOnlyInput, { backgroundColor: colors.surface }]}>
              <Text style={[styles.readOnlyText, { fontSize: getFontSize(16), color: colors.text.light }]}>{initialUser.email}</Text>
            </View>
          </View>

          {/* 이름 */}
          <View style={styles.inputGroup} ref={nameInputRef}>
            <Text style={[styles.label, { fontSize: getFontSize(14), color: colors.text.secondary }]}>이름</Text>
            <TextInput
              style={[styles.input, { fontSize: getFontSize(16), color: colors.text.primary, backgroundColor: colors.surface, borderColor: colors.surface }]}
              value={name}
              onChangeText={setName}
              placeholder="이름을 입력하세요"
              placeholderTextColor={colors.text.light}
              editable={!loading}
              onFocus={() => scrollToInput(nameInputRef)}
            />
          </View>

          {/* 전화번호 */}
          <View style={styles.inputGroup} ref={phoneInputRef}>
            <Text style={[styles.label, { fontSize: getFontSize(14), color: colors.text.secondary }]}>전화번호</Text>
            <TextInput
              style={[styles.input, { fontSize: getFontSize(16), color: colors.text.primary, backgroundColor: colors.surface, borderColor: colors.surface }]}
              value={phone}
              onChangeText={setPhone}
              placeholder="전화번호를 입력하세요"
              placeholderTextColor={colors.text.light}
              keyboardType="phone-pad"
              editable={!loading}
              onFocus={() => scrollToInput(phoneInputRef)}
            />
          </View>

          {/* 닉네임 */}
          <View style={styles.inputGroup} ref={nicknameInputRef}>
            <Text style={[styles.label, { fontSize: getFontSize(14), color: colors.text.secondary }]}>닉네임</Text>
            <TextInput
              style={[styles.input, { fontSize: getFontSize(16), color: colors.text.primary, backgroundColor: colors.surface, borderColor: colors.surface }]}
              value={nickname}
              onChangeText={setNickname}
              placeholder="닉네임을 입력하세요"
              placeholderTextColor={colors.text.light}
              editable={!loading}
              onFocus={() => scrollToInput(nicknameInputRef)}
            />
          </View>

          {/* 자기소개 */}
          <View style={styles.inputGroup} ref={bioInputRef}>
            <Text style={[styles.label, { fontSize: getFontSize(14), color: colors.text.secondary }]}>자기소개</Text>
            <TextInput
              style={[styles.input, styles.bioInput, { fontSize: getFontSize(16), color: colors.text.primary, backgroundColor: colors.surface, borderColor: colors.surface }]}
              value={bio}
              onChangeText={setBio}
              placeholder="자기소개를 입력하세요"
              placeholderTextColor={colors.text.light}
              multiline={true}
              numberOfLines={3}
              textAlignVertical="top"
              maxLength={200}
              editable={!loading}
              onFocus={() => scrollToInput(bioInputRef)}
            />
          </View>

        </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 프로필 이미지 선택 Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
        presentationStyle="overFullScreen"
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { fontSize: getFontSize(18), color: colors.text.primary }]}>프로필 이미지 선택</Text>
            <FlatList
              data={profileImages}
              renderItem={({ item, index }) => (
                <TouchableOpacity onPress={() => handleSelectImage(item.image, index)}>
                  <Image source={item.image} style={styles.modalImage} />
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id}
              numColumns={4}
              contentContainerStyle={styles.imageList}
              scrollEnabled={false}
            />
            <TouchableOpacity style={[styles.closeButton, { backgroundColor: colors.background }]} onPress={() => setModalVisible(false)}>
              <Text style={[styles.closeButtonText, { fontSize: getFontSize(16), color: colors.text.secondary }]}>취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileImageSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: Colors.surface,
    marginBottom: 20,
  },
  profileImageContainer: {
    marginBottom: 12,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    borderRadius: 15,
    padding: 5,
  },
  profileImageText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  formSection: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.text.primary,
    backgroundColor: Colors.surface,
  },
  readOnlyInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  readOnlyText: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  bioInput: {
    height: 80,
    paddingTop: 12,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    alignItems: 'center',
    maxHeight: 350,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  imageList: {
    justifyContent: 'center',
  },
  modalImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    margin: 8,
  },
  closeButton: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileEditScreen;