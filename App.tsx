import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import 'react-native-gesture-handler';

import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';

export default function App() {
  useEffect(() => {
    // 웹에서 aria-hidden 경고 억제
    if (Platform.OS === 'web') {
      const originalWarn = console.warn;
      console.warn = (...args) => {
        if (
          (args[0] && args[0].includes && args[0].includes('aria-hidden')) ||
          (args[0] && args[0].includes && args[0].includes('Blocked aria-hidden'))
        ) {
          return;
        }
        originalWarn(...args);
      };
    }
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
