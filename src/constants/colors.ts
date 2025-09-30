import { ThemeMode, ContrastMode } from '../contexts/ThemeContext';

export interface ColorScheme {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: {
    primary: string;
    secondary: string;
    light: string;
    white: string;
  };
  success: string;
  warning: string;
  error: string;
}

const lightTheme: ColorScheme = {
  primary: '#4A90E2',
  secondary: '#F5A623',
  background: '#FFFFFF',
  surface: '#F8F9FA',
  text: {
    primary: '#333333',
    secondary: '#666666',
    light: '#999999',
    white: '#FFFFFF',
  },
  success: '#27AE60',
  warning: '#F39C12',
  error: '#E74C3C',
};

const darkTheme: ColorScheme = {
  primary: '#5BA3F5',
  secondary: '#FFB84D',
  background: '#121212',
  surface: '#1E1E1E',
  text: {
    primary: '#FFFFFF',
    secondary: '#CCCCCC',
    light: '#888888',
    white: '#000000',
  },
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
};

const lightHighContrast: ColorScheme = {
  primary: '#0000FF', // 파란색 (참고 이미지의 파란색)
  secondary: '#FFFF00', // 노란색 (참고 이미지의 노란색)
  background: '#FFFFFF', // 흰색 배경
  surface: '#F0F0F0', // 연한 회색
  text: {
    primary: '#000000', // 검은색 텍스트 (최대 대비)
    secondary: '#000000', // 검은색 텍스트 (고대비에서는 모든 텍스트를 검은색으로)
    light: '#333333', // 진한 회색
    white: '#000000', // 고대비에서는 white도 검은색으로
  },
  success: '#00FF00', // 초록색 (참고 이미지의 초록색)
  warning: '#FFFF00', // 노란색
  error: '#FF0000', // 빨간색 (참고 이미지의 빨간색)
};

const darkHighContrast: ColorScheme = {
  primary: '#00FFFF', // 청록색 (참고 이미지의 청록색)
  secondary: '#FFFF00', // 노란색
  background: '#000000', // 검은색 배경
  surface: '#1A1A1A', // 진한 회색
  text: {
    primary: '#FFFFFF', // 흰색 텍스트 (최대 대비)
    secondary: '#FFFFFF', // 흰색 텍스트 (고대비에서는 모든 텍스트를 흰색으로)
    light: '#CCCCCC', // 연한 회색
    white: '#FFFFFF', // 흰색 유지
  },
  success: '#00FF00', // 초록색
  warning: '#FFFF00', // 노란색
  error: '#FF0000', // 빨간색
};

export const getColors = (themeMode: ThemeMode, contrastMode: ContrastMode): ColorScheme => {
  if (themeMode === 'dark') {
    return contrastMode === 'high' ? darkHighContrast : darkTheme;
  } else {
    return contrastMode === 'high' ? lightHighContrast : lightTheme;
  }
};

// 기본 Colors export (기존 코드 호환성)
export const Colors = lightTheme;