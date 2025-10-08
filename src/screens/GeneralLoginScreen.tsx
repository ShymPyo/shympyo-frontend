import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  KeyboardAvoidingView,
  Platform as RNPlatform,
  Pressable,
  Keyboard,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';

import { RootStackParamList } from '../types';
import { Colors } from '../constants/colors';
import ApiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useThemedStyles } from '../hooks/useThemedStyles';

WebBrowser.maybeCompleteAuthSession();

type GeneralLoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'GeneralLogin'>;

const GeneralLoginScreen: React.FC = () => {
  const navigation = useNavigation<GeneralLoginScreenNavigationProp>();
  const { login } = useAuth();
  const { colors, getFontSize, statusBarStyle } = useThemedStyles();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleLogin = async () => {
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
      const loginData = {
        email: email.trim(),
        password: password,
      };

      const response = await ApiService.login(loginData);

      if (response.success) {
        console.log('✅ 로그인 성공');

        // 사용자 역할 먼저 확인
        const userResponse = await ApiService.getMe(response.data.accessToken);
        if (userResponse.success && userResponse.data) {
          const userRole = userResponse.data.role;
          console.log('👤 사용자 역할:', userRole);

          // 관리자는 일반 로그인으로 접근 불가
          if (userRole === 'PROVIDER') {
            Alert.alert(
              '관리자 계정',
              '관리자 계정은 관리자 로그인을 이용해주세요.',
              [
                { text: '확인', style: 'default' }
              ]
            );
            return;
          }

          // 일반 사용자만 로그인 허용
          if (userRole === 'USER') {
            // AuthContext login 실행 (토큰 저장 및 사용자 정보 설정)
            await login(response.data.accessToken, response.data.refreshToken);

            // 잠시 대기 후 네비게이션
            setTimeout(() => {
              console.log('👤 일반 사용자로 로그인 - Main으로 이동');
              navigation.reset({
                index: 0,
                routes: [{ name: 'Main' }],
              });
            }, 300);
          } else {
            Alert.alert('로그인 오류', '지원하지 않는 계정 유형입니다.');
          }
        } else {
          console.error('❌ 사용자 정보 조회 실패');
          Alert.alert('로그인 오류', '사용자 정보를 가져올 수 없습니다.');
        }
      } else {
        console.log('❌ 로그인 실패');
        Alert.alert('로그인 실패', response.message || '이메일 또는 비밀번호가 올바르지 않습니다.');
      }
    } catch (error: any) {
      console.error('❌ 로그인 오류:', error);
      Alert.alert('로그인 실패', '로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    navigation.navigate('SignUp');
  };

  // 소셜 로그인 핸들러들
  const handleSocialLogin = async (authUrl: string) => {
    try {
      console.log('🔑 소셜 로그인 시작');
      console.log('🔗 OAuth URL:', authUrl);

      // 웹 환경에서는 window.open으로 처리
      if (RNPlatform.OS === 'web') {
        window.open(authUrl, '_blank');
        Alert.alert(
          '소셜 로그인',
          '새 창에서 로그인을 진행해주세요.\n로그인 완료 후 자동으로 로그인됩니다.'
        );
      } else {
        // 모바일에서는 시스템 브라우저로 열기
        await Linking.openURL(authUrl);
        Alert.alert(
          '소셜 로그인',
          '브라우저에서 로그인을 진행해주세요.'
        );
      }
    } catch (error) {
      console.error('❌ 소셜 로그인 오류:', error);
      Alert.alert('로그인 실패', '소셜 로그인 중 오류가 발생했습니다.');
    }
  };

  const handleGoogleLogin = () => {
    const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
    const redirectUri = encodeURIComponent(`${process.env.EXPO_PUBLIC_OAUTH_REDIRECT_URI}/oauth/google/callback`);
    const scope = encodeURIComponent('openid email profile phone https://www.googleapis.com/auth/user.phonenumbers.read');
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&state=shympyo`;
    handleSocialLogin(authUrl);
  };

  const handleKakaoLogin = () => {
    console.log('🟡 카카오 로그인 버튼 클릭');
    console.log('🔑 환경변수 확인:', {
      clientId: process.env.EXPO_PUBLIC_KAKAO_CLIENT_ID,
      redirectUri: process.env.EXPO_PUBLIC_OAUTH_REDIRECT_URI,
    });

    const clientId = process.env.EXPO_PUBLIC_KAKAO_CLIENT_ID;
    const redirectUri = encodeURIComponent(`${process.env.EXPO_PUBLIC_OAUTH_REDIRECT_URI}/oauth/kakao/callback`);
    const authUrl = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}`;

    console.log('🔗 생성된 카카오 OAuth URL:', authUrl);
    handleSocialLogin(authUrl);
  };

  const handleNaverLogin = () => {
    const clientId = process.env.EXPO_PUBLIC_NAVER_CLIENT_ID;
    const redirectUri = encodeURIComponent(`${process.env.EXPO_PUBLIC_OAUTH_REDIRECT_URI}/oauth/naver/callback`);
    const authUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}`;
    handleSocialLogin(authUrl);
  };

  return (
    <Pressable onPress={dismissKeyboard} style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={statusBarStyle as any} />
        
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={-100}
        >
          <View style={styles.contentContainer}>
            {/* 뒤로가기 버튼 */}
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
            </TouchableOpacity>

            {/* 로고 */}
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../assets/shympyo_logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.title}>일반 로그인</Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="이메일을 입력하세요"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="비밀번호를 입력하세요"
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
                    color={Colors.text.light} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]} 
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.loginButtonText}>로그인</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.signUpButton}
              onPress={handleSignUp}
            >
              <Text style={styles.signUpButtonText}>일반 회원가입</Text>
            </TouchableOpacity>

            {/* 구분선 */}
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>또는</Text>
              <View style={styles.divider} />
            </View>

            {/* 소셜 로그인 버튼들 */}
            <View style={styles.socialLoginContainer}>
              <TouchableOpacity
                style={[styles.socialButton, styles.googleButton]}
                onPress={handleGoogleLogin}
                disabled={isLoading}
              >
                <Ionicons name="logo-google" size={20} color="#DB4437" />
                <Text style={styles.socialButtonText}>구글로 로그인</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.socialButton, styles.kakaoButton]}
                onPress={handleKakaoLogin}
                disabled={isLoading}
              >
                <Image
                  source={{ uri: 'https://developers.kakao.com/assets/img/about/logos/kakaolink/kakaolink_btn_small.png' }}
                  style={styles.kakaoIcon}
                />
                <Text style={styles.socialButtonText}>카카오로 로그인</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.socialButton, styles.naverButton]}
                onPress={handleNaverLogin}
                disabled={isLoading}
              >
                <Text style={styles.naverIcon}>N</Text>
                <Text style={[styles.socialButtonText, { color: '#fff' }]}>네이버로 로그인</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.copyright}>© 2025. All rights reserved.</Text>
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
  backButton: {
    position: 'absolute',
    top: 20,
    left: 30,
    zIndex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 180,
    height: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 15,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginBottom: 15,
  },
  passwordContainer: {
    position: 'relative',
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
    top: 17,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  signUpButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  signUpButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5E5',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#999',
    fontSize: 14,
  },
  socialLoginContainer: {
    gap: 12,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    gap: 10,
  },
  googleButton: {
    backgroundColor: '#fff',
    borderColor: '#E5E5E5',
  },
  kakaoButton: {
    backgroundColor: '#FEE500',
    borderColor: '#FEE500',
  },
  naverButton: {
    backgroundColor: '#03C75A',
    borderColor: '#03C75A',
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  kakaoIcon: {
    width: 20,
    height: 20,
  },
  naverIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  copyright: {
    fontSize: 12,
    color: Colors.text.light,
  },
});

export default GeneralLoginScreen;