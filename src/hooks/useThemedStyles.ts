import { useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getColors } from '../constants/colors';

export const useThemedStyles = () => {
  const { themeMode, contrastMode, getFontSize } = useTheme();

  const colors = useMemo(() => getColors(themeMode, contrastMode), [themeMode, contrastMode]);

  const statusBarStyle = themeMode === 'dark' ? 'light' : 'dark';

  return {
    colors,
    getFontSize,
    statusBarStyle,
    themeMode,
    contrastMode
  };
};