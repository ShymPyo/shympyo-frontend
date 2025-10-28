import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ScrollView,
  Modal,
  Platform,
  Alert,
  BackHandler,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';
import * as Location from 'expo-location';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';

import { Colors, getColors } from '../constants/colors';
import ShelterDetailModal from '../components/ShelterDetailModal';
import UserShelterDetailModal from '../components/UserShelterDetailModal';
import TutorialModal from '../components/TutorialModal';
import ApiService, { MapLocation, NearbyPlace, WeatherData } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainTabParamList } from '../types';

const { width, height } = Dimensions.get('window');

// Shadow 스타일 헬퍼 함수
const getShadowStyle = (shadowConfig: {
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;
  elevation?: number;
}) => {
  if (Platform.OS === 'web') {
    const { shadowOffset, shadowOpacity, shadowRadius } = shadowConfig;
    const offsetX = shadowOffset?.width || 0;
    const offsetY = shadowOffset?.height || 0;
    const blur = shadowRadius || 0;
    const opacity = shadowOpacity || 0;
    return {
      boxShadow: `${offsetX}px ${offsetY}px ${blur}px rgba(0, 0, 0, ${opacity})`
    };
  }
  
  return shadowConfig;
};

// SVG Path로 자연스러운 물결 (안전한 버전)
const AnimatedThermometer: React.FC<{ temperature: number; colors: any; contrastMode: 'normal' | 'high' }> = ({ temperature, colors, contrastMode }) => {
  const [waveOffset1, setWaveOffset1] = React.useState(0);
  const [waveOffset2, setWaveOffset2] = React.useState(0);

  React.useEffect(() => {
    // 자연스러운 속도로 더 빠르게
    const interval1 = setInterval(() => {
      setWaveOffset1(prev => (prev + 0.12) % (Math.PI * 2)); // 더 빠르게
    }, 40); // 더 자주 업데이트

    const interval2 = setInterval(() => {
      setWaveOffset2(prev => (prev + 0.10) % (Math.PI * 2)); // 더 빠르게
    }, 40); // 더 자주 업데이트

    return () => {
      clearInterval(interval1);
      clearInterval(interval2);
    };
  }, []);

  // 물결 Path 생성 (간단하고 안전하게)
  const createWavePath = (offset: number, amplitude: number) => {
    const width = 28;
    const height = 90;
    const fillHeight = height * 0.65;
    const waveTop = height - fillHeight;

    let path = `M 0,${waveTop}`;

    // 더 적은 점으로 간단하게
    for (let x = 0; x <= width; x += 2) {
      const y = waveTop + Math.sin((x / width) * Math.PI * 2 + offset) * amplitude;
      path += ` L ${x},${y}`;
    }

    path += ` L ${width},${height} L 0,${height} Z`;
    return path;
  };

  // 고대비 모드에 따른 색상 설정
  const gradientColors = contrastMode === 'high'
    ? {
        primary1: colors.primary,
        primary2: colors.primary,
        primary3: colors.primary,
        primary4: colors.primary,
        secondary1: colors.primary,
        secondary2: colors.primary,
        secondary3: colors.primary,
        solidColor: colors.primary,
      }
    : {
        primary1: '#D50000',
        primary2: '#FF1744',
        primary3: '#FF5722',
        primary4: '#FF8A65',
        secondary1: '#B71C1C',
        secondary2: '#E53935',
        secondary3: '#FF6B6B',
        solidColor: '#FF3D00',
      };

  return (
    <View style={styles.modernThermometer}>
      <View style={[styles.thermometerBackground, { backgroundColor: contrastMode === 'high' ? colors.surface : '#E8E8E8' }]} />

      {/* 그라데이션 배경 */}
      <Svg
        height="90"
        width="28"
        style={{ position: 'absolute', bottom: 0 }}
        viewBox="0 0 28 90"
      >
        <Defs>
          <SvgLinearGradient id="thermometerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={gradientColors.primary1} stopOpacity={1} />
            <Stop offset="30%" stopColor={gradientColors.primary2} stopOpacity={0.95} />
            <Stop offset="60%" stopColor={gradientColors.primary3} stopOpacity={0.9} />
            <Stop offset="100%" stopColor={gradientColors.primary4} stopOpacity={0.85} />
          </SvgLinearGradient>
          <SvgLinearGradient id="redGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={gradientColors.secondary1} stopOpacity={0.9} />
            <Stop offset="50%" stopColor={gradientColors.secondary2} stopOpacity={0.9} />
            <Stop offset="100%" stopColor={gradientColors.secondary3} stopOpacity={0.8} />
          </SvgLinearGradient>
        </Defs>


        {/* 첫 번째 물결 레이어 */}
        <Path
          d={createWavePath(waveOffset1, 1.8)} // 작은 진폭
          fill="url(#redGradient)"
          opacity={0.8}
        />

        {/* 두 번째 물결 레이어 */}
        <Path
          d={createWavePath(waveOffset2 + Math.PI/3, 1.2)} // 더 작은 진폭, 위상차
          fill={gradientColors.solidColor}
          opacity={0.6}
        />
      </Svg>
    </View>
  );
};

// 대중교통 관련 인터페이스와 데이터 제거 - 쉼터 기능만 사용

interface TodayAndHoliday {
  dayOfWeek: string;
  closed: boolean;
  openTime: string;
  closeTime: string;
  breakStart?: string;
  breakEnd?: string;
  holidays?: string[];
}

interface Shelter {
  id: string;
  name: string;
  type: string;
  distance: string;
  category: '민간 개방 시설' | '스마트 쉼터' | '교통 시설' | '공공 시설' | '기후 동행 쉼터';
  icon: string;
  color: string;
  address?: string;
  description?: string;
  content?: string | null;
  latitude?: number;
  longitude?: number;
  maxCapacity?: number;
  currentCapacity?: number;
  imageUrl?: string;
  todayAndHoliday?: TodayAndHoliday;
  maxUsageMinutes?: number;
}

const shelters: Shelter[] = [
  {
    id: '1',
    name: '카페빈스',
    type: '민간 개방 시설',
    distance: '30M',
    category: '민간 개방 시설',
    icon: 'location-outline',
    color: '#FFA500'
  },
  {
    id: '2',
    name: '미추홀구 스마트 쉼터',
    type: '스마트 쉼터',
    distance: '37M',
    category: '스마트 쉼터',
    icon: 'home-outline',
    color: '#4A90E2'
  },
  {
    id: '3',
    name: '인하대역',
    type: '교통 시설',
    distance: '50M',
    category: '교통 시설',
    icon: 'train-outline',
    color: '#27AE60'
  },
  {
    id: '4',
    name: '용현 노인 문화 센터',
    type: '공공 시설',
    distance: '83M',
    category: '공공 시설',
    icon: 'business-outline',
    color: '#E74C3C'
  }
];

type HomeScreenNavigationProp = StackNavigationProp<MainTabParamList, 'Home'>;

