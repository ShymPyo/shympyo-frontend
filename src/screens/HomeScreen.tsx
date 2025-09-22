import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withRepeat,
  interpolate,
} from 'react-native-reanimated';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';
import * as Location from 'expo-location';

import { Colors } from '../constants/colors';
import ShelterDetailModal from '../components/ShelterDetailModal';
import ApiService, { MapLocation, NearbyPlace } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';

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
const AnimatedThermometer: React.FC<{ temperature: number }> = ({ temperature }) => {
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

  return (
    <View style={styles.modernThermometer}>
      <View style={styles.thermometerBackground} />
      
      {/* 그라데이션 배경 */}
      <Svg 
        height="90" 
        width="28" 
        style={{ position: 'absolute', bottom: 0 }}
        viewBox="0 0 28 90"
      >
        <Defs>
          <SvgLinearGradient id="thermometerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#D50000" stopOpacity={1} />
            <Stop offset="30%" stopColor="#FF1744" stopOpacity={0.95} />
            <Stop offset="60%" stopColor="#FF5722" stopOpacity={0.9} />
            <Stop offset="100%" stopColor="#FF8A65" stopOpacity={0.85} />
          </SvgLinearGradient>
          <SvgLinearGradient id="redGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#B71C1C" stopOpacity={0.9} />
            <Stop offset="50%" stopColor="#E53935" stopOpacity={0.9} />
            <Stop offset="100%" stopColor="#FF6B6B" stopOpacity={0.8} />
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
          fill="#FF3D00"
          opacity={0.6}
        />
      </Svg>
    </View>
  );
};

// 대중교통 관련 인터페이스와 데이터 제거 - 쉼터 기능만 사용

interface Shelter {
  id: string;
  name: string;
  type: string;
  distance: string;
  category: '민간 개방 시설' | '스마트 쉼터' | '교통 시설' | '공공 시설';
  icon: string;
  color: string;
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

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
  const { accessToken, refreshTokens } = useAuth();
  const navigation = useNavigation<HomeScreenNavigationProp>();

