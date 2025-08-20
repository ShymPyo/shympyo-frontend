import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

import { Colors } from '../constants/colors';

const HomeScreen: React.FC = () => {
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
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.mapContainer}>
        <WebView
          originWhitelist={['*']}
          source={{ html: mapHtml, baseUrl: '' }}
          style={styles.map}
        />
        <View style={styles.overlayTop}>
            <View style={styles.header}>
                <Text style={styles.temperature}>35°C</Text>
                <TouchableOpacity style={styles.listButton}>
                    <Ionicons name="list" size={24} color={Colors.text.primary} />
                </TouchableOpacity>
            </View>
        </View>
        <View style={styles.overlayBottom}>
            <TouchableOpacity style={styles.bottomCard}>
                <Text style={styles.bottomCardTitle}>가장 가까운 쉼터 !!</Text>
                <Text style={styles.bottomCardSubtitle}>카페빈스 (민간개방시설)</Text>
                <Ionicons name="chevron-forward" size={20} color={Colors.text.light} />
            </TouchableOpacity>
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
    mapContainer: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    overlayTop: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 5,
    },
    temperature: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text.primary,
    },
    listButton: {
        padding: 5,
    },
    overlayBottom: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
    },
    bottomCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 5,
    },
    bottomCardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
        flex: 1,
    },
    bottomCardSubtitle: {
        fontSize: 14,
        color: 'white',
        marginRight: 10,
    },
});

export default HomeScreen;