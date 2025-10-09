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
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Svg, { Defs, Mask, Rect, Circle } from 'react-native-svg';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Colors } from '../constants/colors';
import ApiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useThemedStyles } from '../hooks/useThemedStyles';


type ScreenState = 'scanning' | 'timer' | 'finished';

const QRScreen: React.FC = () => {
  const navigation = useNavigation();
  const { accessToken } = useAuth();
  const { colors, getFontSize, statusBarStyle } = useThemedStyles();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [screenState, setScreenState] = useState<ScreenState>('scanning');
  const [timeLeft, setTimeLeft] = useState(10); // 10 seconds for testing
  const [totalTime, setTotalTime] = useState(10); // 총 시간
  const [cameraEnabled, setCameraEnabled] = useState(false); // 카메라 활성화 상태
  const [placeName, setPlaceName] = useState<string>(''); // 입장한 장소명
  const [rentalId, setRentalId] = useState<number | null>(null); // 렌탈 ID
  const [placeId, setPlaceId] = useState<number | null>(null); // 장소 ID
  const [isProcessing, setIsProcessing] = useState(false); // 스캔 처리 중 상태
  const [isLetterModalVisible, setLetterModalVisible] = useState(false); // 편지 모달
  const [letterText, setLetterText] = useState(''); // 편지 내용
  const [isSendingLetter, setIsSendingLetter] = useState(false); // 편지 전송 중
  const [lastScannedData, setLastScannedData] = useState<string>(''); // 마지막 스캔 데이터
  const [hasExited, setHasExited] = useState(false); // 퇴장 처리 완료 상태
  const [statusBarKey, setStatusBarKey] = useState(0);

  // 원형 프로그레스 바 애니메이션을 위한 값들
  const progress = useSharedValue(0);

  useEffect(() => {
    if (screenState !== 'timer') return;

    if (timeLeft === 0 && !hasExited) {
      // 타이머 완료 시 자동 퇴장 처리
      handleAutoExit();
      return;
    }

    // 퇴장했으면 타이머 멈춤
    if (hasExited) return;

    const intervalId = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        return newTime;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [screenState, timeLeft, hasExited]);

  // 자동 퇴장 처리 함수
  const handleAutoExit = async () => {
    if (!accessToken || !rentalId) {
      console.log('❌ accessToken 또는 rentalId 없음');
      return;
    }

    try {
      console.log('🚪 타이머 완료, 자동 퇴장 처리 시작');
      const exitResponse = await ApiService.exitPlace(accessToken);

      if (exitResponse.success && exitResponse.data) {
        console.log('✅ 자동 퇴장 완료:', exitResponse.data);
        setHasExited(true);
      } else if (exitResponse.message?.includes('진행 중인 대여가 없습니다')) {
        // 백엔드 스케줄러가 이미 TIME_EXCEEDED로 전환한 경우
        console.log('✅ 이미 퇴장 처리됨 (백엔드 스케줄러)');
        setHasExited(true);
      } else {
        console.log('❌ 자동 퇴장 실패:', exitResponse);
      }
    } catch (error) {
      console.error('💥 자동 퇴장 오류:', error);
    }
  };

  const handleExit = async () => {
    if (!accessToken) {
      Alert.alert('오류', '인증 정보가 없습니다.');
      return;
    }

    if (!rentalId) {
      Alert.alert('오류', '현재 이용 중인 쉼터 정보를 찾을 수 없습니다.');
      return;
    }

    try {
      console.log('🚪 퇴장 처리 시작 (rentalId:', rentalId, ')');

      const exitResponse = await ApiService.exitPlace(accessToken);

      if (exitResponse.success && exitResponse.data) {
        console.log('✅ 퇴장 완료:', exitResponse.data);
        setHasExited(true);
      } else if (exitResponse.message?.includes('진행 중인 대여가 없습니다')) {
        // 이미 자동으로 퇴장 처리된 경우 (TIME_EXCEEDED)
        console.log('✅ 이미 퇴장 처리됨 (시간 초과로 자동 퇴장)');
        setHasExited(true);
      } else {
        console.log('❌ 퇴장 실패:', exitResponse);
        Alert.alert('오류', exitResponse.message || '퇴장 처리에 실패했습니다.');
      }
    } catch (error) {
      console.error('💥 퇴장 오류:', error);
      Alert.alert('오류', '퇴장 처리 중 오류가 발생했습니다.');
    }
  };

  const handleGoHome = () => {
    setScreenState('scanning');
    setScanned(false);
    setTimeLeft(totalTime);
    setPlaceName('');
    setRentalId(null);
    setPlaceId(null);
    setHasExited(false);
    navigation.navigate('Home' as never);
  };

  // 타이머 시작 시 애니메이션 초기화
  useEffect(() => {
    if (screenState === 'timer') {
      progress.value = 0; // 프로그레스 바 초기화
    }
  }, [screenState, progress]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    // 중복 스캔 방지 - 상태와 데이터 모두 체크
    if (scanned || isProcessing || data === lastScannedData) {
      console.log('🚫 중복 스캔 방지:', { scanned, isProcessing, sameData: data === lastScannedData });
      return;
    }

    console.log('✅ QR 스캔 시작');
    setScanned(true);
    setIsProcessing(true);
    setLastScannedData(data);

    if (!accessToken) {
      Alert.alert('로그인 필요', '쉼터를 이용하려면 로그인이 필요합니다.');
      return;
    }

    try {
      console.log('🔍 QR 코드 스캔 데이터:', data);
      console.log('🔍 QR 코드 스캔 데이터 타입:', typeof data);
      console.log('🔍 QR 코드 스캔 데이터 길이:', data.length);

      // QR 코드에서 URL 추출
      let qrUrl = data.trim();

      // QR 코드가 JSON 형태인 경우 처리
      try {
        const qrData = JSON.parse(data);
        if (qrData.url || qrData.placeCode) {
          qrUrl = qrData.url || qrData.placeCode;
          console.log('📱 JSON에서 URL 추출:', qrUrl);
        }
      } catch {
        // JSON이 아닌 경우 무시
      }

      // QR 코드에서 placeCode 추출
      let placeCode = '';

      // URL에서 c 파라미터 추출
      if (qrUrl.includes('/api/enter-code')) {
        try {
          const url = new URL(qrUrl);
          placeCode = url.searchParams.get('c') || '';
        } catch (error) {
          console.log('❌ URL 파싱 실패:', error);
        }
      } else {
        // URL이 아닌 경우 직접 placeCode로 사용
        placeCode = qrUrl;
      }

      if (!placeCode) {
        Alert.alert('잘못된 QR 코드', 'place code를 찾을 수 없습니다.');
        setScanned(false);
        return;
      }

      console.log('📡 쉼터 입장 API 호출 중...', {
        placeCode,
        accessToken: accessToken ? '토큰 있음' : '토큰 없음'
      });

      // 현재 이용 중인지 확인 - 일반 유저는 이 체크 스킵 (제공자가 아닙니다 에러 방지)
      // 입장 시도하면 백엔드에서 중복 체크할 것

      // rental/enter API로 입장 처리
      const enterResponse = await ApiService.enterPlace(accessToken, placeCode);

      if (enterResponse.success && enterResponse.data) {
        console.log('✅ 쉼터 입장 완료:', enterResponse.data);

        // 성공 시 응답 데이터 저장
        setPlaceName(enterResponse.data.placeName);
        setRentalId(enterResponse.data.rentalId);
        setPlaceId(enterResponse.data.placeId);

        // 타이머 화면으로 이동 - maxTime 사용 (초 단위)
        const maxTimeSeconds = enterResponse.data.maxTime * 60; // 분을 초로 변환
        setScreenState('timer');
        setTimeLeft(maxTimeSeconds);
        setTotalTime(maxTimeSeconds);

        console.log('🏢 입장 완료:', enterResponse.data.placeName, 'placeId:', enterResponse.data.placeId, 'maxTime:', enterResponse.data.maxTime, '분');
      } else {
        // "이미 진행 중인 대여" 에러는 무시 (중복 스캔으로 인한 것)
        if (!enterResponse.message?.includes('이미 진행 중인 대여')) {
          console.log('❌ 쉼터 입장 실패:', {
            success: enterResponse.success,
            code: enterResponse.code,
            message: enterResponse.message,
            data: enterResponse.data
          });

          // 영업중이 아닌 경우 친절한 안내 메시지
          if (enterResponse.message?.includes('영업') || enterResponse.message?.includes('운영') || enterResponse.message?.includes('시간')) {
            Alert.alert(
              '영업시간이 아닙니다',
              '현재 이 쉼터는 영업중이 아닙니다.\n영업시간을 확인해주세요.'
            );
          } else {
            Alert.alert(
              '입장 실패',
              enterResponse.message || '쉼터 입장에 실패했습니다.'
            );
          }
        }
        setScanned(false);
        setIsProcessing(false);
        setLastScannedData(''); // 데이터 초기화
      }
    } catch (error: any) {
      console.error('💥 쉼터 입장 오류:', error);
      console.error('💥 에러 메시지:', error.message);
      console.error('💥 에러 스택:', error.stack);

      Alert.alert(
        '오류',
        `네트워크 오류: ${error.message}\n쉼터 입장 중 오류가 발생했습니다.`
      );
      setScanned(false);
      setIsProcessing(false);
      setLastScannedData(''); // 데이터 초기화
    } finally {
      // 성공/실패 여부와 관계없이 3초 후 다시 스캔 가능
      setTimeout(() => {
        setIsProcessing(false);
        setLastScannedData(''); // 3초 후 데이터 초기화
      }, 3000);
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
      // 화면 포커스 시 - 타이머가 진행 중이 아닐 때만 초기화
      if (screenState === 'scanning') {
        setCameraEnabled(true);
      }
      // StatusBar 재설정
      setStatusBarKey(prev => prev + 1);

      return () => {
        // 화면을 떠날 때 카메라만 비활성화 (상태는 유지)
        setCameraEnabled(false);
      };
    }, [screenState])
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
        const elapsedFraction = Math.min((totalTime - timeLeft) / totalTime, 1);
        const strokeLength = elapsedFraction * FULL_DASH_ARRAY;
        const dashArray = `${strokeLength.toFixed(1)} ${FULL_DASH_ARRAY}`;

        return (
          <View style={styles.timerScreenContainer}>
            <View style={styles.timerContainer}>
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
                    stroke={hasExited ? Colors.success : Colors.primary}
                    strokeWidth="15"
                    fill="transparent"
                    strokeDasharray={dashArray}
                    strokeLinecap="round"
                    transform="rotate(-90 100 100)"
                  />
                </Svg>

                {/* 중앙 내용 */}
                <View style={styles.timerCenter}>
                  {hasExited ? (
                    <>
                      <Ionicons name="checkmark-circle" size={70} color={Colors.success} />
                      <Text style={styles.timerCompletedText}>쉼표에서, 마침표로.</Text>
                    </>
                  ) : (
                    <Text style={styles.timerTextLarge}>{formatTime()}</Text>
                  )}
                </View>
              </View>

              {!hasExited && (
                <>
                  <Text style={styles.timerPlaceName}>{placeName || '쉼터'}</Text>
                  <Text style={styles.timerDescription}>
                    최대 {Math.floor(totalTime / 60)}분 이용 가능합니다.
                  </Text>
                </>
              )}

              {hasExited && (
                <Text style={styles.timerDescription}>
                  감사 편지를 남기고 싶으시다면 아래 버튼을 눌러주세요
                </Text>
              )}
            </View>

            {/* 하단 고정 버튼들 */}
            <View style={styles.fixedBottomButtons}>
              {hasExited ? (
                <>
                  <TouchableOpacity style={styles.homeButton} onPress={handleGoHome}>
                    <Text style={styles.buttonText}>홈으로</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.letterButton} onPress={() => setLetterModalVisible(true)}>
                    <Text style={styles.buttonText}>감사 편지 적기</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={styles.exitButton} onPress={handleExit}>
                  <Text style={styles.buttonText}>퇴장하기</Text>
                </TouchableOpacity>
              )}
            </View>
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

  const handleSendLetter = async () => {
    if (!accessToken) {
      Alert.alert('오류', '로그인이 필요합니다.');
      return;
    }

    if (!letterText.trim()) {
      Alert.alert('알림', '편지 내용을 입력해주세요.');
      return;
    }

    if (!rentalId || !placeId) {
      Alert.alert('오류', '장소 정보를 찾을 수 없습니다.');
      return;
    }

    setIsSendingLetter(true);

    try {
      console.log('✉️ 편지 보내기:', { rentalId, placeId, content: letterText.trim() });

      const response = await ApiService.sendLetter(accessToken, rentalId, letterText.trim(), placeId);

      if (response.success && response.data) {
        console.log('✅ 편지 전송 성공:', response.data);

        // AsyncStorage에 편지 전송 기록 저장
        try {
          const stored = await AsyncStorage.getItem('sentLetters');
          const sentLetters = stored ? JSON.parse(stored) : [];
          const updatedSet = new Set(sentLetters).add(rentalId);
          await AsyncStorage.setItem('sentLetters', JSON.stringify(Array.from(updatedSet)));

          const statusStored = await AsyncStorage.getItem('letterStatus');
          const letterStatus = statusStored ? JSON.parse(statusStored) : {};
          letterStatus[rentalId] = {
            letterId: response.data.id,
            read: response.data.read || false,
            content: letterText.trim()
          };
          await AsyncStorage.setItem('letterStatus', JSON.stringify(letterStatus));
          console.log('💾 편지 전송 기록 저장 완료:', rentalId);
        } catch (error) {
          console.error('💥 편지 전송 기록 저장 오류:', error);
        }

        Alert.alert('전송 완료', `${placeName} 사장님에게 감사 편지를 전송했습니다.`);
        setLetterText('');
        setLetterModalVisible(false);
      } else {
        console.log('❌ 편지 전송 실패:', response.message);
        Alert.alert('전송 실패', response.message || '편지 전송에 실패했습니다.');
      }
    } catch (error) {
      console.error('💥 편지 보내기 오류:', error);
      Alert.alert('오류', '편지 전송 중 오류가 발생했습니다.');
    } finally {
      setIsSendingLetter(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar key={statusBarKey} style={statusBarStyle as any} />
      <View style={styles.content}>{renderContent()}</View>

      {/* 편지 작성 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isLetterModalVisible}
        onRequestClose={() => setLetterModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>감사 편지 작성</Text>
            <Text style={styles.modalRecipient}>To. {placeName} 사장님</Text>
            <TextInput
              style={styles.textInput}
              value={letterText}
              onChangeText={setLetterText}
              placeholder="감사한 마음을 담아 편지를 작성해보세요..."
              placeholderTextColor={Colors.text.light}
              multiline
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setLetterModalVisible(false);
                  setLetterText('');
                }}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.sendButton,
                  (isSendingLetter || !letterText.trim()) && styles.disabledButton,
                ]}
                onPress={handleSendLetter}
                disabled={isSendingLetter || !letterText.trim()}
              >
                {isSendingLetter ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.sendButtonText}>전송</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  timerPlaceName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    textAlign: 'center',
    marginTop: 15,
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
  exitButton: {
    backgroundColor: '#FF6B6B',
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'stretch',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: Colors.text.primary,
  },
  modalRecipient: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 15,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    height: 150,
    textAlignVertical: 'top',
    marginBottom: 20,
    color: Colors.text.primary,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    borderRadius: 8,
    padding: 15,
    flex: 1,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.surface,
    marginRight: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  sendButton: {
    backgroundColor: Colors.primary,
  },
  sendButtonText: {
    color: Colors.text.white,
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default QRScreen;
