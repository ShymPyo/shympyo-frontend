import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Modal,
  FlatList,
  Keyboard,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../types';
import { Colors } from '../constants/colors';
import { useThemedStyles } from '../hooks/useThemedStyles';

type ProfileSetupNavigationProp = StackNavigationProp<RootStackParamList, 'ProfileSetup'>;

const ProfileSetupScreen: React.FC = () => {
  const navigation = useNavigation<ProfileSetupNavigationProp>();
  const { colors, getFontSize, statusBarStyle } = useThemedStyles();
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState(require('../../assets/profiles/user_profile.png')); // 기본 이미지로 초기화


  // 키보드 닫기 함수
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleSave = () => {
    // 프로필 정보를 저장하는 로직 (실제로는 AsyncStorage나 서버에 저장)
    navigation.replace('Main');
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
      setProfileImage({ uri: result.assets[0].uri });
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
      setProfileImage({ uri: result.assets[0].uri });
    }
  };

  const showImageSourceOptions = () => {
    Alert.alert(
      '프로필 이미지 선택',
      '이미지를 선택하는 방법을 고르세요',
      [
        { text: '갤러리에서 선택', onPress: pickImage },
        { text: '사진 촬영', onPress: takePhoto },
        { text: '취소', style: 'cancel' },
      ]
    );
  };

  return (
    <Pressable onPress={dismissKeyboard} style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={statusBarStyle as any} />
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.surface }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.title, { fontSize: getFontSize(18), color: colors.text.primary }]}>프로필 편집</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* 키보드가 올라올 때 콘텐츠가 위로 올라가도록 KeyboardAvoidingView 적용 */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* 프로필 이미지 선택 영역 */}
            <TouchableOpacity style={styles.profileImageContainer} onPress={showImageSourceOptions}>
              <Image source={profileImage} style={styles.profileImage} />
              <View style={styles.cameraIconContainer}>
                <Ionicons name="camera" size={20} color="white" />
              </View>
            </TouchableOpacity>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { fontSize: getFontSize(14), color: colors.text.secondary }]}>닉네임</Text>
              <TextInput
                style={[styles.input, { fontSize: getFontSize(16), color: colors.text.primary, backgroundColor: colors.surface, borderColor: colors.surface }]}
                value={nickname}
                onChangeText={setNickname}
                placeholder="닉네임을 입력하세요"
                placeholderTextColor={colors.text.light}
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { fontSize: getFontSize(14), color: colors.text.secondary }]}>자기소개</Text>
              <TextInput
                style={[styles.input, styles.bioInput, { fontSize: getFontSize(16), color: colors.text.primary, backgroundColor: colors.surface, borderColor: colors.surface }]}
                value={bio}
                onChangeText={setBio}
                placeholder="자기소개를 입력하세요"
                placeholderTextColor={colors.text.light}
                multiline
                returnKeyType="done"
              />
            </View>

            <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSave}>
              <Text style={[styles.saveButtonText, { fontSize: getFontSize(16) }]}>저장</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    alignItems: 'center',
    paddingBottom: 40, // 키보드 여유 공간
  },
  profileImageContainer: {
    marginBottom: 30,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
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
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
  },
  saveButtonText: {
    color: Colors.text.white,
    fontSize: 16,
    fontWeight: '600',
  },
  fixedModalContainer: {
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

export default ProfileSetupScreen;
