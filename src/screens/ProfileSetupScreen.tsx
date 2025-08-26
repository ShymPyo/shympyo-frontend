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
  TouchableWithoutFeedback,
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

type ProfileSetupNavigationProp = StackNavigationProp<RootStackParamList, 'ProfileSetup'>;

// 로컬 프로필 이미지들 - assets/profiles 폴더에서 가져옴
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

const ProfileSetupScreen: React.FC = () => {
  const navigation = useNavigation<ProfileSetupNavigationProp>();
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState(profileImages[0].image); // 첫 번째 로컬 이미지로 초기화
  const [isModalVisible, setModalVisible] = useState(false);

  // 키보드 닫기 함수
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleSave = () => {
    // 프로필 정보를 저장하는 로직 (실제로는 AsyncStorage나 서버에 저장)
    navigation.replace('Main');
  };

  const handleSelectImage = (image: any) => {
    setProfileImage(image);
    setModalVisible(false);
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>프로필 편집</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* 키보드가 올라올 때 콘텐츠가 위로 올라가도록 KeyboardAvoidingView 적용 */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* 프로필 이미지 선택 영역 */}
            <TouchableOpacity style={styles.profileImageContainer} onPress={() => setModalVisible(true)}>
              <Image source={profileImage} style={styles.profileImage} />
              <View style={styles.cameraIconContainer}>
                <Ionicons name="camera" size={20} color="white" />
              </View>
            </TouchableOpacity>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>닉네임</Text>
              <TextInput
                style={styles.input}
                value={nickname}
                onChangeText={setNickname}
                placeholder="닉네임을 입력하세요"
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>자기소개</Text>
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={bio}
                onChangeText={setBio}
                placeholder="자기소개를 입력하세요"
                multiline
                returnKeyType="done"
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>저장</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>

      {/* 프로필 이미지 선택 Modal - 완전 고정 위치, 키보드 영향 차단 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
        presentationStyle="overFullScreen"
        statusBarTranslucent={true}
      >
        <View style={styles.fixedModalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>프로필 이미지 선택</Text>
            <FlatList
              data={profileImages}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => handleSelectImage(item.image)}>
                  <Image source={item.image} style={styles.modalImage} />
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id}
              numColumns={4}
              contentContainerStyle={styles.imageList}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
            />
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </SafeAreaView>
    </TouchableWithoutFeedback>
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
