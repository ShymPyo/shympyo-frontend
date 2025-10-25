import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark';
export type ContrastMode = 'normal' | 'high';
export type FontSizeLevel = 'small' | 'normal' | 'large' | 'extra-large';

interface ThemeSettings {
  themeMode: ThemeMode;
  contrastMode: ContrastMode;
  fontSizeLevel: FontSizeLevel;
}

interface ThemeContextType extends ThemeSettings {
  setThemeMode: (mode: ThemeMode) => void;
  setContrastMode: (mode: ContrastMode) => void;
  setFontSizeLevel: (level: FontSizeLevel) => void;
  getFontSize: (baseSize: number) => number;
}

const defaultSettings: ThemeSettings = {
  themeMode: 'light',
  contrastMode: 'normal',
  fontSizeLevel: 'normal',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEYS = {
  THEME_MODE: 'theme_mode',
  CONTRAST_MODE: 'contrast_mode',
  FONT_SIZE_LEVEL: 'font_size_level',
};

const fontSizeMultipliers = {
  'small': 0.85,
  'normal': 1.0,
  'large': 1.15,
  'extra-large': 1.3,
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(defaultSettings.themeMode);
  const [contrastMode, setContrastModeState] = useState<ContrastMode>(defaultSettings.contrastMode);
  const [fontSizeLevel, setFontSizeLevelState] = useState<FontSizeLevel>(defaultSettings.fontSizeLevel);

  // 설정 로드
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [storedTheme, storedContrast, storedFontSize] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.THEME_MODE),
        AsyncStorage.getItem(STORAGE_KEYS.CONTRAST_MODE),
        AsyncStorage.getItem(STORAGE_KEYS.FONT_SIZE_LEVEL),
      ]);

      if (storedTheme) setThemeModeState(storedTheme as ThemeMode);
      if (storedContrast) setContrastModeState(storedContrast as ContrastMode);
      if (storedFontSize) setFontSizeLevelState(storedFontSize as FontSizeLevel);
    } catch (error) {
      console.error('테마 설정 로드 실패:', error);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
      console.log('🎨 테마 모드 변경:', mode);
    } catch (error) {
      console.error('테마 모드 저장 실패:', error);
    }
  };

  const setContrastMode = async (mode: ContrastMode) => {
    try {
      setContrastModeState(mode);
      await AsyncStorage.setItem(STORAGE_KEYS.CONTRAST_MODE, mode);
      console.log('🔆 대비 모드 변경:', mode);

      // 고대비 모드를 켜면 자동으로 다크모드 ON
      if (mode === 'high') {
        setThemeModeState('dark');
        await AsyncStorage.setItem(STORAGE_KEYS.THEME_MODE, 'dark');
        console.log('🎨 고대비 모드 활성화로 다크모드 자동 전환');
      }
    } catch (error) {
      console.error('대비 모드 저장 실패:', error);
    }
  };

  const setFontSizeLevel = async (level: FontSizeLevel) => {
    try {
      setFontSizeLevelState(level);
      await AsyncStorage.setItem(STORAGE_KEYS.FONT_SIZE_LEVEL, level);
      console.log('🔤 글자 크기 변경:', level);
    } catch (error) {
      console.error('글자 크기 저장 실패:', error);
    }
  };

  const getFontSize = (baseSize: number): number => {
    return Math.round(baseSize * fontSizeMultipliers[fontSizeLevel]);
  };

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        contrastMode,
        fontSizeLevel,
        setThemeMode,
        setContrastMode,
        setFontSizeLevel,
        getFontSize,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};