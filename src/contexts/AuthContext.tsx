import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import StorageService from '../services/storage';
import ApiService, { User } from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
    testBackendConnection();
  }, []);

  const testBackendConnection = async () => {
    try {
      const isConnected = await ApiService.testConnection();
      if (isConnected) {
        console.log('✅ 백엔드 연결 성공 - API 호출 가능');
      } else {
        console.log('❌ 백엔드 연결 실패 - CORS 설정 또는 서버 문제');
      }
    } catch (error) {
      console.error('💥 백엔드 연결 테스트 중 에러:', error);
    }
  };

  const checkAuthStatus = async () => {
    try {
      const accessToken = await StorageService.getAccessToken();
      const userData = await StorageService.getUserData();

      if (accessToken && userData) {
        setIsAuthenticated(true);
        setUser(userData);
      }
    } catch (error) {
      console.error('인증 상태 확인 에러:', error);
      await logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (accessToken: string, refreshToken: string) => {
    try {
      await StorageService.setTokens(accessToken, refreshToken);
      
      const userResponse = await ApiService.getMe(accessToken);
      if (userResponse.success) {
        await StorageService.setUserData(userResponse.data);
        setUser(userResponse.data);
        setIsAuthenticated(true);
      } else {
        throw new Error('사용자 정보 조회 실패');
      }
    } catch (error) {
      console.error('로그인 처리 에러:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await StorageService.clearAll();
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('로그아웃 에러:', error);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      StorageService.setUserData(updatedUser);
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    user,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};