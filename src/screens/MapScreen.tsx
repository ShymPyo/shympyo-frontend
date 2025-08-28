import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';
import { Ionicons } from '@expo/vector-icons';

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
      {/* 핀 카테고리 */}
      <View style={styles.categoryContainer}>
        <View style={styles.categoryItem}>
          <View style={[styles.categoryPin, { backgroundColor: '#7B7BF7' }]}>
            <Ionicons name="medical" size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.categoryText}>쉘터</Text>
        </View>
        <View style={styles.categoryItem}>
          <View style={[styles.categoryPin, { backgroundColor: '#A5A5E8' }]}>
            <Ionicons name="business" size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.categoryText}>민간</Text>
        </View>
        <View style={styles.categoryItem}>
          <View style={[styles.categoryPin, { backgroundColor: '#4A90E2' }]}>
            <Ionicons name="car" size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.categoryText}>교통</Text>
        </View>
        <View style={styles.categoryItem}>
          <View style={[styles.categoryPin, { backgroundColor: '#8A8A8A' }]}>
            <Ionicons name="library" size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.categoryText}>공공</Text>
        </View>
      </View>
      
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
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  categoryItem: {
    alignItems: 'center',
  },
  categoryPin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
});

export default MapScreen;
