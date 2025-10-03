import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { useThemedStyles } from '../hooks/useThemedStyles';

const MapScreen: React.FC = () => {
  const { colors, getFontSize, statusBarStyle } = useThemedStyles();
  const [htmlUri, setHtmlUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    const requestLocationPermission = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('위치 권한이 거부되었습니다.');
        return false;
      }
      return true;
    };

    const loadAsset = async () => {
      try {
        const hasPermission = await requestLocationPermission();
        const asset = Asset.fromModule(require('../../assets/kakao_map.html'));
        await asset.downloadAsync();
        setHtmlUri(asset.localUri || asset.uri);
        setLoading(false);

        // 위치 권한이 있으면 실시간 추적 시작
        if (hasPermission) {
          startLocationTracking();
        }
      } catch (err) {
        setError('맵 파일을 불러오는데 실패했습니다.');
        setLoading(false);
      }
    };

    loadAsset();
  }, []);

  const startLocationTracking = async () => {
    try {
      console.log('Starting location tracking...');
      await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000, // 1초마다 업데이트
          distanceInterval: 1, // 1m 이동마다 업데이트
        },
        (location) => {
          const { latitude, longitude, heading } = location.coords;
          console.log('Location update:', latitude, longitude, heading);

          // WebView로 위치 데이터 전달
          if (webViewRef.current) {
            const message = JSON.stringify({
              type: 'location',
              latitude,
              longitude,
              heading: heading || 0,
            });
            console.log('Sending to WebView:', message);
            webViewRef.current.postMessage(message);
          }
        }
      );
    } catch (err) {
      console.error('위치 추적 오류:', err);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <StatusBar style={statusBarStyle as any} />
        <Text style={[styles.loadingText, { fontSize: getFontSize(16), color: colors.text.primary }]}>맵 로딩 중...</Text>
      </View>
    );
  }

  if (error || !htmlUri) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <StatusBar style={statusBarStyle as any} />
        <Text style={[styles.errorText, { fontSize: getFontSize(16), color: colors.text.error }]}>{error || '맵을 불러올 수 없습니다.'}</Text>
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
        source={{ uri: htmlUri }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        mixedContentMode="compatibility"
        geolocationEnabled={true}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error: ', nativeEvent);
          setError('맵을 표시하는데 오류가 발생했습니다.');
        }}
        onLoadStart={() => console.log('WebView loading started')}
        onLoadEnd={() => console.log('WebView loading ended')}
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
