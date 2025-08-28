import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { Colors } from '../constants/colors';
import { RootStackParamList } from '../types';

type AdminLetterListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AdminLetterList'>;

// 임시 데이터
const mockLetters = [
  { id: '1', customerName: '배민형', content: '대출 프로필에 설정한 자기 소개', date: '2025-07-15 10:30', isRead: false },
  { id: '2', customerName: '배민형2', content: '감사 편지', date: '2025-07-15 10:30', isRead: true },
  { id: '3', customerName: '인하대 12학번의', content: '감사 편지', date: '2025-07-14 10:30', isRead: true },
  { id: '4', customerName: '아구팀', content: '감사 편지', date: '2025-07-13 10:30', isRead: true },
  { id: '5', customerName: '김가고던', content: '감사 편지', date: '2025-07-12 10:30', isRead: true },
  { id: '6', customerName: '삼창주식회사', content: '감사 편지', date: '2025-07-11 10:30', isRead: true },
  { id: '7', customerName: '김진우', content: '감사 편지', date: '2025-07-10 10:30', isRead: true },
  { id: '8', customerName: '박서연', content: '감사 편지', date: '2025-07-09 10:30', isRead: true },
  { id: '9', customerName: '이하늘', content: '감사 편지', date: '2025-07-08 10:30', isRead: true },
  { id: '10', customerName: '최민수', content: '감사 편지', date: '2025-07-07 10:30', isRead: true },
];

const AdminLetterListScreen: React.FC = () => {
  const navigation = useNavigation<AdminLetterListScreenNavigationProp>();
  const [selectedLetter, setSelectedLetter] = useState<typeof mockLetters[0] | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  const unreadCount = mockLetters.filter(letter => !letter.isRead).length;
  
  // 검색 필터링된 편지 목록
  const filteredLetters = mockLetters.filter(letter => 
    letter.customerName.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleLetterPress = (letter: typeof mockLetters[0]) => {
    setSelectedLetter(letter);
    setModalVisible(true);
  };

  const renderLetter = (letter: typeof mockLetters[0]) => (
    <TouchableOpacity
      key={letter.id}
      style={styles.letterCard}
      onPress={() => handleLetterPress(letter)}
    >
      <View style={styles.letterContent}>
        <View style={styles.letterHeader}>
          <Text style={styles.letterDate}>{letter.date}</Text>
          {!letter.isRead && <View style={styles.unreadIndicator} />}
        </View>
        <View style={styles.letterMain}>
          <View style={styles.profileCircle}>
            <Text style={styles.profileText}>😊</Text>
          </View>
          <View style={styles.letterTextContainer}>
            <Text style={styles.customerName}>{letter.customerName}</Text>
            <Text style={styles.letterPreview}>{letter.content}</Text>
          </View>
          <Ionicons 
            name={letter.isRead ? "mail-open" : "mail"} 
            size={24} 
            color={letter.isRead ? Colors.text.light : Colors.primary} 
          />
        </View>
      </View>
    </TouchableOpacity>
  );

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
        <Text style={styles.headerTitle}>편지함</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* 검색창 */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={Colors.text.light} />
          <TextInput
            style={styles.searchInput}
            placeholder="사용자 닉네임으로 검색..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor={Colors.text.light}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={20} color={Colors.text.light} />
            </TouchableOpacity>
          )}
        </View>
      </View>


      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 편지함 정보 */}
        <View style={styles.letterInfo}>
          <View style={styles.letterCount}>
            <Ionicons name="mail" size={20} color={Colors.primary} />
            <Text style={styles.countText}>지금까지 총 130개의 감사 편지를 받았어요 !</Text>
          </View>
          {unreadCount > 0 && (
            <View style={styles.unreadCount}>
              <Ionicons name="alert-circle" size={16} color={Colors.primary} />
              <Text style={styles.unreadCountText}>새로운 편지가 {unreadCount}개 도착했습니다.</Text>
            </View>
          )}
        </View>

        {/* 편지 리스트 */}
        <View style={styles.letterList}>
          {filteredLetters.length > 0 ? (
            filteredLetters.map(renderLetter)
          ) : searchText.length > 0 ? (
            <View style={styles.noResultsContainer}>
              <Ionicons name="search" size={48} color={Colors.text.light} />
              <Text style={styles.noResultsText}>'{searchText}'에 대한 검색 결과가 없습니다.</Text>
              <Text style={styles.noResultsSubtext}>다른 닉네임으로 검색해보세요.</Text>
            </View>
          ) : (
            mockLetters.map(renderLetter)
          )}
        </View>
      </ScrollView>

      {/* 편지 상세 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{selectedLetter?.customerName} 님의 감사 편지</Text>
              <View style={{ width: 24 }} />
            </View>
            
            <Text style={styles.modalDate}>{selectedLetter?.date} 발송</Text>
            
            <View style={styles.modalLetterContent}>
              <View style={styles.modalProfile}>
                <Text style={styles.modalProfileText}>😊</Text>
              </View>
              <View style={styles.modalTextSection}>
                <Text style={styles.modalLabel}>자기소개</Text>
                <Text style={styles.modalText}>대출 프로필에 설정한 자기 소개{'\n'}공간 프로필 편하게 쉬었다 가세요~!</Text>
              </View>
            </View>
            
            <View style={styles.modalLetterSection}>
              <Text style={styles.modalLabel}>편지 내용</Text>
              <Text style={styles.modalLetterText}>
                대출 더한 좋았는데 쇼핑다른 말{'\n'}
                삼겹련서 고맙다는 말{'\n'}
                나중에 커피 마시러 가겠다.
              </Text>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'space-between',
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
    marginLeft: 10,
    marginRight: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  letterInfo: {
    paddingVertical: 20,
  },
  letterCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    marginBottom: 10,
  },
  countText: {
    fontSize: 14,
    color: Colors.text.primary,
    marginLeft: 10,
    fontWeight: '500',
  },
  unreadCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadCountText: {
    fontSize: 14,
    color: Colors.primary,
    marginLeft: 5,
    fontWeight: '600',
  },
  letterList: {
    paddingBottom: 20,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  noResultsText: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginTop: 15,
    textAlign: 'center',
  },
  noResultsSubtext: {
    fontSize: 14,
    color: Colors.text.light,
    marginTop: 5,
    textAlign: 'center',
  },
  letterCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  letterContent: {
    padding: 15,
  },
  letterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  letterDate: {
    fontSize: 12,
    color: Colors.text.light,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  letterMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE4B5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileText: {
    fontSize: 20,
  },
  letterTextContainer: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 3,
  },
  letterPreview: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  modalDate: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalLetterContent: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  modalProfile: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFE4B5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  modalProfileText: {
    fontSize: 24,
  },
  modalTextSection: {
    flex: 1,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.light,
    marginBottom: 5,
  },
  modalText: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  modalLetterSection: {
    marginTop: 20,
  },
  modalLetterText: {
    fontSize: 16,
    color: Colors.text.primary,
    backgroundColor: Colors.surface,
    padding: 15,
    borderRadius: 8,
    lineHeight: 24,
  },
  modalSubText: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default AdminLetterListScreen;