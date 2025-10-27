import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemedStyles } from '../hooks/useThemedStyles';

const { width: screenWidth } = Dimensions.get('window');

interface TutorialPage {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface TutorialModalProps {
  visible: boolean;
  onClose: () => void;
}

const TutorialModal: React.FC<TutorialModalProps> = ({ visible, onClose }) => {
  const { colors, getFontSize } = useThemedStyles();
  const [currentPage, setCurrentPage] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const pages: TutorialPage[] = [
    {
      id: '1',
      title: '앱 소개 및 주요 기능',
      content: (
        <View style={styles.pageContent}>
          <Text style={[styles.description, { fontSize: getFontSize(15), color: colors.text.primary }]}>
            쉼표 앱은 시민들이 여름철·겨울철에 안전하고 편리하게 쉴 수 있는 장소를 안내하는 서비스입니다.
          </Text>

          <Text style={[styles.sectionTitle, { fontSize: getFontSize(16), color: colors.text.primary }]}>주요 기능</Text>

          <View style={styles.featureItem}>
            <Text style={[styles.featureBullet, { fontSize: getFontSize(14), color: colors.primary }]}>•</Text>
            <View style={styles.featureTextContainer}>
              <Text style={[styles.featureTitle, { fontSize: getFontSize(14), color: colors.text.primary }]}>주변 쉼터 찾기</Text>
              <Text style={[styles.featureDesc, { fontSize: getFontSize(13), color: colors.text.secondary }]}>
                내 위치 기반으로 가까운 쉼터를 확인해요!
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={[styles.featureBullet, { fontSize: getFontSize(14), color: colors.primary }]}>•</Text>
            <View style={styles.featureTextContainer}>
              <Text style={[styles.featureTitle, { fontSize: getFontSize(14), color: colors.text.primary }]}>필터 검색</Text>
              <Text style={[styles.featureDesc, { fontSize: getFontSize(13), color: colors.text.secondary }]}>
                기후동행쉼터, 스마트쉼터 등 유형별 구분을 할 수 있어요!
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={[styles.featureBullet, { fontSize: getFontSize(14), color: colors.primary }]}>•</Text>
            <View style={styles.featureTextContainer}>
              <Text style={[styles.featureTitle, { fontSize: getFontSize(14), color: colors.text.primary }]}>시설 사용 후 편지 보내기</Text>
              <Text style={[styles.featureDesc, { fontSize: getFontSize(13), color: colors.text.secondary }]}>
                시설에 대한 리뷰, 혹은 감사한 마음을 담아 장소 제공자에게 편지를 보내요!
              </Text>
            </View>
          </View>

          <Text style={[styles.footerText, { fontSize: getFontSize(14), color: colors.text.secondary }]}>
            이렇게 무더위·한파 등 기후위기 상황에서 시민들에게 안전한 휴식 공간을 제공하고 있습니다 :)
          </Text>
        </View>
      ),
    },
    {
      id: '2',
      title: '메인 화면 구성 및 기능 설명',
      content: (
        <View style={styles.pageContent}>
          <View style={styles.featureItem}>
            <Text style={[styles.emoji, { fontSize: getFontSize(20) }]}>🔍</Text>
            <View style={styles.featureTextContainer}>
              <Text style={[styles.featureTitle, { fontSize: getFontSize(14), color: colors.text.primary }]}>검색창</Text>
              <Text style={[styles.featureDesc, { fontSize: getFontSize(13), color: colors.text.secondary }]}>
                원하는 지역/주소 입력
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={[styles.emoji, { fontSize: getFontSize(20) }]}>🗺️</Text>
            <View style={styles.featureTextContainer}>
              <Text style={[styles.featureTitle, { fontSize: getFontSize(14), color: colors.text.primary }]}>지도</Text>
              <Text style={[styles.featureDesc, { fontSize: getFontSize(13), color: colors.text.secondary }]}>
                쉼터 위치를 한눈에 확인
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={[styles.emoji, { fontSize: getFontSize(20) }]}>📌</Text>
            <View style={styles.featureTextContainer}>
              <Text style={[styles.featureTitle, { fontSize: getFontSize(14), color: colors.text.primary }]}>마커(아이콘)</Text>
              <Text style={[styles.featureDesc, { fontSize: getFontSize(13), color: colors.text.secondary }]}>
                쉼터의 종류별 표시
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={[styles.emoji, { fontSize: getFontSize(20) }]}>☰</Text>
            <View style={styles.featureTextContainer}>
              <Text style={[styles.featureTitle, { fontSize: getFontSize(14), color: colors.text.primary }]}>필터 버튼</Text>
              <Text style={[styles.featureDesc, { fontSize: getFontSize(13), color: colors.text.secondary }]}>
                원하는 쉼터 유형만 선택 가능
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={[styles.emoji, { fontSize: getFontSize(20) }]}>🏷️</Text>
            <View style={styles.featureTextContainer}>
              <Text style={[styles.featureTitle, { fontSize: getFontSize(14), color: colors.text.primary }]}>상세 정보</Text>
              <Text style={[styles.featureDesc, { fontSize: getFontSize(13), color: colors.text.secondary }]}>
                마커 클릭 시 시설 정보와 이용 시간 확인
              </Text>
            </View>
          </View>
        </View>
      ),
    },
    {
      id: '3',
      title: '기타 기능',
      content: (
        <View style={styles.pageContent}>
          <Text style={[styles.sectionTitle, { fontSize: getFontSize(16), color: colors.text.primary }]}>나눔쉼터란?</Text>

          <Text style={[styles.description, { fontSize: getFontSize(14), color: colors.text.secondary }]}>
            카페, 음식점 등 쉼터를 제공하는 매장에서 20분 동안 쉬어갈 수 있어요
          </Text>

          <View style={[styles.warningBox, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
            <Text style={[styles.warningTitle, { fontSize: getFontSize(14), color: colors.error }]}>
              주의사항
            </Text>
            <Text style={[styles.warningText, { fontSize: getFontSize(13), color: colors.text.secondary }]}>
              20분을 지키지 않거나 매너없는 행동을 할 경우 다음과 같은 패널티가 생겨요!
            </Text>
          </View>

          <View style={styles.penaltyItem}>
            <Text style={[styles.penaltyNumber, { fontSize: getFontSize(13), color: colors.primary }]}>1.</Text>
            <Text style={[styles.penaltyText, { fontSize: getFontSize(13), color: colors.text.secondary }]}>
              신고 3번을 당하면 나눔 쉼터가 내 지도에서 아예 볼 수 없어요
            </Text>
          </View>

          <View style={styles.penaltyItem}>
            <Text style={[styles.penaltyNumber, { fontSize: getFontSize(13), color: colors.primary }]}>2.</Text>
            <Text style={[styles.penaltyText, { fontSize: getFontSize(13), color: colors.text.secondary }]}>
              사용한 가게 주인이 차단을 할 경우, 내 지도에서 해당 가게는 볼 수 없어요
            </Text>
          </View>

          <Text style={[styles.footerText, { fontSize: getFontSize(14), color: colors.primary }]}>
            매너 있는 행동으로 서로 행복한 쉼터를 만들어가요
          </Text>
        </View>
      ),
    },
    {
      id: '4',
      title: '쉼터 종류 안내',
      content: (
        <View style={styles.pageContent}>
          <Text style={[styles.description, { fontSize: getFontSize(14), color: colors.text.secondary }]}>
            필터를 통해 두 가지 주요 쉼터를 구분할 수 있습니다!
          </Text>

          <View style={[styles.shelterTypeBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.shelterTypeTitle, { fontSize: getFontSize(15), color: colors.primary }]}>
              기후동행쉼터
            </Text>
            <View style={styles.shelterTypeItem}>
              <Text style={[styles.featureBullet, { fontSize: getFontSize(12), color: colors.text.secondary }]}>•</Text>
              <Text style={[styles.shelterTypeText, { fontSize: getFontSize(13), color: colors.text.secondary }]}>
                무더위, 한파 등 기후위기 대응을 위해 마련된 공공 쉼터
              </Text>
            </View>
            <View style={styles.shelterTypeItem}>
              <Text style={[styles.featureBullet, { fontSize: getFontSize(12), color: colors.text.secondary }]}>•</Text>
              <Text style={[styles.shelterTypeText, { fontSize: getFontSize(13), color: colors.text.secondary }]}>
                주민센터, 도서관, 경로당 등 공공시설을 활용
              </Text>
            </View>
            <View style={styles.shelterTypeItem}>
              <Text style={[styles.featureBullet, { fontSize: getFontSize(12), color: colors.text.secondary }]}>•</Text>
              <Text style={[styles.shelterTypeText, { fontSize: getFontSize(13), color: colors.text.secondary }]}>
                누구나 무료로 이용 가능
              </Text>
            </View>
          </View>

          <View style={[styles.shelterTypeBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.shelterTypeTitle, { fontSize: getFontSize(15), color: colors.primary }]}>
              스마트 쉼터
            </Text>
            <View style={styles.shelterTypeItem}>
              <Text style={[styles.featureBullet, { fontSize: getFontSize(12), color: colors.text.secondary }]}>•</Text>
              <Text style={[styles.shelterTypeText, { fontSize: getFontSize(13), color: colors.text.secondary }]}>
                버스정류장 등에 설치된 첨단 기술 기반 쉼터
              </Text>
            </View>
            <View style={styles.shelterTypeItem}>
              <Text style={[styles.featureBullet, { fontSize: getFontSize(12), color: colors.text.secondary }]}>•</Text>
              <Text style={[styles.shelterTypeText, { fontSize: getFontSize(13), color: colors.text.secondary }]}>
                냉난방 시스템, 공기청정, 와이파이, 스마트 안전 기능 제공
              </Text>
            </View>
            <View style={styles.shelterTypeItem}>
              <Text style={[styles.featureBullet, { fontSize: getFontSize(12), color: colors.text.secondary }]}>•</Text>
              <Text style={[styles.shelterTypeText, { fontSize: getFontSize(13), color: colors.text.secondary }]}>
                날씨와 교통정보까지 확인 가능
              </Text>
            </View>
          </View>

          <View style={[styles.summaryBox, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
            <Text style={[styles.summaryText, { fontSize: getFontSize(13), color: colors.text.primary }]}>
              👉 기후동행쉼터는 공공시설 중심, 스마트쉼터는 첨단 편의시설 중심이라는 차이가 있어요!
            </Text>
          </View>
        </View>
      ),
    },
  ];

  const handleNext = () => {
    if (currentPage < pages.length - 1) {
      const nextPage = currentPage + 1;
      flatListRef.current?.scrollToIndex({ index: nextPage, animated: true });
      setCurrentPage(nextPage);
    } else {
      onClose();
    }
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / screenWidth);
    setCurrentPage(page);
  };

  const renderPage = ({ item }: { item: TutorialPage }) => (
    <TouchableOpacity
      style={[styles.page, { width: screenWidth - 40 }]}
      activeOpacity={1}
      onPress={handleNext}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.pageScrollContent}
      >
        <Text style={[styles.pageTitle, { fontSize: getFontSize(20), color: colors.text.primary }]}>
          {item.title}
        </Text>
        {item.content}
      </ScrollView>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={[styles.modalContainer, { backgroundColor: colors.background }]}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <View style={[styles.header, { borderBottomColor: colors.surface }]}>
            <Text style={[styles.headerTitle, { fontSize: getFontSize(18), color: colors.text.primary }]}>
              앱 사용 설명서
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* 페이지 */}
          <View style={styles.pagesWrapper}>
            <FlatList
              ref={flatListRef}
              data={pages}
              renderItem={renderPage}
              keyExtractor={(item) => item.id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              contentContainerStyle={styles.pagesContainer}
            />
          </View>

          {/* 페이지 인디케이터 */}
          <View style={styles.footer}>
            <View style={styles.indicators}>
              {pages.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    { backgroundColor: currentPage === index ? colors.primary : colors.text.light },
                  ]}
                />
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    height: '75%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  pagesWrapper: {
    flex: 1,
  },
  pagesContainer: {
    paddingHorizontal: 20,
  },
  page: {
    paddingVertical: 15,
    paddingHorizontal: 5,
  },
  pageScrollContent: {
    paddingBottom: 20,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  pageContent: {
    gap: 15,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  featureBullet: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 10,
    marginTop: 2,
  },
  emoji: {
    fontSize: 20,
    marginRight: 10,
    marginTop: 2,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  footerText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
    fontStyle: 'italic',
  },
  warningBox: {
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    marginVertical: 10,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  warningText: {
    fontSize: 13,
    lineHeight: 18,
  },
  penaltyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginLeft: 10,
    marginBottom: 8,
  },
  penaltyNumber: {
    fontSize: 13,
    fontWeight: 'bold',
    marginRight: 8,
  },
  penaltyText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  shelterTypeBox: {
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
  },
  shelterTypeTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  shelterTypeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  shelterTypeText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  summaryBox: {
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 10,
  },
  summaryText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
  footer: {
    paddingVertical: 15,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default TutorialModal;
