import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';

import { RootStackParamList } from '../types';
import { Colors } from '../constants/colors';

type SplashScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Splash'>;

const { width, height } = Dimensions.get('window');

const SplashScreen: React.FC = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../assets/shympyo_logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        
        <Text style={styles.subtitle}>더위 쉼표, 시원한 우선처</Text>
      </View>

      <View style={styles.illustrationContainer}>
        <View style={styles.illustration}>
          <View style={styles.person} />
          <View style={styles.fan} />
          <View style={styles.drink} />
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025. All rights reserved.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: height * 0.1,
  },
  logo: {
    width: 200,
    height: 120,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.white,
    textAlign: 'center',
  },
  illustrationContainer: {
    width: width * 0.8,
    height: height * 0.3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustration: {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  person: {
    width: 80,
    height: 100,
    backgroundColor: '#FFB6C1',
    borderRadius: 10,
    marginBottom: 20,
  },
  fan: {
    width: 40,
    height: 40,
    backgroundColor: '#87CEEB',
    borderRadius: 20,
    position: 'absolute',
    top: 20,
    right: 30,
  },
  drink: {
    width: 20,
    height: 30,
    backgroundColor: '#FFA500',
    borderRadius: 5,
    position: 'absolute',
    bottom: 30,
    left: 40,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
  },
  footerText: {
    fontSize: 12,
    color: Colors.text.white,
    opacity: 0.7,
  },
});

export default SplashScreen;