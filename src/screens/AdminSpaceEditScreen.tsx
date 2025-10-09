import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { Colors } from '../constants/colors';
import { RootStackParamList } from '../types';
import ApiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';

type AdminSpaceEditScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AdminSpaceEdit'>;
type AdminSpaceEditScreenRouteProp = RouteProp<RootStackParamList, 'AdminSpaceEdit'>;

const AdminSpaceEditScreen: React.FC = () => {
  const navigation = useNavigation<AdminSpaceEditScreenNavigationProp>();
  const route = useRoute<AdminSpaceEditScreenRouteProp>();
  const { accessToken } = useAuth();
  const { place } = route.params;

  // 공간 정보 상태
  const [spaceName, setSpaceName] = useState(place.name);
  const [location, setLocation] = useState(place.address);
  const [description, setDescription] = useState(place.content);
  const [imageUrl, setImageUrl] = useState(place.imageUrl);

  // 이용 인원 설정 상태
  const [maxUsers, setMaxUsers] = useState(place.maxCapacity.toString());
  const [showUserModal, setShowUserModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  // 인원 설정 옵션들
  const userOptions = [
    { label: '1명', value: '1' },
    { label: '2명', value: '2' },
    { label: '3명', value: '3' },
    { label: '4명', value: '4' },
    { label: '5명', value: '5' },
    { label: '6명', value: '6' },
    { label: '7명', value: '7' },
    { label: '8명', value: '8' },
    { label: '10명', value: '10' },
    { label: '12명', value: '12' },
    { label: '15명', value: '15' },
    { label: '20명', value: '20' },
  ];

  const handleSave = async () => {
    if (!spaceName || !location || !description) {
      Alert.alert('알림', '모든 필수 정보를 입력해주세요.');
      return;
    }

    if (!accessToken) {
      Alert.alert('오류', '인증 정보가 없습니다.');
      return;
    }

    try {
      setIsSaving(true);

      const response = await ApiService.updatePlace(
        {
          name: spaceName,
          content: description,
          maxCapacity: parseInt(maxUsers),
          imageUrl: imageUrl,
          address: location,
        },
        accessToken
      );

      if (response.success) {
        Alert.alert(
          '저장 완료',
          '공간 프로필이 성공적으로 업데이트되었습니다.',
          [
            {
              text: '확인',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('오류', response.message || '저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('💥 쉼터 수정 오류:', error);
      Alert.alert('오류', '저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUserSelection = (value: string) => {
    setMaxUsers(value);
    setShowUserModal(false);
  };

  const formatMaxUsers = (users: string) => {
    return `최대 ${users}명`;
  };

  const handleTextInputFocus = (offsetY: number) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: offsetY - 100,
        animated: true,
      });
    }, 300);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={0}
      >
        {/* 헤더 */}
        <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>공간 프로필 수정</Text>
        </View>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>저장</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.content} 
        showsVerticalScrollIndicator={false}
      >
        {/* 공간 이미지 */}
        <View style={styles.imageSection}>
          <Image
            source={{ uri: imageUrl || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' }}
            style={styles.spaceImage}
          />
          <TouchableOpacity style={styles.imageEditButton}>
            <Ionicons name="camera" size={20} color="white" />
            <Text style={styles.imageEditText}>사진 변경</Text>
          </TouchableOpacity>
        </View>

        {/* 기본 정보 */}
        <View style={[styles.section, styles.sectionCard]}>
          

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>공간 이름 *</Text>
            <TextInput
              style={styles.input}
              value={spaceName}
              onChangeText={setSpaceName}
              placeholder="공간 이름을 입력하세요"
              onFocus={() => handleTextInputFocus(200)}
            />
          </View>
        </View>

        {/* 위치 정보 */}
        <View style={[styles.section, styles.sectionCard]}>
          

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>주소 *</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="주소를 입력하세요"
            />
          </View>
        </View>

        {/* 공간 소개 */}
        <View style={[styles.section, styles.sectionCard]}>
          

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>소개글 *</Text>
            <TextInput
              style={styles.textArea}
              value={description}
              onChangeText={setDescription}
              placeholder="공간에 대한 소개와 안내사항을 입력하세요"
              multiline
              numberOfLines={5}
            />
          </View>
        </View>

        {/* 이용 인원 설정 */}
        <View style={[styles.section, styles.sectionCard]}>
          
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>최대 이용 인원 *</Text>
            <TouchableOpacity 
              style={styles.timeSelector}
              onPress={() => setShowUserModal(true)}
            >
              <Text style={styles.timeSelectorText}>
                {formatMaxUsers(maxUsers)}
              </Text>
              <Ionicons name="chevron-down" size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
            <Text style={styles.helperText}>
              동시에 이용할 수 있는 최대 인원을 설정하세요
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* 인원 선택 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showUserModal}
        onRequestClose={() => setShowUserModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>최대 이용 인원 선택</Text>
              <TouchableOpacity onPress={() => setShowUserModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.timeOptions}>
              {userOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.timeOption,
                    maxUsers === option.value && styles.selectedTimeOption
                  ]}
                  onPress={() => handleUserSelection(option.value)}
                >
                  <Text style={[
                    styles.timeOptionText,
                    maxUsers === option.value && styles.selectedTimeOptionText
                  ]}>
                    {option.label}
                  </Text>
                  {maxUsers === option.value && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 5,
  },
  headerCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    zIndex: -1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  imageSection: {
    position: 'relative',
    marginBottom: 20,
  },
  spaceImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#f0f0f0',
  },
  imageEditButton: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  imageEditText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 5,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 0,
  },
  sectionCard: {
    backgroundColor: 'transparent',
    marginHorizontal: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },

  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  textArea: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputGroupHalf: {
    width: '48%',
    marginBottom: 20,
  },
  timeSelector: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  timeSelectorText: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  helperText: {
    fontSize: 12,
    color: Colors.text.light,
    marginTop: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  timeOptions: {
    marginTop: 20,
  },
  timeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 5,
  },
  selectedTimeOption: {
    backgroundColor: '#E8F4FD',
  },
  timeOptionText: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  selectedTimeOptionText: {
    color: Colors.primary,
    fontWeight: '600',
  },
});

export default AdminSpaceEditScreen;