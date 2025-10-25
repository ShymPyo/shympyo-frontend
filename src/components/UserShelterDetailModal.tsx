import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemedStyles } from '../hooks/useThemedStyles';

const { width, height } = Dimensions.get('window');

interface TodayAndHoliday {
  dayOfWeek: string;
  closed: boolean;
  openTime: string;
  closeTime: string;
  breakStart?: string;
  breakEnd?: string;
  holidays?: string[];
}

interface UserShelter {
  id: string | number;
  name: string;
  type: string;
  distance?: string;
  category: '민간 개방 시설';
  icon: string;
  color: string;
  address?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  maxCapacity?: number;
  currentCapacity?: number;
  todayAndHoliday?: TodayAndHoliday;
  maxUsageMinutes?: number;
}

interface UserShelterDetailModalProps {
  visible: boolean;
  shelter: UserShelter | null;
  onClose: () => void;
}

const UserShelterDetailModal: React.FC<UserShelterDetailModalProps> = ({
  visible,
  shelter,
  onClose,
}) => {
  const { colors, getFontSize } = useThemedStyles();

  if (!shelter) return null;

  // 영업시간 포맷팅 (초 제거)
  const formatBusinessHours = (todayAndHoliday?: TodayAndHoliday): string => {
    if (!todayAndHoliday) return '24시간 운영\n연중무휴';

    if (todayAndHoliday.closed) {
      return '오늘은 휴무일입니다';
    }

    // 시간:분:초 형식에서 시간:분만 추출
    const formatTime = (time: string) => {
      const parts = time.split(':');
      return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : time;
    };

    const openTime = formatTime(todayAndHoliday.openTime || '00:00');
    const closeTime = formatTime(todayAndHoliday.closeTime || '24:00');

    let hoursText = `${openTime} - ${closeTime}`;

    if (todayAndHoliday.breakStart && todayAndHoliday.breakEnd) {
      const breakStart = formatTime(todayAndHoliday.breakStart);
      const breakEnd = formatTime(todayAndHoliday.breakEnd);
      hoursText += `\n휴게시간: ${breakStart} - ${breakEnd}`;
    }

    return hoursText;
  };

  const displayHours = formatBusinessHours(shelter.todayAndHoliday);
  const displayAddress = shelter.address || '주소 정보 없음';

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent={true}
      {...(Platform.OS === 'web' && {
        accessibilityViewIsModal: false,
        presentationStyle: 'overFullScreen'
      })}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
        {...(Platform.OS === 'web' && { accessible: false })}
      >
        <TouchableOpacity
          style={[styles.container, { backgroundColor: colors.background }]}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
          accessible={false}
        >
          {/* 헤더 */}
          <View style={[styles.header, { borderBottomColor: colors.surface }]}>
            <TouchableOpacity onPress={onClose} style={[styles.backButton, { backgroundColor: colors.surface }]}>
              <Ionicons name="close" size={20} color={colors.text.primary} />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Text style={[styles.categoryText, { fontSize: getFontSize(14), color: colors.text.primary }]} numberOfLines={1}>민간 개방 시설</Text>
            </View>
            <View style={{ width: 32 }} />
          </View>

          {/* 메인 콘텐츠 */}
          <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false}>
            {/* 상단 정보 섹션 */}
            <View style={styles.topSection}>
              {/* 왼쪽: 시설 이미지 - 이미지가 있을 때만 표시 */}
              {shelter.imageUrl && (
                <View style={[styles.imageContainer, { backgroundColor: colors.surface }]}>
                  <Image
                    source={{ uri: shelter.imageUrl }}
                    style={styles.shelterImage}
                    resizeMode="cover"
                  />
                </View>
              )}

              {/* 오른쪽: 시설명과 기본 정보 */}
              <View style={[styles.infoContainer, !shelter.imageUrl && { marginLeft: 0 }]}>
                <Text style={[styles.shelterName, { fontSize: getFontSize(20), color: colors.text.primary }]} numberOfLines={2}>
                  {shelter.name}
                </Text>
                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={16} color={colors.text.secondary} />
                  <Text style={[styles.infoText, { fontSize: getFontSize(13), color: colors.text.secondary }]} numberOfLines={2}>{displayHours}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={16} color={colors.text.secondary} />
                  <Text style={[styles.infoText, { fontSize: getFontSize(13), color: colors.text.secondary }]} numberOfLines={2}>{displayAddress}</Text>
                </View>
              </View>
            </View>

            {/* 쉼터 소개 */}
            {shelter.description && (
              <View style={styles.descriptionSection}>
                <Text style={[styles.descriptionText, { fontSize: getFontSize(12), color: colors.text.secondary }]} numberOfLines={3}>
                  {shelter.description}
                </Text>
              </View>
            )}

            {/* 쉴 수 있는 시간 */}
            {shelter.maxUsageMinutes !== undefined && (
              <View style={styles.restTimeSection}>
                <Text style={[styles.restTimeText, { fontSize: getFontSize(14), color: colors.primary }]}>{shelter.maxUsageMinutes}분까지, 마음 편히 쉬어가세요.</Text>
              </View>
            )}

            {/* 현재 이용 인원 - 크게 표시 */}
            {shelter.maxCapacity !== undefined && shelter.currentCapacity !== undefined && (
              <View style={[styles.capacitySection, { backgroundColor: colors.surface }]}>
                <View style={styles.capacityHeader}>
                  <Ionicons name="people" size={20} color={colors.primary} />
                  <Text style={[styles.capacityLabel, { fontSize: getFontSize(14), color: colors.text.primary }]}>현재 이용 인원</Text>
                </View>
                <View style={styles.capacityDisplay}>
                  <Text style={[styles.capacityNumber, { fontSize: getFontSize(36), color: colors.primary }]}>{shelter.currentCapacity}</Text>
                  <Text style={[styles.capacitySeparator, { fontSize: getFontSize(24), color: colors.text.light }]}>/</Text>
                  <Text style={[styles.capacityMax, { fontSize: getFontSize(20), color: colors.text.secondary }]}>{shelter.maxCapacity}명</Text>
                </View>
              </View>
            )}

            {/* 길찾기 버튼 */}
            <TouchableOpacity style={[styles.navigationButton, { backgroundColor: colors.primary }]}>
              <Ionicons name="navigate" size={20} color={colors.text.white} />
              <Text style={[styles.navigationButtonText, { fontSize: getFontSize(16), color: colors.text.white }]}>길찾기</Text>
            </TouchableOpacity>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 60,
  },
  container: {
    width: '100%',
    borderRadius: 20,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.3)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
          elevation: 20,
        }
    ),
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryText: {
    fontWeight: '600',
  },
  mainContent: {
    padding: 20,
  },
  topSection: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  shelterImage: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  shelterName: {
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 28,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoText: {
    marginLeft: 6,
    flex: 1,
  },
  descriptionSection: {
    marginBottom: 16,
  },
  descriptionText: {
    lineHeight: 18,
  },
  restTimeSection: {
    marginBottom: 16,
  },
  restTimeText: {
    fontWeight: '700',
  },
  capacitySection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  capacityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  capacityLabel: {
    fontWeight: '600',
    marginLeft: 6,
  },
  capacityDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  capacityNumber: {
    fontWeight: '700',
  },
  capacitySeparator: {
    fontWeight: '400',
    marginHorizontal: 4,
  },
  capacityMax: {
    fontWeight: '600',
  },
  navigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 'auto',
  },
  navigationButtonText: {
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default UserShelterDetailModal;
