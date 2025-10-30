import { useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getColors } from '../constants/colors';
import { StatusBarStyle } from 'expo-status-bar';

export const useThemedStyles = () => {
  const { themeMode, contrastMode, getFontSize } = useTheme();

  const colors = useMemo(() => getColors(themeMode, contrastMode), [themeMode, contrastMode]);

  const statusBarStyle: StatusBarStyle = themeMode === 'dark' ? 'light' : 'dark';

  return {
    colors,
    getFontSize,
    statusBarStyle,
    themeMode,
    contrastMode
  };
};