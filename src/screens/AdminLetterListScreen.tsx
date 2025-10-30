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
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '../types';
import ApiService, { ReceivedLetter, LetterCount, LetterDetail } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useThemedStyles } from '../hooks/useThemedStyles';

type AdminLetterListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AdminLetterList'>;

const AdminLetterListScreen: React.FC = () => {
  const navigation = useNavigation<AdminLetterListScreenNavigationProp>();
  const { accessToken } = useAuth();
  const { colors, getFontSize, statusBarStyle } = useThemedStyles();

  const [selectedLetter, setSelectedLetter] = useState<LetterDetail | null>(null);
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
        cursorId = lastLetter.letterId;
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
    letter.createdAt.startsWith(searchText)  // name → nickname 변경
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
        setSelectedLetter(letterWithDetail);
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

  };

  const renderLetter = (letter: ReceivedLetter) => (
    <TouchableOpacity
      key={letter.letterId}
      style={styles.letterCard}
      onPress={() => handleLetterPress(letter)}
    >
      <View style={styles.letterContent}>
        <View style={styles.letterHeader}>
          <Text style={[styles.letterDate, { fontSize: getFontSize(12), color: colors.text.light }]}>{new Date(letter.createdAt).toLocaleString('ko-KR')}</Text>
          {!letter.read && <View style={[styles.unreadIndicator, { backgroundColor: colors.primary }]} />}
        </View>
        <View style={styles.letterMain}>
          <View style={[styles.profileCircle, { backgroundColor: colors.surface }]}>
            <Image
              source={letter.writerInfo.imageUrl && letter.writerInfo.imageUrl.startsWith('http') ? { uri: letter.writerInfo.imageUrl } : require('../../assets/profiles/user_profile.png')}
              style={styles.profileImage}
            />
          </View>
          <View style={styles.letterTextContainer}>
            <Text style={[styles.customerName, { fontSize: getFontSize(16), color: colors.text.primary }]}>{letter.writerInfo.nickname}</Text>
            {letter.writerInfo.bio && (
              <Text style={[styles.letterBio, { fontSize: getFontSize(12), color: colors.text.light }]} numberOfLines={1}>{letter.writerInfo.bio}</Text>
            )}
          </View>
          <Ionicons
            name={letter.read ? "mail-open" : "mail"}
            size={24}
            color={letter.read ? colors.text.light : colors.primary}
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={statusBarStyle} />

      {/* 헤더 */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.surface }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontSize: getFontSize(18), color: colors.text.primary }]}>편지함</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* 검색창 */}
      <View style={[styles.searchContainer, { backgroundColor: colors.background, borderBottomColor: colors.surface }]}>
        <View style={[styles.searchInputContainer, { backgroundColor: colors.surface }]}>
          <Ionicons name="search" size={20} color={colors.text.light} />
          <TextInput
            style={[styles.searchInput, { fontSize: getFontSize(16), color: colors.text.primary }]}
            placeholder="날짜로 검색 (YYYY-MM-DD)..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor={colors.text.light}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={20} color={colors.text.light} />
            </TouchableOpacity>
          )}
        </View>
      </View>


      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
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
            <View style={[styles.letterCount, { backgroundColor: colors.surface, borderLeftColor: colors.primary }]}>
              <Ionicons name="mail" size={20} color={colors.primary} />
              <Text style={[styles.countText, { fontSize: getFontSize(14), color: colors.text.primary }]}>지금까지 총 {letterCount.total}개의 감사 편지를 받았어요 !</Text>
            </View>
            {unreadCount > 0 && (
              <View style={styles.unreadCount}>
                <Ionicons name="alert-circle" size={16} color={colors.primary} />
                <Text style={[styles.unreadCountText, { fontSize: getFontSize(14), color: colors.primary }]}>새로운 편지가 {unreadCount}개 도착했습니다.</Text>
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
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                )}
              </>
            ) : searchText.length > 0 ? (
              <View style={styles.noResultsContainer}>
                <Ionicons name="search" size={48} color={colors.text.light} />
                <Text style={[styles.noResultsText, { fontSize: getFontSize(16), color: colors.text.secondary }]}>'{searchText}'에 대한 검색 결과가 없습니다.</Text>
                <Text style={[styles.noResultsSubtext, { fontSize: getFontSize(14), color: colors.text.light }]}>다른 닉네임으로 검색해보세요.</Text>
              </View>
            ) : (
              <View style={styles.noResultsContainer}>
                <Ionicons name="mail-outline" size={48} color={colors.text.light} />
                <Text style={[styles.noResultsText, { fontSize: getFontSize(16), color: colors.text.secondary }]}>아직 받은 편지가 없습니다.</Text>
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
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleCloseModal}>
                <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { fontSize: getFontSize(18), color: colors.text.primary }]}>{selectedLetter?.writerInfo.nickname} 님의 감사 편지</Text>
              <View style={{ width: 24 }} />
            </View>

            <Text style={[styles.modalDate, { fontSize: getFontSize(14), color: colors.text.secondary }]}>
              {selectedLetter?.createdAt ? new Date(selectedLetter.createdAt).toLocaleString('ko-KR') : ''} 발송
            </Text>

            <View style={styles.modalLetterContent}>
              <View style={[styles.modalProfile, { backgroundColor: colors.background }]}>
                <Image
                  source={selectedLetter?.writerInfo.imageUrl && selectedLetter.writerInfo.imageUrl.startsWith('http') ? { uri: selectedLetter.writerInfo.imageUrl } : require('../../assets/profiles/user_profile.png')}
                  style={styles.modalProfileImage}
                />
              </View>
              <View style={styles.modalTextSection}>

                <Text style={[styles.modalName, { fontSize: getFontSize(18), color: colors.text.primary }]}>{selectedLetter?.writerInfo.nickname}</Text>
                {selectedLetter?.writerInfo.bio && (
                  <Text style={[styles.modalBio, { fontSize: getFontSize(14), color: colors.text.secondary }]}>{selectedLetter.writerInfo.bio}</Text>
                )}
              </View>
            </View>

            <View style={styles.modalLetterSection}>
              <Text style={[styles.modalLabel, { fontSize: getFontSize(14), color: colors.text.light }]}>편지 내용</Text>
              <Text style={[styles.modalLetterText, { fontSize: getFontSize(16), color: colors.text.primary, backgroundColor: colors.background }]}>
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
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
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
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    marginBottom: 10,
  },
  countText: {
    marginLeft: 10,
    fontWeight: '500',
  },
  unreadCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadCountText: {
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
    marginTop: 15,
    textAlign: 'center',
  },
  noResultsSubtext: {
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
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  letterMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileText: {
  },
  letterTextContainer: {
    flex: 1,
  },
  customerName: {
    fontWeight: 'bold',
    marginBottom: 3,
  },
  letterPreview: {
  },
  letterBio: {
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
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  modalDate: {
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    overflow: 'hidden',
  },
  modalProfileImage: {
    width: '100%',
    height: '100%',
  },
  modalProfileText: {
  },
  modalTextSection: {
    flex: 1,
  },
  modalLabel: {
    fontWeight: '600',
    marginBottom: 5,
  },
  modalText: {
  },
  modalName: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  modalBio: {
    lineHeight: 20,
    fontStyle: 'italic',
  },
  modalLetterSection: {
    marginTop: 10,
  },
  modalLetterText: {
    padding: 15,
    borderRadius: 8,
    lineHeight: 24,
  },
  modalSubText: {
    marginTop: 8,
    fontStyle: 'italic',
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default AdminLetterListScreen;