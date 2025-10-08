import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { Colors } from '../constants/colors';
import { RootStackParamList } from '../types';
import ApiService, { BlockedUser, BlockDetail } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

type BlockedUsersScreenNavigationProp = StackNavigationProp<RootStackParamList, 'BlockedUsers'>;

const BlockedUsersScreen: React.FC = () => {
  const navigation = useNavigation<BlockedUsersScreenNavigationProp>();
  const { accessToken } = useAuth();

  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadBlockedUsers = async (isRefresh: boolean = false) => {
    if (!accessToken) return;

    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const response = await ApiService.getBlockedUsers(accessToken);

      if (response.success && response.data) {
        setBlockedUsers(response.data);
        console.log('✅ 차단 목록 로드:', response.data);
      } else {
        console.log('❌ 차단 목록 조회 실패:', response.message);
        setBlockedUsers([]);
      }
    } catch (error) {
      console.error('💥 차단 목록 로드 오류:', error);
      Alert.alert('오류', '차단 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadBlockedUsers();
  }, [accessToken]);

  const handleUnblock = async (userId: number, nickname: string) => {
    if (!accessToken) return;

    Alert.alert('차단 해제', `${nickname}님의 차단을 해제하시겠습니까?`, [
      {
        text: '취소',
        style: 'cancel',
      },
      {
        text: '해제',
        onPress: async () => {
          try {
            const response = await ApiService.unblockUser(userId, accessToken);

            if (response.success) {
              Alert.alert('완료', '차단이 해제되었습니다.');
              loadBlockedUsers();
            } else {
              Alert.alert('오류', response.message || '차단 해제에 실패했습니다.');
            }
          } catch (error) {
            console.error('💥 차단 해제 오류:', error);
            Alert.alert('오류', '차단 해제 중 오류가 발생했습니다.');
          }
        },
      },
    ]);
  };

  const handleViewDetail = async (userId: number) => {
    if (!accessToken) return;

    try {
      const response = await ApiService.getBlockDetail(userId, accessToken);

      if (response.success && response.data) {
        const detail = response.data;
        const reasonText = getReasonText(detail.reason);

        Alert.alert(
          '차단 상세 정보',
          `사용자: ${detail.nickname}\n\n차단 사유: ${reasonText}\n\n상세 내용:\n${detail.detail}\n\n차단 시작: ${new Date(
            detail.startAt
          ).toLocaleString('ko-KR')}\n차단 해제: ${new Date(detail.endAt).toLocaleString('ko-KR')}\n\n상태: ${
            detail.status === 'ACTIVE' ? '활성' : detail.status === 'EXPIRED' ? '만료' : '취소'
          }`
        );
      } else {
        Alert.alert('오류', '차단 상세 정보를 불러올 수 없습니다.');
      }
    } catch (error) {
      console.error('💥 차단 상세 조회 오류:', error);
      Alert.alert('오류', '상세 정보를 불러오는 중 오류가 발생했습니다.');
    }
  };

  const getReasonText = (reason: string) => {
    switch (reason) {
      case 'ABUSE':
        return '욕설/괴롭힘';
      case 'INAPPROPRIATE':
        return '부적절한 행동';
      case 'SCAM':
        return '사기';
      case 'POLICY_VIOLATION':
        return '정책 위반';
      case 'OTHER':
        return '기타';
      default:
        return reason;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return '#FF4444';
      case 'EXPIRED':
        return '#999';
      case 'REVOKED':
        return '#4CAF50';
      default:
        return '#999';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return '차단 중';
      case 'EXPIRED':
        return '만료됨';
      case 'REVOKED':
        return '해제됨';
      default:
        return status;
    }
  };

  const renderBlockedUser = ({ item }: { item: BlockedUser }) => (
    <TouchableOpacity style={styles.userCard} onPress={() => handleViewDetail(item.userId)}>
      <View style={styles.userInfo}>
        <View style={styles.userHeader}>
          <Text style={styles.userNickname}>{item.nickname}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
        <Text style={styles.blockDate}>
          차단 시작: {new Date(item.startAt).toLocaleDateString('ko-KR')}
        </Text>
      </View>

      {item.status === 'ACTIVE' && (
        <TouchableOpacity
          style={styles.unblockButton}
          onPress={(e) => {
            e.stopPropagation();
            handleUnblock(item.userId, item.nickname);
          }}
        >
          <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
          <Text style={styles.unblockButtonText}>해제</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>차단 목록을 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>차단 목록</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* 차단 목록 */}
      {blockedUsers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="ban-outline" size={64} color={Colors.text.light} />
          <Text style={styles.emptyText}>차단한 사용자가 없습니다</Text>
        </View>
      ) : (
        <FlatList
          data={blockedUsers}
          renderItem={renderBlockedUser}
          keyExtractor={(item) => item.sanctionId.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadBlockedUsers(true)} />}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  listContent: {
    padding: 20,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userNickname: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'white',
  },
  blockDate: {
    fontSize: 13,
    color: Colors.text.light,
  },
  unblockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F0F8FF',
    gap: 4,
  },
  unblockButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
});

export default BlockedUsersScreen;
