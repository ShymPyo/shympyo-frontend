import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Keyboard,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';

// Shadow 스타일 헬퍼 함수
const getShadowStyle = (shadowConfig: {
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;
  elevation?: number;
}) => {
  if (Platform.OS === 'web') {
    const { shadowOffset, shadowOpacity, shadowRadius } = shadowConfig;
    const offsetX = shadowOffset?.width || 0;
    const offsetY = shadowOffset?.height || 0;
    const blur = shadowRadius || 0;
    const opacity = shadowOpacity || 0;
    return {
      boxShadow: `${offsetX}px ${offsetY}px ${blur}px rgba(0, 0, 0, ${opacity})`
    };
  }
  
  return shadowConfig;
};
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../constants/colors';
import ApiService, { VisitedPlace } from '../services/api';
import { useAuth } from '../contexts/AuthContext';


const LetterScreen: React.FC = () => {
  const { accessToken } = useAuth();
  const [places, setPlaces] = useState<VisitedPlace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<{ placeId: number; placeName: string } | null>(null);
  const [letterText, setLetterText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // 방문한 장소 목록 가져오기
  const fetchVisitedPlaces = async () => {
    if (!accessToken) {
      console.log('❌ 로그인되지 않음');
      setIsLoading(false);
      return;
    }

    try {
      console.log('📋 방문한 장소 목록 가져오기...');

      const response = await ApiService.getVisitedPlaces(accessToken);

      if (response.success) {
        console.log('✅ 방문한 장소 목록 가져오기 성공:', response.data);
        setPlaces(response.data);
      } else {
        console.log('❌ 방문한 장소 목록 가져오기 실패:', response.message);
        Alert.alert('오류', '방문한 장소 목록을 불러올 수 없습니다.');
      }
    } catch (error: any) {
      console.error('💥 방문한 장소 목록 오류:', error);
      Alert.alert('오류', '방문한 장소 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // 새로고침
  const onRefresh = () => {
    setRefreshing(true);
    fetchVisitedPlaces();
  };

  // 편지 작성하기
  const handleWriteLetter = (place: { placeId: number; placeName: string }) => {
    setSelectedPlace(place);
    setModalVisible(true);
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // 편지 보내기
  const handleSendLetter = async () => {
    if (!selectedPlace || !accessToken) return;

    if (!letterText.trim()) {
      Alert.alert('알림', '편지 내용을 입력해주세요.');
      return;
    }

    setIsSending(true);

    try {
      console.log('✉️ 편지 보내기...', {
        placeId: selectedPlace.placeId,
        content: letterText
      });

      const response = await ApiService.sendLetter(
        accessToken,
        selectedPlace.placeId,
        letterText.trim()
      );

      if (response.success) {
        console.log('✅ 편지 보내기 성공:', response.data);

        Alert.alert(
          '전송 완료',
          `${selectedPlace.placeName} 사장님에게 감사 편지를 전송했습니다.`,
          [{ text: '확인' }]
        );

        // 편지 전송 성공 시 목록 새로고침
        fetchVisitedPlaces();
      } else {
        console.log('❌ 편지 보내기 실패:', response.message);
        Alert.alert('전송 실패', response.message || '편지 전송에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('💥 편지 보내기 오류:', error);
      Alert.alert('오류', '편지 전송 중 오류가 발생했습니다.');
    } finally {
      setIsSending(false);
      setLetterText('');
      setModalVisible(false);
      setSelectedPlace(null);
    }
  };

  // 화면 로드 시 방문한 장소 목록 가져오기
  useEffect(() => {
    fetchVisitedPlaces();
  }, [accessToken]);

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}`;
  };

  const renderItem = ({ item }: { item: VisitedPlace }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.date}>{formatDate(item.visitDate)}</Text>
        <Text style={styles.placeName}>{item.placeName}</Text>
        <Text style={styles.rentalInfo}>렌탈 ID: {item.rentalId}</Text>
      </View>
      <TouchableOpacity
        style={styles.button}
        onPress={() => handleWriteLetter({
          placeId: item.placeId,
          placeName: item.placeName
        })}
      >
        <Ionicons
          name="pencil"
          size={20}
          color={Colors.text.white}
        />
        <Text style={styles.buttonText}>
          고마운 마음 전하기
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>나의 쉼표 기록</Text>
        <Text style={styles.subtitle}>한 줄의 편지가 쉼표의 따스함을 이어갑니다.</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>방문한 장소를 불러오는 중...</Text>
        </View>
      ) : places.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="location-outline" size={80} color={Colors.text.light} />
          <Text style={styles.emptyTitle}>아직 방문한 쉼터가 없어요</Text>
          <Text style={styles.emptySubtitle}>
            QR 코드를 스캔해서 쉼터를 방문하고{'\n'}
            감사 편지를 작성해보세요!
          </Text>
        </View>
      ) : (
        <FlatList
          data={places}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable onPress={dismissKeyboard} style={{ flex: 1 }}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
            keyboardVerticalOffset={-50}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>감사 편지 작성</Text>
              <Text style={styles.modalRecipient}>To. {selectedPlace?.placeName} 사장님</Text>
              <TextInput
                style={styles.textInput}
                value={letterText}
                onChangeText={setLetterText}
                placeholder="감사한 마음을 담아 편지를 작성해보세요..."
                multiline
              />
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.sendButton,
                    (isSending || !letterText.trim()) && styles.disabledButton
                  ]}
                  onPress={handleSendLetter}
                  disabled={isSending || !letterText.trim()}
                >
                  {isSending ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.sendButtonText}>전송</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  list: {
    padding: 20,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    ...getShadowStyle({
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    }),
  },
  cardContent: {
    marginBottom: 15,
  },
  date: {
    fontSize: 12,
    color: Colors.text.light,
    marginBottom: 5,
  },
  placeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  rentalInfo: {
    fontSize: 12,
    color: Colors.text.light,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
  },
  buttonText: {
    color: Colors.text.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  sentButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  sentButtonText: {
    color: Colors.text.secondary,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'stretch',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalRecipient: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 15,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    height: 150,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    borderRadius: 8,
    padding: 15,
    flex: 1,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.surface,
    marginRight: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  sendButton: {
    backgroundColor: Colors.primary,
  },
  sendButtonText: {
    color: Colors.text.white,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginTop: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default LetterScreen;
