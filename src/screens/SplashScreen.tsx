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
      <StatusBar style="dark" />
      
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/shympyo_logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.copyright}>© 2025. All rights reserved.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 180,
    height: 108,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
    textAlign: 'center',
  },
  footer: {
    paddingBottom: 50,
    alignItems: 'center',
  },
  copyright: {
    fontSize: 12,
    color: Colors.text.light,
    textAlign: 'center',
  },
});

export default SplashScreen;