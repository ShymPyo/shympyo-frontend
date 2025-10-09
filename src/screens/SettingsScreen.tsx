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
  Switch,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { getColors } from '../constants/colors';
import { RootStackParamList } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, ThemeMode, ContrastMode, FontSizeLevel } from '../contexts/ThemeContext';

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { logout, user: authUser } = useAuth();
  const {
    themeMode,
    contrastMode,
    fontSizeLevel,
    setThemeMode,
    setContrastMode,
    setFontSizeLevel,
    getFontSize
  } = useTheme();

  const [loading, setLoading] = useState(true);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showContrastModal, setShowContrastModal] = useState(false);
  const [showFontModal, setShowFontModal] = useState(false);
  const [statusBarKey, setStatusBarKey] = useState(0);

  const colors = getColors(themeMode, contrastMode);

  // 화면 포커스 시 StatusBar 재설정
  useFocusEffect(
    React.useCallback(() => {
      setStatusBarKey(prev => prev + 1);
    }, [])
  );

  const getThemeDisplayName = () => {
    return themeMode === 'dark' ? '다크 모드' : '라이트 모드';
  };

  const getContrastDisplayName = () => {
    return contrastMode === 'high' ? '고대비 모드' : '일반 대비';
  };

  const getFontDisplayName = () => {
    switch (fontSizeLevel) {
      case 'small': return '작게';
      case 'large': return '크게';
      case 'extra-large': return '매우 크게';
      default: return '보통';
    }
  };

  // 로딩 상태 초기화
  useEffect(() => {
    setLoading(false);
  }, [authUser]);

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }
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

  const renderThemeModal = () => {
    const themeOptions = [
      { key: 'light', theme: 'light' as ThemeMode, label: '라이트 모드', icon: 'sunny-outline' as const },
      { key: 'dark', theme: 'dark' as ThemeMode, label: '다크 모드', icon: 'moon-outline' as const },
    ];

    return (
      <Modal visible={showThemeModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowThemeModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { fontSize: getFontSize(18), color: colors.text.primary }]}>
              화면 테마 선택
            </Text>

            {themeOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.modalOption,
                  { borderBottomColor: colors.background },
                  themeMode === option.theme && styles.selectedOption
                ]}
                onPress={() => {
                  setThemeMode(option.theme);
                  setShowThemeModal(false);
                }}
              >
                <Ionicons name={option.icon} size={24} color={colors.text.secondary} />
                <Text style={[styles.modalOptionText, { fontSize: getFontSize(16), color: colors.text.primary }]}>
                  {option.label}
                </Text>
                {themeMode === option.theme && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowThemeModal(false)}
            >
              <Text style={[styles.modalCloseText, { fontSize: getFontSize(16) }]}>닫기</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    );
  };

  const renderContrastModal = () => {
    const contrastOptions = [
      { key: 'normal', contrast: 'normal' as ContrastMode, label: '일반 대비', icon: 'contrast-outline' as const },
      { key: 'high', contrast: 'high' as ContrastMode, label: '고대비 모드', icon: 'contrast' as const },
    ];

    return (
      <Modal visible={showContrastModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowContrastModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { fontSize: getFontSize(18), color: colors.text.primary }]}>
              화면 대비 선택
            </Text>

            {contrastOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.modalOption,
                  { borderBottomColor: colors.background },
                  contrastMode === option.contrast && styles.selectedOption
                ]}
                onPress={() => {
                  setContrastMode(option.contrast);
                  setShowContrastModal(false);
                }}
              >
                <Ionicons name={option.icon} size={24} color={colors.text.secondary} />
                <Text style={[styles.modalOptionText, { fontSize: getFontSize(16), color: colors.text.primary }]}>
                  {option.label}
                </Text>
                {contrastMode === option.contrast && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowContrastModal(false)}
            >
              <Text style={[styles.modalCloseText, { fontSize: getFontSize(16) }]}>닫기</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    );
  };

  const renderFontSizeModal = () => {
    const fontOptions: { key: FontSizeLevel; label: string; description: string }[] = [
      { key: 'small', label: '작게', description: '작은 글자 (85%)' },
      { key: 'normal', label: '보통', description: '기본 글자 크기' },
      { key: 'large', label: '크게', description: '큰 글자 (115%)' },
      { key: 'extra-large', label: '매우 크게', description: '매우 큰 글자 (130%)' },
    ];

    return (
      <Modal visible={showFontModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowFontModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { fontSize: getFontSize(18), color: colors.text.primary }]}>
              글자 크기 선택
            </Text>

            {fontOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.modalOption,
                  { borderBottomColor: colors.background },
                  fontSizeLevel === option.key && styles.selectedOption
                ]}
                onPress={() => {
                  setFontSizeLevel(option.key);
                  setShowFontModal(false);
                }}
              >
                <View style={styles.fontOptionContent}>
                  <Text style={[styles.modalOptionText, { fontSize: getFontSize(16), color: colors.text.primary }]}>
                    {option.label}
                  </Text>
                  <Text style={[styles.fontOptionDescription, { fontSize: getFontSize(14), color: colors.text.secondary }]}>
                    {option.description}
                  </Text>
                </View>
                {fontSizeLevel === option.key && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowFontModal(false)}
            >
              <Text style={[styles.modalCloseText, { fontSize: getFontSize(16) }]}>닫기</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar key={statusBarKey} style={themeMode === 'dark' ? 'light' : 'dark'} />

      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.surface }]}>
        <Text style={[styles.title, { fontSize: getFontSize(20), color: colors.text.primary }]}>설정</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* 프로필 섹션 */}
        <TouchableOpacity
          style={styles.profileSection}
          onPress={handleProfilePress}
        >
          <Image
            source={require('../../assets/profiles/profile1.png')}
            style={styles.profileImage}
          />
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { fontSize: getFontSize(22), color: colors.text.primary }]}>
              {loading ? '로딩 중...' : (authUser ? authUser.name : '로그인이 필요합니다')}
            </Text>
            <Text style={[styles.profileLink, { fontSize: getFontSize(15), color: colors.text.secondary }]}>
              {authUser ? '내 정보 · 주소 관리' : '로그인하여 프로필을 확인하세요'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.text.light} />
        </TouchableOpacity>

        {/* 설정 섹션 1 */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          {/* 글자 크기 */}
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowFontModal(true)}
          >
            <Text style={[styles.itemTitle, { fontSize: getFontSize(16), color: colors.text.primary }]}>
              글자 크기
            </Text>
            <View style={styles.itemValueContainer}>
              <Text style={[styles.itemValue, { fontSize: getFontSize(16), color: colors.text.secondary }]}>
                {getFontDisplayName()}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.text.light} />
            </View>
          </TouchableOpacity>

          {/* 화면 테마 */}
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowThemeModal(true)}
          >
            <Text style={[styles.itemTitle, { fontSize: getFontSize(16), color: colors.text.primary }]}>
              화면 테마
            </Text>
            <View style={styles.itemValueContainer}>
              <Text style={[styles.itemValue, { fontSize: getFontSize(16), color: colors.text.secondary }]}>
                {getThemeDisplayName()}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.text.light} />
            </View>
          </TouchableOpacity>

          {/* 화면 대비 */}
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowContrastModal(true)}
          >
            <Text style={[styles.itemTitle, { fontSize: getFontSize(16), color: colors.text.primary }]}>
              화면 대비
            </Text>
            <View style={styles.itemValueContainer}>
              <Text style={[styles.itemValue, { fontSize: getFontSize(16), color: colors.text.secondary }]}>
                {getContrastDisplayName()}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.text.light} />
            </View>
          </TouchableOpacity>
        </View>
        
        {/* 로그아웃 버튼 */}
        {authUser && (
          <View style={[styles.section, { backgroundColor: colors.surface, marginTop: 10 }]}>
            <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
              <Text style={[styles.itemTitle, { fontSize: getFontSize(16), color: colors.error }]}>로그아웃</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.text.light} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* 테마 선택 모달 */}
      {renderThemeModal()}

      {/* 대비 선택 모달 */}
      {renderContrastModal()}

      {/* 글자 크기 선택 모달 */}
      {renderFontSizeModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 20,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileLink: {
    // 동적 스타일은 컴포넌트에서 적용
  },
  section: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  itemTitle: {
    flex: 1,
  },
  itemValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemValue: {
    marginRight: 4,
  },
  logoutText: {
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 300,
  },
  modalTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },
  selectedOption: {
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: 8,
  },
  modalOptionText: {
    flex: 1,
    marginLeft: 15,
  },
  fontOptionContent: {
    flex: 1,
    marginLeft: 15,
  },
  fontOptionDescription: {
    marginTop: 4,
  },
  modalCloseButton: {
    marginTop: 20,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCloseText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default SettingsScreen;
