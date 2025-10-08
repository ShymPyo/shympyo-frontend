import React from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome, Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../types';
import { Colors } from '../constants/colors';
import { useThemedStyles } from '../hooks/useThemedStyles';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { colors, getFontSize, statusBarStyle } = useThemedStyles();

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

  // 키보드 닫기 함수 (향후 텍스트 입력이 추가될 때를 대비)
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <Pressable onPress={dismissKeyboard} style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={-100}
        >
          <View style={styles.contentContainer}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../assets/shympyo_logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.socialButton, styles.kakaoButton]}
                onPress={() => handleSocialLogin('Kakao')}
              >
                <FontAwesome name="comment" size={20} color="#3B1E1E" style={styles.icon} />
                <Text style={[styles.socialButtonText, styles.kakaoButtonText, { fontSize: getFontSize(16) }]} numberOfLines={1}>카카오로 쉬운시작</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.socialButton, styles.googleButton]}
                onPress={() => handleSocialLogin('Google')}
              >
                <Ionicons name="logo-google" size={20} color="#4285F4" style={styles.icon} />
                <Text style={[styles.socialButtonText, styles.googleButtonText, { fontSize: getFontSize(16) }]} numberOfLines={1}>구글로 쉬운시작</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.socialButton, styles.naverButton]}
                onPress={() => handleSocialLogin('Naver')}
              >
                <Text style={[styles.socialButtonText, styles.naverButtonText, { fontSize: getFontSize(16) }]} numberOfLines={1}>네이버로 쉬운시작</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.socialButton, styles.generalButton]}
                onPress={() => navigation.navigate('GeneralLogin')}
              >
                <FontAwesome name="user" size={20} color={Colors.text.primary} style={styles.icon} />
                <Text style={[styles.socialButtonText, styles.generalButtonText, { fontSize: getFontSize(16) }]} numberOfLines={1}>일반 로그인</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity onPress={handleAdminLogin}>
              <Text style={[styles.footerText, { fontSize: getFontSize(14) }]} numberOfLines={1}>관리자 로그인 / 회원가입</Text>
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
  subtitle: {
    fontSize: 18,
    color: Colors.text.secondary,
  },
  buttonContainer: {
    width: '100%',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 15,
    marginBottom: 15,
    width: '100%',
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  icon: {
    marginRight: 10,
  },
  kakaoButton: {
    backgroundColor: '#FEE500',
  },
  kakaoButtonText: {
    color: '#3B1E1E',
  },
  googleButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  googleButtonText: {
    color: Colors.text.primary,
  },
  naverButton: {
    backgroundColor: '#03C75A',
  },
  naverButtonText: {
    color: 'white',
  },
  generalButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.text.light,
  },
  generalButtonText: {
    color: Colors.text.primary,
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
