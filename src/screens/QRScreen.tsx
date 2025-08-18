import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../constants/colors';

const QRScreen: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);

  const handleScanPress = () => {
    setIsScanning(true);
    // QR 스캔 시뮬레이션
    setTimeout(() => {
      setIsScanning(false);
      Alert.alert('스캔 완료', '쉼터에 체크인되었습니다!');
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.title}>QR 스캔</Text>
        <Text style={styles.subtitle}>쉼터의 QR 코드를 스캔해보세요</Text>
      </View>

      <View style={styles.scanContainer}>
        <View style={styles.scanFrame}>
          {isScanning ? (
            <View style={styles.scanningIndicator}>
              <Text style={styles.scanningText}>스캔 중...</Text>
            </View>
          ) : (
            <View style={styles.scanPlaceholder}>
              <Ionicons name="qr-code-outline" size={80} color={Colors.text.light} />
              <Text style={styles.placeholderText}>QR 코드를 여기에 맞춰주세요</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.scanButton, isScanning && styles.scanButtonDisabled]} 
          onPress={handleScanPress}
          disabled={isScanning}
        >
          <Ionicons name="scan" size={24} color={Colors.text.white} />
          <Text style={styles.scanButtonText}>
            {isScanning ? '스캔 중...' : 'QR 스캔 시작'}
          </Text>
        </TouchableOpacity>

        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Ionicons name="information-circle" size={20} color={Colors.primary} />
            <Text style={styles.infoText}>QR 코드 스캔으로 쉼터 이용이 가능합니다</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            <Text style={styles.infoText}>체크인 시 포인트가 적립됩니다</Text>
          </View>
        </View>
      </View>
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  scanContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  scanPlaceholder: {
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: Colors.text.light,
    textAlign: 'center',
    marginTop: 16,
  },
  scanningIndicator: {
    alignItems: 'center',
  },
  scanningText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  actions: {
    padding: 20,
  },
  scanButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  scanButtonDisabled: {
    opacity: 0.6,
  },
  scanButtonText: {
    color: Colors.text.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoContainer: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.secondary,
  },
});

export default QRScreen;