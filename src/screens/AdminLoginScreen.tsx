import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Keyboard,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../types';
import { Colors } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';

type AdminLoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AdminLogin'>;

const AdminLoginScreen: React.FC = () => {
  const navigation = useNavigation<AdminLoginScreenNavigationProp>();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('입력 오류', '이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true);
      console.log('🔐 관리자 로그인 시도:', email);

      const loginData = {
        email: email.trim(),
        password: password,
      };

      const response = await ApiService.login(loginData);

      if (response.success) {
        console.log('✅ 관리자 로그인 성공');

        // 사용자 역할 확인
        const userResponse = await ApiService.getMe(response.data.accessToken);
        if (userResponse.success && userResponse.data) {
          const userRole = userResponse.data.role;
          console.log('👤 사용자 역할:', userRole);

          // 일반 사용자는 관리자 로그인으로 접근 불가
          if (userRole === 'USER') {
            Alert.alert(
              '일반 사용자 계정',
              '일반 사용자는 일반 로그인을 이용해주세요.',
              [
                { text: '확인', style: 'default' }
              ]
            );
            return;
          }

          // 관리자만 로그인 허용
          if (userRole === 'PROVIDER') {
            // AuthContext login 실행 (토큰 저장 및 사용자 정보 설정)
            await login(response.data.accessToken, response.data.refreshToken);

            console.log('🏢 관리자 역할 확인됨 - AdminMain으로 이동');
            // 잠시 대기 후 네비게이션
            setTimeout(() => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'AdminMain' }],
              });
            }, 300);
          } else {
            Alert.alert('접근 권한 없음', '관리자 권한이 필요합니다.');
          }
        } else {
          console.error('❌ 사용자 정보 조회 실패');
          Alert.alert('로그인 오류', '사용자 정보를 가져올 수 없습니다.');
        }
      } else {
        console.log('❌ 관리자 로그인 실패');
        Alert.alert('로그인 실패', response.message || '이메일 또는 비밀번호가 올바르지 않습니다.');
      }
    } catch (error: any) {
      console.error('❌ 관리자 로그인 오류:', error);
      Alert.alert('로그인 오류', '로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    Alert.alert('안내', '관리자 회원가입은 별도 승인이 필요합니다.\n문의: admin@shympyo.com');
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
            {/* 뒤로가기 버튼 */}
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
            </TouchableOpacity>



            <Text style={styles.title}>관리자 로그인</Text>
            
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
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.loginButtonText}>로그인</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.signUpButton} 
              onPress={handleSignUp}
            >
              <Text style={styles.signUpButtonText}>관리자 회원가입</Text>
            </TouchableOpacity>
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
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
    paddingTop: 80,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 30,
    zIndex: 1,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 30,
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
  footer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  copyright: {
    fontSize: 12,
    color: Colors.text.light,
  },
});

export default AdminLoginScreen;