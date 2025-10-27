import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Keyboard,
  Linking,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome, Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../types';
import { Colors } from '../constants/colors';
import { useThemedStyles } from '../hooks/useThemedStyles';
import ApiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { colors, getFontSize, statusBarStyle } = useThemedStyles();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert('알림', '이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('알림', '올바른 이메일 형식을 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await ApiService.login({ email: email.trim(), password });

      if (response.success) {
        const userResponse = await ApiService.getMe(response.data.accessToken);
        if (userResponse.success && userResponse.data) {
          const userRole = userResponse.data.role;

          if (userRole === 'PROVIDER') {
            Alert.alert('관리자 계정', '관리자 계정은 관리자 로그인을 이용해주세요.');
            return;
          }

          if (userRole === 'USER') {
            await login(response.data.accessToken, response.data.refreshToken);
            setTimeout(() => {
              navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
            }, 300);
          } else {
            Alert.alert('로그인 오류', '지원하지 않는 계정 유형입니다.');
          }
        } else {
          Alert.alert('로그인 오류', '사용자 정보를 가져올 수 없습니다.');
        }
      } else {
        Alert.alert('로그인 실패', response.message || '이메일 또는 비밀번호가 올바르지 않습니다.');
      }
    } catch (error: any) {
      Alert.alert('로그인 실패', '로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    navigation.navigate('SignUp');
  };

  const handleSocialLogin = async (provider: 'Google' | 'Kakao' | 'Naver') => {
    try {
      console.log(`🔑 ${provider} 로그인 시작`);

      let authUrl = '';
      const redirectUri = encodeURIComponent(`${process.env.EXPO_PUBLIC_OAUTH_REDIRECT_URI}/oauth/${provider.toLowerCase()}/callback`);

      if (provider === 'Google') {
        const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
        const scope = encodeURIComponent('openid email profile phone https://www.googleapis.com/auth/user.phonenumbers.read');
        authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&state=shympyo`;
      } else if (provider === 'Kakao') {
        const clientId = process.env.EXPO_PUBLIC_KAKAO_CLIENT_ID;
        authUrl = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}`;
      } else if (provider === 'Naver') {
        const clientId = process.env.EXPO_PUBLIC_NAVER_CLIENT_ID;
        const state = 'shympyo'; // 네이버는 state 필수
        authUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}`;
      }

      console.log('🔗 OAuth URL:', authUrl);

      // 웹 환경에서는 window.open, 모바일에서는 Linking
      if (Platform.OS === 'web') {
        window.open(authUrl, '_blank');
      } else {
        await Linking.openURL(authUrl);
      }
    } catch (error) {
      console.error('❌ 소셜 로그인 오류:', error);
    }
  };

  const handleAdminLogin = () => {
    try {
      navigation.navigate('AdminLogin');
    } catch (error) {
      console.error('Admin login navigation error:', error);
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <Pressable onPress={dismissKeyboard} style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />

        <KeyboardAvoidingView
          behavior={undefined}
          style={styles.keyboardAvoidingView}
        >
          <View style={styles.contentContainer}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/shympyo_logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <View style={styles.formContainer}>
              {/* 이메일 입력 */}
              <TextInput
                style={styles.input}
                placeholder="이메일"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              {/* 비밀번호 입력 */}
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="비밀번호"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#999"
                  />
                </TouchableOpacity>
              </View>

              {/* 로그인 버튼 */}
              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                onPress={handleEmailLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.loginButtonText}>로그인</Text>
                )}
              </TouchableOpacity>

              {/* 링크들 */}
              <View style={styles.linksContainer}>
                <TouchableOpacity>
                  <Text style={styles.linkText}>비밀번호 찾기</Text>
                </TouchableOpacity>
                <View style={styles.linkDivider} />
                <TouchableOpacity onPress={handleSignUp}>
                  <Text style={styles.linkText}>회원가입</Text>
                </TouchableOpacity>
              </View>

              {/* 간편 로그인 구분선 */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>간편 로그인</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* 소셜 로그인 아이콘들 */}
              <View style={styles.socialIconsContainer}>
                <TouchableOpacity
                  style={[styles.socialIconButton, styles.kakaoButton]}
                  onPress={() => handleSocialLogin('Kakao')}
                >
                  <FontAwesome name="comment" size={28} color="#3B1E1E" style={{ marginTop: -3 }} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.socialIconButton, styles.googleButton]}
                  onPress={() => handleSocialLogin('Google')}
                >
                  <Image
                    source={require('../../assets/google-color.png')}
                    style={styles.googleIcon}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.socialIconButton, styles.naverButton]}
                  onPress={() => handleSocialLogin('Naver')}
                >
                  <Text style={styles.naverIcon}>N</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity onPress={handleAdminLogin}>
              <Text style={[styles.footerText, { fontSize: getFontSize(14) }]} numberOfLines={1}>관리자 로그인 / 신청</Text>
            </TouchableOpacity>
            <Text style={[styles.copyright, { fontSize: getFontSize(12) }]}>© 2025. All rights reserved.</Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
    paddingTop: 50,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 180,
    height: 100,
  },
  formContainer: {
    width: '100%',
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginBottom: 12,
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  passwordInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    paddingRight: 50,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  eyeButton: {
    position: 'absolute',
    right: 15,
    top: 15,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 16,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  linksContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  linkText: {
    fontSize: 14,
    color: '#666',
  },
  linkDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#DDDDDD',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
  },
  socialIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  socialIconButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kakaoButton: {
    backgroundColor: '#FEE500',
  },
  googleButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  naverButton: {
    backgroundColor: '#03C75A',
  },
  googleIcon: {
    width: 28,
    height: 28,
  },
  naverIcon: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 14,
    color: Colors.text.light,
    textDecorationLine: 'underline',
  },
  copyright: {
    fontSize: 12,
    color: Colors.text.light,
    marginTop: 15,
  },
});

export default LoginScreen;
