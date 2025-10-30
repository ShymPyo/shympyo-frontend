import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { useFocusEffect } from '@react-navigation/native';

const MapScreen: React.FC = () => {
  const { colors, getFontSize, statusBarStyle } = useThemedStyles();
  const webViewRef = useRef<WebView>(null);
  const [isWebViewReady, setIsWebViewReady] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [error, setError] = useState<string | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  // 길찾기 상태
  const [isNavigating, setIsNavigating] = useState(false);
  const [destinationInfo, setDestinationInfo] = useState<{ name: string; distance: number } | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      startWatchingLocation();
      return () => {
        stopWatchingLocation();
      };
    }, [])
  );

  const startWatchingLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setError('위치 정보 접근 권한이 거부되었습니다.');
      Alert.alert(
        '권한 필요',
        '실시간 위치를 사용하려면 위치 정보 접근 권한이 필요합니다. 설정에서 권한을 허용해주세요.'
      );
      return;
    }

    try {
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 5,
        },
        (newLocation) => {
          setLocation(newLocation);
          sendLocationToWebView(newLocation);
        }
      );
    } catch (err) {
      setError('실시간 위치 정보를 가져오는 데 실패했습니다.');
      console.error(err);
    }
  };

  const stopWatchingLocation = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
  };

  const sendLocationToWebView = (currentLocation: Location.LocationObject) => {
    if (webViewRef.current && isWebViewReady) {
      const message = JSON.stringify({
        type: 'location',
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        heading: currentLocation.coords.heading,
      });
      webViewRef.current.postMessage(message);
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      switch (data.type) {
        case 'navigation_start':
          setIsNavigating(true);
          setDestinationInfo({ name: data.destinationName, distance: data.totalDistance });
          break;
        case 'navigation_update':
          if (destinationInfo) {
            setDestinationInfo({ ...destinationInfo, distance: data.remainingDistance });
          }
          break;
        case 'navigation_end':
          setIsNavigating(false);
          setDestinationInfo(null);
          break;
        case 'recalculate_route':
          // 웹에서 경로 재요청을 하도록 유도 (필요 시)
          console.log('경로 재탐색 요청 수신');
          break;
        default:
          break;
      }
    } catch (e) {
      console.error('WebView 메시지 처리 오류:', e);
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

      {isNavigating && destinationInfo && (
        <View style={[styles.navigationBar, { backgroundColor: colors.primary }]}>
          <Text style={[styles.destinationText, { fontSize: getFontSize(15) }]} numberOfLines={1}>
            {destinationInfo.name}
          </Text>
          <Text style={[styles.distanceText, { fontSize: getFontSize(14) }]}>
            남은 거리: {(destinationInfo.distance / 1000).toFixed(1)} km
          </Text>
        </View>
      )}

      {!isWebViewReady && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.text.primary, marginTop: 10 }}>지도를 불러오는 중...</Text>
        </View>
      )}

      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ uri: 'https://map-deploy-olive.vercel.app/' }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mixedContentMode="always"
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        injectedJavaScript={`window.ReactNativeWebView = window.ReactNativeWebView || {}; true;`}
        onLoadEnd={() => setIsWebViewReady(true)}
        onMessage={handleWebViewMessage}
        onError={(e) => setError(`맵 로딩 오류: ${e.nativeEvent.description}`)}
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
    textAlign: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  navigationBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  destinationText: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  distanceText: {
    color: 'white',
  },
});

export default MapScreen;
