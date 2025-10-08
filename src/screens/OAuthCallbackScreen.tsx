import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import ApiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types';
import { Colors } from '../constants/colors';

type OAuthCallbackScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const OAuthCallbackScreen: React.FC = () => {
  const navigation = useNavigation<OAuthCallbackScreenNavigationProp>();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {
    try {
      console.log('🔑 OAuth 콜백 처리 시작');

      // URL에서 인가 코드 추출
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const provider = getProviderFromUrl();

      console.log('📝 인가 코드 (전체):', code);
      console.log('🔑 제공자:', provider);

      if (!code) {
        throw new Error('인가 코드가 없습니다.');
      }

      if (!provider) {
        throw new Error('OAuth 제공자를 확인할 수 없습니다.');
      }

      // 백엔드 API 호출
      console.log('📤 백엔드 API 호출:', `${process.env.EXPO_PUBLIC_API_BASE_URL}/oauth/${provider}/callback?code=${code}`);

      let response;
      if (provider === 'google') {
        response = await ApiService.loginWithGoogle(code);
      } else if (provider === 'kakao') {
        response = await ApiService.loginWithKakao(code);
      } else if (provider === 'naver') {
        response = await ApiService.loginWithNaver(code);
      }

      console.log('📥 백엔드 응답:', response);

      if (response && response.success && response.data) {
        console.log('✅ 토큰 수신 성공');

        // 사용자 정보 확인
        const userResponse = await ApiService.getMe(response.data.accessToken);
        if (userResponse.success && userResponse.data) {
          if (userResponse.data.role === 'PROVIDER') {
            setError('관리자 계정은 관리자 로그인을 이용해주세요.');
            setTimeout(() => {
              navigation.replace('Login');
            }, 2000);
            return;
          }

          // 로그인 성공
          await login(response.data.accessToken, response.data.refreshToken);

          console.log('✅ 로그인 완료, Main으로 이동');
          navigation.replace('Main');
        } else {
          throw new Error('사용자 정보를 가져올 수 없습니다.');
        }
      } else {
        throw new Error(response?.message || '소셜 로그인에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('❌ OAuth 콜백 처리 오류:', error);
      setError(error.message || '로그인 처리 중 오류가 발생했습니다.');

      setTimeout(() => {
        navigation.replace('Login');
      }, 3000);
    }
  };

  const getProviderFromUrl = (): string | null => {
    const path = window.location.pathname;
    if (path.includes('google')) return 'google';
    if (path.includes('kakao')) return 'kakao';
    if (path.includes('naver')) return 'naver';
    return null;
  };

  return (
    <View style={styles.container}>
      {error ? (
        <>
          <Text style={styles.errorText}>❌ {error}</Text>
          <Text style={styles.redirectText}>잠시 후 로그인 화면으로 이동합니다...</Text>
        </>
      ) : (
        <>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>로그인 처리 중...</Text>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: Colors.text.primary,
  },
  errorText: {
    fontSize: 16,
    color: '#FF4444',
    textAlign: 'center',
    marginBottom: 10,
  },
  redirectText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});

export default OAuthCallbackScreen;
