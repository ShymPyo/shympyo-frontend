import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { useFocusEffect } from '@react-navigation/native';

// 쉼터 데이터 타입 정의
interface Shelter {
  id: number;
  lat: number;
  lng: number;
  name: string;
  iconUrl?: string;
}

const MapScreen: React.FC = () => {
  const { colors, getFontSize, statusBarStyle } = useThemedStyles();
  const webViewRef = useRef<WebView>(null);

  // 상태 정의
  const [isWebViewReady, setIsWebViewReady] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [error, setError] = useState<string | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  // 길찾기 상태
  const [isNavigating, setIsNavigating] = useState(false);
  const [destinationInfo, setDestinationInfo] = useState<{ name: string; distance: number } | null>(null);

  // 쉼터 데이터
  const [shelters, setShelters] = useState<Shelter[]>([]);

  /** ------------------------------------------------
   * 1️⃣ 앱 시작 시 Mock 데이터 로드 (API로 대체 가능)
   * ------------------------------------------------ */
  useEffect(() => {
    const mockShelters: Shelter[] = [
      { id: 1, lat: 37.5665, lng: 126.9780, name: '시청역 쉼터', iconUrl: 'https://i.imgur.com/wB4s3Z8.png' },
      { id: 2, lat: 37.5700, lng: 126.9792, name: '광화문 쉼터', iconUrl: 'https://i.imgur.com/wB4s3Z8.png' },
      { id: 3, lat: 37.5650, lng: 126.9760, name: '덕수궁 쉼터', iconUrl: 'https://i.imgur.com/wB4s3Z8.png' },
    ];
    setShelters(mockShelters);
  }, []);

  /** ------------------------------------------------
   * 2️⃣ 지도 준비 완료 시 쉼터 데이터 전송
   * ------------------------------------------------ */
  useEffect(() => {
    if (isWebViewReady && isMapReady && shelters.length > 0) {
      sendSheltersToWebView();
    }
  }, [isWebViewReady, isMapReady, shelters]);

  /** ------------------------------------------------
   * 3️⃣ 위치 추적 (Focus 시 실행, Unfocus 시 정지)
   * ------------------------------------------------ */
  useFocusEffect(
    React.useCallback(() => {
      startWatchingLocation();
      return () => stopWatchingLocation();
    }, [])
  );

  const startWatchingLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setError('위치 정보 접근 권한이 거부되었습니다.');
      Alert.alert('권한 필요', '실시간 위치를 사용하려면 위치 정보 접근 권한이 필요합니다.');
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

  /** ------------------------------------------------
   * 4️⃣ RN → WebView 메시지 전송 함수
   * ------------------------------------------------ */
  const sendLocationToWebView = (currentLocation: Location.LocationObject) => {
    if (webViewRef.current && isMapReady) {
      const message = JSON.stringify({
        type: 'location',
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        heading: currentLocation.coords.heading,
      });
      webViewRef.current.postMessage(message);
    }
  };

  const sendSheltersToWebView = () => {
    if (!webViewRef.current || !isMapReady || !isWebViewReady) {
      console.log('⏸️ 웹뷰 또는 맵 준비 안 됨 — 전송 보류');
      return;
    }
    const message = JSON.stringify({ type: 'shelters', list: shelters });
    webViewRef.current.postMessage(message);
    console.log('✅ 쉼터 데이터를 웹뷰로 전송했습니다.');
  };

  /** ------------------------------------------------
   * 5️⃣ WebView → RN 메시지 수신
   * ------------------------------------------------ */
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      switch (data.type) {
        case 'map_ready':
          setIsMapReady(true);
          console.log('🗺️ 웹뷰의 카카오맵이 준비되었습니다.');
          break;
        case 'navigation_start':
          setIsNavigating(true);
          setDestinationInfo({ name: data.destinationName, distance: data.totalDistance });
          console.log('🚗 길찾기 시작:', data);
          break;
        case 'navigation_update':
          if (destinationInfo) {
            setDestinationInfo({ ...destinationInfo, distance: data.remainingDistance });
          }
          break;
        case 'navigation_end':
          console.log('🏁 길찾기 종료');
          setIsNavigating(false);
          setDestinationInfo(null);
          break;
        default:
          console.log('📩 기타 WebView 메시지:', data);
          break;
      }
    } catch (e) {
      console.error('❌ WebView 메시지 처리 오류:', e);
    }
  };

  /** ------------------------------------------------
   * 6️⃣ 렌더링
   * ------------------------------------------------ */
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
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        allowFileAccess
        allowUniversalAccessFromFileURLs
        injectedJavaScript={`
          (function() {
            window.ReactNativeWebView = window.ReactNativeWebView || {};
            // ✅ Android 메시지 브리지 보강
            document.addEventListener('message', function(e) {
              if (window.ReactNativeWebView.onMessage) {
                window.ReactNativeWebView.onMessage(e);
              }
            });
          })();
          true;
        `}
        onLoadEnd={() => {
          setIsWebViewReady(true);
          console.log('✅ WebView 로드 완료');
        }}
        onMessage={handleWebViewMessage}
        onError={(e) => setError(`맵 로딩 오류: ${e.nativeEvent.description}`)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  webview: { flex: 1 },
  errorText: { textAlign: 'center' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  navigationBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  destinationText: { color: 'white', fontWeight: 'bold', marginBottom: 4 },
  distanceText: { color: 'white' },
});

export default MapScreen;
