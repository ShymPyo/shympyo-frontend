import React, { useState } from 'react';
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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { Colors } from '../constants/colors';
import { RootStackParamList } from '../types';

type AdminSpaceEditScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AdminSpaceEdit'>;

const AdminSpaceEditScreen: React.FC = () => {
  const navigation = useNavigation<AdminSpaceEditScreenNavigationProp>();
  
  // 공간 정보 상태
  const [spaceName, setSpaceName] = useState('카페 빈스');
  const [openTime, setOpenTime] = useState('12:00');
  const [closeTime, setCloseTime] = useState('22:00');
  const [closedDays, setClosedDays] = useState('토요일 정기휴무');
  const [location, setLocation] = useState('인하대 후문');
  const [building, setBuilding] = useState('서곡대 빌딩 2층');
  const [description, setDescription] = useState('다정한 카페로 우영한 카페 빈스입니다 !');
  const [subDescription, setSubDescription] = useState('더텐디 편하게 쉬었다 가세요 ~ !');
  
  // 이용 시간 설정 상태
  const [maxUsageMinutes, setMaxUsageMinutes] = useState('60');
  const [showTimeModal, setShowTimeModal] = useState(false);
  
  // 시간 설정 옵션들 (분 단위)
  const timeOptions = [
    { label: '10분', value: '10' },
    { label: '30분', value: '30' },
    { label: '60분', value: '60' },
    { label: '90분', value: '90' },
    { label: '120분', value: '120' },
    { label: '사용자 정의', value: 'custom' },
  ];

  const handleSave = () => {
    if (!spaceName || !openTime || !closeTime || !maxUsageMinutes) {
      Alert.alert('알림', '모든 필수 정보를 입력해주세요.');
      return;
    }

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
  };

  const handleTimeSelection = (value: string) => {
    if (value === 'custom') {
      setShowTimeModal(false);
      // 커스텀 시간 입력을 위해 모달을 닫고 직접 입력 가능하도록 함
      return;
    }
    setMaxUsageMinutes(value);
    setShowTimeModal(false);
  };

  const formatUsageTime = (minutes: string) => {
    const num = parseInt(minutes);
    if (num >= 60) {
      const hours = Math.floor(num / 60);
      const remainingMinutes = num % 60;
      return remainingMinutes > 0 ? `${hours}시간 ${remainingMinutes}분` : `${hours}시간`;
    }
    return `${minutes}분`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>공간 프로필 수정</Text>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>저장</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 공간 이미지 */}
        <View style={styles.imageSection}>
          <Image 
            source={{ uri: 'https://via.placeholder.com/300x200' }} 
            style={styles.spaceImage}
          />
          <TouchableOpacity style={styles.imageEditButton}>
            <Ionicons name="camera" size={20} color="white" />
            <Text style={styles.imageEditText}>사진 변경</Text>
          </TouchableOpacity>
        </View>

        {/* 기본 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>기본 정보</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>공간 이름 *</Text>
            <TextInput
              style={styles.input}
              value={spaceName}
              onChangeText={setSpaceName}
              placeholder="공간 이름을 입력하세요"
            />
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputGroupHalf}>
              <Text style={styles.inputLabel}>영업 시작 *</Text>
              <TextInput
                style={styles.input}
                value={openTime}
                onChangeText={setOpenTime}
                placeholder="12:00"
              />
            </View>
            <View style={styles.inputGroupHalf}>
              <Text style={styles.inputLabel}>영업 종료 *</Text>
              <TextInput
                style={styles.input}
                value={closeTime}
                onChangeText={setCloseTime}
                placeholder="22:00"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>휴무일</Text>
            <TextInput
              style={styles.input}
              value={closedDays}
              onChangeText={setClosedDays}
              placeholder="휴무일을 입력하세요"
            />
          </View>
        </View>

        {/* 위치 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>위치 정보</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>주요 위치</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="주요 위치를 입력하세요"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>상세 주소</Text>
            <TextInput
              style={styles.input}
              value={building}
              onChangeText={setBuilding}
              placeholder="건물명, 층수 등을 입력하세요"
            />
          </View>
        </View>

        {/* 이용 시간 설정 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>이용 시간 설정</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>최대 이용 시간 *</Text>
            <TouchableOpacity 
              style={styles.timeSelector}
              onPress={() => setShowTimeModal(true)}
            >
              <Text style={styles.timeSelectorText}>
                {formatUsageTime(maxUsageMinutes)}
              </Text>
              <Ionicons name="chevron-down" size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
            <Text style={styles.helperText}>
              고객이 QR 스캔 후 이용할 수 있는 최대 시간을 설정하세요
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>커스텀 시간 (분)</Text>
            <TextInput
              style={styles.input}
              value={maxUsageMinutes}
              onChangeText={setMaxUsageMinutes}
              placeholder="분 단위로 입력하세요"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* 공간 소개 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>공간 소개</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>메인 소개</Text>
            <TextInput
              style={styles.textArea}
              value={description}
              onChangeText={setDescription}
              placeholder="공간에 대한 소개를 입력하세요"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>추가 안내</Text>
            <TextInput
              style={styles.textArea}
              value={subDescription}
              onChangeText={setSubDescription}
              placeholder="추가 안내사항을 입력하세요"
              multiline
              numberOfLines={2}
            />
          </View>
        </View>
      </ScrollView>

      {/* 시간 선택 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showTimeModal}
        onRequestClose={() => setShowTimeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>최대 이용 시간 선택</Text>
              <TouchableOpacity onPress={() => setShowTimeModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.timeOptions}>
              {timeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.timeOption,
                    maxUsageMinutes === option.value && styles.selectedTimeOption
                  ]}
                  onPress={() => handleTimeSelection(option.value)}
                >
                  <Text style={[
                    styles.timeOptionText,
                    maxUsageMinutes === option.value && styles.selectedTimeOptionText
                  ]}>
                    {option.label}
                  </Text>
                  {maxUsageMinutes === option.value && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
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
    height: 200,
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
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  textArea: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    textAlignVertical: 'top',
    minHeight: 80,
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
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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