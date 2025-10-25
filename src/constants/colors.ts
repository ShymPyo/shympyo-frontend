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
  primary: '#0066FF', // 밝은 파란색 (이미지 참고)
  secondary: '#FFD700', // 금색/노란색 (이미지의 키패드 색상)
  background: '#FFFFFF', // 순수 흰색 배경
  surface: '#F5F5F5', // 연한 회색
  text: {
    primary: '#000000', // 순수 검은색 텍스트 (최대 대비)
    secondary: '#000000', // 순수 검은색 텍스트
    light: '#000000', // 순수 검은색 (고대비에서는 모든 텍스트 동일)
    white: '#FFFFFF', // 순수 흰색
  },
  success: '#00CC00', // 초록색
  warning: '#FFD700', // 금색/노란색
  error: '#FF0000', // 순수 빨간색
};

const darkHighContrast: ColorScheme = {
  primary: '#FFD700', // 금색/노란색 (이미지의 키패드 색상과 동일)
  secondary: '#0066FF', // 밝은 파란색
  background: '#000000', // 순수 검은색 배경
  surface: '#1A1A1A', // 약간 밝은 검은색 (구분을 위해)
  text: {
    primary: '#FFFFFF', // 순수 흰색 텍스트 (최대 대비)
    secondary: '#FFFFFF', // 순수 흰색 텍스트
    light: '#FFFFFF', // 순수 흰색 (고대비에서는 모든 텍스트 동일)
    white: '#000000', // 검은색 (노란색 배경 위에 사용)
  },
  success: '#00FF00', // 순수 초록색
  warning: '#FFD700', // 금색/노란색
  error: '#FF3333', // 밝은 빨간색
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