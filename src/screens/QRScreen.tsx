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
// import { BarCodeScanner } from 'expo-barcode-scanner';
import { useNavigation } from '@react-navigation/native';

import { Colors } from '../constants/colors';


type ScreenState = 'scanning' | 'timer' | 'finished';

const QRScreen: React.FC = () => {
  const navigation = useNavigation();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [screenState, setScreenState] = useState<ScreenState>('scanning');
  const [timeLeft, setTimeLeft] = useState(20 * 60); // 20 minutes in seconds

  /*
  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getBarCodeScannerPermissions();
  }, []);
  */

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

  /*
  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    alert(`QR 코드를 스캔했습니다!\n장소: ${data}`);
    setScreenState('timer');
  };
  */

  const formatTime = () => {
    const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const seconds = (timeLeft % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const renderContent = () => {
    switch (screenState) {
      case 'scanning':
        if (hasPermission === null) {
          return <Text style={styles.infoText}>카메라 권한을 요청하는 중입니다...</Text>;
        }
        if (hasPermission === false) {
          return <Text style={styles.infoText}>카메라 접근 권한이 없습니다.</Text>;
        }
        return (
          <View style={styles.scannerContainer}>
            <Text style={styles.infoText}>QR Code Scanner is temporarily disabled.</Text>
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
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>쉼표</Text>
        <Text style={styles.subtitle}>더위 쉼표, 시원한 휴식처</Text>
      </View>
      <View style={styles.content}>{renderContent()}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 4,
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
  },
  scannerOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.6)',
  },
  overlayTitle: {
      fontSize: 18,
      color: 'white',
      textAlign: 'center',
      marginBottom: 20,
  },
  scannerBox: {
      width: 250,
      height: 250,
      borderWidth: 2,
      borderColor: 'white',
      borderRadius: 10,
  },
  overlaySubtitle: {
      fontSize: 14,
      color: 'white',
      textAlign: 'center',
      marginTop: 20,
      paddingHorizontal: 40,
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
});

export default QRScreen;
