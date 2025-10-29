import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useThemedStyles } from '../hooks/useThemedStyles';

const MapScreen: React.FC = () => {
  const { colors, getFontSize, statusBarStyle } = useThemedStyles();
  const webViewRef = useRef<WebView>(null);
  const [error, setError] = useState<string | null>(null);

  const sendFixedLocation = () => {
    // 고정된 위치 (서울 시청)로 설정
    const fixedLocation = {
      latitude: 37.5665,
      longitude: 126.978,
      heading: 0,
    };

    // WebView로 위치 데이터 전달
    if (webViewRef.current) {
      const message = JSON.stringify({
        type: 'location',
        latitude: fixedLocation.latitude,
        longitude: fixedLocation.longitude,
        heading: fixedLocation.heading,
      });
      console.log('Sending fixed location to WebView:', message);
      webViewRef.current.postMessage(message);
    }
  };

  if (error) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <StatusBar style={statusBarStyle as any} />
        <Text style={[styles.errorText, { fontSize: getFontSize(16), color: colors.text.error }]}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={statusBarStyle as any} />
      {/* 핀 카테고리 */}
      <View style={[styles.categoryContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.categoryItem}>
          <View style={[styles.categoryPin, { backgroundColor: '#7B7BF7' }]}>
            <Ionicons name="medical" size={16} color="#FFFFFF" />
          </View>
          <Text style={[styles.categoryText, { fontSize: getFontSize(12), color: colors.text.primary }]}>쉘터</Text>
        </View>
        <View style={styles.categoryItem}>
          <View style={[styles.categoryPin, { backgroundColor: '#A5A5E8' }]}>
            <Ionicons name="business" size={16} color="#FFFFFF" />
          </View>
          <Text style={[styles.categoryText, { fontSize: getFontSize(12), color: colors.text.primary }]}>민간</Text>
        </View>
        <View style={styles.categoryItem}>
          <View style={[styles.categoryPin, { backgroundColor: '#4A90E2' }]}>
            <Ionicons name="car" size={16} color="#FFFFFF" />
          </View>
          <Text style={[styles.categoryText, { fontSize: getFontSize(12), color: colors.text.primary }]}>교통</Text>
        </View>
        <View style={styles.categoryItem}>
          <View style={[styles.categoryPin, { backgroundColor: '#8A8A8A' }]}>
            <Ionicons name="library" size={16} color="#FFFFFF" />
          </View>
          <Text style={[styles.categoryText, { fontSize: getFontSize(12), color: colors.text.primary }]}>공공</Text>
        </View>
      </View>
      
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ uri: 'https://map-deploy-olive.vercel.app/' }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        mixedContentMode="always"
        geolocationEnabled={false}
        cacheEnabled={true}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error: ', nativeEvent);
          setError('맵을 표시하는데 오류가 발생했습니다.');
        }}
        onLoadStart={() => console.log('WebView loading started')}
        onLoadEnd={() => {
          console.log('WebView loading ended');
          // WebView 로드 완료 후 고정 위치 전송
          setTimeout(() => {
            sendFixedLocation();
          }, 500);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  webview: {
    flex: 1,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    fontSize: 16,
  },
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  categoryItem: {
    alignItems: 'center',
  },
  categoryPin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
});

export default MapScreen;
