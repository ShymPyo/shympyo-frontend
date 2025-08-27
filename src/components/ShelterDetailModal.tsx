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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

const { width, height } = Dimensions.get('window');

interface Shelter {
  id: string;
  name: string;
  type: string;
  distance: string;
  category: '민간 개방 시설' | '스마트 쉼터' | '교통 시설' | '공공 시설';
  icon: string;
  color: string;
  address?: string;
  hours?: string;
  description?: string;
  image?: string;
}

interface ShelterDetailModalProps {
  visible: boolean;
  shelter: Shelter | null;
  onClose: () => void;
}

const ShelterDetailModal: React.FC<ShelterDetailModalProps> = ({
  visible,
  shelter,
  onClose,
}) => {
  if (!shelter) return null;

  // 카테고리별 기본 정보 설정
  const getDefaultInfo = (category: string, name: string) => {
    switch (category) {
      case '민간 개방 시설':
        return {
          hours: '09:00 ~ 22:00\n연중무휴',
          address: '인천 미추홀구 인하로 100',
          description: '무료 Wi-Fi와 충전 시설이 구비되어 있습니다.',
        };
      case '스마트 쉼터':
        return {
          hours: '24시간 운영\n연중무휴',
          address: '인천 미추홀구 용현동 123',
          description: '스마트 시설과 에어컨이 완비된 쉼터입니다.',
        };
      case '교통 시설':
        return {
          hours: '05:30 ~ 24:00\n지하철 운행시간',
          address: '인천 미추홀구 용현동',
          description: '지하철역 내부 대합실에서 휴식 가능합니다.',
        };
      case '공공 시설':
        return {
          hours: '09:00 ~ 18:00\n토요일 정기휴무',
          address: '인천 미추홀구 용현동 456',
          description: '1층에 쉼터 공간이 마련되어있습니다.',
        };
      default:
        return {
          hours: '운영시간 확인 필요',
          address: '주소 정보 없음',
          description: '시설 정보를 확인해주세요.',
        };
    }
  };

  const defaultInfo = getDefaultInfo(shelter.category, shelter.name);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity 
          style={styles.container}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <Ionicons name="close" size={20} color={Colors.text.primary} />
            </TouchableOpacity>
            
            <View style={styles.headerTitleContainer}>
              <Text style={styles.categoryText}>{shelter.category}</Text>
              <View style={[styles.locationIcon, { backgroundColor: shelter.color }]}>
                <Ionicons name="location" size={12} color="white" />
              </View>
            </View>
          </View>

          {/* 메인 콘텐츠 */}
          <View style={styles.mainContent}>
            {/* 상단 정보 섹션 */}
            <View style={styles.topSection}>
              {/* 왼쪽: 시설 이미지 */}
              <View style={styles.imageContainer}>
                <Ionicons 
                  name={shelter.icon as any} 
                  size={32} 
                  color={shelter.color} 
                />
              </View>
              
              {/* 오른쪽: 시설명과 기본 정보 */}
              <View style={styles.infoContainer}>
                <Text style={styles.shelterName}>{shelter.name}</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={16} color="#666" />
                  <Text style={styles.infoText}>{defaultInfo.hours}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={16} color="#666" />
                  <Text style={styles.infoText}>{defaultInfo.address}</Text>
                </View>
              </View>
            </View>

            {/* 시설 소개 */}
            <View style={styles.descriptionSection}>
              <View style={styles.descriptionHeader}>
                <Text style={styles.descriptionTitle}>시설 소개</Text>
              </View>
              <Text style={styles.descriptionText}>
                {defaultInfo.description}
              </Text>
            </View>
          </View>
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
    height: 400,
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
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
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
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
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginRight: 6,
  },
  locationIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainContent: {
    flex: 1,
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
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  shelterName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginLeft: 6,
    flex: 1,
  },
  descriptionSection: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  descriptionHeader: {
    marginBottom: 8,
  },
  descriptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  descriptionText: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
});

export default ShelterDetailModal;