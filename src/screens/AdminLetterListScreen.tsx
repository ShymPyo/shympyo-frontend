import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { Colors } from '../constants/colors';
import { RootStackParamList } from '../types';
import ApiService, { ReceivedLetter, LetterCount } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

type AdminLetterListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AdminLetterList'>;

const AdminLetterListScreen: React.FC = () => {
  const navigation = useNavigation<AdminLetterListScreenNavigationProp>();
  const { accessToken } = useAuth();

  const [selectedLetter, setSelectedLetter] = useState<ReceivedLetter | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [letters, setLetters] = useState<ReceivedLetter[]>([]);
  const [letterCount, setLetterCount] = useState<LetterCount>({ total: 0, unRead: 0, read: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [hasNext, setHasNext] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    loadLetters();
  }, []);

  const loadLetters = async (loadMore: boolean = false) => {
    if (!accessToken) return;

    try {
      if (!loadMore) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      let cursorCreatedAt: string | undefined;
      let cursorId: number | undefined;

      if (loadMore && letters.length > 0) {
        const lastLetter = letters[letters.length - 1];
        cursorCreatedAt = lastLetter.createdAt;
        cursorId = lastLetter.id;
      }

      // 편지 목록 조회 (커서 페이징)
      const lettersResponse = await ApiService.getReceivedLetters(accessToken, 10, cursorCreatedAt, cursorId);
      if (lettersResponse.success && lettersResponse.data) {
        console.log('📬 받은 편지 목록:', JSON.stringify(lettersResponse.data, null, 2));

        if (loadMore) {
          setLetters([...letters, ...lettersResponse.data.content]);
        } else {
          setLetters(lettersResponse.data.content);
        }

        setHasNext(lettersResponse.data.hasNext);
      }

      // 편지 개수 조회 (첫 로드일 때만)
      if (!loadMore) {
        const countResponse = await ApiService.getLetterCount(accessToken);
        if (countResponse.success && countResponse.data) {
          setLetterCount(countResponse.data);
        }
      }
    } catch (error) {
      console.error('편지 로드 오류:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (hasNext && !isLoadingMore) {
      loadLetters(true);
    }
  };

  const unreadCount = letterCount.unRead;

  // 검색 필터링된 편지 목록
  const filteredLetters = letters.filter(letter =>
    letter.writerInfo.nickname.toLowerCase().includes(searchText.toLowerCase())  // name → nickname 변경
  );

  const handleLetterPress = async (letter: ReceivedLetter) => {
    if (!accessToken) return;

    // 편지 상세 조회
    try {
      const detailResponse = await ApiService.getLetterDetail(letter.letterId, accessToken);
      if (detailResponse.success && detailResponse.data) {
        // 상세 정보를 포함한 편지 객체 생성
        const letterWithDetail = {
          ...letter,
          content: detailResponse.data.content,
        };
        setSelectedLetter(letterWithDetail as any);
        setModalVisible(true);
      }
    } catch (error) {
      console.error('편지 상세 조회 오류:', error);
    }
  };

  // 모달 닫을 때 읽음 처리
  const handleCloseModal = async () => {
    setModalVisible(false);

    // 읽지 않은 편지였으면 읽음 처리 (목록에서 현재 상태 확인)
    if (selectedLetter && accessToken) {
      const currentLetter = letters.find(l => l.letterId === selectedLetter.letterId);

      // 목록에서 아직 읽지 않은 상태인 경우만 처리
      if (currentLetter && !currentLetter.read) {
        // UI 먼저 업데이트 (즉시 반영)
        setLetters(prev => prev.map(l =>
          l.letterId === selectedLetter.letterId ? { ...l, read: true } : l
        ));

        // 카운트 업데이트
        setLetterCount(prev => ({
          ...prev,
          unRead: Math.max(0, prev.unRead - 1),
          read: prev.read + 1
        }));

        // 백엔드에 읽음 처리 요청
        try {
          const readResponse = await ApiService.markLetterAsRead(selectedLetter.letterId, accessToken);
          if (readResponse.success) {
            console.log('✅ 편지 읽음 처리 완료:', selectedLetter.letterId);
          } else {
            // 실패 시 롤백 (이미 읽음 에러는 무시)
            if (!readResponse.message?.includes('이미 읽은')) {
              console.error('❌ 편지 읽음 처리 실패:', readResponse.message);
              setLetters(prev => prev.map(l =>
                l.letterId === selectedLetter.letterId ? { ...l, read: false } : l
              ));
              setLetterCount(prev => ({
                ...prev,
                unRead: prev.unRead + 1,
                read: Math.max(0, prev.read - 1)
              }));
            }
          }
        } catch (error) {
          console.error('편지 읽음 처리 오류:', error);
        }
      }
    }

    setSelectedLetter(null);
  };

  const renderLetter = (letter: ReceivedLetter) => (
    <TouchableOpacity
      key={letter.letterId}
      style={styles.letterCard}
      onPress={() => handleLetterPress(letter)}
    >
      <View style={styles.letterContent}>
        <View style={styles.letterHeader}>
          <Text style={styles.letterDate}>{new Date(letter.createdAt).toLocaleString('ko-KR')}</Text>
          {!letter.read && <View style={styles.unreadIndicator} />}
        </View>
        <View style={styles.letterMain}>
          <View style={styles.profileCircle}>
            <Text style={styles.profileText}>😊</Text>
          </View>
          <View style={styles.letterTextContainer}>
            <Text style={styles.customerName}>{letter.writerInfo.nickname}</Text>
            {letter.writerInfo.bio && (
              <Text style={styles.letterBio} numberOfLines={1}>{letter.writerInfo.bio}</Text>
            )}
          </View>
          <Ionicons
            name={letter.read ? "mail-open" : "mail"}
            size={24}
            color={letter.read ? Colors.text.light : Colors.primary}
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>편지함</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* 검색창 */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={Colors.text.light} />
          <TextInput
            style={styles.searchInput}
            placeholder="사용자 닉네임으로 검색..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor={Colors.text.light}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={20} color={Colors.text.light} />
            </TouchableOpacity>
          )}
        </View>
      </View>


      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 100;
            if (isCloseToBottom && hasNext && !isLoadingMore) {
              loadMore();
            }
          }}
          scrollEventThrottle={400}
        >
          {/* 편지함 정보 */}
          <View style={styles.letterInfo}>
            <View style={styles.letterCount}>
              <Ionicons name="mail" size={20} color={Colors.primary} />
              <Text style={styles.countText}>지금까지 총 {letterCount.total}개의 감사 편지를 받았어요 !</Text>
            </View>
            {unreadCount > 0 && (
              <View style={styles.unreadCount}>
                <Ionicons name="alert-circle" size={16} color={Colors.primary} />
                <Text style={styles.unreadCountText}>새로운 편지가 {unreadCount}개 도착했습니다.</Text>
              </View>
            )}
          </View>

          {/* 편지 리스트 */}
          <View style={styles.letterList}>
            {filteredLetters.length > 0 ? (
              <>
                {filteredLetters.map(renderLetter)}
                {isLoadingMore && (
                  <View style={styles.loadingMore}>
                    <ActivityIndicator size="small" color={Colors.primary} />
                  </View>
                )}
              </>
            ) : searchText.length > 0 ? (
              <View style={styles.noResultsContainer}>
                <Ionicons name="search" size={48} color={Colors.text.light} />
                <Text style={styles.noResultsText}>'{searchText}'에 대한 검색 결과가 없습니다.</Text>
                <Text style={styles.noResultsSubtext}>다른 닉네임으로 검색해보세요.</Text>
              </View>
            ) : (
              <View style={styles.noResultsContainer}>
                <Ionicons name="mail-outline" size={48} color={Colors.text.light} />
                <Text style={styles.noResultsText}>아직 받은 편지가 없습니다.</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* 편지 상세 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={handleCloseModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleCloseModal}
        >
          <TouchableOpacity
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleCloseModal}>
                <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{selectedLetter?.writerInfo.nickname} 님의 감사 편지</Text>
              <View style={{ width: 24 }} />
            </View>

            <Text style={styles.modalDate}>
              {selectedLetter?.createdAt ? new Date(selectedLetter.createdAt).toLocaleString('ko-KR') : ''} 발송
            </Text>

            <View style={styles.modalLetterContent}>
              <View style={styles.modalProfile}>
                <Text style={styles.modalProfileText}>😊</Text>
              </View>
              <View style={styles.modalTextSection}>
                
                <Text style={styles.modalName}>{selectedLetter?.writerInfo.nickname}</Text>
                {selectedLetter?.writerInfo.bio && (
                  <Text style={styles.modalBio}>{selectedLetter.writerInfo.bio}</Text>
                )}
              </View>
            </View>

            <View style={styles.modalLetterSection}>
              <Text style={styles.modalLabel}>편지 내용</Text>
              <Text style={styles.modalLetterText}>
                {selectedLetter?.content}
              </Text>
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
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
    marginLeft: 10,
    marginRight: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  letterInfo: {
    paddingVertical: 20,
  },
  letterCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    marginBottom: 10,
  },
  countText: {
    fontSize: 14,
    color: Colors.text.primary,
    marginLeft: 10,
    fontWeight: '500',
  },
  unreadCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadCountText: {
    fontSize: 14,
    color: Colors.primary,
    marginLeft: 5,
    fontWeight: '600',
  },
  letterList: {
    paddingBottom: 20,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  noResultsText: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginTop: 15,
    textAlign: 'center',
  },
  noResultsSubtext: {
    fontSize: 14,
    color: Colors.text.light,
    marginTop: 5,
    textAlign: 'center',
  },
  letterCard: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    marginBottom: 10,
  },
  letterContent: {
    padding: 15,
  },
  letterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  letterDate: {
    fontSize: 12,
    color: Colors.text.light,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  letterMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE4B5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileText: {
    fontSize: 20,
  },
  letterTextContainer: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 3,
  },
  letterPreview: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  letterBio: {
    fontSize: 12,
    color: Colors.text.light,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  modalDate: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalLetterContent: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-end',
  },
  modalProfile: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFE4B5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  modalProfileText: {
    fontSize: 36,
  },
  modalTextSection: {
    flex: 1,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.light,
    marginBottom: 5,
  },
  modalText: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  modalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 5,
  },
  modalBio: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  modalLetterSection: {
    marginTop: 10,
  },
  modalLetterText: {
    fontSize: 16,
    color: Colors.text.primary,
    backgroundColor: Colors.surface,
    padding: 15,
    borderRadius: 8,
    lineHeight: 24,
  },
  modalSubText: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default AdminLetterListScreen;