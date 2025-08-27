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
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome } from '@expo/vector-icons';

import { RootStackParamList } from '../types';
import { Colors } from '../constants/colors';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();

  const handleSocialLogin = (provider: string) => {
    try {
      // For now, any login attempt will navigate to the main screen
      console.log(`${provider} login`);
      navigation.replace('Main');
    } catch (error) {
      console.error('Login navigation error:', error);
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
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.socialButton, styles.kakaoButton]}
                onPress={() => handleSocialLogin('Kakao')}
              >
                <FontAwesome name="comment" size={20} color="#3B1E1E" style={styles.icon} />
                <Text style={[styles.socialButtonText, styles.kakaoButtonText]}>카카오로 쉬운시작</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.socialButton, styles.facebookButton]}
                onPress={() => handleSocialLogin('Facebook')}
              >
                <FontAwesome name="facebook-square" size={24} color="white" style={styles.icon} />
                <Text style={styles.socialButtonText}>페이스북으로 쉬운시작</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.socialButton, styles.naverButton]}
                onPress={() => handleSocialLogin('Naver')}
              >
                <Text style={[styles.socialButtonText, styles.naverButtonText]}>네이버로 쉬운시작</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.socialButton, styles.generalButton]}
                onPress={() => handleSocialLogin('General')}
              >
                <FontAwesome name="user" size={20} color={Colors.text.primary} style={styles.icon} />
                <Text style={[styles.socialButtonText, styles.generalButtonText]}>일반 로그인</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity onPress={handleAdminLogin}>
              <Text style={styles.footerText}>관리자 로그인 / 회원가입</Text>
            </TouchableOpacity>
            <Text style={styles.copyright}>© 2025. All rights reserved.</Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
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
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    width: 180,
    height: 100,
    marginBottom: 15,
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
  facebookButton: {
    backgroundColor: '#1877F2',
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
