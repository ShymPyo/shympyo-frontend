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
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemedStyles } from '../hooks/useThemedStyles';

const { width, height } = Dimensions.get('window');

interface Shelter {
  id: string | number;
  name: string;
  type: string;
  distance?: string;
  category: '스마트 쉼터' | '교통 시설' | '공공 시설' | '기후 동행 쉼터';
  icon: string;
  color: string;
  address?: string;
  hours?: string;
  description?: string;
  content?: string | null;
  latitude?: number;
  longitude?: number;
  image?: string;
}

interface ShelterDetailModalProps {
  visible: boolean;
  shelter: Shelter | null;
  onClose: () => void;
  onNavigate?: (latitude: number, longitude: number, name?: string) => void;
}

const ShelterDetailModal: React.FC<ShelterDetailModalProps> = ({
  visible,
  shelter,
  onClose,
  onNavigate,
}) => {
  const { colors, getFontSize } = useThemedStyles();

  if (!shelter) return null;

  // 길찾기 버튼 클릭 시 부모 컴포넌트에 알림
  const handleNavigation = () => {
    if (!shelter.latitude || !shelter.longitude) {
      Alert.alert('알림', '위치 정보가 없어 길찾기를 사용할 수 없습니다.');
      return;
    }

    // 모달을 닫고 부모 컴포넌트에서 경로 그리기
    onClose();
    if (onNavigate) {
      onNavigate(shelter.latitude, shelter.longitude, shelter.name);
    }
  };


  // 스마트쉘터 기본 설명
  const getDefaultDescription = (type: string, content: string | null | undefined) => {
    if (content) {
      return content;
    }

    // content가 null이거나 없을 때 기본 설명
    switch (type) {
      case 'SHELTER':
        return '스마트 시설과 에어컨이 완비된 쉼터입니다. 24시간 이용 가능하며, 무료 Wi-Fi와 충전 시설을 제공합니다.';
      case 'CAFE':
        return '편안한 휴식 공간을 제공하는 카페입니다.';
      case 'RESTAURANT':
        return '맛있는 음식을 제공하는 식당입니다.';
      case 'STORE':
        return '생필품을 구매할 수 있는 상점입니다.';
      default:
        return '시설 정보를 확인해주세요.';
    }
  };

  // 실제 데이터 사용
  const displayInfo = {
    hours: shelter.hours || '24시간 운영\n연중무휴',
    address: shelter.address || '주소 정보 없음',
    description: getDefaultDescription(shelter.type, shelter.content || shelter.description),
  };

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
              <Text style={[styles.categoryText, { fontSize: getFontSize(14), color: colors.text.primary }]} numberOfLines={1}>{shelter.category}</Text>
            </View>
            <View style={{ width: 32 }} />
          </View>

          {/* 메인 콘텐츠 */}
          <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false}>
            {/* 상단 정보 섹션 */}
            <View style={styles.topSection}>
              {/* 왼쪽: 시설 이미지 */}
              <View style={[styles.imageContainer, { backgroundColor: colors.surface }]}>
                <Ionicons
                  name={shelter.icon as any}
                  size={32}
                  color={shelter.color}
                />
              </View>

              {/* 오른쪽: 시설명과 기본 정보 */}
              <View style={styles.infoContainer}>
                <Text style={[styles.shelterName, { fontSize: getFontSize(20), color: colors.text.primary }]} numberOfLines={2}>
                  {(() => {
                    const name = shelter.name;
                    const description = displayInfo.description;
                    const category = shelter.category;

                    // 교통 시설: name + description 결합 (예: "2호선 용답역")
                    if (category === '교통 시설') {
                      return name && description ? `${name} ${description}` : (name || description);
                    }
                    // 기후 동행 쉼터: name과 description을 공백으로 연결 (예: "경희당점 CU")
                    if (category === '기후 동행 쉼터') {
                      return name && description ? `${name} ${description}` : (name || description);
                    }
                    // 그 외: description 표시
                    return displayInfo.description;
                  })()}
                </Text>
                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={16} color={colors.text.secondary} />
                  <Text style={[styles.infoText, { fontSize: getFontSize(13), color: colors.text.secondary }]} numberOfLines={2}>{displayInfo.hours}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={16} color={colors.text.secondary} />
                  <Text style={[styles.infoText, { fontSize: getFontSize(13), color: colors.text.secondary }]} numberOfLines={2}>{displayInfo.address}</Text>
                </View>
              </View>
            </View>

            {/* 길찾기 버튼 */}
            <TouchableOpacity
              style={[styles.navigationButton, { backgroundColor: colors.primary }]}
              onPress={handleNavigation}
            >
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
  locationIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
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

export default ShelterDetailModal;
