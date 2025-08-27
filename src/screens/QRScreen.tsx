import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Button,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Svg, { Defs, Mask, Rect } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';

import { Colors } from '../constants/colors';


type ScreenState = 'scanning' | 'timer' | 'finished';

const QRScreen: React.FC = () => {
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [screenState, setScreenState] = useState<ScreenState>('scanning');
  const [timeLeft, setTimeLeft] = useState(20 * 60); // 20 minutes in seconds

  useEffect(() => {
    if (screenState !== 'timer') return;

    if (timeLeft === 0) {
      setScreenState('finished');
      return;
    }

    const intervalId = setInterval(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [screenState, timeLeft]);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setScanned(true);
    // QR 코드 스캔 성공 시 타이머 화면으로 이동
    setScreenState('timer');
    setTimeLeft(20 * 60); // 20분으로 초기화
  };

  const formatTime = () => {
    const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const seconds = (timeLeft % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

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
            <CameraView
              style={styles.scanner}
              facing="back"
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ["qr", "pdf417"],
              }}
            />
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
        return (
          <View style={styles.timerContainer}>
            <Ionicons name="timer-outline" size={100} color={Colors.primary} />
            <Text style={styles.timerText}>{formatTime()}</Text>
            <Text style={styles.timerSubtitle}>카페 빈스</Text>
          </View>
        );
      case 'finished':
        return (
          <View style={styles.finishedContainer}>
            <Ionicons name="checkmark-circle-outline" size={100} color={Colors.success} />
            <Text style={styles.finishedTitle}>시간이 다 되었습니다!</Text>
            <Text style={styles.finishedSubtitle}>카페 빈스</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.homeButton} onPress={() => navigation.navigate('Home')}>
                <Text style={styles.buttonText}>홈으로</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.letterButton} onPress={() => navigation.navigate('Letter')}>
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
  timerContainer: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginVertical: 20,
  },
  timerSubtitle: {
    fontSize: 24,
    color: Colors.text.secondary,
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
});

export default QRScreen;
