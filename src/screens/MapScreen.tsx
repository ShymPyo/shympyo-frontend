import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';

const MapScreen: React.FC = () => {
  const [htmlUri, setHtmlUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAsset = async () => {
      try {
        const asset = Asset.fromModule(require('../../assets/kakao_map.html'));
        await asset.downloadAsync();
        setHtmlUri(asset.localUri || asset.uri);
        setLoading(false);
      } catch (err) {
        setError('맵 파일을 불러오는데 실패했습니다.');
        setLoading(false);
      }
    };

    loadAsset();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text>맵 로딩 중...</Text>
      </View>
    );
  }

  if (error || !htmlUri) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>{error || '맵을 불러올 수 없습니다.'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ uri: htmlUri }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        mixedContentMode="compatibility"
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error: ', nativeEvent);
          setError('맵을 표시하는데 오류가 발생했습니다.');
        }}
        onLoadStart={() => console.log('WebView loading started')}
        onLoadEnd={() => console.log('WebView loading ended')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  webview: {
    flex: 1,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default MapScreen;
