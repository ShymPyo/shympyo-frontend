import React, { useState, useEffect, useCallback } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Svg, { Defs, Mask, Rect, Circle } from 'react-native-svg';
import * as Notifications from 'expo-notifications';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

import { Colors } from '../constants/colors';
import ApiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';


type ScreenState = 'scanning' | 'timer' | 'finished';

// 알림 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const QRScreen: React.FC = () => {
  const navigation = useNavigation();
  const { accessToken } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [screenState, setScreenState] = useState<ScreenState>('scanning');
  const [timeLeft, setTimeLeft] = useState(10); // 10 seconds for testing
  const [totalTime, setTotalTime] = useState(10); // 총 시간
  const [cameraEnabled, setCameraEnabled] = useState(false); // 카메라 활성화 상태
  const [placeName, setPlaceName] = useState<string>(''); // 입장한 장소명
  const [rentalId, setRentalId] = useState<number | null>(null); // 렌탈 ID
  
  // 원형 프로그레스 바 애니메이션을 위한 값들
  const progress = useSharedValue(0);

  useEffect(() => {
    if (screenState !== 'timer') return;

    if (timeLeft === 0) {
      // 타이머 완료 시 알림 발송
      sendNotification();
      return;
    }

    const intervalId = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        return newTime;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [screenState, timeLeft]);

  // 알림 권한 요청 및 발송 함수
  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('알림 권한이 거부되었습니다.');
      }
    };
    requestPermissions();
  }, []);

  const sendNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '쉼터 이용 완료! 🌿',
        body: `${placeName || '쉼터'}에서의 휴식이 끝났습니다.\n감사 편지를 작성해보세요! ✉️`,
        sound: 'default',
      },
      trigger: null, // 즉시 발송
    });
  };

  // 타이머 시작 시 애니메이션 초기화
  useEffect(() => {
    if (screenState === 'timer') {
      progress.value = 0; // 프로그레스 바 초기화
    }
  }, [screenState, progress]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;

    setScanned(true);

    if (!accessToken) {
      Alert.alert('로그인 필요', '쉼터를 이용하려면 로그인이 필요합니다.');
      return;
    }

    try {
      console.log('🔍 QR 코드 스캔 데이터:', data);
      console.log('🔍 QR 코드 스캔 데이터 타입:', typeof data);
      console.log('🔍 QR 코드 스캔 데이터 길이:', data.length);

      // QR 코드에서 placeCode 추출
      let placeCode = data.trim();

      // QR 코드가 JSON 형태인 경우 처리
      try {
        const qrData = JSON.parse(data);
        if (qrData.placeCode) {
          placeCode = qrData.placeCode;
          console.log('📱 JSON에서 placeCode 추출:', placeCode);
        }
      } catch {
        // JSON이 아닌 경우 무시
      }

      // QR 코드가 URL 형태인 경우 처리 (예: https://example.com/place/PL-A12F9C3D)
      if (placeCode.includes('://')) {
        const urlParts = placeCode.split('/');
        const lastPart = urlParts[urlParts.length - 1];
        if (lastPart.startsWith('PL-')) {
          placeCode = lastPart;
          console.log('🔗 URL에서 placeCode 추출:', placeCode);
        }
      }

      console.log('📡 쉼터 입장 API 호출 중...', {
        placeCode,
        placeCodeLength: placeCode.length,
        accessToken: accessToken ? '토큰 있음' : '토큰 없음'
      });

      const response = await ApiService.enterPlace(accessToken, placeCode);

      if (response.success) {
        console.log('✅ 쉼터 입장 성공:', response.data);

        // 성공 시 응답 데이터 저장
        setPlaceName(response.data.placeName);
        setRentalId(response.data.rentalId);

        // 타이머 화면으로 이동
        setScreenState('timer');
        setTimeLeft(10); // 10초로 초기화 (실제로는 API에서 받은 시간 사용 가능)
        setTotalTime(10);

        console.log('🏢 입장 완료:', response.data.placeName);
      } else {
        console.log('❌ 쉼터 입장 실패:', {
          success: response.success,
          code: response.code,
          message: response.message,
          data: response.data
        });

        Alert.alert(
          '입장 실패',
          `오류 코드: ${response.code}\n${response.message || '쉼터 입장에 실패했습니다.'}`
        );
        setScanned(false); // 다시 스캔할 수 있도록
      }
    } catch (error: any) {
      console.error('💥 쉼터 입장 오류:', error);
      console.error('💥 에러 메시지:', error.message);
      console.error('💥 에러 스택:', error.stack);

      Alert.alert(
        '오류',
        `네트워크 오류: ${error.message}\n쉼터 입장 중 오류가 발생했습니다.`
      );
      setScanned(false); // 다시 스캔할 수 있도록
    }
  };

  const formatTime = () => {
    const elapsedTime = totalTime - timeLeft;
    const minutes = Math.floor(elapsedTime / 60).toString().padStart(2, '0');
    const seconds = (elapsedTime % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  // 화면 포커스 관리 - 카메라 활성화/비활성화
  useFocusEffect(
    useCallback(() => {
      // 화면 포커스 시 상태 초기화 및 카메라 활성화
      setScreenState('scanning');
      setScanned(false);
      setTimeLeft(10);
      setTotalTime(10);
      setPlaceName('');
      setRentalId(null);
      setCameraEnabled(true);

      return () => {
        // 화면을 떠날 때 카메라 비활성화
        setCameraEnabled(false);
      };
    }, [])
  );

  // 스크린 상태가 스캐닝으로 변경될 때 프로그레스 리셋
  useEffect(() => {
    if (screenState === 'scanning') {
      progress.value = 0;
    }
  }, [screenState, progress]);

  // 원형 프로그레스 바를 위한 값 계산
  const FULL_DASH_ARRAY = 2 * Math.PI * 85; // 반지름 85인 원의 둘레

  const renderContent = () => {
    switch (screenState) {
      case 'scanning':
        if (!permission) {
          return <Text style={styles.infoText}>카메라 권한을 요청하는 중입니다...</Text>;
        }
        if (!permission.granted) {
          return (
            <View style={styles.permissionContainer}>
              <Text style={styles.infoText}>카메라 접근 권한이 필요합니다.</Text>
              <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                <Text style={styles.permissionButtonText}>권한 허용</Text>
              </TouchableOpacity>
            </View>
          );
        }
        return (
          <View style={styles.scannerContainer}>
            {cameraEnabled && (
              <CameraView
                style={styles.scanner}
                facing="back"
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                  barcodeTypes: ["qr", "pdf417"],
                }}
              />
            )}
            {/* SVG 마스크 오버레이 */}
            <Svg style={styles.svgOverlay} width="100%" height="100%">
              <Defs>
                <Mask id="scannerMask">
                  {/* 전체를 하얀색으로 채움 (불투명) */}
                  <Rect width="100%" height="100%" fill="white" />
                  {/* 스캔 박스 영역을 검은색으로 뚫음 (투명) */}
                  <Rect 
                    x="50%" 
                    y="50%" 
                    width="250" 
                    height="250" 
                    rx="15" 
                    ry="15"
                    fill="black"
                    transform="translate(-125, -125)"
                  />
                </Mask>
              </Defs>
              {/* 마스크가 적용된 검은 오버레이 */}
              <Rect 
                width="100%" 
                height="100%" 
                fill="rgba(0,0,0,0.7)" 
                mask="url(#scannerMask)" 
              />
            </Svg>
            
            {/* 텍스트와 스캔 박스 테두리 */}
            <View style={styles.overlayContent}>
              <Text style={styles.overlayTitle}>쉼표 공간 QR을 스캔해주세요.</Text>
              <View style={styles.scannerBox} />
              <Text style={styles.overlaySubtitle}>
                사장님의 자발적인 나눔으로 마련된 쉼터입니다.{'\n'}
                서로를 배려하며 사용해 주세요.
              </Text>

              {/* 테스트용 버튼 */}
              <TouchableOpacity
                style={styles.testButton}
                onPress={() => handleBarCodeScanned({ data: 'PL-A12F9C3D' })}
              >
                <Text style={styles.testButtonText}>테스트 QR</Text>
              </TouchableOpacity>
            </View>
            {scanned && (
              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => setScanned(false)}
              >
                <Text style={styles.resetButtonText}>다시 스캔하기</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      case 'timer':
        const elapsedTime = totalTime - timeLeft;
        const timeFraction = Math.min(elapsedTime / totalTime, 1);
        const strokeLength = timeFraction * FULL_DASH_ARRAY;
        const dashArray = `${strokeLength.toFixed(1)} ${FULL_DASH_ARRAY}`;
        
        return (
          <View style={styles.timerScreenContainer}>
            <View style={styles.timerContainer}>
              <Text style={styles.timerTopText}>따뜻한 배려로 열린 쉼표,{'\n'}최대 10초 이용 가능합니다.</Text>
              
              {/* 원형 프로그레스 바 */}
              <View style={styles.circularProgressContainer}>
                <Svg width="280" height="280" viewBox="0 0 200 200" style={styles.circularProgress}>
                  {/* 배경 원 */}
                  <Circle
                    cx="100"
                    cy="100"
                    r="85"
                    stroke="#E0E0E0"
                    strokeWidth="15"
                    fill="transparent"
                  />
                  {/* 프로그레스 원 */}
                  <Circle
                    cx="100"
                    cy="100"
                    r="85"
                    stroke={timeLeft === 0 ? Colors.success : Colors.primary}
                    strokeWidth="15"
                    fill="transparent"
                    strokeDasharray={dashArray}
                    strokeLinecap="round"
                    transform="rotate(-90 100 100)"
                  />
                </Svg>
                
                {/* 중앙 내용 */}
                <View style={styles.timerCenter}>
                  {timeLeft === 0 ? (
                    <>
                      <Ionicons name="checkmark-circle" size={70} color={Colors.success} />
                      <Text style={styles.timerCompletedText}>쉼표에서, 마침표로.</Text>
                    </>
                  ) : (
                    <Text style={styles.timerTextLarge}>{formatTime()}</Text>
                  )}
                </View>
              </View>
              
              <Text style={styles.timerSubtitle}>{placeName || '쉼터'}</Text>
              <Text style={styles.timerDescription}>깨끗하고 조용한 공간에서 편히 쉬어가세요</Text>
            </View>
            
            {/* 타이머 완료 후 버튼들 - 하단 고정 */}
            {timeLeft === 0 && (
              <View style={styles.fixedBottomButtons}>
                <TouchableOpacity style={styles.homeButton} onPress={() => navigation.navigate('Home' as never)}>
                  <Text style={styles.buttonText}>홈으로</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.letterButton} onPress={() => navigation.navigate('Letter' as never)}>
                  <Text style={styles.buttonText}>감사 편지 적기</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      case 'finished':
        return (
          <View style={styles.finishedContainer}>
            <Ionicons name="checkmark-circle-outline" size={100} color={Colors.success} />
            <Text style={styles.finishedTitle}>시간이 다 되었습니다!</Text>
            <Text style={styles.finishedSubtitle}>{placeName || '쉼터'}</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.homeButton} onPress={() => navigation.navigate('Home' as never)}>
                <Text style={styles.buttonText}>홈으로</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.letterButton} onPress={() => navigation.navigate('Letter' as never)}>
                <Text style={styles.buttonText}>감사 편지 적기</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>{renderContent()}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  scannerContainer: {
    flex: 1,
    width: '100%',
    position: 'relative',
  },
  scanner: {
    flex: 1,
  },
  svgOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTitle: {
    position: 'absolute',
    top: '25%',
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    paddingHorizontal: 20,
    fontWeight: '600',
    width: '100%',
  },
  scannerBox: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: 'white',
    borderRadius: 15,
    backgroundColor: 'transparent',
  },
  overlaySubtitle: {
    position: 'absolute',
    bottom: '25%',
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
    width: '100%',
  },
  timerScreenContainer: {
    flex: 1,
  },
  timerContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  timerTopText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 20,
    marginTop: 60,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  circularProgressContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  circularProgress: {
    transform: [{ rotate: '-90deg' }],
  },
  timerCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginVertical: 20,
  },
  timerTextSmall: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginTop: 4,
  },
  timerTextLarge: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  timerCompletedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.success,
    marginTop: 10,
  },
  timerButtonContainer: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 30,
  },
  fixedBottomButtons: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
  },
  timerSubtitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginTop: 5,
  },
  timerDescription: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  finishedContainer: {
    alignItems: 'center',
  },
  finishedTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginVertical: 20,
  },
  finishedSubtitle: {
    fontSize: 20,
    color: Colors.text.secondary,
    marginBottom: 30,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  homeButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  letterButton: {
    backgroundColor: Colors.success,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetButton: {
    position: 'absolute',
    bottom: 50,
    left: 50,
    right: 50,
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  permissionContainer: {
    alignItems: 'center',
    gap: 20,
  },
  permissionButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  testButton: {
    position: 'absolute',
    bottom: -100,
    backgroundColor: Colors.success,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'center',
  },
  testButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default QRScreen;
