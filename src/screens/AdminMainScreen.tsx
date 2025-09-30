import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { Colors } from '../constants/colors';
import { RootStackParamList } from '../types';
import ApiService, { AdminPlace, LetterCount } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

type AdminMainScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AdminMain'>;

const AdminMainScreen: React.FC = () => {
  const navigation = useNavigation<AdminMainScreenNavigationProp>();
  const { accessToken, user, logout } = useAuth();

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isUserModalVisible, setUserModalVisible] = useState(false);
  const [adminPlace, setAdminPlace] = useState<AdminPlace | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [letterCount, setLetterCount] = useState<LetterCount>({ total: 0, unRead: 0, read: 0 });

  // accessToken이나 user가 없으면 로딩 상태 유지
  useEffect(() => {
    if (!accessToken || !user) {
      setIsLoading(true);
    }
  }, [accessToken, user]);

  // 데이터 로드 함수
  const loadAdminData = async () => {
    console.log('🔍 AdminMain - loadAdminData 호출됨');
    console.log('🔍 accessToken 상태:', accessToken ? '존재함' : '없음');
    console.log('🔍 user 상태:', user ? `${user.name} (${user.role})` : '없음');

    if (!accessToken) {
      console.log('❌ accessToken이 없어서 로그인 화면으로 이동');
      Alert.alert('인증 오류', '로그인이 필요합니다.');
      navigation.replace('Login');
      return;
    }

    try {
      setIsLoading(true);
      console.log('🏢 관리자 데이터 로드 시작');

      // 관리자의 장소 목록 조회
      const placesResponse = await ApiService.getAdminPlaces(accessToken);

      if (placesResponse.success && placesResponse.data) {
        setAdminPlace(placesResponse.data);
        console.log('✅ 관리자 장소 정보 로드:', placesResponse.data);

        // 현재 사용자 목록 조회
        const usersResponse = await ApiService.getPlaceCurrentUsers(placesResponse.data.id, accessToken);
        if (usersResponse.success && usersResponse.data) {
          setUsers(usersResponse.data);
          console.log('✅ 현재 사용자 목록 로드:', usersResponse.data);
        } else {
          console.log('❌ 현재 사용자 목록 조회 실패:', usersResponse.message);
          setUsers([]);
        }

        // 편지 개수 조회
        const letterCountResponse = await ApiService.getLetterCount(accessToken);
        if (letterCountResponse.success && letterCountResponse.data) {
          setLetterCount(letterCountResponse.data);
          console.log('✅ 편지 개수 로드:', letterCountResponse.data);
        } else {
          console.log('❌ 편지 개수 조회 실패:', letterCountResponse.message);
        }
      } else {
        console.log('❌ 관리자 장소 조회 실패:', placesResponse.message);
        Alert.alert('장소 정보 없음', '등록된 장소가 없습니다.');
      }
    } catch (error) {
      console.error('💥 관리자 데이터 로드 오류:', error);
      Alert.alert('데이터 로드 실패', '정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken && user) {
      console.log('🔍 useEffect 트리거됨 - accessToken과 user 모두 준비됨');
      loadAdminData();
    } else {
      console.log('🔍 useEffect - 아직 준비되지 않음:', {
        accessToken: accessToken ? '있음' : '없음',
        user: user ? `${user.name}` : '없음'
      });
    }
  }, [accessToken, user]);

  // 화면 포커스 시 데이터 새로고침
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (accessToken && user) {
        console.log('🔄 화면 포커스 - 데이터 새로고침');
        loadAdminData();
      }
    });

    return unsubscribe;
  }, [navigation, accessToken, user]);

  const handleEditProfile = () => {
    if (adminPlace) {
      navigation.navigate('AdminSpaceEdit', { place: adminPlace });
    } else {
      Alert.alert('오류', '장소 정보를 불러올 수 없습니다.');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigation.replace('Login');
    } catch (error) {
      console.error('❌ 로그아웃 오류:', error);
    }
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
          <Text style={styles.welcomeTitle}>
            {adminPlace?.name || user?.name || '관리자'} 사장님 환영합니다 !
          </Text>
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

          {isLoading ? (
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 20 }} />
          ) : adminPlace ? (
            <>
              <View style={styles.profileContent}>
                <Image
                  source={{
                    uri: adminPlace.imageUrl || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
                  }}
                  style={styles.shopImage}
                />
                <View style={styles.shopInfo}>
                  <Text style={styles.shopName}>{adminPlace.name}</Text>
                  <View style={styles.shopDetails}>
                    <Ionicons name="time" size={16} color={Colors.text.secondary} />
                    <Text style={styles.shopTime}>
                      {adminPlace.openTime} ~ {adminPlace.closeTime}
                    </Text>
                  </View>
                  <View style={styles.shopLocation}>
                    <Ionicons name="location" size={16} color={Colors.text.secondary} />
                    <Text style={styles.shopAddress}>{adminPlace.address}</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.shopDescription}>{adminPlace.content}</Text>
            </>
          ) : (
            <Text style={styles.noDataText}>장소 정보를 불러올 수 없습니다.</Text>
          )}
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
          {letterCount.unRead > 0 && (
            <View style={styles.letterCount}>
              <Ionicons name="alert-circle" size={16} color={Colors.primary} />
              <Text style={styles.countText}>새로운 편지가 {letterCount.unRead}개 도착했습니다.</Text>
            </View>
          )}
          <View style={styles.notificationBanner}>
            <Ionicons name="mail" size={20} color={Colors.text.primary} />
            <Text style={styles.notificationText}>지금까지 총 {letterCount.total}개의 감사 편지를 받았어요 !</Text>
          </View>
        </TouchableOpacity>

        {/* 인원 현황 */}
        <View style={styles.statsSection}>
          <Text style={styles.statsTitle}>
            인원 현황 ({users.length}/{adminPlace?.maxCapacity || 6})
          </Text>
          <View style={styles.statsGrid}>
            {/* 현재 사용자들 */}
            {users.map((user) => (
              <TouchableOpacity
                key={user.id}
                style={styles.userStats}
                onPress={() => handleUserPress(user)}
              >
                <Image
                  source={{
                    uri: user.profileImage || user.imageUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
                  }}
                  style={styles.userProfile}
                />
                <Text style={styles.userName}>{user.name || user.nickname} 님</Text>
                <Text style={styles.userTime}>{user.time || '이용중'}</Text>
              </TouchableOpacity>
            ))}

            {/* 빈 자리들 */}
            {Array.from({ length: (adminPlace?.maxCapacity || 6) - users.length }, (_, index) => (
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
              <Image
                source={{ uri: selectedUser?.profileImage }}
                style={styles.userModalProfileCircle}
              />
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
    justifyContent: 'space-around',
  },
  userStats: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 15,
    borderRadius: 12,
    width: '31%',
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
    width: '31%',
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
    marginBottom: 15,
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
  noDataText: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginVertical: 20,
  },
});

export default AdminMainScreen;