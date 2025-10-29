import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemedStyles } from '../hooks/useThemedStyles';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface TutorialPage {
  id: string;
  number: string;
  title: string;
  description: string;
  image?: any;
  pinImage?: any;
  secondaryImage?: any;
  showMultiplePins?: boolean;
  showStepIcons?: boolean;
  steps?: Array<{
    icon: string;
    text: string;
  }>;
  sideBySideImages?: boolean;
}

interface TutorialModalProps {
  visible: boolean;
  onClose: () => void;
}

const TutorialModal: React.FC<TutorialModalProps> = ({ visible, onClose }) => {
  const { colors, getFontSize } = useThemedStyles();
  const [currentPage, setCurrentPage] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // 모달이 열릴 때마다 첫 페이지로 초기화
  React.useEffect(() => {
    if (visible) {
      setCurrentPage(0);
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: 0, animated: false });
      }, 100);
    }
  }, [visible]);

  const pages: TutorialPage[] = [
    {
      id: '1',
      number: '①',
      title: '쉼표는 어떤 앱인가요?',
      description: '쉼표는 내 주변 500m 안,\n부담 없이 들를 수 있는 쉼터를 안내해주는 앱이에요.\n\n덥거나 추울 때,\n잠시 머물며 편히 쉴 수 있는 공간을 찾아드립니다.',
      image: require('../../assets/tutorial/tuto-1.png'),
    },
    {
      id: '2',
      number: '②',
      title: '쉼터는 어떤 종류가 있나요?',
      description: '쉼표에는 5가지 쉼터 유형이 있어요.\n\n먼저 바로 이용 가능한 3가지 공공쉼터부터 알려드릴게요',
      showMultiplePins: true,
    },
    {
      id: '3',
      number: '③',
      title: '기후동행쉼터',
      description: '기후동행쉼터는 폭염이나 한파 같은 기후 위기 속에서\n시민이 잠시 머물며 쉴 수 있도록 서울시가 마련한 쉼터예요.\n\n편의점·은행 등과 협업해 운영되며,\n운영시간 내 자유롭게 이용할 수 있습니다.',
      pinImage: require('../../assets/map_fins/climate.png'),
      secondaryImage: require('../../assets/tutorial/tuto-3.png'),
      sideBySideImages: true,
    },
    {
      id: '4',
      number: '④',
      title: '나눔쉼터',
      description: '나눔쉼터는\n지역의 사장님들이 공간을 나눔해주신 쉼터예요.\n\n민간 공간이므로,\n사장님을 배려하며 조용히 이용해주세요',
      pinImage: require('../../assets/map_fins/mingan.png'),
      secondaryImage: require('../../assets/tutorial/tuto-4.png'),
      sideBySideImages: true,
    },
    {
      id: '5',
      number: '⑤',
      title: '나눔쉼터 이용 방법',
      description: '쉼의 여운으로,\n\n감사의 마음 한 줄 남겨보는건 어떨까요?',
      showStepIcons: true,
      steps: [
        { icon: 'qr-code', text: '입장 시 쉼터 QR코드를 스캔해요.' },
        { icon: 'time', text: '타이머 시간 동안 자유롭게 휴식!' },
        { icon: 'sparkles', text: '이용 후에는 자리 정돈을 꼭 해주세요.' },
      ],
    },
    {
      id: '6',
      number: '⑥',
      title: '이제 쉼표를 이용해볼까요?',
      description: '내 주변 쉼터를 바로 찾아보고,\n가장 가까운 휴식처로 쉼표 찍으러 가요.',
      image: require('../../assets/shympyo_logo.png'),
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

  const handleSkip = () => {
    onClose();
  };

  // modalContainer의 실제 너비 계산
  const modalContainerWidth = screenWidth * 0.9;

  const handleMomentumScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / modalContainerWidth);
    if (page >= 0 && page < pages.length) {
      setCurrentPage(page);
    }
  };

  const renderPage = ({ item }: { item: TutorialPage }) => (
    <View style={[styles.pageContainer, { width: modalContainerWidth }]}>
      <View style={styles.page}>
      {/* 상단 영역 */}
      <View style={styles.topSection}>
        {/* 제목 */}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { fontSize: getFontSize(20), color: colors.text.primary }]}>
            {item.title}
          </Text>
        </View>

        {/* 이미지 영역 */}
        <View style={styles.imageContainer}>
          {item.showMultiplePins ? (
            <View style={styles.multiplePinsContainer}>
              <View style={styles.pinRow}>
                <Image source={require('../../assets/map_fins/shelter.png')} style={styles.pinIcon} resizeMode="contain" />
                <View style={styles.pinInfo}>
                  <Text style={[styles.pinTitle, { fontSize: getFontSize(15), color: colors.text.primary }]}>스마트쉘터</Text>
                  <Text style={[styles.pinDesc, { fontSize: getFontSize(13), color: colors.text.secondary }]}>버스정류장형 냉·난방 쉼터</Text>
                </View>
              </View>
              <View style={styles.pinRow}>
                <Image source={require('../../assets/map_fins/traffic.png')} style={styles.pinIcon} resizeMode="contain" />
                <View style={styles.pinInfo}>
                  <Text style={[styles.pinTitle, { fontSize: getFontSize(15), color: colors.text.primary }]}>교통 시설</Text>
                  <Text style={[styles.pinDesc, { fontSize: getFontSize(13), color: colors.text.secondary }]}>지하철역, 역사 등 시민 개방 시설</Text>
                </View>
              </View>
              <View style={styles.pinRow}>
                <Image source={require('../../assets/map_fins/politic.png')} style={styles.pinIcon} resizeMode="contain" />
                <View style={styles.pinInfo}>
                  <Text style={[styles.pinTitle, { fontSize: getFontSize(15), color: colors.text.primary }]}>공공 시설</Text>
                  <Text style={[styles.pinDesc, { fontSize: getFontSize(13), color: colors.text.secondary }]}>주민센터, 도서관, 복지관 등 누구나 이용 가능</Text>
                </View>
              </View>
            </View>
          ) : item.sideBySideImages && item.pinImage && item.secondaryImage ? (
            <View style={styles.sideBySideContainer}>
              <Image source={item.pinImage} style={styles.pinImageMedium} resizeMode="contain" />
              <Image source={item.secondaryImage} style={styles.secondaryImageSide} resizeMode="contain" />
            </View>
          ) : item.showStepIcons && item.steps ? (
            <View style={styles.stepsContainer}>
              {item.steps.map((step, index) => (
                <View key={index} style={styles.stepRow}>
                  <Ionicons name={step.icon as any} size={32} color={colors.primary} style={styles.stepIcon} />
                  <Text style={[styles.stepText, { fontSize: getFontSize(14), color: colors.text.primary }]}>
                    {index + 1}. {step.text}
                  </Text>
                </View>
              ))}
              <View style={styles.specialMessageContainer}>
                <Ionicons name="mail" size={24} color={colors.primary} style={styles.mailIcon} />
                <Text style={[styles.specialMessage, { fontSize: getFontSize(13), color: colors.text.secondary }]}>
                  {item.description}
                </Text>
              </View>
            </View>
          ) : item.image ? (
            <Image
              source={item.image}
              style={item.id === '6' ? styles.logoImage : styles.mainImage}
              resizeMode="contain"
            />
          ) : null}
        </View>
      </View>

      {/* 하단 고정 영역 */}
      <View style={styles.bottomFixedSection}>
        {/* 설명 */}
        <View style={styles.descriptionContainer}>
          {!item.showStepIcons && (
            <Text style={[styles.description, { fontSize: getFontSize(14), color: colors.text.primary }]}>
              {item.description}
            </Text>
          )}
        </View>

        {/* 인디케이터 */}
        <View style={styles.indicators}>
          {pages.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                {
                  backgroundColor: currentPage === index ? colors.primary : colors.text.light,
                },
              ]}
            />
          ))}
        </View>
      </View>
      </View>
    </View>
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
        <View
          style={[styles.modalContainer, { backgroundColor: colors.background }]}
          onStartShouldSetResponder={() => true}
        >
          <TouchableOpacity onPress={handleSkip} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={colors.text.secondary} />
          </TouchableOpacity>

          <FlatList
            ref={flatListRef}
            data={pages}
            renderItem={renderPage}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleMomentumScrollEnd}
            bounces={false}
            decelerationRate="fast"
            scrollEnabled={true}
            snapToInterval={modalContainerWidth}
            snapToAlignment="start"
            getItemLayout={(_, index) => ({
              length: modalContainerWidth,
              offset: modalContainerWidth * index,
              index,
            })}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    height: '68%',
    borderRadius: 20,
    paddingVertical: 20,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 15,
    zIndex: 10,
    padding: 8,
  },
  closeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  pageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  page: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
    justifyContent: 'space-between',
  },
  topSection: {
    flex: 1,
  },
  titleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomFixedSection: {
    minHeight: 90,
  },
  descriptionContainer: {
    minHeight: 45,
    marginBottom: 12,
  },
  mainImage: {
    width: '100%',
    height: 200,
  },
  logoImage: {
    width: 150,
    height: 150,
  },
  pinContainer: {
    alignItems: 'center',
    width: '100%',
  },
  pinImageLarge: {
    width: 80,
    height: 80,
    marginBottom: 15,
  },
  secondaryImage: {
    width: '90%',
    height: 120,
    marginTop: 15,
  },
  multiplePinsContainer: {
    width: '100%',
  },
  pinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  pinIcon: {
    width: 48,
    height: 48,
    marginRight: 15,
  },
  pinInfo: {
    flex: 1,
  },
  pinTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 3,
    textAlign: 'left',
  },
  pinDesc: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'left',
  },
  sideBySideContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 20,
  },
  pinImageMedium: {
    width: 65,
    height: 65,
  },
  secondaryImageSide: {
    width: 130,
    height: 130,
  },
  stepsContainer: {
    width: '100%',
    paddingVertical: 10,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  stepIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'left',
  },
  specialMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  mailIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  specialMessage: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    fontStyle: 'italic',
    textAlign: 'left',
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'left',
    paddingHorizontal: 10,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    flexWrap: 'nowrap',
  },
  indicator: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
});

export default TutorialModal;
