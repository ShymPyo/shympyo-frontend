import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { BlurView } from 'expo-blur';
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
  const scrollViewRef = useRef<ScrollView>(null);

  // 모달이 열릴 때마다 첫 페이지로 초기화
  React.useEffect(() => {
    if (visible) {
      setCurrentPage(0);
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ x: 0, animated: false });
      }, 100);
    }
  }, [visible]);

  const pages: TutorialPage[] = [
    {
      id: '1',
      number: '',
      title: '혹시 지금, 쉴 곳이 필요하세요?',
      description: '찌는 듯한 더위, 살을 에는 추위를 피해 잠시 쉬고 싶을 때.\n약속 시간은 남았는데 갈 곳은 마땅치 않을 때.',
      image: require('../../assets/tutorial/tuto-1.png'),
    },
    {
      id: '2',
      number: '',
      title: '쉼표는 이런 앱이에요',
      description: '쉼표는 당신이 몰랐던 우리 동네의 숨은 쉼터를 찾아드립니다.\n\n내 주변 500m 안, 가장 가까운 휴식처로 안내할게요.',
      image: require('../../assets/shympyo_logo.png'),
    },
    {
      id: '3',
      number: '',
      title: '어떤 쉼터들이 있나요?',
      description: '쉼표에는 누구나 편히 이용할 수 있는 다양한 쉼터가 있어요.',
      showMultiplePins: true,
    },
    {
      id: '4',
      number: '',
      title: '고마운 기후동행쉼터',
      description: '폭염과 한파를 피할 수 있도록 서울시가 마련한 고마운 쉼터예요.\n가까운 편의점, 은행 등에서 잠시 쉬어가세요.\n\n운영시간 내 자유롭게 이용할 수 있습니다.',
      pinImage: require('../../assets/map_fins/climate.png'),
      secondaryImage: require('../../assets/tutorial/tuto-3.png'),
      sideBySideImages: true,
    },
    {
      id: '5',
      number: '',
      title: '따뜻한 나눔쉼터',
      description: '우리 동네 사장님들이 기꺼이 내어주신 따뜻한 공간이에요.\n사장님의 따뜻한 마음을 생각하며, 조용히 머물다 가주세요.',
      pinImage: require('../../assets/map_fins/mingan.png'),
      secondaryImage: require('../../assets/tutorial/tuto-4.png'),
      sideBySideImages: true,
    },
    {
      id: '6',
      number: '',
      title: '나눔쉼터 이용 방법',
      description: '따뜻한 공간을 내어주신 사장님께\n감사 메시지 한 줄 남겨보는 건 어떨까요?',
      showStepIcons: true,
      steps: [
        { icon: 'qr-code', text: '입장 시 쉼터 QR코드를 스캔하고,' },
        { icon: 'time', text: '타이머 시간 동안 편안하게 휴식을 취하세요.' },
        { icon: 'sparkles', text: '이용 후에는 다음 사람을 위해 자리 정돈은 필수!' },
      ],
    },
    {
      id: '7',
      number: '',
      title: '이제, 쉼표 찍으러 가볼까요?',
      description: '내 주변 쉼터를 바로 찾아보고,\n가장 가까운 휴식처로 쉼표 찍으러 가요.',
      image: require('../../assets/shympyo_logo.png'),
    },
  ];

  const modalWidth = screenWidth * 0.9;

  const handleNext = () => {
    if (currentPage < pages.length - 1) {
      const nextPage = currentPage + 1;
      scrollViewRef.current?.scrollTo({ x: modalWidth * nextPage, animated: true });
      setCurrentPage(nextPage);
    } else {
      onClose();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / modalWidth);
    if (page >= 0 && page < pages.length && page !== currentPage) {
      setCurrentPage(page);
    }
  };

  const renderPage = (item: TutorialPage, index: number) => (
    <View key={item.id} style={[styles.pageContainer, { width: modalWidth }]}>
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
              <Text style={[styles.sectionTitle, { fontSize: getFontSize(16), color: colors.text.primary }]}>든든한 공공쉼터</Text>
              <Text style={[styles.sectionSubtitle, { fontSize: getFontSize(13), color: colors.text.secondary }]}>누구나 편하게 이용할 수 있는 우리의 공간이에요.</Text>
              <View style={styles.pinRow}>
                <Image source={require('../../assets/map_fins/shelter.png')} style={styles.pinIcon} resizeMode="contain" />
                <View style={styles.pinInfo}>
                  <Text style={[styles.pinTitle, { fontSize: getFontSize(15), color: colors.text.primary }]}>스마트쉘터</Text>
                  <Text style={[styles.pinDesc, { fontSize: getFontSize(13), color: colors.text.secondary }]}>냉난방이 되는 버스정류장</Text>
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
                  <Text style={[styles.pinDesc, { fontSize: getFontSize(13), color: colors.text.secondary }]}>주민센터, 도서관, 복지관 등</Text>
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
                  <Ionicons name={step.icon as any} size={28} color={colors.primary} style={styles.stepIcon} />
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
              style={(item.id === '2' || item.id === '7') ? styles.logoImage : styles.mainImage}
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
      <View style={styles.modalOverlay}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={onClose}
          />
        </BlurView>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <TouchableOpacity onPress={handleSkip} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={colors.text.secondary} />
          </TouchableOpacity>

          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled={false}
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            bounces={false}
            decelerationRate="fast"
            snapToInterval={modalWidth}
            snapToAlignment="start"
            style={{ flex: 1 }}
          >
            {pages.map((page, index) => renderPage(page, index))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
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
    height: 220,
  },
  logoImage: {
    width: 200,
    height: 200,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'left',
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 15,
    textAlign: 'left',
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
    gap: 25,
  },
  pinImageMedium: {
    width: 80,
    height: 80,
  },
  secondaryImageSide: {
    width: 150,
    height: 150,
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