// 로딩 점 애니메이션 컴포넌트
const LoadingDots: React.FC<{ color: string }> = ({ color }) => {
  const dot1Opacity = useSharedValue(0.3);
  const dot2Opacity = useSharedValue(0.3);
  const dot3Opacity = useSharedValue(0.3);

  useEffect(() => {
    const animateDot = (dotOpacity: Animated.SharedValue<number>, delay: number) => {
      dotOpacity.value = withSpring(1, { damping: 2, stiffness: 100 }, () => {
        dotOpacity.value = withSpring(0.3, { damping: 2, stiffness: 100 });
      });
    };

    const interval = setInterval(() => {
      animateDot(dot1Opacity, 0);
      setTimeout(() => animateDot(dot2Opacity, 0), 200);
      setTimeout(() => animateDot(dot3Opacity, 0), 400);
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  const dot1Style = useAnimatedStyle(() => ({
    opacity: dot1Opacity.value,
  }));

  const dot2Style = useAnimatedStyle(() => ({
    opacity: dot2Opacity.value,
  }));

  const dot3Style = useAnimatedStyle(() => ({
    opacity: dot3Opacity.value,
  }));

  return (
    <View style={styles.loadingDots}>
      <Animated.View style={[styles.dot, { backgroundColor: color }, dot1Style]} />
      <Animated.View style={[styles.dot, { backgroundColor: color }, dot2Style]} />
      <Animated.View style={[styles.dot, { backgroundColor: color }, dot3Style]} />
    </View>
  );
};

// 길안내 메시지 애니메이션 컴포넌트
const NavigationMessage: React.FC<{
  visible: boolean;
  icon: string;
  message: string;
  colors: any;
  getFontSize: (size: number) => number;
  showDots?: boolean;
}> = ({ visible, icon, message, colors, getFontSize, showDots = false }) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const translateY = useSharedValue(-20);

  useEffect(() => {
    if (visible) {
      // 페이드인 + 스케일 + 위에서 아래로
      opacity.value = withSpring(1, { damping: 30, stiffness: 80 });
      scale.value = withSpring(1, { damping: 30, stiffness: 80 });
      translateY.value = withSpring(0, { damping: 30, stiffness: 80 });
    } else {
      opacity.value = 0;
      scale.value = 0.8;
      translateY.value = -20;
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  if (!visible) return null;

  return (
    <View style={styles.loadingOverlay}>
      <Animated.View style={[styles.loadingCard, { backgroundColor: colors.surface }, animatedStyle]}>
        <Ionicons name={icon as any} size={32} color={colors.primary} />
        <Text style={[styles.loadingText, { fontSize: getFontSize(16), color: colors.text.primary }]}>
          {message}
        </Text>
        {showDots && <LoadingDots color={colors.primary} />}
      </Animated.View>
    </View>
  );
};

const HomeScreen: React.FC = () => {
  const { accessToken, refreshTokens } = useAuth();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { colors, getFontSize, statusBarStyle, contrastMode } = useThemedStyles();

  // 상태 관리: 선택된 쉼터 정보만 관리
  const [selectedShelter, setSelectedShelter] = useState<Shelter>(shelters[0]);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['민간 개방 시설', '스마트 쉼터', '교통 시설', '공공 시설', '기후 동행 쉼터']);

  // 튜토리얼 모달 상태
  const [showTutorial, setShowTutorial] = useState(false);

  // 위치 관련 상태
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [locationPermission, setLocationPermission] = useState<Location.PermissionStatus | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [mapLocations, setMapLocations] = useState<MapLocation[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // 날씨 관련 상태
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);

  // 핀 이미지 base64 상태
  const [pinImages, setPinImages] = useState<{
    shelter: string;
    mingan: string;
    traffic: string;
    politic: string;
    climate: string;
  } | null>(null);

  // 길안내 관련 상태
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationInfo, setNavigationInfo] = useState<{
    destinationName: string;
    distance: string;
    duration: string;
  } | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [isEndingRoute, setIsEndingRoute] = useState(false);
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lon: number } | null>(null);

  // 길안내 정보 카드 애니메이션
  const navInfoOpacity = useSharedValue(0);
  const navInfoTranslateY = useSharedValue(-20);

  // 길안내 정보 카드 애니메이션 트리거
  useEffect(() => {
    if (isNavigating && !isLoadingRoute && !isEndingRoute) {
      navInfoOpacity.value = 1;
      navInfoTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
    } else {
      navInfoOpacity.value = 1;
      navInfoTranslateY.value = -20;
    }
  }, [isNavigating, isLoadingRoute, isEndingRoute]);

  const navInfoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: 1,
    transform: [{ translateY: navInfoTranslateY.value }],
  }));

  // 선택된 쉼터 ID (마커 강조용)
  const [selectedShelterId, setSelectedShelterId] = useState<string | null>(null);

  // 핀 이미지 로드
  useEffect(() => {
    const loadPinImages = async () => {
      try {
        const shelterAsset = Asset.fromModule(require('../../assets/map_fins/shelter.png'));
        const minganAsset = Asset.fromModule(require('../../assets/map_fins/mingan.png'));
        const trafficAsset = Asset.fromModule(require('../../assets/map_fins/traffic.png'));
        const politicAsset = Asset.fromModule(require('../../assets/map_fins/politic.png'));
        const climateAsset = Asset.fromModule(require('../../assets/map_fins/climate.png'));

        await Promise.all([
          shelterAsset.downloadAsync(),
          minganAsset.downloadAsync(),
          trafficAsset.downloadAsync(),
          politicAsset.downloadAsync(),
          climateAsset.downloadAsync(),
        ]);

        const shelterBase64 = await FileSystem.readAsStringAsync(shelterAsset.localUri!, { encoding: 'base64' });
        const minganBase64 = await FileSystem.readAsStringAsync(minganAsset.localUri!, { encoding: 'base64' });
        const trafficBase64 = await FileSystem.readAsStringAsync(trafficAsset.localUri!, { encoding: 'base64' });
        const politicBase64 = await FileSystem.readAsStringAsync(politicAsset.localUri!, { encoding: 'base64' });
        const climateBase64 = await FileSystem.readAsStringAsync(climateAsset.localUri!, { encoding: 'base64' });

        setPinImages({
          shelter: `data:image/png;base64,${shelterBase64}`,
          mingan: `data:image/png;base64,${minganBase64}`,
          traffic: `data:image/png;base64,${trafficBase64}`,
          politic: `data:image/png;base64,${politicBase64}`,
          climate: `data:image/png;base64,${climateBase64}`,
        });

        console.log('✅ 핀 이미지 로드 완료');
      } catch (error) {
        console.error('❌ 핀 이미지 로드 실패:', error);
      }
    };

    loadPinImages();
  }, []);

  // 로그인 시마다 튜토리얼 표시
  useEffect(() => {
    if (accessToken) {
      setTimeout(() => {
        setShowTutorial(true);
      }, 500);
    }
  }, [accessToken]);

  // 튜토리얼 닫기 핸들러
  const handleCloseTutorial = () => {
    setShowTutorial(false);
  };

  // 위치 권한 요청 및 초기 위치 설정
  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setLocationPermission(status);

        if (status === 'granted') {
          // 권한이 있으면 현재 위치 가져오기
          getCurrentLocation();
        } else {
          console.log('위치 권한이 거부됨');
        }
      } catch (error) {
        console.error('위치 권한 요청 실패:', error);
      }
    };

    requestLocationPermission();
  }, []);

  // 현재 위치 가져오기
  const getCurrentLocation = async () => {
    try {
      setIsLoadingLocation(true);

      // 고정 위치 사용 (서울 시청)
      const fixedLat = 37.5665;
      const fixedLon = 126.978;

      // 고정 위치를 Location 객체 형식으로 생성
      const location = {
        coords: {
          latitude: fixedLat,
          longitude: fixedLon,
          altitude: null,
          accuracy: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      } as Location.LocationObject;

      setCurrentLocation(location);
      console.log('✅ 고정 위치 (서울 시청):', fixedLat, fixedLon);

      // 주변 장소 및 날씨 조회
      await Promise.all([
        loadNearbyPlaces(fixedLat, fixedLon),
        loadWeather(fixedLat, fixedLon)
      ]);
    } catch (error) {
      console.error('❌ 현재 위치 가져오기 실패:', error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // 날씨 정보 조회
  const loadWeather = async (lat: number, lon: number) => {
    try {
      console.log('🌤️ 날씨 정보 조회 중... 위치:', { lat, lon });

      const response = await ApiService.getWeather(lat, lon);

      if (response.success && response.data) {
        setWeatherData(response.data);
        console.log('✅ 날씨 정보 로드:', response.data);
      } else {
        console.log('❌ 날씨 API 실패:', response.message);
      }
    } catch (error) {
      console.error('❌ 날씨 정보 조회 실패:', error);
    }
  };

  // 주변 장소 조회
  const loadNearbyPlaces = async (lat: number, lon: number, radius: number = 500) => {
    try {
      console.log(`🔍 검색 조건: 위치(${lat}, ${lon}), 반경: ${radius}m`);

      const [mapResponse, listResponse] = await Promise.all([
        ApiService.getNearbyMap(lat, lon, radius, 100, accessToken || ''),
        ApiService.getNearbyList(lat, lon, radius, 50, accessToken || '')
      ]);

      console.log('🔍 API 응답 상세 정보:');
      console.log('지도 API 응답:', JSON.stringify(mapResponse, null, 2));
      console.log('리스트 API 응답:', JSON.stringify(listResponse, null, 2));

      if (mapResponse.success && mapResponse.data) {
        setMapLocations(mapResponse.data);
        console.log('✅ 지도 위치 데이터 로드:', mapResponse.data.length, '개');
        console.log('지도 데이터 내용:', mapResponse.data);
      } else {
        console.log('❌ 지도 API 실패:', mapResponse.message);
      }

      if (listResponse.success && listResponse.data) {
        setNearbyPlaces(listResponse.data);
        console.log('✅ 주변 장소 리스트 로드:', listResponse.data.length, '개');
        console.log('리스트 데이터 내용:', listResponse.data);
      } else {
        console.log('❌ 리스트 API 실패:', listResponse.message);
      }
    } catch (error: any) {
      console.error('❌ 주변 장소 조회 실패:', error);

      // 401/403 오류인 경우 토큰 재발급 시도
      if (error?.toString().includes('401') || error?.toString().includes('403')) {
        console.log('🔄 토큰 만료 감지, 재발급 시도...');

        try {
          await refreshTokens();
          console.log('✅ 토큰 재발급 성공, 재시도...');

          // 토큰 재발급 후 다시 시도
          const [retryMapResponse, retryListResponse] = await Promise.all([
            ApiService.getNearbyMap(lat, lon, radius, 100, accessToken || undefined),
            ApiService.getNearbyList(lat, lon, radius, 50, accessToken || undefined)
          ]);

          if (retryMapResponse.success && retryMapResponse.data) {
            setMapLocations(retryMapResponse.data);
            console.log('✅ 재시도 - 지도 위치 데이터 로드:', retryMapResponse.data.length);
          }

          if (retryListResponse.success && retryListResponse.data) {
            setNearbyPlaces(retryListResponse.data);
            console.log('✅ 재시도 - 주변 장소 리스트 로드:', retryListResponse.data.length);
          }
        } catch (refreshError) {
          console.error('❌ 토큰 재발급 실패:', refreshError);
          console.log('🔐 로그인이 필요합니다.');
        }
      }
    }
  };

  // WebView 참조
  const webViewRef = React.useRef<any>(null);

  // 내 위치 버튼 클릭 핸들러
  const handleMyLocationPress = async () => {
    if (locationPermission !== 'granted') {
      Alert.alert(
        '위치 권한 필요',
        '내 위치를 확인하려면 위치 권한이 필요합니다.',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '설정으로 이동',
            onPress: () => {
              if (Platform.OS === 'ios') {
                // iOS에서는 설정 앱으로 직접 이동하기 어려우므로 안내만
                Alert.alert('설정 안내', '설정 > 개인정보 보호 및 보안 > 위치 서비스에서 권한을 허용해주세요.');
              } else {
                // Android에서는 앱 설정으로 이동 가능
                Location.requestForegroundPermissionsAsync();
              }
            }
          }
        ]
      );
      return;
    }

    // 현재 위치 갱신
    await getCurrentLocation();

    // WebView의 지도를 실제 현재 위치로 이동하고 줌 레벨 초기화
    if (webViewRef.current && currentLocation) {
      const lat = currentLocation.coords.latitude;
      const lon = currentLocation.coords.longitude;

      const moveScript = `
        if (typeof map !== 'undefined') {
          var moveLatLon = new kakao.maps.LatLng(${lat}, ${lon});
          map.setCenter(moveLatLon);
          map.setLevel(3);
        }
      `;
      webViewRef.current.injectJavaScript(moveScript);
    }
  };

  // 마커 클릭 핸들러 - 백엔드 API 호출
  const handleMarkerClick = async (placeId: number) => {
    try {
      console.log('🔍 마커 클릭 - 장소 ID:', placeId);

      const response = await ApiService.getPlaceDetail(placeId, accessToken || undefined);

      if (response.success) {
        console.log('✅ 장소 상세 정보 로드:', response.data);

        // 리스트 API에서 content 정보 찾기
        const listPlace = nearbyPlaces.find(p => p.id === placeId);
        const content = listPlace ? listPlace.content : response.data?.content;

        console.log(`🔍 Content 정보 비교 - List API: "${listPlace?.content}", Detail API: "${response.data?.content}"`);

        // 타입에 따른 카테고리 분류
        const getCategory = (type: string) => {
          if (type === 'SHELTER') return '스마트 쉼터';
          if (type === 'USER_SHELTER') return '민간 개방 시설';
          if (type === 'STATION') return '교통 시설';
          if (type === 'CLIMATE_SHELTER') return '기후 동행 쉼터';
          return '민간 개방 시설';
        };

        const getIcon = (type: string) => {
          if (type === 'SHELTER') return 'medical';
          if (type === 'USER_SHELTER') return 'business';
          if (type === 'STATION') return 'train';
          if (type === 'CLIMATE_SHELTER') return 'sunny';
          return 'business';
        };

        const getColor = (type: string) => {
          if (type === 'SHELTER') return '#4A90E2';
          if (type === 'USER_SHELTER') return '#FFA500';
          if (type === 'STATION') return '#27AE60';
          if (type === 'CLIMATE_SHELTER') return '#9B59B6';
          return '#7ED321';
        };

        // 백엔드 응답을 Shelter 형태로 변환 (리스트 API의 content 사용)
        const detailShelter: Shelter = {
          id: response.data?.id?.toString() || '',
          name: response.data?.name || '쉼터', // name을 시설명으로 사용
          type: response.data?.type || '',
          distance: '0m', // 거리는 계산하거나 기본값
          category: getCategory(response.data?.type || ''),
          icon: getIcon(response.data?.type || ''),
          color: getColor(response.data?.type || ''),
          address: response.data?.address,
          description: content, // 리스트 API의 content 사용 (버스정류장 정보 등)
          content: content, // 리스트 API의 content 사용
          latitude: response.data?.latitude,
          longitude: response.data?.longitude,
          maxCapacity: response.data?.maxCapacity,
          currentCapacity: response.data?.currentCapacity,
          imageUrl: response.data?.imageUrl,
          todayAndHoliday: response.data?.todayAndHoliday,
          maxUsageMinutes: response.data?.maxUsageMinutes,
        };

        console.log('🔍 변환된 Shelter 객체:', detailShelter);

        setSelectedShelter(detailShelter);
        setModalVisible(true);
      } else {
        console.error('❌ 장소 상세 정보 조회 실패:', response.message);
        Alert.alert('오류', '장소 정보를 불러올 수 없습니다.');
      }
    } catch (error) {
      console.error('❌ 장소 상세 정보 조회 에러:', error);
      Alert.alert('오류', '장소 정보를 불러오는 중 오류가 발생했습니다.');
    }
  };

  // 장소 상세 정보 가져오기
  const handleShelterPress = async (shelter: Shelter) => {
    // 선택된 쉼터 ID 업데이트
    setSelectedShelterId(shelter.id);

    // 리스트를 자연스럽게 내리기 (하단 슬라이드 닫기)
    translateY.value = withSpring(0, {
      damping: 40,
      stiffness: 60,
    });
    runOnJS(setShowFade)(false);

    // 지도에서 해당 마커를 강조하고 지도 중심 이동
    if (webViewRef.current && shelter.latitude && shelter.longitude) {
      const highlightScript = `
        // 모든 마커를 원래 크기로 복원
        if (window.markers) {
          window.markers.forEach(function(markerObj, idx) {
            if (markerObj.marker && markerObj.pinImage) {
              var normalImageWithShadow = window.createMarkerImageWithShadow(markerObj.pinImage, 36, 46);
              var normalImage = new kakao.maps.MarkerImage(
                normalImageWithShadow,
                new kakao.maps.Size(44, 52),
                { offset: new kakao.maps.Point(22, 49) }
              );
              markerObj.marker.setImage(normalImage);
            }
          });
        }

        // 선택된 마커 찾기
        var selectedMarkerId = "${shelter.id}";
        var selectedMarkerObj = window.markers ? window.markers.find(function(m) {
          return m.id === selectedMarkerId;
        }) : null;

        if (selectedMarkerObj && selectedMarkerObj.marker && selectedMarkerObj.pinImage) {
          // 선택된 마커는 크기를 키워서 강조 - 비율 301:388 유지 (그림자 포함)
          var highlightImageWithShadow = window.createMarkerImageWithShadow(selectedMarkerObj.pinImage, 48, 62);
          var highlightImage = new kakao.maps.MarkerImage(
            highlightImageWithShadow,
            new kakao.maps.Size(56, 68),
            { offset: new kakao.maps.Point(28, 65) }
          );
          selectedMarkerObj.marker.setImage(highlightImage);
        }

        // 지도 중심을 해당 쉼터로 부드럽게 이동 (약간 위쪽으로 조정하여 화면 중앙에 위치)
        var shelterPosition = new kakao.maps.LatLng(${shelter.latitude}, ${shelter.longitude});
        window.map.panTo(shelterPosition);

        // 적절한 줌 레벨로 조정
        setTimeout(function() {
          window.map.setLevel(3);
        }, 300);
      `;
      webViewRef.current.injectJavaScript(highlightScript);
      console.log('🎯 마커 강조 및 지도 이동:', shelter.name, shelter.id, shelter.latitude, shelter.longitude);
    }

    // 백엔드에서 실제 데이터가 있는 경우 상세 정보 조회
    if (mapLocations.length > 0) {
      try {
        // shelter의 id를 숫자로 변환하여 사용
        const placeId = parseInt(shelter.id);
        const response = await ApiService.getPlaceDetail(placeId, accessToken || undefined);

        if (response.success && response.data) {
          console.log('✅ 장소 상세 정보 로드:', response.data);
          // 상세 정보로 shelter 객체 업데이트
          const updatedShelter = {
            ...shelter,
            address: response.data.address,
            description: response.data.content,
            latitude: response.data.latitude,
            longitude: response.data.longitude,
            maxCapacity: response.data.maxCapacity,
            currentCapacity: response.data.currentCapacity,
            imageUrl: response.data.imageUrl,
            todayAndHoliday: response.data.todayAndHoliday,
            maxUsageMinutes: response.data.maxUsageMinutes,
          };
          console.log('🔍 업데이트된 Shelter - lat:', updatedShelter.latitude, 'lon:', updatedShelter.longitude);
          setSelectedShelter(updatedShelter);
          setModalVisible(true);
        } else {
          // API 실패 시 기본 shelter로 모달 열기
          setSelectedShelter(shelter);
          setModalVisible(true);
        }
      } catch (error) {
        console.error('❌ 장소 상세 정보 조회 실패:', error);
        // 에러 시 기본 shelter로 모달 열기
        setSelectedShelter(shelter);
        setModalVisible(true);
      }
    } else {
      // mapLocations가 없으면 기본 shelter로 모달 열기
      setSelectedShelter(shelter);
      setModalVisible(true);
    }
  };

  // 길찾기: 지도에 경로 그리기 (TMAP 보행자 경로 API)
  const handleNavigation = async (destLat: number, destLon: number, destinationName?: string) => {
    if (!currentLocation) {
      Alert.alert('알림', '현재 위치 정보를 가져올 수 없습니다.');
      return;
    }

    const myLat = currentLocation.coords.latitude;
    const myLon = currentLocation.coords.longitude;
    const destinationShelterId = selectedShelter?.id || '';

    console.log('🗺️ 길찾기 시작:', { from: { myLat, myLon }, to: { destLat, destLon }, name: destinationName, shelterId: destinationShelterId });

    // 하단 슬라이드 닫기
    translateY.value = withSpring(0, {
      damping: 40,
      stiffness: 60,
    });
    runOnJS(setShowFade)(false);

    // 로딩 시작
    setIsLoadingRoute(true);

    try {
      // TMAP 보행자 경로 안내 API
      const requestBody = {
        startX: myLon.toString(),
        startY: myLat.toString(),
        endX: destLon.toString(),
        endY: destLat.toString(),
        reqCoordType: 'WGS84GEO',
        resCoordType: 'WGS84GEO', // WGS84로 받아서 변환 불필요
        startName: '출발지',
        endName: '목적지',
        searchOption: '0',
      };

      console.log('🗺️ TMAP API 요청:', requestBody);

      const response = await fetch('https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1&format=json', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'appKey': process.env.EXPO_PUBLIC_TMAP_API_KEY || '',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API 오류 응답:', errorText);
        throw new Error(`API 오류: ${response.status}`);
      }

      const data = await response.json();
      console.log('🗺️ TMAP 경로 데이터 수신 성공');

      if (!data.features || data.features.length === 0) {
        throw new Error('경로를 찾을 수 없습니다');
      }

      // GeoJSON features에서 LineString 타입만 추출하여 경로 좌표 생성
      let pathCoords: [number, number][] = [];
      let totalDistance = 0;
      let totalTime = 0;

      data.features.forEach((feature: any) => {
        if (feature.geometry.type === 'LineString') {
          // LineString의 coordinates 배열 추가
          feature.geometry.coordinates.forEach((coord: number[]) => {
            // TMAP은 [경도, 위도] 형식, 카카오맵도 LatLng(위도, 경도)
            pathCoords.push([coord[1], coord[0]]); // [위도, 경도]
          });
        }

        // 첫 번째 feature에서 총 거리와 시간 정보 추출
        if (feature.properties && feature.properties.totalDistance) {
          totalDistance = feature.properties.totalDistance;
          totalTime = feature.properties.totalTime;
        }
      });

      // 출발지와 목적지를 명시적으로 연결 (끊김 방지)
      if (pathCoords.length > 0) {
        // 첫 번째 좌표가 현재 위치와 다르면 출발지 추가
        const firstCoord = pathCoords[0];
        const distToStart = Math.abs(firstCoord[0] - myLat) + Math.abs(firstCoord[1] - myLon);
        if (distToStart > 0.0001) { // 약 10m 이상 차이나면
          console.log('🔗 출발지 연결:', { myLat, myLon }, '→', firstCoord);
          pathCoords.unshift([myLat, myLon]); // 맨 앞에 현재 위치 추가
        }

        // 마지막 좌표가 목적지와 다르면 목적지 추가
        const lastCoord = pathCoords[pathCoords.length - 1];
        const distToEnd = Math.abs(lastCoord[0] - destLat) + Math.abs(lastCoord[1] - destLon);
        if (distToEnd > 0.0001) { // 약 10m 이상 차이나면
          console.log('🔗 목적지 연결:', lastCoord, '→', { destLat, destLon });
          pathCoords.push([destLat, destLon]); // 맨 뒤에 목적지 추가
        }
      }

      console.log('🗺️ 경로 좌표 개수:', pathCoords.length);
      console.log('🗺️ 총 거리:', totalDistance, 'm, 총 시간:', totalTime, '초');
      console.log('🗺️ 경로 시작:', pathCoords[0], '경로 끝:', pathCoords[pathCoords.length - 1]);

      // WebView에 경로 그리기
      if (webViewRef.current && pathCoords.length > 0) {
        // 먼저 목적지 쉼터만 보이도록 마커 업데이트
        console.log('🎯 목적지 쉼터 ID:', destinationShelterId);
        console.log('🎯 filteredMapLocations 수:', filteredMapLocations.length);
        console.log('🎯 filteredMapLocations IDs:', filteredMapLocations.map(loc => String(loc.id)).join(', '));

        const destinationLocation = filteredMapLocations.find(loc => String(loc.id) === destinationShelterId);

        console.log('🎯 destinationLocation 찾기 결과:', destinationLocation ? 'O' : 'X');

        // 경로 그리기 및 마커 업데이트를 하나의 스크립트로 통합
        const pathString = pathCoords.map(coord => `new kakao.maps.LatLng(${coord[0]}, ${coord[1]})`).join(',');

        let destinationMarkerScript = '';

        if (destinationLocation) {
          const destinationPlace = nearbyPlaces.find(p => p.id === destinationLocation.id);
          const destinationPosition = {
            title: destinationPlace ? destinationPlace.name : destinationLocation.type,
            latlng: [destinationLocation.latitude, destinationLocation.longitude],
            content: destinationPlace ? destinationPlace.content : '',
            id: destinationLocation.id,
            type: destinationLocation.type
          };

          destinationMarkerScript = `
            console.log('🎯 목적지 외 마커 제거 시작');

            // 기존 마커들 모두 제거
            if (window.markers) {
              console.log('🎯 제거할 마커 수:', window.markers.length);
              window.markers.forEach(function(markerObj) {
                if (markerObj.marker) markerObj.marker.setMap(null);
                if (markerObj.circle) markerObj.circle.setMap(null);
              });
            }
            window.markers = [];

            // 목적지 마커만 다시 생성
            var position = ${JSON.stringify(destinationPosition)};
            var markerPosition = new kakao.maps.LatLng(position.latlng[0], position.latlng[1]);

            var markerColor = position.type === 'SHELTER' ? '#4A90E2' :
                             position.type === 'USER_SHELTER' ? '#FFA500' :
                             position.type === 'STATION' ? '#27AE60' :
                             position.type === 'CLIMATE_SHELTER' ? '#9B59B6' : '#7ED321';

            var pinImageSrc = position.type === 'SHELTER' ? '${pinImages?.shelter}' :
                              position.type === 'USER_SHELTER' ? '${pinImages?.mingan}' :
                              position.type === 'STATION' ? '${pinImages?.traffic}' :
                              position.type === 'PUBLIC' ? '${pinImages?.politic}' :
                              position.type === 'CLIMATE_SHELTER' ? '${pinImages?.climate}' : '${pinImages?.shelter}';

            var markerImageWithShadow = window.createMarkerImageWithShadow(pinImageSrc, 36, 46);
            var markerSize = new kakao.maps.Size(44, 52); // 페이드 + 그림자 포함 (width: 36+8, height: 46+6)
            var markerOffset = new kakao.maps.Point(22, 49); // 핀의 끝점 위치 (중앙 정렬)

            var markerImage = new kakao.maps.MarkerImage(
              markerImageWithShadow,
              markerSize,
              { offset: markerOffset }
            );

            var marker = new kakao.maps.Marker({
              position: markerPosition,
              image: markerImage,
              clickable: true
            });

            marker.setMap(window.map);

            window.markers.push({
              id: String(position.id),
              marker: marker,
              circle: null,
              originalColor: markerColor,
              type: position.type,
              pinImage: pinImageSrc
            });

            kakao.maps.event.addListener(marker, 'click', function() {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage('MARKER_CLICK:' + position.id);
              }
            });

            console.log('🎯 목적지 마커만 표시 완료:', position.id);
          `;
        }

        const drawRouteScript = `
          console.log('🎯 경로 그리기 스크립트 실행됨');

          ${destinationMarkerScript}

          console.log('🎯 마커 처리 완료, 이제 경로 그리기');

          // 기존 경로 폴리라인 제거
          if (window.routeLine) {
            window.routeLine.setMap(null);
          }
          if (window.routeLineOutline) {
            window.routeLineOutline.setMap(null);
          }
          if (window.routeLineShadow) {
            window.routeLineShadow.setMap(null);
          }

          // 실제 보행자 경로 그리기 - 카카오맵 네비 스타일
          var linePath = [${pathString}];

          // 고대비 모드 색상
          var isHighContrast = ${contrastMode === 'high'};
          var routeColor = isHighContrast ? '#FFD700' : '#4A90E2'; // 고대비: 노란색, 일반: 파란색

          // 그림자/외곽선 (진한 회색)
          window.routeLineShadow = new kakao.maps.Polyline({
            path: linePath,
            strokeWeight: 16,
            strokeColor: '#000000',
            strokeOpacity: 0.2,
            strokeStyle: 'solid',
            zIndex: 1
          });

          // 외곽선 (하얀색 테두리)
          window.routeLineOutline = new kakao.maps.Polyline({
            path: linePath,
            strokeWeight: 14,
            strokeColor: isHighContrast ? '#000000' : '#FFFFFF',
            strokeOpacity: 1.0,
            strokeStyle: 'solid',
            zIndex: 2
          });

          // 메인 라인 (굵은 색상 - 고대비 모드에 따라 변경)
          window.routeLine = new kakao.maps.Polyline({
            path: linePath,
            strokeWeight: 10,
            strokeColor: routeColor,
            strokeOpacity: 1.0,
            strokeStyle: 'solid',
            zIndex: 3
          });

          window.routeLineShadow.setMap(window.map);
          window.routeLineOutline.setMap(window.map);
          window.routeLine.setMap(window.map);

          // 경로가 모두 보이도록 지도 범위 조정
          var bounds = new kakao.maps.LatLngBounds();
          linePath.forEach(function(point) {
            bounds.extend(point);
          });

          // 지도 범위 설정 및 강제 리렌더링
          window.map.setBounds(bounds);

          // 약간의 딜레이 후 다시 한 번 bounds 설정 (렌더링 버그 방지)
          setTimeout(function() {
            window.map.setBounds(bounds);
            if (window.map.relayout) {
              window.map.relayout();
            }
          }, 100);

          console.log('✅ 보행자 경로가 지도에 표시되었습니다');
        `;

        console.log('🎯 생성된 스크립트 길이:', drawRouteScript.length);
        console.log('🎯 스크립트 앞부분:', drawRouteScript.substring(0, 500));

        try {
          webViewRef.current.injectJavaScript(drawRouteScript);
          console.log('🎯 injectJavaScript 호출 완료');
        } catch (error) {
          console.error('🎯 injectJavaScript 오류:', error);
        }

        // 거리와 시간 정보 계산
        const distance = totalDistance < 1000
          ? `${Math.round(totalDistance)}m`
          : `${(totalDistance / 1000).toFixed(1)}km`;
        const duration = Math.round(totalTime / 60); // 분

        // 애니메이션과 함께 길안내 시작 (2초 후)
        setTimeout(() => {
          setIsNavigating(true);
          setNavigationInfo({
            destinationName: destinationName || '목적지',
            distance: distance,
            duration: `약 ${duration}분`,
          });
          setDestinationCoords({ lat: destLat, lon: destLon }); // 목적지 좌표 저장
          setIsLoadingRoute(false);
          console.log('✅ 길안내 시작:', { destinationName, distance, duration });
        }, 2000);
      }
    } catch (error) {
      console.error('❌ 경로 탐색 실패:', error);
      setIsLoadingRoute(false);
      Alert.alert('오류', '경로를 찾을 수 없습니다.\n다시 시도해주세요.');
    }
  };

  // 하버사인 공식을 사용한 거리 계산 (미터 단위)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // 지구 반지름 (미터)
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // 미터 단위
  };

  // 목적지 도착 감지
  useEffect(() => {
    if (!isNavigating || !destinationCoords || !currentLocation) return;

    const distance = calculateDistance(
      currentLocation.coords.latitude,
      currentLocation.coords.longitude,
      destinationCoords.lat,
      destinationCoords.lon
    );

    console.log('📍 목적지까지 거리:', Math.round(distance), 'm');

    // 목적지 반경 10m 이내에 도착하면 자동 종료
    if (distance <= 10) {
      console.log('🎯 목적지 도착!');
      handleCancelNavigation();
    }
  }, [currentLocation, isNavigating, destinationCoords]);

  // 길안내 취소 함수
  const handleCancelNavigation = () => {
    // 종료 메시지 표시
    setIsEndingRoute(true);

    setTimeout(() => {
      // 지도에서 경로 및 마커 제거 및 내 위치로 포커스
      if (webViewRef.current) {
        const myLat = currentLocation?.coords.latitude || 37.5665;
        const myLon = currentLocation?.coords.longitude || 126.9780;

        // 모든 마커 복원 (필터 방식 사용)
        const allPositions = filteredMapLocations.map((location, index) => {
          const place = nearbyPlaces.find(p => p.id === location.id);
          return {
            title: place ? place.name : location.type,
            latlng: [location.latitude, location.longitude],
            content: place ? place.content : '',
            id: location.id,
            type: location.type
          };
        });

        const clearRouteScript = `
          // 경로 제거
          if (window.routeLine) {
            window.routeLine.setMap(null);
            window.routeLine = null;
          }
          if (window.routeLineOutline) {
            window.routeLineOutline.setMap(null);
            window.routeLineOutline = null;
          }
          if (window.routeLineShadow) {
            window.routeLineShadow.setMap(null);
            window.routeLineShadow = null;
          }

          console.log('🎯 모든 마커 복원 시작');

          // 기존 마커들 모두 제거
          if (window.markers) {
            window.markers.forEach(function(markerObj) {
              if (markerObj.marker) markerObj.marker.setMap(null);
              if (markerObj.circle) markerObj.circle.setMap(null);
            });
          }
          window.markers = [];

          // 모든 마커들 다시 생성 (필터링된 상태 유지)
          var positions = ${JSON.stringify(allPositions)};
          positions.forEach(function(position) {
            var markerPosition = new kakao.maps.LatLng(position.latlng[0], position.latlng[1]);

            var markerColor = position.type === 'SHELTER' ? '#4A90E2' :
                             position.type === 'USER_SHELTER' ? '#FFA500' :
                             position.type === 'STATION' ? '#27AE60' :
                             position.type === 'CLIMATE_SHELTER' ? '#9B59B6' : '#7ED321';

            var pinImageSrc = position.type === 'SHELTER' ? '${pinImages?.shelter}' :
                              position.type === 'USER_SHELTER' ? '${pinImages?.mingan}' :
                              position.type === 'STATION' ? '${pinImages?.traffic}' :
                              position.type === 'PUBLIC' ? '${pinImages?.politic}' :
                              position.type === 'CLIMATE_SHELTER' ? '${pinImages?.climate}' : '${pinImages?.shelter}';

            var markerImageWithShadow = window.createMarkerImageWithShadow(pinImageSrc, 36, 46);
            var markerSize = new kakao.maps.Size(44, 52); // 페이드 + 그림자 포함 (width: 36+8, height: 46+6)
            var markerOffset = new kakao.maps.Point(22, 49); // 핀의 끝점 위치 (중앙 정렬)

            var markerImage = new kakao.maps.MarkerImage(
              markerImageWithShadow,
              markerSize,
              { offset: markerOffset }
            );

            var marker = new kakao.maps.Marker({
              position: markerPosition,
              image: markerImage,
              clickable: true
            });

            marker.setMap(window.map);

            window.markers.push({
              id: String(position.id),
              marker: marker,
              circle: null,
              originalColor: markerColor,
              type: position.type,
              pinImage: pinImageSrc
            });

            kakao.maps.event.addListener(marker, 'click', function() {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage('MARKER_CLICK:' + position.id);
              }
            });
          });

          console.log('🎯 모든 마커 복원 완료:', positions.length);


          // 내 위치로 지도 이동 (부드러운 애니메이션)
          var myPosition = new kakao.maps.LatLng(${myLat}, ${myLon});
          window.map.panTo(myPosition);

          // 적절한 줌 레벨로 설정
          setTimeout(function() {
            window.map.setLevel(4);
          }, 300);

          console.log('📍 내 위치로 포커스:', ${myLat}, ${myLon});
        `;
        webViewRef.current.injectJavaScript(clearRouteScript);
      }

      // 상태 초기화
      setIsNavigating(false);
      setNavigationInfo(null);
      setDestinationCoords(null);
      setIsEndingRoute(false);

      // 하단 슬라이드 다시 중간 상태로 열기
      translateY.value = withSpring(-peekHeight, {
        damping: 40,
        stiffness: 60,
      });
      runOnJS(setShowFade)(true);

      console.log('✅ 길안내 종료됨');
    }, 2000); // 2초 후 종료
  };

  // 하단 슬라이드 애니메이션을 위한 값들
  const bottomSheetHeight = height * 0.5; // 전체 높이의 50%
  const peekHeight = 200; // 살짝 보이는 높이
  const minHeight = peekHeight; // 최소 높이 - 제목과 첫 번째 카드 일부만 보임
  const maxHeight = bottomSheetHeight; // 최대 높이 - 전체 목록 표시

  // 초기값을 -peekHeight으로 설정하여 중간 상태로 시작
  const translateY = useSharedValue(-peekHeight);
  const [showFade, setShowFade] = useState(true);

  // 드래그 시작 위치를 저장할 변수
  const startY = useSharedValue(0);

  // 팬 제스처 핸들러 - 3단계 상태를 지원하는 스마트 슬라이드
  const panGesture = Gesture.Pan()
    .activeOffsetY([-20, 20])
    .failOffsetX([-15, 15])
    .enableTrackpadTwoFingerGesture(true)
    .onStart(() => {
      // 드래그 시작 위치 저장
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      // 드래그 중 위치 업데이트 - 부드러운 따라감
      const newTranslateY = startY.value + event.translationY;
      // 범위 제한: 완전히 닫힌 상태(0)부터 완전히 열린 상태(-maxHeight + 70)까지, 과도한 탄성 방지
      translateY.value = Math.max(-maxHeight + 100, Math.min(20, newTranslateY));
    })
    .onEnd((event) => {
      // 3단계 상태 결정: 닫힘(0), 중간(-peekHeight), 완전히 열림(-maxHeight)
      const currentPos = translateY.value;
      const velocity = event.velocityY;

      let targetY = 0; // 기본값은 닫힌 상태

      // 위로 빠르게 드래그하면 완전히 열기
      if (velocity < -500) {
        targetY = -maxHeight + 100; // 완전히 열림 (하단 탭바와 여백 제거)
      }
      // 아래로 빠르게 드래그하면 닫기
      else if (velocity > 500) {
        targetY = 0; // 닫힌 상태
      }
      // 속도가 느리면 현재 위치에 따라 결정
      else {
        if (currentPos > -50) {
          targetY = 0; // 닫힌 상태
        } else if (currentPos < -200) {
          targetY = -maxHeight + 100; // 완전히 열림
        } else {
          targetY = -peekHeight; // 중간 상태
        }
      }

      // 부드러운 스프링 애니메이션으로 목표 위치로 이동
      translateY.value = withSpring(targetY, {
        damping: 20,
        stiffness: 120,
        mass: 1,
      });

      // 슬라이더가 완전히 닫혔을 때 페이드 숨기기 (runOnJS 사용)
      if (targetY === 0) {
        runOnJS(setShowFade)(false);
      } else {
        runOnJS(setShowFade)(true);
      }
    });


  // 애니메이션 스타일 정의
  const bottomSheetStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  // 내 위치 버튼 애니메이션 스타일 - 하단 슬라이드와 함께 움직임
  const locationButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });


  // 헤더 터치 시 리스트 토글 (펼치기/접기)
  const handleHeaderPress = () => {
    const currentPos = translateY.value;
    // 현재 위치에 따라 토글 결정
    if (currentPos < -200) {
      // 많이 열려있으면 닫기
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 120,
        mass: 1,
      });
      setShowFade(false);
    } else {
      // 닫혀있으면 완전히 열기
      translateY.value = withSpring(-maxHeight + 100, {
        damping: 20,
        stiffness: 120,
        mass: 1,
      });
      setShowFade(true);
    }
  };

  // 타입에 따른 카테고리/아이콘/색상 매핑 함수
  const getCategoryFromType = (type: string): '민간 개방 시설' | '스마트 쉼터' | '교통 시설' | '공공 시설' | '기후 동행 쉼터' => {
    if (type === 'SHELTER') return '스마트 쉼터';
    if (type === 'USER_SHELTER') return '민간 개방 시설';
    if (type === 'STATION') return '교통 시설';
    if (type === 'CLIMATE_SHELTER') return '기후 동행 쉼터';
    return '민간 개방 시설';
  };

  const getIconFromType = (type: string): string => {
    if (type === 'SHELTER') return 'medical';
    if (type === 'USER_SHELTER') return 'business';
    if (type === 'STATION') return 'train';
    if (type === 'CLIMATE_SHELTER') return 'sunny';
    return 'business';
  };

  const getColorFromType = (type: string): string => {
    if (type === 'SHELTER') return '#4A90E2';
    if (type === 'USER_SHELTER') return '#FFA500';
    if (type === 'STATION') return '#27AE60';
    if (type === 'CLIMATE_SHELTER') return '#9B59B6';
    return '#7ED321';
  };

  // 실제 API 데이터를 필터링된 쉼터 목록으로 변환
  const filteredShelters: Shelter[] = nearbyPlaces
    .map(place => {
      // mapLocations에서 같은 id의 위치 정보 찾기
      const locationData = mapLocations.find(loc => loc.id === place.id);

      return {
        id: place.id.toString(),
        name: place.name,
        category: getCategoryFromType(place.type),
        type: place.type,
        distance: place.distanceM < 1000 ? `${Math.round(place.distanceM)}m` : `${(place.distanceM / 1000).toFixed(1)}km`,
        address: place.address,
        description: place.content,
        content: place.content,
        latitude: locationData?.latitude,
        longitude: locationData?.longitude,
        icon: getIconFromType(place.type),
        color: getColorFromType(place.type),
        maxCapacity: place.maxCapacity,
        currentCapacity: place.currentCapacity,
        maxUsageMinutes: place.maxUsageMinutes,
      };
    })
    .filter(shelter => selectedCategories.includes(shelter.category));

  // 필터링된 쉼터에 해당하는 지도 위치 데이터
  const filteredMapLocations = mapLocations.filter(location => {
    const matchingPlace = nearbyPlaces.find(place => place.id === location.id);
    if (!matchingPlace) return false;
    const category = getCategoryFromType(matchingPlace.type);
    return selectedCategories.includes(category);
  });

  // 카테고리 토글 함수
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => {
      // 이미 선택된 카테고리를 누른 경우
      if (prev.includes(category)) {
        // 최소 1개는 선택되어야 하므로, 마지막 1개면 해제 불가
        if (prev.length <= 1) {
          return prev;
        }
        return prev.filter(c => c !== category);
      }
      // 선택되지 않은 카테고리를 누른 경우 추가
      return [...prev, category];
    });
  };

  // 필터 변경 시 지도 마커 업데이트
  useEffect(() => {
    // 길안내 중일 때는 마커 업데이트하지 않음
    if (isNavigating) {
      console.log('🎯 길안내 중이므로 마커 업데이트 건너뜀');
      return;
    }

    if (webViewRef.current && mapLocations.length > 0 && pinImages) {
      // JavaScript를 통해 마커만 업데이트
      const filteredPositions = filteredMapLocations.map((location, index) => {
        const place = nearbyPlaces.find(p => p.id === location.id);
        const title = place ? place.name : location.type;
        const content = place ? place.content : '';
        return {
          title: title,
          latlng: [location.latitude, location.longitude],
          content: content,
          id: location.id,
          type: location.type
        };
      });

      const updateMarkersScript = `
        // 기존 마커들 제거
        if (window.markers) {
          window.markers.forEach(function(markerObj) {
            if (markerObj.marker) markerObj.marker.setMap(null);
            if (markerObj.circle) markerObj.circle.setMap(null);
          });
        }
        window.markers = [];

        // 새로운 마커들 생성
        var positions = ${JSON.stringify(filteredPositions)};
        positions.forEach(function(position, index) {
          var markerPosition = new kakao.maps.LatLng(position.latlng[0], position.latlng[1]);

          // 쉼터 타입에 따른 마커 이미지 설정
          var markerColor = position.type === 'SHELTER' ? '#4A90E2' :
                           position.type === 'USER_SHELTER' ? '#FFA500' :
                           position.type === 'STATION' ? '#27AE60' :
                           position.type === 'CLIMATE_SHELTER' ? '#9B59B6' : '#7ED321';
          var markerIcon = position.type === 'SHELTER' ? 'M12 2l3.09 6.26L22 9l-5 4.87L18.18 20 12 16.82 5.82 20 7 13.87 2 9l6.91-.74L12 2z' :
                          position.type === 'STATION' ? 'M12 2l-2 6-6 2 6 2 2 6 2-6 6-2-6-2z' :
                          position.type === 'CLIMATE_SHELTER' ? 'M12 2C8.14 2 5 5.14 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.14-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z' :
                          'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z';

          // 커스텀 핀 이미지 사용
          var pinImageSrc = position.type === 'SHELTER' ? '${pinImages?.shelter}' :
                            position.type === 'USER_SHELTER' ? '${pinImages?.mingan}' :
                            position.type === 'STATION' ? '${pinImages?.traffic}' :
                            position.type === 'PUBLIC' ? '${pinImages?.politic}' :
                            position.type === 'CLIMATE_SHELTER' ? '${pinImages?.climate}' : '${pinImages?.shelter}';

          // 그림자가 있는 마커 이미지 생성 - 비율 301:388 유지
          var markerImageWithShadow = window.createMarkerImageWithShadow(pinImageSrc, 36, 46);
          var markerSize = new kakao.maps.Size(44, 52); // 페이드 + 그림자 포함 (width: 36+8, height: 46+6)
          var markerOffset = new kakao.maps.Point(22, 49); // 핀의 끝점 위치 (중앙 정렬)

          var markerImage = new kakao.maps.MarkerImage(
            markerImageWithShadow,
            markerSize,
            { offset: markerOffset }
          );

          var marker = new kakao.maps.Marker({
            position: markerPosition,
            image: markerImage,
            clickable: true
          });

          marker.setMap(window.map);

          // 마커를 ID와 함께 배열에 저장
          var markerObj = {
            id: String(position.id),
            marker: marker,
            circle: null,
            originalColor: markerColor,
            type: position.type,
            icon: markerIcon,
            pinImage: pinImageSrc
          };
          window.markers.push(markerObj);

          kakao.maps.event.addListener(marker, 'click', function() {
            console.log('🗺️ 동적 마커 클릭됨! Place ID:', position.id);
            if (window.ReactNativeWebView) {
              console.log('📤 React Native로 메시지 전송:', 'MARKER_CLICK:' + position.id);
              window.ReactNativeWebView.postMessage('MARKER_CLICK:' + position.id);
            } else {
              console.log('❌ ReactNativeWebView 없음');
            }
          });
        });
      `;

      webViewRef.current.injectJavaScript(updateMarkersScript);
    }
  }, [isNavigating, selectedCategories, filteredMapLocations, nearbyPlaces, pinImages]);

  // 하드웨어 백 버튼 처리 - Android에서 앱 종료
  useEffect(() => {
    const backAction = () => {
      Alert.alert('앱 종료', '앱을 종료하시겠습니까?', [
        {
          text: '취소',
          onPress: () => null,
          style: 'cancel',
        },
        { text: '종료', onPress: () => BackHandler.exitApp() },
      ]);
      return true; // 뒤로가기 이벤트를 처리했음을 나타냄
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, []);

  // 화면 포커스 시 StatusBar 스타일 설정
  const [statusBarKey, setStatusBarKey] = useState(0);

  useFocusEffect(
    React.useCallback(() => {
      // StatusBar를 강제로 리렌더링하여 dark 스타일 적용
      setStatusBarKey(prev => prev + 1);
    }, [])
  );

  // 쉼터 정보 카드 렌더링 함수 - 선택 가능한 카드 리스트 형태
  const renderShelterCard = ({ item }: { item: Shelter }) => (
    <TouchableOpacity
      style={[
        styles.shelterCard,
        { backgroundColor: colors.surface },
        selectedShelter.id === item.id && [styles.selectedCard, { borderColor: colors.primary, backgroundColor: colors.surface }] // 선택된 카드는 다른 스타일 적용
      ]}
      onPress={() => handleShelterPress(item)} // 카드 선택 시 상세 정보 로드 후 모달 열기
    >
      {/* 쉼터 타입별 맵 핀 이미지 */}
      <View style={styles.iconContainer}>
        <Image
          source={
            item.category === '스마트 쉼터' ? require('../../assets/map_fins/shelter.png') :
            item.category === '민간 개방 시설' ? require('../../assets/map_fins/mingan.png') :
            item.category === '교통 시설' ? require('../../assets/map_fins/traffic.png') :
            item.category === '공공 시설' ? require('../../assets/map_fins/politic.png') :
            item.category === '기후 동행 쉼터' ? require('../../assets/map_fins/climate.png') :
            require('../../assets/map_fins/shelter.png')
          }
          style={{ width: 28, height: 36, resizeMode: 'contain' }}
        />
      </View>
      {/* 쉼터 정보 텍스트 영역 */}
      <View style={styles.shelterInfo}>
        <Text style={[styles.shelterCategory, { fontSize: getFontSize(11), color: colors.text.light }]}>{item.category}</Text>
        <Text style={[styles.shelterName, { fontSize: getFontSize(15), color: colors.text.primary }]}>
          {(() => {
            const name = item.name;
            const description = item.description;
            const category = item.category;

            // 교통 시설: name + description 결합 (예: "2호선 용답역")
            if (category === '교통 시설') {
              return name && description ? `${name} ${description}` : (name || description);
            }
            // 민간 개방 시설: name 표시
            if (category === '민간 개방 시설') {
              return name;
            }
            // 기후 동행 쉼터: name과 description을 공백으로 연결 (예: "경희당점 CU")
            if (category === '기후 동행 쉼터') {
              return name && description ? `${name} ${description}` : (name || description);
            }
            // 그 외: description 표시
            return description || name;
          })()}
        </Text>
      </View>
      {/* 오른쪽 정보 - 거리 또는 인원 */}
      <View style={styles.rightInfo}>
        {item.category === '민간 개방 시설' && item.maxCapacity !== undefined && item.currentCapacity !== undefined ? (
          <Text style={[styles.capacityText, { fontSize: getFontSize(13), color: colors.text.secondary }]}>
            {item.currentCapacity}/{item.maxCapacity}명
          </Text>
        ) : (
          <Text style={[styles.shelterDistance, { fontSize: getFontSize(18), color: colors.primary }]}>{item.distance}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const mapHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"/>
    <title>Kakao Maps</title>
      <style>
          * { box-sizing: border-box; }
          html, body {
              width: 100%;
              height: 100%;
              margin: 0;
              padding: 0;
              overflow: hidden;
              font-size: 16px;
              -webkit-text-size-adjust: 100%;
              -webkit-user-select: none;
              user-select: none;
          }
          #map {
              width: 100vw;
              height: 100vh;
              position: relative;
              z-index: 1;
          }
      </style>
  </head>
  <body>
      <div id="map"></div>
      <script type="text/javascript" src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=76e23ff1c2370fd1c14d17f2370c8985"></script>
      <script>
          var container = document.getElementById('map');

          // 현재 위치 사용 (기본값 서울)
          var centerLat = ${currentLocation?.coords.latitude || 37.5665};
          var centerLng = ${currentLocation?.coords.longitude || 126.9780};

          var options = {
              center: new kakao.maps.LatLng(centerLat, centerLng),
              level: 3  // 한 단계 더 확대
          };

          var map = new kakao.maps.Map(container, options);

          // POI 숨기기를 위한 스타일 적용
          setTimeout(function() {
              try {
                  var style = document.createElement('style');
                  style.innerHTML = \`
                      .overlay_info, .label, .info, .marker,
                      .MapWalkthrough, .bg_present, .sprite_blank,
                      [class*="category"], [class*="place_"], [class*="info_"],
                      .ollie, .category, .category_bg, .txt_category,
                      .overlay { display: none !important; }
                  \`;
                  document.head.appendChild(style);
              } catch (error) {
                  console.log('POI 숨김 실패:', error);
              }
          }, 500);

          // 내 위치 마커 - 카카오맵 스타일로 강조
          ${currentLocation ? `
          // 내 위치 원형 범위 표시 (정확도 범위)
          var myLocationCircle = new kakao.maps.Circle({
              center: new kakao.maps.LatLng(${currentLocation.coords.latitude}, ${currentLocation.coords.longitude}),
              radius: 15, // 15m 반경으로 축소
              strokeWeight: 1,
              strokeColor: '#FF0000',
              strokeOpacity: 0.6,
              fillColor: '#FF0000',
              fillOpacity: 0.1
          });
          myLocationCircle.setMap(map);

          // 내 위치 마커 - 빨간색 원형
          var myLocationMarker = new kakao.maps.Marker({
              map: map,
              position: new kakao.maps.LatLng(${currentLocation.coords.latitude}, ${currentLocation.coords.longitude}),
              title: '내 위치',
              image: new kakao.maps.MarkerImage(
                  'data:image/svg+xml;base64,' + btoa(\`
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="10" cy="10" r="9" fill="#FF0000" stroke="white" stroke-width="2"/>
                      <circle cx="10" cy="10" r="3" fill="white"/>
                    </svg>
                  \`),
                  new kakao.maps.Size(20, 20),
                  { offset: new kakao.maps.Point(10, 10) }
              )
          });
          ` : ''}
  
          // 필터링된 주변 장소들로 마커 생성
          var positions = [
              ${filteredMapLocations.map((location, index) => {
                const place = nearbyPlaces.find(p => p.id === location.id);
                const title = place ? place.name : location.type;
                const content = place ? place.content : '';
                return `{
                  title: "${title}",
                  content: "${content}",
                  latlng: new kakao.maps.LatLng(${location.latitude}, ${location.longitude}),
                  type: "${location.type}",
                  id: ${location.id}
                }`;
              }).join(',')}
          ];
  
          // 마커 배열을 전역 변수로 저장
          window.markers = [];
          window.map = map;

          // 그림자가 있는 마커 이미지 생성 헬퍼 함수 (전역으로 저장)
          window.createMarkerImageWithShadow = function(pinImageSrc, width, height) {
            var shadowHeight = 6;
            var totalHeight = height + shadowHeight;
            var padding = 4;
            var totalWidth = width + padding * 2;

            var svg = \`
              <svg width="\${totalWidth}" height="\${totalHeight}" viewBox="0 0 \${totalWidth} \${totalHeight}" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <filter id="bgShadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
                    <feOffset dx="0" dy="1" result="offsetblur"/>
                    <feComponentTransfer>
                      <feFuncA type="linear" slope="0.3"/>
                    </feComponentTransfer>
                    <feMerge>
                      <feMergeNode/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <!-- 배경 페이드 (핀 주변으로 살짝 보이게) -->
                <circle cx="\${totalWidth/2}" cy="\${height * 0.37}" r="\${width * 0.48}" fill="white" opacity="0.75" filter="url(#bgShadow)"/>
                <!-- 둥근 그림자 (타원) -->
                <ellipse cx="\${totalWidth/2}" cy="\${height + 3}" rx="\${width * 0.25}" ry="2" fill="black" opacity="0.2"/>
                <!-- 핀 이미지 - 선명하게 유지 (filter 제거) -->
                <image href="\${pinImageSrc}" x="\${padding}" y="0" width="\${width}" height="\${height}"/>
              </svg>
            \`;

            return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
          };

          // 마커 생성 (데이터가 있는 경우에만)
          if (positions.length > 0) {
              for (var i = 0; i < positions.length; i ++) {
                  // 쉼터 타입에 따른 마커 이미지 설정
                  var markerColor = positions[i].type === 'SHELTER' ? '#4A90E2' :
                                   positions[i].type === 'USER_SHELTER' ? '#FFA500' :
                                   positions[i].type === 'STATION' ? '#27AE60' :
                                   positions[i].type === 'CLIMATE_SHELTER' ? '#9B59B6' : '#7ED321';
                  var markerIcon = positions[i].type === 'SHELTER' ? 'M12 2l3.09 6.26L22 9l-5 4.87L18.18 20 12 16.82 5.82 20 7 13.87 2 9l6.91-.74L12 2z' :
                                  positions[i].type === 'STATION' ? 'M12 2l-2 6-6 2 6 2 2 6 2-6 6-2-6-2z' :
                                  positions[i].type === 'CLIMATE_SHELTER' ? 'M12 2C8.14 2 5 5.14 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.14-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z' :
                                  'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z';

                  // 커스텀 핀 이미지 사용
                  var pinImageSrc = positions[i].type === 'SHELTER' ? '${pinImages?.shelter}' :
                                    positions[i].type === 'USER_SHELTER' ? '${pinImages?.mingan}' :
                                    positions[i].type === 'STATION' ? '${pinImages?.traffic}' :
                                    positions[i].type === 'PUBLIC' ? '${pinImages?.politic}' :
                                    positions[i].type === 'CLIMATE_SHELTER' ? '${pinImages?.climate}' : '${pinImages?.shelter}';

                  // 그림자가 있는 마커 이미지 생성 - 비율 301:388 유지
                  var markerImageWithShadow = window.createMarkerImageWithShadow(pinImageSrc, 36, 46);
                  var markerSize = new kakao.maps.Size(44, 52); // 페이드 + 그림자 포함 (width: 36+8, height: 46+6)
                  var markerOffset = new kakao.maps.Point(22, 49); // 핀의 끝점 위치 (중앙 정렬)

                  var markerImage = new kakao.maps.MarkerImage(
                      markerImageWithShadow,
                      markerSize,
                      { offset: markerOffset }
                  );

                  var marker = new kakao.maps.Marker({
                      map: map,
                      position: positions[i].latlng,
                      title: positions[i].title,
                      image: markerImage
                  });

                  // 마커를 ID와 함께 배열에 저장 (강조 기능용)
                  window.markers.push({
                      id: String(positions[i].id),
                      marker: marker,
                      circle: null,
                      originalColor: markerColor,
                      type: positions[i].type,
                      icon: markerIcon,
                      pinImage: pinImageSrc
                  });

                  // 정보창 생성
                  var infoWindow = new kakao.maps.InfoWindow({
                      content: \`
                        <div style="padding: 10px; min-width: 200px;">
                          <h4 style="margin: 0 0 5px 0; color: #333;">\${positions[i].title}</h4>
                          <p style="margin: 0; color: #666; font-size: 12px;">\${positions[i].content}</p>
                        </div>
                      \`
                  });

                  // 마커 클릭 이벤트 - React Native로 상세 정보 요청
                  (function(markerObj, infoWindow, placeId) {
                      kakao.maps.event.addListener(markerObj.marker, 'click', function() {
                          console.log('🗺️ 마커 클릭됨! Place ID:', placeId);

                          // React Native로 장소 ID 전달
                          if (window.ReactNativeWebView) {
                              console.log('📤 React Native로 메시지 전송:', 'MARKER_CLICK:' + placeId);
                              window.ReactNativeWebView.postMessage('MARKER_CLICK:' + placeId);
                          } else {
                              console.log('❌ ReactNativeWebView 없음');
                          }
                      });
                  })(window.markers[window.markers.length - 1], infoWindow, positions[i].id);
              }
          }

          // React Native에서 메시지를 받을 리스너 추가
          window.addEventListener('message', function(event) {
            try {
              eval(event.data);
            } catch (e) {
              console.error('메시지 실행 오류:', e);
            }
          });

      </script>
  </body>
  </html>
  `;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar key={statusBarKey} style="dark" translucent backgroundColor="transparent" />
        <View style={styles.mapContainer}>
          <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: mapHtml, baseUrl: '' }}
            style={styles.map}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            scalesPageToFit={false}
            scrollEnabled={false}
            bounces={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            automaticallyAdjustContentInsets={false}
            contentInset={{ top: 0, left: 0, bottom: 0, right: 0 }}
            onMessage={(event) => {
              const message = event.nativeEvent.data;
              console.log('📱 WebView 메시지 수신:', message);

              // 문자열 메시지 처리
              if (message.startsWith('MARKER_CLICK:')) {
                const placeId = message.replace('MARKER_CLICK:', '');
                console.log('🔍 마커 클릭 감지, Place ID:', placeId);
                handleMarkerClick(parseInt(placeId));
                return;
              }

              // JSON 메시지 처리
              try {
                const jsonMessage = JSON.parse(message);
                if (jsonMessage.type === 'markerClick') {
                  console.log('🔍 JSON 마커 클릭 감지, Place ID:', jsonMessage.id);
                  handleMarkerClick(parseInt(jsonMessage.id));
                }
              } catch (e) {
                // JSON이 아닌 경우 무시
                console.log('📱 일반 메시지:', message);
              }
            }}
          />
          {/* 상단 오버레이를 미니멀하게 변경 - 내 위치 버튼과 미세먼지 정보만 표시 */}

          {/* 설명서 버튼 - 우측 상단 */}
          <View style={styles.tutorialButtonContainer}>
            <TouchableOpacity
              style={[styles.tutorialButton, { backgroundColor: colors.surface }]}
              onPress={() => setShowTutorial(true)}
            >
              <Ionicons name="help-circle-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* 길안내 로딩 오버레이 */}
          <NavigationMessage
            visible={isLoadingRoute}
            icon="navigate"
            message="길안내를 시작하겠습니다"
            colors={colors}
            getFontSize={getFontSize}
            showDots={true}
          />

          {/* 길안내 종료 오버레이 */}
          <NavigationMessage
            visible={isEndingRoute}
            icon="checkmark-circle"
            message="길안내를 종료하겠습니다"
            colors={colors}
            getFontSize={getFontSize}
          />

          {/* 길안내 정보 오버레이 */}
          {isNavigating && navigationInfo && !isLoadingRoute && !isEndingRoute && (
            <Animated.View style={[styles.navigationInfoContainer, { backgroundColor: colors.surface }, navInfoAnimatedStyle]}>
              <View style={styles.navigationInfoContent}>
                <View style={styles.navigationInfoLeft}>
                  <Ionicons name="navigate" size={20} color={colors.primary} />
                  <View style={styles.navigationTextContainer}>
                    <Text style={[styles.navigationDestination, { fontSize: getFontSize(14), color: colors.text.primary }]} numberOfLines={1}>
                      {navigationInfo.destinationName}
                    </Text>
                    <View style={styles.navigationDetails}>
                      <Text style={[styles.navigationDetailText, { fontSize: getFontSize(12), color: colors.text.secondary }]}>
                        {navigationInfo.distance}
                      </Text>
                      <Text style={[styles.navigationSeparator, { fontSize: getFontSize(12), color: colors.text.light }]}>•</Text>
                      <Text style={[styles.navigationDetailText, { fontSize: getFontSize(12), color: colors.text.secondary }]}>
                        {navigationInfo.duration}
                      </Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.navigationCloseButton, { backgroundColor: colors.text.light + '20' }]}
                  onPress={handleCancelNavigation}
                >
                  <Ionicons name="close" size={18} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {/* 온도계 - 우측 하단 (하단 슬라이드와 함께 움직임) */}
          <Animated.View style={[styles.thermometerBottomContainer, locationButtonStyle]}>
            <View style={styles.thermometerCard}>
              <View style={styles.thermometerRow}>
                <AnimatedThermometer temperature={weatherData?.temperature || 25} colors={colors} contrastMode={contrastMode} />
                <View style={styles.temperatureLabelContainer}>
                  <View style={[styles.temperatureLabel, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.temperatureText, { color: colors.text.white }]}>{weatherData?.temperature ? `${Math.round(weatherData.temperature)}°` : '--°'}</Text>
                    <View style={[styles.trianglePointer, { borderRightColor: colors.primary }]} />
                  </View>
                  {weatherData?.weather && (
                    <Text style={[styles.weatherText, { backgroundColor: colors.surface, color: colors.text.primary }]}>{weatherData.weather}</Text>
                  )}
                </View>
              </View>
            </View>
          </Animated.View>

          {/* 내 위치 버튼 - 우측 하단 (하단 슬라이드와 함께 움직임) */}
          <Animated.View style={[styles.locationButtonContainer, locationButtonStyle]}>
            <TouchableOpacity
              style={[
                styles.locationButton,
                { backgroundColor: colors.surface },
                isLoadingLocation && styles.locationButtonLoading
              ]}
              onPress={handleMyLocationPress}
              disabled={isLoadingLocation}
            >
              <Ionicons
                name={isLoadingLocation ? "refresh" : "locate"}
                size={20}
                color={isLoadingLocation ? colors.primary : colors.text.primary}
              />
            </TouchableOpacity>
          </Animated.View>

          <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.overlayBottom, { backgroundColor: colors.surface }, bottomSheetStyle]}>
              {/* 드래그 핸들 - 미니멀한 회색 바 */}
              <View style={[styles.dragHandle, { backgroundColor: colors.text.light }]} />

              {/* 헤더 부분 - 터치 시 리스트 토글 */}
              <TouchableOpacity style={[styles.bottomHeader, { borderBottomColor: colors.text.light + '20' }]} onPress={handleHeaderPress}>
                <Text style={[styles.headerTitle, { fontSize: getFontSize(18), color: colors.text.primary }]}>반경 500m 내 쉼터</Text>
              </TouchableOpacity>

              {/* 내 주변 쉼터 개수 표시 */}
              <Text style={[styles.topNote, { fontSize: getFontSize(12), color: colors.text.light }]}>
                ※ 내 주변에 쉼터가 <Text style={{ color: '#4A90E2', fontWeight: '700' }}>{filteredShelters.length}개</Text> 있습니다.
              </Text>

              {/* 필터 칩 - 스크롤 가능한 가로 배치 */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterChipContainer}
                contentContainerStyle={styles.filterChipContent}
              >
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    { backgroundColor: colors.surface, borderColor: colors.text.light + '40' },
                    selectedCategories.includes('스마트 쉼터') && { borderColor: '#4A90E2', borderWidth: 2 }
                  ]}
                  onPress={() => toggleCategory('스마트 쉼터')}
                >
                  <View style={{ width: 24, height: 24, borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                    <Image
                      source={require('../../assets/map_fins/shelter.png')}
                      style={{ width: 26, height: 34, resizeMode: 'contain', marginTop: 8 }}
                    />
                  </View>
                  <Text style={[
                    styles.filterChipText,
                    { fontSize: getFontSize(13), color: colors.text.secondary }
                  ]}>스마트 쉘터</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    { backgroundColor: colors.surface, borderColor: colors.text.light + '40' },
                    selectedCategories.includes('민간 개방 시설') && { borderColor: '#FFA500', borderWidth: 2 }
                  ]}
                  onPress={() => toggleCategory('민간 개방 시설')}
                >
                  <View style={{ width: 24, height: 24, borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                    <Image
                      source={require('../../assets/map_fins/mingan.png')}
                      style={{ width: 26, height: 34, resizeMode: 'contain', marginTop: 8 }}
                    />
                  </View>
                  <Text style={[
                    styles.filterChipText,
                    { fontSize: getFontSize(13), color: colors.text.secondary }
                  ]}>민간 개방</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    { backgroundColor: colors.surface, borderColor: colors.text.light + '40' },
                    selectedCategories.includes('교통 시설') && { borderColor: '#27AE60', borderWidth: 2 }
                  ]}
                  onPress={() => toggleCategory('교통 시설')}
                >
                  <View style={{ width: 24, height: 24, borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                    <Image
                      source={require('../../assets/map_fins/traffic.png')}
                      style={{ width: 26, height: 34, resizeMode: 'contain', marginTop: 8 }}
                    />
                  </View>
                  <Text style={[
                    styles.filterChipText,
                    { fontSize: getFontSize(13), color: colors.text.secondary }
                  ]}>교통 시설</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    { backgroundColor: colors.surface, borderColor: colors.text.light + '40' },
                    selectedCategories.includes('공공 시설') && { borderColor: '#E74C3C', borderWidth: 2 }
                  ]}
                  onPress={() => toggleCategory('공공 시설')}
                >
                  <View style={{ width: 24, height: 24, borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                    <Image
                      source={require('../../assets/map_fins/politic.png')}
                      style={{ width: 26, height: 34, resizeMode: 'contain', marginTop: 8 }}
                    />
                  </View>
                  <Text style={[
                    styles.filterChipText,
                    { fontSize: getFontSize(13), color: colors.text.secondary }
                  ]}>공공 시설</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    { backgroundColor: colors.surface, borderColor: colors.text.light + '40' },
                    selectedCategories.includes('기후 동행 쉼터') && { borderColor: '#9B59B6', borderWidth: 2 }
                  ]}
                  onPress={() => toggleCategory('기후 동행 쉼터')}
                >
                  <View style={{ width: 24, height: 24, borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                    <Image
                      source={require('../../assets/map_fins/climate.png')}
                      style={{ width: 26, height: 34, resizeMode: 'contain', marginTop: 8 }}
                    />
                  </View>
                  <Text style={[
                    styles.filterChipText,
                    { fontSize: getFontSize(13), color: colors.text.secondary }
                  ]}>기후 동행</Text>
                </TouchableOpacity>
              </ScrollView>

              {/* 쉼터 목록 - FlatList로 직접 렌더링 */}
              <FlatList<Shelter>
                data={filteredShelters}
                renderItem={renderShelterCard}
                keyExtractor={(item) => item.id}
                ListFooterComponent={<View style={styles.bottomFiller} />}
                showsVerticalScrollIndicator={false}
                style={styles.contentContainer}
                contentContainerStyle={styles.scrollContentContainer}
              />
            </Animated.View>
          </GestureDetector>
        </View>

        {/* 쉼터 세부정보 모달 - 민간 개방 시설 */}
        {selectedShelter.category === '민간 개방 시설' && (
          <UserShelterDetailModal
            visible={modalVisible}
            shelter={selectedShelter as any}
            onClose={() => setModalVisible(false)}
            onNavigate={handleNavigation}
          />
        )}

        {/* 쉼터 세부정보 모달 - 기타 시설 */}
        {selectedShelter.category !== '민간 개방 시설' && (
          <ShelterDetailModal
            visible={modalVisible}
            shelter={selectedShelter as any}
            onClose={() => setModalVisible(false)}
            onNavigate={handleNavigation}
          />
        )}

        {/* 필터 모달 */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={filterModalVisible}
          onRequestClose={() => setFilterModalVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setFilterModalVisible(false)}
          >
            <TouchableOpacity
              style={[styles.filterModalContent, { backgroundColor: colors.surface }]}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={[styles.filterModalHeader, { borderBottomColor: colors.text.light + '20' }]}>
                <Text style={[styles.filterModalTitle, { fontSize: getFontSize(18), color: colors.text.primary }]}>쉼터 종류 선택</Text>
                <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.text.primary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    { backgroundColor: colors.background },
                    selectedCategories.includes('스마트 쉼터') && [styles.filterOptionSelected, { borderColor: colors.primary }]
                  ]}
                  onPress={() => toggleCategory('스마트 쉼터')}
                >
                  <View style={[styles.filterIcon, { backgroundColor: '#4A90E2' }]}>
                    <Ionicons name="medical" size={16} color="white" />
                  </View>
                  <Text style={[
                    styles.filterOptionText,
                    { fontSize: getFontSize(16), color: colors.text.primary },
                    selectedCategories.includes('스마트 쉼터') && styles.filterOptionTextSelected
                  ]}>스마트 쉼터</Text>
                  {selectedCategories.includes('스마트 쉼터') && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    { backgroundColor: colors.background },
                    selectedCategories.includes('민간 개방 시설') && [styles.filterOptionSelected, { borderColor: colors.primary }]
                  ]}
                  onPress={() => toggleCategory('민간 개방 시설')}
                >
                  <View style={[styles.filterIcon, { backgroundColor: '#FFA500' }]}>
                    <Ionicons name="business" size={16} color="white" />
                  </View>
                  <Text style={[
                    styles.filterOptionText,
                    { fontSize: getFontSize(16), color: colors.text.primary },
                    selectedCategories.includes('민간 개방 시설') && styles.filterOptionTextSelected
                  ]}>민간 개방 시설</Text>
                  {selectedCategories.includes('민간 개방 시설') && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    { backgroundColor: colors.background },
                    selectedCategories.includes('교통 시설') && [styles.filterOptionSelected, { borderColor: colors.primary }]
                  ]}
                  onPress={() => toggleCategory('교통 시설')}
                >
                  <View style={[styles.filterIcon, { backgroundColor: '#27AE60' }]}>
                    <Ionicons name="car" size={16} color="white" />
                  </View>
                  <Text style={[
                    styles.filterOptionText,
                    { fontSize: getFontSize(16), color: colors.text.primary },
                    selectedCategories.includes('교통 시설') && styles.filterOptionTextSelected
                  ]}>교통 시설</Text>
                  {selectedCategories.includes('교통 시설') && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    { backgroundColor: colors.background },
                    selectedCategories.includes('공공 시설') && [styles.filterOptionSelected, { borderColor: colors.primary }]
                  ]}
                  onPress={() => toggleCategory('공공 시설')}
                >
                  <View style={[styles.filterIcon, { backgroundColor: '#E74C3C' }]}>
                    <Ionicons name="library" size={16} color="white" />
                  </View>
                  <Text style={[
                    styles.filterOptionText,
                    { fontSize: getFontSize(16), color: colors.text.primary },
                    selectedCategories.includes('공공 시설') && styles.filterOptionTextSelected
                  ]}>공공 시설</Text>
                  {selectedCategories.includes('공공 시설') && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    { backgroundColor: colors.background },
                    selectedCategories.includes('기후 동행 쉼터') && [styles.filterOptionSelected, { borderColor: colors.primary }]
                  ]}
                  onPress={() => toggleCategory('기후 동행 쉼터')}
                >
                  <View style={[styles.categoryPin, { backgroundColor: '#9B59B6' }]}>
                    <Ionicons name="sunny" size={16} color="#FFFFFF" />
                  </View>
                  <Text style={[
                    styles.filterOptionText,
                    { fontSize: getFontSize(16), color: colors.text.primary },
                    selectedCategories.includes('기후 동행 쉼터') && styles.filterOptionTextSelected
                  ]}>기후 동행 쉼터</Text>
                  {selectedCategories.includes('기후 동행 쉼터') && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.filterModalFooter}>
                <TouchableOpacity 
                  style={styles.filterApplyButton}
                  onPress={() => setFilterModalVisible(false)}
                >
                  <Text style={styles.filterApplyText}>적용하기</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* 튜토리얼 모달 */}
        <TutorialModal
          visible={showTutorial}
          onClose={handleCloseTutorial}
        />
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    mapContainer: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    thermometerContainer: {
        position: 'absolute',
        top: 60,
        left: 20,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 10,
        ...getShadowStyle({
          shadowColor: '#000',
          shadowOffset: { width: 2, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 10,
        }),
    },
    thermometerBottomContainer: {
        position: 'absolute',
        left: 20,
        bottom: 80,
        zIndex: 10,
    },
    thermometerCard: {
        backgroundColor: 'transparent',
    },
    thermometerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    temperatureLabelContainer: {
        marginLeft: 8,
        alignItems: 'center',
    },
    modernThermometer: {
        width: 28,
        height: 90,
        borderRadius: 14,
        marginLeft: 10,
        overflow: 'hidden',
        backgroundColor: '#fff',
        position: 'relative',
        borderWidth: 2,
        borderColor: '#fff',
    },
    thermometerBackground: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: 14,
        backgroundColor: '#E8E8E8',
    },
    thermometerFill: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: '65%',
        borderRadius: 12.5,
    },
    temperatureLabel: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        ...getShadowStyle({
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.5,
          shadowRadius: 4,
          elevation: 12,
        }),
    },
    temperatureText: {
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    weatherText: {
        fontSize: 10,
        fontWeight: '600',
        marginTop: 6,
        textAlign: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        ...getShadowStyle({
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.45,
          shadowRadius: 4,
          elevation: 10,
        }),
    },
    trianglePointer: {
        position: 'absolute',
        left: -6,
        top: '50%',
        marginTop: -5,
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderTopWidth: 5,
        borderRightWidth: 6,
        borderBottomWidth: 5,
        borderLeftWidth: 0,
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    loadingCard: {
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        minWidth: 200,
        ...getShadowStyle({
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 12,
        }),
    },
    loadingText: {
        marginTop: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    loadingDots: {
        flexDirection: 'row',
        marginTop: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    navigationInfoContainer: {
        position: 'absolute',
        top: 60,
        left: 20,
        right: 20,
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        zIndex: 15,
        ...getShadowStyle({
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.5,
          shadowRadius: 4,
          elevation: 12,
        }),
    },
    navigationInfoContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    navigationInfoLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 8,
    },
    navigationTextContainer: {
        marginLeft: 10,
        flex: 1,
    },
    navigationDestination: {
        fontWeight: '700',
        marginBottom: 2,
    },
    navigationDetails: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    navigationDetailText: {
        fontWeight: '500',
    },
    navigationSeparator: {
        marginHorizontal: 6,
    },
    navigationCloseButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    shelterCategoryContainer: {
        position: 'absolute',
        top: 60,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        ...getShadowStyle({
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 3,
        }),
        zIndex: 10,
        minWidth: 60,
        minHeight: 40,
    },
    categoryItem: {
        alignItems: 'center',
        marginHorizontal: 6,
    },
    categoryPin: {
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 2,
    },
    categoryText: {
        fontSize: 9,
        color: Colors.text.secondary,
        fontWeight: '500',
    },
    filterIconContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    filterText: {
        fontSize: 12,
        color: Colors.text.secondary,
        fontWeight: '500',
        marginLeft: 4,
    },
    shelterCategoryContainerSquare: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 0,
        paddingVertical: 0,
        minWidth: 40,
        minHeight: 40,
        maxWidth: 40,
        maxHeight: 40,
    },
    locationButtonContainer: {
        position: 'absolute',
        bottom: 100,
        right: 20,
        zIndex: 10,
    },
    locationButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        ...getShadowStyle({
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.5,
          shadowRadius: 4,
          elevation: 12,
        }),
    },
    locationButtonLoading: {
        backgroundColor: '#f0f8ff',
    },
    tutorialButtonContainer: {
        position: 'absolute',
        top: Platform.OS === 'android' ? 60 : 60,
        right: 20,
        zIndex: 10,
    },
    tutorialButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        ...getShadowStyle({
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.5,
          shadowRadius: 4,
          elevation: 12,
        }),
    },
    overlayBottom: {
        position: 'absolute',
        bottom: -height * 0.4,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 12,
        paddingBottom: Platform.OS === 'android' ? 30 : 0, // 안드로이드에서 하단 패딩 추가
        height: Platform.OS === 'android' ? height * 0.5 + 30 : height * 0.5, // 안드로이드에서 높이 증가
        ...getShadowStyle({
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 8,
        }),
    },
    dragHandle: {
        width: 36,
        height: 4,
        backgroundColor: '#E0E0E0',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 12,
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 0,
        marginTop: -1, // 여백 제거
    },
    bottomHeader: {
        alignItems: 'center',
        marginBottom: 0,
        paddingBottom: 8,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.text.primary,
        textAlign: 'center',
    },
    filterChipContainer: {
        maxHeight: 50,
        marginTop: 8,
        marginBottom: 4,
    },
    filterChipContent: {
        paddingHorizontal: 16,
        alignItems: 'center',
        gap: 6,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        marginRight: 6,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        backgroundColor: 'white',
        gap: 6,
    },
    filterChipSelected: {
        backgroundColor: '#F5F5F5',
        borderColor: '#333',
    },
    filterChipIcon: {
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 6,
    },
    filterChipText: {
        fontSize: 13,
        fontWeight: '500',
    },
    filterChipTextSelected: {
        fontWeight: '600',
    },
    topNote: {
        fontSize: 12,
        color: Colors.text.light,
        textAlign: 'center',
        marginBottom: Platform.OS === 'android' ? 8 : 4,
        marginTop: Platform.OS === 'android' ? 16 : 8,
        paddingHorizontal: 16,
    },
    shelterCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 16,
        marginVertical: 6,
        borderRadius: 12,
        ...getShadowStyle({
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        }),
    },
    selectedCard: {
        backgroundColor: '#F8F9FF',
        borderColor: Colors.primary,
        borderWidth: 1.5,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    shelterInfo: {
        flex: 1,
    },
    shelterCategory: {
        fontSize: 12,
        color: Colors.text.light,
        marginBottom: 2,
        fontWeight: '500',
    },
    shelterName: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text.primary,
        lineHeight: 20,
    },
    shelterAddress: {
        fontSize: 12,
        fontWeight: '400',
        color: Colors.text.light,
        marginTop: 2,
        lineHeight: 16,
    },
    shelterDescription: {
        fontSize: 11,
        fontWeight: '400',
        color: Colors.text.secondary,
        marginTop: 1,
        lineHeight: 14,
        fontStyle: 'italic',
    },
    rightInfo: {
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        minWidth: 60,
        paddingTop: 18,
    },
    capacityText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.text.secondary,
        textAlign: 'right',
    },
    shelterDistance: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.primary,
        textAlign: 'right',
    },
    scrollContentContainer: {
        flexGrow: 1,
        paddingTop: 0, // 상단 여백 제거
    },
    bottomFiller: {
        height: 60, // 페이드 높이만큼 여백 추가
        backgroundColor: 'transparent',
    },
    bottomFadeFixed: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 40,
        zIndex: 100,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterModalContent: {
        width: '85%',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        maxHeight: '70%',
    },
    filterModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    filterModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text.primary,
    },
    filterOptions: {
        marginBottom: 20,
    },
    filterOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 15,
        borderRadius: 12,
        marginBottom: 10,
        backgroundColor: '#F8F9FA',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    filterOptionSelected: {
        backgroundColor: '#F0F8FF',
        borderColor: Colors.primary,
    },
    filterIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    filterOptionText: {
        flex: 1,
        fontSize: 16,
        color: Colors.text.primary,
        fontWeight: '500',
    },
    filterOptionTextSelected: {
        color: Colors.primary,
        fontWeight: '600',
    },
    filterModalFooter: {
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
    },
    filterApplyButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    filterApplyText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    emptyStateContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.text.primary,
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyStateSubtitle: {
        fontSize: 14,
        color: Colors.text.light,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    refreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f8ff',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    refreshButtonText: {
        fontSize: 14,
        color: Colors.primary,
        fontWeight: '500',
        marginLeft: 6,
    },
});

export default HomeScreen;