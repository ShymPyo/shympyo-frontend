import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { Colors } from '../constants/colors';
import { RootStackParamList } from '../types';
import ApiService, { User } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { accessToken, logout, user: authUser } = useAuth();
  const [loading, setLoading] = useState(true);

  const settingsOptions = [
    { title: '언어', value: '한국어', icon: 'language-outline', screen: '' },
    { title: '알림', icon: 'notifications-outline', screen: '' },
    { title: '화면 테마 · 진동', icon: 'contrast-outline', screen: '' },
    { title: '연락처 관리', icon: 'call-outline', screen: '' },
  ];

  // 로딩 상태 초기화
  useEffect(() => {
    if (authUser || !accessToken) {
      setLoading(false);
    }
  }, [authUser, accessToken]);

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: () => logout()
        }
      ]
    );
  };

  const handleProfilePress = () => {
    if (authUser) {
      navigation.navigate('ProfileEdit', { user: authUser });
    } else {
      navigation.navigate('Login');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.title}>설정</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <TouchableOpacity style={styles.profileSection} onPress={handleProfilePress}>
            {/* 로컬 프로필 이미지 사용 - profile1.png가 기본값 */}
            <Image
                source={require('../../assets/profiles/profile1.png')}
                style={styles.profileImage}
            />
            <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {loading ? '로딩 중...' : (authUser ? authUser.name : '로그인이 필요합니다')}
                </Text>
                <Text style={styles.profileLink}>
                  {authUser ? '내 정보 · 주소 관리' : '로그인하여 프로필을 확인하세요'}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.text.light} />
        </TouchableOpacity>

        {settingsOptions.map((item, index) => (
            <TouchableOpacity key={index} style={styles.settingItem}>
                <Ionicons name={item.icon} size={24} color={Colors.text.secondary} style={styles.itemIcon} />
                <Text style={styles.itemTitle}>{item.title}</Text>
                {item.value && <Text style={styles.itemValue}>{item.value}</Text>}
                <Ionicons name="chevron-forward" size={20} color={Colors.text.light} />
            </TouchableOpacity>
        ))}

        {/* 로그아웃 버튼 - 로그인된 경우에만 표시 */}
        {authUser && (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color="#FF4444" style={styles.itemIcon} />
              <Text style={styles.logoutText}>로그아웃</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.text.light} />
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.surface,
    borderBottomWidth: 8,
    borderBottomColor: '#F0F0F0',
  },
  profileImage: {
      width: 60,
      height: 60,
      borderRadius: 30,
      marginRight: 15,
  },
  profileInfo: {
      flex: 1,
  },
  profileName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: Colors.text.primary,
      marginBottom: 5,
  },
  profileLink: {
      fontSize: 14,
      color: Colors.text.secondary,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  itemIcon: {
      marginRight: 15,
  },
  itemTitle: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
  },
  itemValue: {
      fontSize: 16,
      color: Colors.text.secondary,
      marginRight: 10,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 8,
    borderTopColor: '#F0F0F0',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  logoutText: {
    flex: 1,
    fontSize: 16,
    color: '#FF4444',
    fontWeight: '500',
  },
});

export default SettingsScreen;
