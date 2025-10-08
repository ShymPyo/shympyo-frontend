import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import StorageService from '../services/storage';
import ApiService, { User } from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  login: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  refreshTokens: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  const refreshTokens = async (): Promise<string | null> => {
    try {
      if (!refreshToken) {
        console.error('❌ 리프레시 토큰이 없습니다.');
        await logout();
        return null;
      }

      console.log('🔄 토큰 재발급 시도...');
      const response = await ApiService.refreshToken(refreshToken);

      if (response.success) {
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

        await StorageService.setTokens(newAccessToken, newRefreshToken);
        setAccessToken(newAccessToken);
        setRefreshToken(newRefreshToken);

        console.log('✅ 토큰 재발급 성공');
        return newAccessToken;
      } else {
        console.error('❌ 토큰 재발급 실패:', response.message);
        await logout();
        return null;
      }
    } catch (error) {
      console.error('❌ 토큰 재발급 실패:', error);
      await logout();
      return null;
    }
  };

  useEffect(() => {
    checkAuthStatus();
    testBackendConnection();
  }, []);

  useEffect(() => {
    // API 서비스에 토큰 재발급 콜백 설정 (refreshToken이 변경될 때마다)
    ApiService.setRefreshTokenCallback(refreshTokens);
  }, [refreshToken]);

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
      const storedAccessToken = await StorageService.getAccessToken();
      const storedRefreshToken = await StorageService.getRefreshToken();
      const userData = await StorageService.getUserData();

      if (storedAccessToken && userData) {
        setAccessToken(storedAccessToken);
        setRefreshToken(storedRefreshToken);
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

  const login = async (newAccessToken: string, newRefreshToken: string) => {
    try {
      await StorageService.setTokens(newAccessToken, newRefreshToken);
      setAccessToken(newAccessToken);
      setRefreshToken(newRefreshToken);

      const userResponse = await ApiService.getMe(newAccessToken);
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
      if (accessToken) {
        try {
          await ApiService.logout(accessToken);
        } catch (error) {
          console.error('서버 로그아웃 에러 (계속 진행):', error);
        }
      }

      await StorageService.clearAll();
      setIsAuthenticated(false);
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
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
    accessToken,
    refreshToken,
    login,
    logout,
    updateUser,
    refreshTokens,
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