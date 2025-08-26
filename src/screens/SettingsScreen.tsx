import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { Colors } from '../constants/colors';

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();

  const settingsOptions = [
    { title: '언어', value: '한국어', icon: 'language-outline', screen: '' },
    { title: '알림', icon: 'notifications-outline', screen: '' },
    { title: '화면 테마 · 진동', icon: 'contrast-outline', screen: '' },
    { title: '연락처 관리', icon: 'call-outline', screen: '' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>설정</Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView style={styles.scrollView}>
        <TouchableOpacity style={styles.profileSection} onPress={() => navigation.navigate('ProfileSetup')}>
            {/* 로컬 프로필 이미지 사용 - profile1.png가 기본값 */}
            <Image 
                source={require('../../assets/profiles/profile1.png')} 
                style={styles.profileImage}
            />
            <View style={styles.profileInfo}>
                <Text style={styles.profileName}>김진</Text>
                <Text style={styles.profileLink}>내 정보 · 주소 관리</Text>
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
});

export default SettingsScreen;
