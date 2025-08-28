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

import { Colors } from '../constants/colors';
import ShelterDetailModal from '../components/ShelterDetailModal';

const { width, height } = Dimensions.get('window');

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

const HomeScreen: React.FC = () => {
  // 상태 관리: 선택된 쉼터 정보만 관리
  const [selectedShelter, setSelectedShelter] = useState<Shelter>(shelters[0]);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['민간 개방 시설', '스마트 쉼터', '교통 시설', '공공 시설']);
  
  // 하단 슬라이드 애니메이션을 위한 값들
  const bottomSheetHeight = height * 0.5; // 전체 높이의 50%
  const peekHeight = 120; // 기본적으로 살짝 보이는 높이
  const minHeight = peekHeight; // 최소 높이 - 제목과 첫 번째 카드 일부만 보임
  const maxHeight = bottomSheetHeight; // 최대 높이 - 전체 목록 표시
  
  // CSS로 위치를 조정했으므로 translateY는 0에서 시작
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
      onPress={() => {
        setSelectedShelter(item);
        setModalVisible(true);
      }} // 카드 선택 시 상태 업데이트하고 모달 열기
    >
      {/* 쉼터 타입별 색상 아이콘 */}
      <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon as any} size={20} color="white" />
      </View>
      {/* 쉼터 정보 텍스트 영역 */}
      <View style={styles.shelterInfo}>
        <Text style={styles.shelterCategory}>{item.category}</Text>
        <Text style={styles.shelterName}>{item.name}</Text>
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
    <title>Kakao Maps</title>
      <style>
          html, body {
              width: 100%;
              height: 100%;
              margin: 0;
              padding: 0;
          }
          #map {
              width: 100%;
              height: 100%;
          }
      </style>
  </head>
  <body>
      <div id="map"></div>
      <script type="text/javascript" src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=76e23ff1c2370fd1c14d17f2370c8985"></script>
      <script>
          var container = document.getElementById('map');
          var options = {
              center: new kakao.maps.LatLng(37.4485, 126.6584),
              level: 4
          };
  
          var map = new kakao.maps.Map(container, options);
  
          var positions = [
              {
                  title: '카페 빈스',
                  latlng: new kakao.maps.LatLng(37.4485, 126.6584)
              },
              {
                  title: '용현노인문화센터',
                  latlng: new kakao.maps.LatLng(37.4505, 126.6564)
              },
              {
                  title: '인하대역',
                  latlng: new kakao.maps.LatLng(37.4495, 126.6554)
              },
              {
                  title: '스마트쉼터',
                  latlng: new kakao.maps.LatLng(37.4515, 126.6594)
              },
              {
                  title: '공공시설',
                  latlng: new kakao.maps.LatLng(37.4475, 126.6534)
              }
          ];
  
          for (var i = 0; i < positions.length; i ++) {
              var marker = new kakao.maps.Marker({
                  map: map,
                  position: positions[i].latlng,
                  title: positions[i].title
              });
          }
          
          map.setCenter(positions[0].latlng);
  
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
            <TouchableOpacity style={styles.locationButton}>
              <Ionicons name="locate" size={20} color={Colors.text.primary} />
            </TouchableOpacity>
          </Animated.View>
          
          <PanGestureHandler onGestureEvent={gestureHandler}>
            <Animated.View style={[styles.overlayBottom, bottomSheetStyle]}>
              {/* 드래그 핸들 - 미니멀한 회색 바 */}
              <View style={styles.dragHandle} />
              
              {/* 헤더 부분 - 터치 시 리스트 토글 */}
              <TouchableOpacity style={styles.bottomHeader} onPress={handleHeaderPress}>
                <Text style={styles.headerTitle}>반경 100m 내 쉼터</Text>
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
                  <FlatList
                    data={filteredShelters}
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
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 10,
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    overlayBottom: {
        position: 'absolute',
        bottom: -height * 0.5 + 85, // 슬라이드를 아래로 숨기고 15px만 보이게
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 12,
        height: height * 0.5, // 슬라이드 전체 높이
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
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
});

export default HomeScreen;