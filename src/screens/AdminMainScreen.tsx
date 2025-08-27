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
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isUserModalVisible, setUserModalVisible] = useState(false);

  const unreadCount = mockLetters.filter(letter => !letter.isRead).length;

  // 현재 사용자들 데이터
  const currentUsers = [
    { 
      id: '1', 
      name: '배민형', 
      time: '19:59', 
      profileEmoji: '😊',
      introduction: '안녕하세요! 개발자로 일하고 있습니다.\n조용한 곳에서 집중하며 작업하는 것을 좋아해요.'
    },
    { 
      id: '2', 
      name: '아구팀', 
      time: '1:04', 
      profileEmoji: '😊',
      introduction: '팀프로젝트를 진행하고 있습니다!\n토론하면서 아이디어를 나누는 시간을 갖고 있어요.'
    }
  ];

  const handleEditProfile = () => {
    navigation.navigate('AdminSpaceEdit');
  };

  const handleLogout = () => {
    navigation.replace('Login');
  };

  const handleUserPress = (user: any) => {
    setSelectedUser(user);
    setUserModalVisible(true);
  };


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
          <Text style={styles.welcomeSubtitle}>쉼표를 제공해주셔서 진심으로 감사드립니다.</Text>
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
          
          <Text style={styles.shopDescription}>다정한 카페로 유명한 카페 빈스입니다 !</Text>
          <Text style={styles.shopSubDescription}>편하게 쉬었다 가세요 ~ !</Text>
        </View>

        {/* 편지함 섹션 */}
        <TouchableOpacity 
          style={styles.letterSection}
          onPress={() => navigation.navigate('AdminLetterList')}
        >
          <View style={styles.letterSectionHeader}>
            <Text style={styles.sectionTitle}>편지함</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.text.primary} />
          </View>
          {unreadCount > 0 && (
            <View style={styles.letterCount}>
              <Ionicons name="alert-circle" size={16} color={Colors.primary} />
              <Text style={styles.countText}>새로운 편지가 {unreadCount}개 도착했습니다.</Text>
            </View>
          )}
          <View style={styles.notificationBanner}>
            <Ionicons name="mail" size={20} color={Colors.text.primary} />
            <Text style={styles.notificationText}>지금까지 총 130개의{'\n'}감사 편지를 받았어요 !</Text>
          </View>
        </TouchableOpacity>

        {/* 인원 현황 */}
        <View style={styles.statsSection}>
          <Text style={styles.statsTitle}>인원 현황 (2/5)</Text>
          <View style={styles.statsGrid}>
            {/* 현재 사용자들 */}
            {currentUsers.map((user) => (
              <TouchableOpacity 
                key={user.id}
                style={styles.userStats}
                onPress={() => handleUserPress(user)}
              >
                <View style={styles.userProfile}>
                  <Text style={styles.userProfileText}>{user.profileEmoji}</Text>
                </View>
                <Text style={styles.userName}>{user.name} 님</Text>
                <Text style={styles.userTime}>{user.time}</Text>
              </TouchableOpacity>
            ))}
            
            {/* 빈 자리들 (총 5자리 중 사용자 수만큼 빼기) */}
            {Array.from({ length: 5 - currentUsers.length }, (_, index) => (
              <View key={`empty-${index}`} style={styles.emptySlot}>
                <View style={styles.emptyProfile}>
                  <Ionicons name="person-outline" size={24} color={Colors.text.light} />
                </View>
                <Text style={styles.emptyText}>빈 자리</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 로그아웃 버튼 */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#FF4444" style={styles.logoutIcon} />
          <Text style={styles.logoutButtonText}>로그아웃</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.text.light} />
        </TouchableOpacity>
      </ScrollView>

      {/* 사용자 프로필 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isUserModalVisible}
        onRequestClose={() => setUserModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setUserModalVisible(false)}
        >
          <TouchableOpacity 
            style={styles.userModalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.userModalHeader}>
              <TouchableOpacity onPress={() => setUserModalVisible(false)}>
                <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
              <Text style={styles.userModalTitle}>{selectedUser?.name} 님의 프로필</Text>
              <View style={{ width: 24 }} />
            </View>
            
            <View style={styles.userModalProfile}>
              <View style={styles.userModalProfileCircle}>
                <Text style={styles.userModalProfileEmoji}>{selectedUser?.profileEmoji}</Text>
              </View>
              <Text style={styles.userModalName}>{selectedUser?.name}</Text>
            </View>
            
            <View style={styles.userModalIntroSection}>
              <Text style={styles.userModalLabel}>자기소개</Text>
              <Text style={styles.userModalIntroText}>{selectedUser?.introduction}</Text>
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
    backgroundColor: Colors.surface,
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  letterSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  letterCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
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
  statsSection: {
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  userStats: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 15,
    borderRadius: 12,
    width: '48%',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  emptySlot: {
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 12,
    width: '48%',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderStyle: 'dashed',
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
  emptyProfile: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderStyle: 'dashed',
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
  emptyText: {
    fontSize: 14,
    color: Colors.text.light,
    fontWeight: '500',
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
  userModalContent: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    maxHeight: '70%',
  },
  userModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  userModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  userModalProfile: {
    alignItems: 'center',
    marginBottom: 25,
  },
  userModalProfileCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFE4B5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  userModalProfileEmoji: {
    fontSize: 40,
  },
  userModalName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  userModalIntroSection: {
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 15,
  },
  userModalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.light,
    marginBottom: 10,
  },
  userModalIntroText: {
    fontSize: 16,
    color: Colors.text.primary,
    lineHeight: 24,
  },
});

export default AdminMainScreen;