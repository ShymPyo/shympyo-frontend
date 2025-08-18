import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';

const MapScreen: React.FC = () => {
  const kakaoMapHtmlUri = Asset.fromModule(require('../../assets/kakao_map.html')).uri;

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ uri: kakaoMapHtmlUri }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});

export default MapScreen;
