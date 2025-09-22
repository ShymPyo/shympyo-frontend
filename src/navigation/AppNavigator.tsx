import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList, MainTabParamList } from '../types';
import { Colors } from '../constants/colors';

import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import ProfileEditScreen from '../screens/ProfileEditScreen';
import HomeScreen from '../screens/HomeScreen';
import QRScreen from '../screens/QRScreen';
import LetterScreen from '../screens/LetterScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AdminLoginScreen from '../screens/AdminLoginScreen';
import AdminMainScreen from '../screens/AdminMainScreen';
import AdminSpaceEditScreen from '../screens/AdminSpaceEditScreen';
import AdminLetterListScreen from '../screens/AdminLetterListScreen';
import GeneralLoginScreen from '../screens/GeneralLoginScreen';
import SignUpScreen from '../screens/SignUpScreen';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'QR':
              iconName = focused ? 'qr-code' : 'qr-code-outline';
              break;
            case 'Letter':
              iconName = focused ? 'mail' : 'mail-outline';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.text.light,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopColor: '#E5E5E5',
          paddingTop: 10,
          paddingBottom: 25,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}>
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ tabBarLabel: '' }}
      />
      <Tab.Screen 
        name="QR" 
        component={QRScreen}
        options={{ tabBarLabel: '' }}
      />
      <Tab.Screen 
        name="Letter" 
        component={LetterScreen}
        options={{ tabBarLabel: '' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ tabBarLabel: '' }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
        }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
        <Stack.Screen name="Main" component={MainTabNavigator} />
        <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
        <Stack.Screen name="AdminMain" component={AdminMainScreen} />
        <Stack.Screen name="AdminSpaceEdit" component={AdminSpaceEditScreen} />
        <Stack.Screen 
          name="AdminLetterList" 
          component={AdminLetterListScreen}
          options={{
            gestureEnabled: true,
            gestureDirection: 'horizontal',
          }}
        />
        <Stack.Screen name="GeneralLogin" component={GeneralLoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;