  // 상태 관리: 선택된 쉼터 정보만 관리
  const [selectedShelter, setSelectedShelter] = useState<Shelter>(shelters[0]);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['민간 개방 시설', '스마트 쉼터', '교통 시설', '공공 시설']);

  // 위치 관련 상태
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [locationPermission, setLocationPermission] = useState<Location.PermissionStatus | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [mapLocations, setMapLocations] = useState<MapLocation[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

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

      // 테스트용으로 서울 합정역 위치 사용
      const testLocation = {
        coords: {
          latitude: 37.5492056,
          longitude: 126.9140677,
          altitude: 0,
          accuracy: 10,
          altitudeAccuracy: 0,
          heading: 0,
          speed: 0,
        },
        timestamp: Date.now(),
      };

      setCurrentLocation(testLocation);
      console.log('✅ 테스트 위치 (서울 합정역):', testLocation.coords.latitude, testLocation.coords.longitude);

      // 주변 장소 조회
      await loadNearbyPlaces(testLocation.coords.latitude, testLocation.coords.longitude);
    } catch (error) {
      console.error('❌ 현재 위치 가져오기 실패:', error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // 주변 장소 조회
  const loadNearbyPlaces = async (lat: number, lon: number, radius: number = 2000) => {
    try {
      console.log(`🔍 검색 조건: 위치(${lat}, ${lon}), 반경: ${radius}m`);

      const [mapResponse, listResponse] = await Promise.all([
        ApiService.getNearbyMap(lat, lon, radius, 100, accessToken),
        ApiService.getNearbyList(lat, lon, radius, 50, accessToken)
      ]);

      console.log('🔍 API 응답 상세 정보:');
      console.log('지도 API 응답:', JSON.stringify(mapResponse, null, 2));
      console.log('리스트 API 응답:', JSON.stringify(listResponse, null, 2));

      if (mapResponse.success) {
        setMapLocations(mapResponse.data);
        console.log('✅ 지도 위치 데이터 로드:', mapResponse.data.length, '개');
        console.log('지도 데이터 내용:', mapResponse.data);
      } else {
        console.log('❌ 지도 API 실패:', mapResponse.message);
      }

      if (listResponse.success) {
        setNearbyPlaces(listResponse.data);
        console.log('✅ 주변 장소 리스트 로드:', listResponse.data.length, '개');
        console.log('리스트 데이터 내용:', listResponse.data);
      } else {
        console.log('❌ 리스트 API 실패:', listResponse.message);
      }
    } catch (error) {
      console.error('❌ 주변 장소 조회 실패:', error);

      // 401/403 오류인 경우 토큰 재발급 시도
      if (error.toString().includes('401') || error.toString().includes('403')) {
        console.log('🔄 토큰 만료 감지, 재발급 시도...');

        try {
          await refreshTokens();
          console.log('✅ 토큰 재발급 성공, 재시도...');

          // 토큰 재발급 후 다시 시도
          const [retryMapResponse, retryListResponse] = await Promise.all([
            ApiService.getNearbyMap(lat, lon, radius, 100, accessToken || undefined),
            ApiService.getNearbyList(lat, lon, radius, 50, accessToken || undefined)
          ]);

          if (retryMapResponse.success) {
            setMapLocations(retryMapResponse.data);
            console.log('✅ 재시도 - 지도 위치 데이터 로드:', retryMapResponse.data.length);
          }

          if (retryListResponse.success) {
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

  // 내 위치 버튼 클릭 핸들러
  const handleMyLocationPress = () => {
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

    getCurrentLocation();
  };

  // 장소 상세 정보 가져오기
  const handleShelterPress = async (shelter: Shelter) => {
    setSelectedShelter(shelter);

    // 백엔드에서 실제 데이터가 있는 경우 상세 정보 조회
    if (mapLocations.length > 0) {
      try {
        // shelter의 id를 숫자로 변환하여 사용
        const placeId = parseInt(shelter.id);
        const response = await ApiService.getPlaceDetail(placeId, accessToken || undefined);

        if (response.success) {
          console.log('✅ 장소 상세 정보 로드:', response.data);
          // 상세 정보로 shelter 객체 업데이트
          const updatedShelter = {
            ...shelter,
            address: response.data.address,
            description: response.data.content,
          };
          setSelectedShelter(updatedShelter);
        }
      } catch (error) {
        console.error('❌ 장소 상세 정보 조회 실패:', error);
      }
    }

    setModalVisible(true);
  };

  // 하단 슬라이드 애니메이션을 위한 값들
  const bottomSheetHeight = height * 0.5; // 전체 높이의 50%
  const peekHeight = 120; // 기본적으로 살짝 보이는 높이
  const minHeight = peekHeight; // 최소 높이 - 제목과 첫 번째 카드 일부만 보임
  const maxHeight = bottomSheetHeight; // 최대 높이 - 전체 목록 표시
  
  // 초기값을 0으로 설정 (원래 상태)
  const translateY = useSharedValue(0);

  // 팬 제스처 핸들러 - 3단계 상태를 지원하는 스마트 슬라이드
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context: any) => {
      // 드래그 시작 위치 저장
      context.startY = translateY.value;
    },
    onActive: (event, context) => {
      // 드래그 중 위치 업데이트 - 부드러운 따라감
      const newTranslateY = context.startY + event.translationY;
      // 범위 제한: 완전히 닫힌 상태(0)부터 완전히 열린 상태(-maxHeight + 85)까지, 과도한 탄성 방지
      translateY.value = Math.max(-maxHeight + 85, Math.min(20, newTranslateY));
    },
    onEnd: (event) => {
      // 3단계 상태 결정: 완전히 닫힘(0), 살짝 열림(-peekHeight), 완전히 열림(-maxHeight)
      const currentPos = translateY.value;
      const velocity = event.velocityY;
      
      let targetY = 0; // 기본값은 닫힌 상태
      
      // 위로 빠르게 드래그하면 완전히 열기
      if (velocity < -500) {
        targetY = -maxHeight + 85; // 완전히 열림 (하단 네비 고려)
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
          targetY = -maxHeight + 85; // 완전히 열림
        } else {
          targetY = -peekHeight; // 중간 상태 (살짝 열림)
        }
      }
      
      // 부드러운 스프링 애니메이션으로 목표 위치로 이동
      translateY.value = withSpring(targetY, {
        damping: 30,
        stiffness: 300,
      });
    },
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
        damping: 30,
        stiffness: 300,
      });
    } else {
      // 닫혀있거나 살짝 열려있으면 완전히 열기
      translateY.value = withSpring(-maxHeight + 85, {
        damping: 30,
        stiffness: 300,
      });
    }
  };

  // 필터링된 쉼터 목록
  const filteredShelters = shelters.filter(shelter => 
    selectedCategories.includes(shelter.category)
  );

  // 카테고리 토글 함수
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // 쉼터 정보 카드 렌더링 함수 - 선택 가능한 카드 리스트 형태
  const renderShelterCard = ({ item }: { item: Shelter }) => (
    <TouchableOpacity 
      style={[
        styles.shelterCard, 
        selectedShelter.id === item.id && styles.selectedCard // 선택된 카드는 다른 스타일 적용
      ]}
      onPress={() => handleShelterPress(item)} // 카드 선택 시 상세 정보 로드 후 모달 열기
    >
      {/* 쉼터 타입별 색상 아이콘 */}
      <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon as any} size={20} color="white" />
      </View>
      {/* 쉼터 정보 텍스트 영역 */}
      <View style={styles.shelterInfo}>
        <Text style={styles.shelterCategory}>{item.category}</Text>
        <Text style={styles.shelterName}>{item.name}</Text>
        {item.address && (
          <Text style={styles.shelterAddress}>{item.address}</Text>
        )}
        {item.description && (
          <Text style={styles.shelterDescription} numberOfLines={1}>
            {item.description}
          </Text>
        )}
      </View>
      {/* 거리 정보 - 오른쪽에 큰 글씨로 표시 */}
      <Text style={styles.shelterDistance}>{item.distance}</Text>
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

          // 현재 위치가 있으면 해당 위치를 중심으로, 없으면 기본 위치 사용
          var centerLat = ${currentLocation?.coords.latitude || 37.4485};
          var centerLng = ${currentLocation?.coords.longitude || 126.6584};

          var options = {
              center: new kakao.maps.LatLng(centerLat, centerLng),
              level: 4  // 모바일에 적합한 줌 레벨
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

          // 내 위치 마커 (현재 위치가 있는 경우에만)
          ${currentLocation ? `
          var myLocationMarker = new kakao.maps.Marker({
              map: map,
              position: new kakao.maps.LatLng(${currentLocation.coords.latitude}, ${currentLocation.coords.longitude}),
              title: '내 위치',
              image: new kakao.maps.MarkerImage(
                  'data:image/svg+xml;base64,' + btoa(\`
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="8" fill="#007AFF" stroke="white" stroke-width="2"/>
                      <circle cx="12" cy="12" r="3" fill="white"/>
                    </svg>
                  \`),
                  new kakao.maps.Size(24, 24),
                  { offset: new kakao.maps.Point(12, 12) }
              )
          });
          ` : ''}
  
          // 백엔드에서 가져온 주변 장소들로 마커 생성
          var positions = [
              ${mapLocations.map((location, index) => {
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
  
          // 마커 생성 (데이터가 있는 경우에만)
          if (positions.length > 0) {
              for (var i = 0; i < positions.length; i ++) {
                  // 쉼터 타입에 따른 마커 이미지 설정
                  var markerImageSrc = 'data:image/svg+xml;base64,' + btoa(\`
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="16" cy="16" r="14" fill="#4A90E2" stroke="white" stroke-width="2"/>
                      <path d="M16 10L18 14H22L19 17L20 22L16 19L12 22L13 17L10 14H14L16 10Z" fill="white"/>
                    </svg>
                  \`);

                  var markerImage = new kakao.maps.MarkerImage(
                      markerImageSrc,
                      new kakao.maps.Size(32, 32),
                      { offset: new kakao.maps.Point(16, 32) }
                  );

                  var marker = new kakao.maps.Marker({
                      map: map,
                      position: positions[i].latlng,
                      title: positions[i].title,
                      image: markerImage
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

                  // 마커 클릭 이벤트
                  (function(marker, infoWindow) {
                      kakao.maps.event.addListener(marker, 'click', function() {
                          infoWindow.open(map, marker);
                      });
                  })(marker, infoWindow);
              }
          }
  
      </script>
  </body>
  </html>
  `;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <StatusBar style="dark" translucent backgroundColor="rgba(255,255,255,0.8)" />
        <View style={styles.mapContainer}>
          <WebView
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
          />
          {/* 상단 오버레이를 미니멀하게 변경 - 내 위치 버튼과 미세먼지 정보만 표시 */}
          {/* 온도계 - 좌측 하단 (카테고리 아래) */}
          <View style={styles.thermometerContainer}>
            <AnimatedThermometer temperature={65} />
            <View style={styles.temperatureLabel}>
              <Text style={styles.temperatureText}>99°</Text>
              <View style={styles.trianglePointer} />
            </View>
          </View>
          
          {/* 쉼터 종류 범례 - 상단 가로 배치 */}
          <TouchableOpacity 
            style={[
              styles.shelterCategoryContainer,
              selectedCategories.length === 0 && styles.shelterCategoryContainerSquare
            ]}
            onPress={() => setFilterModalVisible(true)}
          >
            {selectedCategories.length === 0 ? (
              <View style={styles.filterIconContainer}>
                <Ionicons name="options" size={18} color={Colors.text.secondary} />
              </View>
            ) : (
              <>
                {selectedCategories.includes('스마트 쉼터') && (
                  <View style={styles.categoryItem}>
                    <View style={[styles.categoryPin, { backgroundColor: '#4A90E2' }]}>
                      <Ionicons name="medical" size={12} color="white" />
                    </View>
                    <Text style={styles.categoryText}>쉘터</Text>
                  </View>
                )}
                {selectedCategories.includes('민간 개방 시설') && (
                  <View style={styles.categoryItem}>
                    <View style={[styles.categoryPin, { backgroundColor: '#FFA500' }]}>
                      <Ionicons name="business" size={12} color="white" />
                    </View>
                    <Text style={styles.categoryText}>민간</Text>
                  </View>
                )}
                {selectedCategories.includes('교통 시설') && (
                  <View style={styles.categoryItem}>
                    <View style={[styles.categoryPin, { backgroundColor: '#27AE60' }]}>
                      <Ionicons name="car" size={12} color="white" />
                    </View>
                    <Text style={styles.categoryText}>교통</Text>
                  </View>
                )}
                {selectedCategories.includes('공공 시설') && (
                  <View style={styles.categoryItem}>
                    <View style={[styles.categoryPin, { backgroundColor: '#E74C3C' }]}>
                      <Ionicons name="library" size={12} color="white" />
                    </View>
                    <Text style={styles.categoryText}>공공</Text>
                  </View>
                )}
              </>
            )}
          </TouchableOpacity>

          {/* 내 위치 버튼 - 우측 하단 (하단 슬라이드와 함께 움직임) */}
          <Animated.View style={[styles.locationButtonContainer, locationButtonStyle]}>
            <TouchableOpacity
              style={[
                styles.locationButton,
                isLoadingLocation && styles.locationButtonLoading
              ]}
              onPress={handleMyLocationPress}
              disabled={isLoadingLocation}
            >
              <Ionicons
                name={isLoadingLocation ? "refresh" : "locate"}
                size={20}
                color={isLoadingLocation ? Colors.primary : Colors.text.primary}
              />
            </TouchableOpacity>
          </Animated.View>
          
          <PanGestureHandler onGestureEvent={gestureHandler}>
            <Animated.View style={[styles.overlayBottom, bottomSheetStyle]}>
              {/* 드래그 핸들 - 미니멀한 회색 바 */}
              <View style={styles.dragHandle} />
              
              {/* 헤더 부분 - 터치 시 리스트 토글 */}
              <TouchableOpacity style={styles.bottomHeader} onPress={handleHeaderPress}>
                <Text style={styles.headerTitle}>반경 2km 내 쉼터</Text>
              </TouchableOpacity>

              {/* 쉼터 목록 - 스크롤 가능한 영역 */}
              <ScrollView
                style={styles.contentContainer}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContentContainer}
              >
                {/* 실시간 업데이트 안내 - 리스트 내부 */}
                <Text style={styles.topNote}>※ 실시간으로 업데이트 됩니다.</Text>
                
                <View style={{ backgroundColor: 'transparent' }}>
                  {/* 쉼터 목록 항상 표시 */}
                    <FlatList
                      data={nearbyPlaces.map(place => ({
                        id: place.id.toString(),
                        name: place.name,
                        category: place.type === 'SHELTER' ? '스마트 쉼터' : '기타 시설',
                        type: place.type,
                        distance: place.distanceM < 1000 ? `${Math.round(place.distanceM)}m` : `${(place.distanceM / 1000).toFixed(1)}km`,
                        address: place.address,
                        description: place.content,
                        icon: place.type === 'SHELTER' ? 'home' : 'business',
                        color: place.type === 'SHELTER' ? '#4A90E2' : '#7ED321'
                      }))}
                      renderItem={renderShelterCard}
                      keyExtractor={(item) => item.id}
                      scrollEnabled={false}
                    />
                </View>
                <View style={styles.bottomFiller} />
              </ScrollView>
            </Animated.View>
          </PanGestureHandler>
        </View>

        {/* 쉼터 세부정보 모달 */}
        <ShelterDetailModal
          visible={modalVisible}
          shelter={selectedShelter}
          onClose={() => setModalVisible(false)}
        />

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
              style={styles.filterModalContent}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.filterModalHeader}>
                <Text style={styles.filterModalTitle}>쉼터 종류 선택</Text>
                <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                  <Ionicons name="close" size={24} color={Colors.text.primary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    selectedCategories.includes('스마트 쉼터') && styles.filterOptionSelected
                  ]}
                  onPress={() => toggleCategory('스마트 쉼터')}
                >
                  <View style={[styles.filterIcon, { backgroundColor: '#4A90E2' }]}>
                    <Ionicons name="medical" size={16} color="white" />
                  </View>
                  <Text style={[
                    styles.filterOptionText,
                    selectedCategories.includes('스마트 쉼터') && styles.filterOptionTextSelected
                  ]}>스마트 쉼터</Text>
                  {selectedCategories.includes('스마트 쉼터') && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    selectedCategories.includes('민간 개방 시설') && styles.filterOptionSelected
                  ]}
                  onPress={() => toggleCategory('민간 개방 시설')}
                >
                  <View style={[styles.filterIcon, { backgroundColor: '#FFA500' }]}>
                    <Ionicons name="business" size={16} color="white" />
                  </View>
                  <Text style={[
                    styles.filterOptionText,
                    selectedCategories.includes('민간 개방 시설') && styles.filterOptionTextSelected
                  ]}>민간 개방 시설</Text>
                  {selectedCategories.includes('민간 개방 시설') && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    selectedCategories.includes('교통 시설') && styles.filterOptionSelected
                  ]}
                  onPress={() => toggleCategory('교통 시설')}
                >
                  <View style={[styles.filterIcon, { backgroundColor: '#27AE60' }]}>
                    <Ionicons name="car" size={16} color="white" />
                  </View>
                  <Text style={[
                    styles.filterOptionText,
                    selectedCategories.includes('교통 시설') && styles.filterOptionTextSelected
                  ]}>교통 시설</Text>
                  {selectedCategories.includes('교통 시설') && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    selectedCategories.includes('공공 시설') && styles.filterOptionSelected
                  ]}
                  onPress={() => toggleCategory('공공 시설')}
                >
                  <View style={[styles.filterIcon, { backgroundColor: '#E74C3C' }]}>
                    <Ionicons name="library" size={16} color="white" />
                  </View>
                  <Text style={[
                    styles.filterOptionText,
                    selectedCategories.includes('공공 시설') && styles.filterOptionTextSelected
                  ]}>공공 시설</Text>
                  {selectedCategories.includes('공공 시설') && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary} />
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
        backgroundColor: '#000',
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        ...getShadowStyle({
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
          elevation: 10,
        }),
        marginLeft: 8,
    },
    temperatureText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
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
        borderRightColor: '#000',
        borderBottomColor: 'transparent',
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
        bottom: 120,
        right: 20,
        zIndex: 10,
    },
    locationButton: {
        backgroundColor: 'white',
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        ...getShadowStyle({
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }),
    },
    locationButtonLoading: {
        backgroundColor: '#f0f8ff',
    },
    overlayBottom: {
        position: 'absolute',
        bottom: -height * 0.4, // 원래 위치로 복구
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 12,
        height: height * 0.5, // 원래 높이로 복구
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
    },
    bottomHeader: {
        alignItems: 'center',
        marginBottom: 0,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.text.primary,
        textAlign: 'center',
    },
    topNote: {
        fontSize: 12,
        color: Colors.text.light,
        textAlign: 'center',
        marginBottom: 10,
        marginTop: 8,
        paddingHorizontal: 0,
    },
    shelterCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 16,
        marginVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F0F0F0',
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
    shelterDistance: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.primary,
        minWidth: 50,
        textAlign: 'right',
    },
    scrollContentContainer: {
        flexGrow: 1,
    },
    bottomFiller: {
        height: 100, // 하단 네비게이션 바 높이만큼 여백 추가
        backgroundColor: 'transparent',
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