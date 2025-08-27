import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { Colors } from '../constants/colors';
import { RootStackParamList } from '../types';

type AdminMainScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AdminMain'>;

// 임시 데이터
const mockLetters = [
  { id: '1', customerName: '배민형', content: '대출 프로필에 설정한 자기 소개', date: '2025-07-15 10:30', isRead: false },
  { id: '2', customerName: '배민형2', content: '감사 편지', date: '2025-07-15 10:30', isRead: true },
  { id: '3', customerName: '인하대 12학번의', content: '감사 편지', date: '2025-07-14 10:30', isRead: true },
  { id: '4', customerName: '아구팀', content: '감사 편지', date: '2025-07-13 10:30', isRead: true },
  { id: '5', customerName: '김가고던', content: '감사 편지', date: '2025-07-12 10:30', isRead: true },
  { id: '6', customerName: '삼창주식회사', content: '감사 편지', date: '2025-07-11 10:30', isRead: true },
];

const AdminMainScreen: React.FC = () => {
  const navigation = useNavigation<AdminMainScreenNavigationProp>();
  const [selectedLetter, setSelectedLetter] = useState<typeof mockLetters[0] | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);

  const unreadCount = mockLetters.filter(letter => !letter.isRead).length;

  const handleLetterPress = (letter: typeof mockLetters[0]) => {
    setSelectedLetter(letter);
    setModalVisible(true);
  };

  const handleEditProfile = () => {
    navigation.navigate('AdminSpaceEdit');
  };

  const handleLogout = () => {
    navigation.replace('Login');
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
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/shympyo_logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 환영 메시지 */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>카페빈스 사장님 환영합니다 !</Text>
          <Text style={styles.welcomeSubtitle}>공간 나눔의 건전으로 감사드립니다.</Text>
        </View>

        {/* 공간 프로필 카드 */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Text style={styles.profileTitle}>공간 프로필</Text>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={handleEditProfile}
            >
              <Ionicons name="create" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.profileContent}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80' }} 
              style={styles.shopImage}
            />
            <View style={styles.shopInfo}>
              <Text style={styles.shopName}>카페 빈스</Text>
              <View style={styles.shopDetails}>
                <Ionicons name="time" size={16} color={Colors.text.secondary} />
                <Text style={styles.shopTime}>12:00 ~ 22:00</Text>
              </View>
              <Text style={styles.shopSubtext}>토요일 정기휴무</Text>
              <View style={styles.shopLocation}>
                <Ionicons name="location" size={16} color={Colors.text.secondary} />
                <Text style={styles.shopAddress}>인하대 후문</Text>
                <Text style={styles.shopBuilding}>서곡대 빌딩 2층</Text>
              </View>
            </View>
          </View>
          
          <Text style={styles.shopDescription}>다정한 카페로 우영한 카페 빈스입니다 !</Text>
          <Text style={styles.shopSubDescription}>더텐디 편하게 쉬었다 가세요 ~ !</Text>
        </View>

        {/* 편지함 섹션 */}
        <View style={styles.letterSection}>
          <View style={styles.letterHeader}>
            <Text style={styles.sectionTitle}>편지함</Text>
            <View style={styles.letterCount}>
              <Ionicons name="alert-circle" size={16} color={Colors.primary} />
              <Text style={styles.countText}>새로운 편지가 {unreadCount}개입니다.</Text>
            </View>
          </View>
          <View style={styles.notificationBanner}>
            <Ionicons name="mail" size={20} color={Colors.text.primary} />
            <Text style={styles.notificationText}>지금까지 총 130개의{'\n'}감사 편지를 받았어요 !</Text>
          </View>
        </View>

        {/* 편지 리스트 */}
        <View style={styles.letterList}>
          {mockLetters.map(renderLetter)}
        </View>

        {/* 인원 현황 */}
        <View style={styles.statsSection}>
          <Text style={styles.statsTitle}>인원 현황 (2/5)</Text>
          <View style={styles.statsContainer}>
            <View style={styles.userStats}>
              <View style={styles.userProfile}>
                <Text style={styles.userProfileText}>😊</Text>
              </View>
              <Text style={styles.userName}>배민형 님</Text>
              <Text style={styles.userTime}>19:59</Text>
            </View>
            <View style={styles.userStats}>
              <View style={styles.userProfile}>
                <Text style={styles.userProfileText}>😊</Text>
              </View>
              <Text style={styles.userName}>아구팀 님</Text>
              <Text style={styles.userTime}>1:04</Text>
            </View>
          </View>
        </View>

        {/* 로그아웃 버튼 */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#FF4444" style={styles.logoutIcon} />
          <Text style={styles.logoutButtonText}>로그아웃</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.text.light} />
        </TouchableOpacity>
      </ScrollView>

      {/* 편지 상세 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
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
                <Text style={styles.modalText}>대출 프로필에 설정한 자기 소개</Text>
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 140,
    height: 60,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  welcomeSection: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 5,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  editButton: {
    padding: 5,
  },
  profileContent: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  shopImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 5,
  },
  shopDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  shopTime: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginLeft: 5,
  },
  shopSubtext: {
    fontSize: 12,
    color: Colors.text.light,
    marginBottom: 5,
  },
  shopLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopAddress: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginLeft: 5,
    marginRight: 5,
  },
  shopBuilding: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  shopDescription: {
    fontSize: 14,
    color: Colors.text.primary,
    marginBottom: 5,
    backgroundColor: '#F8F9FA',
    padding: 10,
    borderRadius: 8,
  },
  shopSubDescription: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  letterSection: {
    marginBottom: 15,
  },
  letterHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 5,
  },
  letterCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countText: {
    fontSize: 14,
    color: Colors.primary,
    marginLeft: 5,
    fontWeight: '600',
  },
  notificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  notificationText: {
    fontSize: 14,
    color: Colors.text.primary,
    marginLeft: 10,
    fontWeight: '500',
  },
  letterList: {
    marginBottom: 20,
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
  letterDate: {
    fontSize: 12,
    color: Colors.text.light,
    marginBottom: 8,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  statsSection: {
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  userStats: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 15,
    borderRadius: 12,
    width: '45%',
  },
  userProfile: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFE4B5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  userProfileText: {
    fontSize: 24,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 3,
  },
  userTime: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopWidth: 8,
    borderTopColor: '#F0F0F0',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 30,
  },
  logoutIcon: {
    marginRight: 15,
  },
  logoutButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#FF4444',
    fontWeight: '500',
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
});

export default AdminMainScreen;