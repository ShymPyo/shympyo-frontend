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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
import ApiService, { VisitedPlace, VisitedPlacesResponse } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useThemedStyles } from '../hooks/useThemedStyles';


const LetterScreen: React.FC = () => {
  const navigation = useNavigation();
  const { accessToken } = useAuth();
  const { colors, getFontSize, statusBarStyle } = useThemedStyles();

  const [places, setPlaces] = useState<VisitedPlace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<{ placeId: number; placeName: string; rentalId: number } | null>(null);
  const [letterText, setLetterText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sentLetters, setSentLetters] = useState<Set<number>>(new Set());
  const [letterStatus, setLetterStatus] = useState<Map<number, { letterId: number; read: boolean; content?: string }>>(new Map());
  const [selectedLetterDetail, setSelectedLetterDetail] = useState<{ placeName: string; content: string; read: boolean; sentAt: string } | null>(null);
  const [isDetailModalVisible, setDetailModalVisible] = useState(false);
  const [statusBarKey, setStatusBarKey] = useState(0);

  // 화면 포커스 시 StatusBar 재설정
  useFocusEffect(
    React.useCallback(() => {
      setStatusBarKey(prev => prev + 1);
    }, [])
  );

  // AsyncStorage에서 보낸 편지 목록 및 상태 불러오기
  useEffect(() => {
    const loadSentLetters = async () => {
      try {
        const stored = await AsyncStorage.getItem('sentLetters');
        if (stored) {
          const parsed = JSON.parse(stored);
          setSentLetters(new Set(parsed));
          console.log('📋 저장된 편지 전송 기록 로드:', parsed);
        }

        const statusStored = await AsyncStorage.getItem('letterStatus');
        if (statusStored) {
          const parsed = JSON.parse(statusStored);
          setLetterStatus(new Map(Object.entries(parsed).map(([k, v]: [string, any]) => [Number(k), v])));
          console.log('📋 저장된 편지 상태 로드:', parsed);
        }
      } catch (error) {
        console.error('💥 편지 전송 기록 로드 오류:', error);
      }
    };

    loadSentLetters();
  }, []);

  // 방문한 장소 목록 가져오기
  const fetchVisitedPlaces = async (loadMore: boolean = false) => {
    if (!accessToken) {
      console.log('❌ 로그인되지 않음');
      setIsLoading(false);
      return;
    }

    try {
      if (!loadMore) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      console.log('📋 방문한 장소 목록 가져오기...');

      let cursorEndTime: string | undefined;
      let cursorId: number | undefined;

      if (loadMore && places.length > 0) {
        const lastPlace = places[places.length - 1];
        cursorEndTime = lastPlace.endTime;
        cursorId = lastPlace.rentalId;
      }

      const response = await ApiService.getVisitedPlaces(accessToken, 10, cursorEndTime, cursorId);

      if (response.success && response.data) {
        console.log('✅ 방문한 장소 목록 가져오기 성공:', response.data);

        if (loadMore) {
          setPlaces([...places, ...response.data.content]);
        } else {
          setPlaces(response.data.content);
        }

        setHasNext(response.data.hasNext);
      } else {
        console.log('❌ 방문한 장소 목록 가져오기 실패:', response.message);
        if (!loadMore) {
          setPlaces([]);
        }
      }
    } catch (error: any) {
      console.error('💥 방문한 장소 목록 오류:', error);
      Alert.alert('오류', '방문한 장소 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
      setIsLoadingMore(false);
    }
  };

  // 새로고침
  const onRefresh = () => {
    setRefreshing(true);
    fetchVisitedPlaces(false);
  };

  // 더 불러오기
  const loadMore = () => {
    if (hasNext && !isLoadingMore) {
      fetchVisitedPlaces(true);
    }
  };

  // 편지 작성하기
  const handleWriteLetter = (place: { placeId: number; placeName: string; rentalId: number }) => {
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
        selectedPlace.rentalId,
        letterText.trim(),
        selectedPlace.placeId  // placeId도 함께 전달
      );

      if (response.success && response.data) {
        console.log('✅ 편지 보내기 성공:', response.data);

        // 편지 전송 성공 시 해당 rental을 전송 완료 처리
        const updatedSet = new Set(sentLetters).add(selectedPlace.rentalId);
        setSentLetters(updatedSet);

        // 편지 상태 저장 (letterId, 읽음 여부, 내용)
        const updatedStatus = new Map(letterStatus);
        updatedStatus.set(selectedPlace.rentalId, {
          letterId: response.data.id,
          read: response.data.read,
          content: letterText.trim()
        });
        setLetterStatus(updatedStatus);

        // AsyncStorage에 저장
        try {
          await AsyncStorage.setItem('sentLetters', JSON.stringify(Array.from(updatedSet)));
          await AsyncStorage.setItem('letterStatus', JSON.stringify(Object.fromEntries(updatedStatus)));
          console.log('💾 편지 전송 기록 저장:', selectedPlace.rentalId, '편지 ID:', response.data.id);
        } catch (error) {
          console.error('💥 편지 전송 기록 저장 오류:', error);
        }

        Alert.alert(
          '전송 완료',
          `${selectedPlace.placeName} 사장님에게 감사 편지를 전송했습니다.`,
          [{ text: '확인' }]
        );
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

  // 화면 포커스 시 목록 새로고침 및 읽음 상태 확인
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      if (accessToken) {
        console.log('📋 편지 화면 포커스 - 목록 새로고침');

        // AsyncStorage에서 편지 전송 기록 다시 로드
        try {
          const stored = await AsyncStorage.getItem('sentLetters');
          if (stored) {
            const parsed = JSON.parse(stored);
            setSentLetters(new Set(parsed));
            console.log('📋 편지 전송 기록 재로드:', parsed);
          }

          const statusStored = await AsyncStorage.getItem('letterStatus');
          if (statusStored) {
            const parsed = JSON.parse(statusStored);
            setLetterStatus(new Map(Object.entries(parsed).map(([k, v]: [string, any]) => [Number(k), v])));
            console.log('📋 편지 상태 재로드:', parsed);
          }
        } catch (error) {
          console.error('💥 편지 전송 기록 재로드 오류:', error);
        }

        fetchVisitedPlaces(false);

        // 보낸 편지 읽음 상태 확인
        await checkLetterReadStatus();
      }
    });

    return unsubscribe;
  }, [navigation, accessToken]);

  // 보낸 편지의 읽음 상태 확인
  const checkLetterReadStatus = async () => {
    if (!accessToken || sentLetters.size === 0) return;

    try {
      console.log('📮 보낸 편지 읽음 상태 확인 시작...');

      // 보낸 편지함 API 호출
      const response = await ApiService.getSentLetters(accessToken);

      if (response.success && response.data) {
        console.log('✅ 보낸 편지 목록:', response.data);

        const updatedStatus = new Map(letterStatus);
        let hasChanges = false;

        // 보낸 편지 목록에서 읽음 상태 업데이트
        response.data.forEach(letter => {
          // letterId로 rentalId 찾기
          for (const [rentalId, status] of letterStatus.entries()) {
            if (status.letterId === letter.id) {
              // 읽음 상태가 변경된 경우만 업데이트
              if (status.read !== letter.read) {
                updatedStatus.set(rentalId, {
                  letterId: letter.id,
                  read: letter.read,
                  content: status.content // 기존 내용 유지
                });
                hasChanges = true;
                console.log(`✅ 편지 ${letter.id} 읽음 상태 업데이트: ${status.read} → ${letter.read}`);
              }
            }
          }
        });

        // 변경사항이 있으면 저장
        if (hasChanges) {
          setLetterStatus(updatedStatus);
          await AsyncStorage.setItem('letterStatus', JSON.stringify(Object.fromEntries(updatedStatus)));
          console.log('💾 편지 읽음 상태 저장 완료');
        }
      } else {
        console.log('⚠️ 보낸 편지함 API 응답:', response.message);
      }
    } catch (error: any) {
      // API가 없거나 에러 발생 시 무시 (백엔드 준비 안됨)
      console.log('⚠️ 보낸 편지함 API가 아직 준비되지 않았습니다. (에러 무시)');
    }
  };

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

  const handleLetterPress = (item: VisitedPlace) => {
    const status = letterStatus.get(item.rentalId);
    if (!status || !status.content) return;

    setSelectedLetterDetail({
      placeName: item.placeName,
      content: status.content,
      read: status.read,
      sentAt: item.endTime
    });
    setDetailModalVisible(true);
  };

  const renderItem = ({ item }: { item: VisitedPlace }) => {
    const isLetterSent = sentLetters.has(item.rentalId);
    const status = letterStatus.get(item.rentalId);
    const isLetterRead = status?.read || false;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => isLetterSent && handleLetterPress(item)}
        disabled={!isLetterSent}
      >
        <View style={styles.imagePlaceholder} />
        <View style={styles.cardBody}>
          <View style={styles.cardContent}>
            <Text style={[styles.date, { fontSize: getFontSize(12), color: colors.text.light }]}>
              {formatDate(item.endTime)}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.placeName, { fontSize: getFontSize(18), color: colors.text.primary, flexShrink: 1 }]} numberOfLines={1}>
                {item.placeName}
              </Text>
              
            </View>
          </View>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }, isLetterSent && [styles.sentButton, { backgroundColor: colors.surface, borderColor: colors.text.light + '40' }]]}
            onPress={(e) => {
              e.stopPropagation();
              if (!isLetterSent) {
                handleWriteLetter({
                  placeId: Number(item.placeId),
                  placeName: item.placeName,
                  rentalId: item.rentalId
                });
              }
            }}
            disabled={isLetterSent}
          >
            <Ionicons
              name={isLetterSent ? "checkmark" : "pencil"}
              size={20}
              color={isLetterSent ? Colors.text.secondary : Colors.text.white}
            />
            <Text style={[styles.buttonText, isLetterSent && styles.sentButtonText]}>
              {isLetterSent ? '전송 완료' : '고마운 마음 전하기'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar key={statusBarKey} style={statusBarStyle as any} />
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.surface }]}>
        <Text style={[styles.title, { fontSize: getFontSize(22), color: colors.text.primary }]}>나의 쉼표 기록</Text>
        <Text style={[styles.subtitle, { fontSize: getFontSize(14), color: colors.text.secondary }]}>한 줄의 편지가 쉼표의 따스함을 이어갑니다.</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { fontSize: getFontSize(16), color: colors.text.secondary }]}>방문한 장소를 불러오는 중...</Text>
        </View>
      ) : places.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="location-outline" size={80} color={colors.text.light} />
          <Text style={[styles.emptyTitle, { fontSize: getFontSize(20), color: colors.text.primary }]}>아직 방문한 쉼터가 없어요</Text>
          <Text style={[styles.emptySubtitle, { fontSize: getFontSize(14), color: colors.text.secondary }]}>
            QR 코드를 스캔해서 쉼터를 방문하고{'\n'}
            감사 편지를 작성해보세요!
          </Text>
        </View>
      ) : (
        <FlatList
          data={places}
          renderItem={renderItem}
          keyExtractor={(item) => item.rentalId.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null
          }
        />
      )}

      {/* 편지 작성 모달 */}
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
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <Text style={[styles.modalTitle, { fontSize: getFontSize(20), color: colors.text.primary }]}>감사 편지 작성</Text>
              <Text style={[styles.modalRecipient, { fontSize: getFontSize(16), color: colors.text.secondary }]}>To. {selectedPlace?.placeName} 사장님</Text>
              <TextInput
                style={[styles.textInput, { fontSize: getFontSize(14), color: colors.text.primary, backgroundColor: colors.background, borderColor: colors.text.light + '40' }]}
                value={letterText}
                onChangeText={setLetterText}
                placeholder="감사한 마음을 담아 편지를 작성해보세요..."
                placeholderTextColor={colors.text.light}
                multiline
              />
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.background }]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={[styles.cancelButtonText, { fontSize: getFontSize(16), color: colors.text.secondary }]}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.sendButton,
                    { backgroundColor: colors.primary },
                    (isSending || !letterText.trim()) && styles.disabledButton
                  ]}
                  onPress={handleSendLetter}
                  disabled={isSending || !letterText.trim()}
                >
                  {isSending ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={[styles.sendButtonText, { fontSize: getFontSize(16) }]}>전송</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      {/* 편지 상세 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isDetailModalVisible}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={() => setDetailModalVisible(false)}
        >
          <TouchableOpacity
            style={[styles.detailModalContent, { backgroundColor: colors.surface }]}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.detailModalHeader}>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
              <Text style={[styles.detailModalTitle, { fontSize: getFontSize(20), color: colors.text.primary }]}>보낸 편지</Text>
              <View style={{ width: 24 }} />
            </View>

            <View style={styles.detailModalInfo}>
              <Text style={[styles.detailModalLabel, { fontSize: getFontSize(12), color: colors.text.light }]}>받는 사람</Text>
              <Text style={[styles.detailModalText, { fontSize: getFontSize(16), color: colors.text.primary }]}>{selectedLetterDetail?.placeName} 사장님</Text>
            </View>

            <View style={styles.detailModalInfo}>
              <Text style={[styles.detailModalLabel, { fontSize: getFontSize(12), color: colors.text.light }]}>전송 일시</Text>
              <Text style={[styles.detailModalText, { fontSize: getFontSize(16), color: colors.text.primary }]}>
                {selectedLetterDetail?.sentAt ? formatDate(selectedLetterDetail.sentAt) : '-'}
              </Text>
            </View>

            <View style={styles.detailModalContentSection}>
              <Text style={[styles.detailModalLabel, { fontSize: getFontSize(12), color: colors.text.light }]}>편지 내용</Text>
              <View style={[styles.detailModalLetterBox, { backgroundColor: colors.background, borderColor: colors.text.light + '40' }]}>
                <Text style={[styles.detailModalLetterText, { fontSize: getFontSize(16), color: colors.text.primary }]}>
                  {selectedLetterDetail?.content}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
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
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 20,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 10,
    backgroundColor: '#E9E9E9',
    marginRight: 15,
  },
  cardBody: {
    flex: 1,
    justifyContent: 'space-between',
  },
  sentCard: {
    backgroundColor: '#F5F5F5',
    opacity: 0.8,
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

  sentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#E8E8E8',
    borderRadius: 12,
  },
  sentBadgeText: {
    fontSize: 12,
    color: Colors.text.light,
    marginLeft: 4,
    fontWeight: '600',
  },
  readBadgeText: {
    color: Colors.success,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
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
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  sentButtonText: {
    color: Colors.text.secondary,
  },
  detailModalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
  },
  detailModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  detailModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  detailModalInfo: {
    marginBottom: 15,
  },
  detailModalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.light,
    marginBottom: 5,
  },
  detailModalText: {
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  detailModalStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailModalStatusText: {
    fontSize: 16,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  detailModalReadText: {
    color: Colors.success,
  },
  detailModalContentSection: {
    marginTop: 10,
  },
  detailModalLetterBox: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    minHeight: 150,
  },
  detailModalLetterText: {
    fontSize: 16,
    color: Colors.text.primary,
    lineHeight: 24,
  },
});

export default LetterScreen;
