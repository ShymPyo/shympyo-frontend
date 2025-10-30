import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
  Switch,
  Platform,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Picker } from '@react-native-picker/picker';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { Colors } from '../constants/colors';
import { RootStackParamList } from '../types';
import ApiService, { AdminPlace, LetterCount, CurrentRental, BusinessHours, DayOfWeek, BlockReason, RentalStatus, ReportReason } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import BlockReasonModal from '../components/BlockReasonModal';
import ReportReasonModal from '../components/ReportReasonModal';
import { connectSSE, disconnectSSE, SSEEvent } from '../services/sse';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

type AdminMainScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AdminMain'>;

const AdminMainScreen: React.FC = () => {
  const navigation = useNavigation<AdminMainScreenNavigationProp>();
  const { accessToken, user, logout } = useAuth();

  const [selectedUser, setSelectedUser] = useState<CurrentRental | null>(null);
  const [isUserModalVisible, setUserModalVisible] = useState(false);
  const [isBlockModalVisible, setBlockModalVisible] = useState(false);
  const [isReportModalVisible, setReportModalVisible] = useState(false);
  const [adminPlace, setAdminPlace] = useState<AdminPlace | null>(null);
  const [users, setUsers] = useState<CurrentRental[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [letterCount, setLetterCount] = useState<LetterCount>({ total: 0, unRead: 0, read: 0 });
  const [isStatusModalVisible, setStatusModalVisible] = useState(false);
  const [isTimeModalVisible, setTimeModalVisible] = useState(false);
  const [maxUsageMinutes, setMaxUsageMinutes] = useState<number>(10);
  const [tempMaxUsageMinutes, setTempMaxUsageMinutes] = useState<number>(10);
  const [isBusinessHoursModalVisible, setBusinessHoursModalVisible] = useState(false);
  const [businessHours, setBusinessHours] = useState<DayOfWeek[]>([]);
  const [tempBusinessHours, setTempBusinessHours] = useState<DayOfWeek[]>([]);
  const [isCapacityModalVisible, setCapacityModalVisible] = useState(false);
  const [maxCapacity, setMaxCapacity] = useState<number>(6);
  const [tempMaxCapacity, setTempMaxCapacity] = useState<number>(6);
  const [defaultOpenTime, setDefaultOpenTime] = useState<string>('09:00');
  const [defaultCloseTime, setDefaultCloseTime] = useState<string>('18:00');
  const [isDefaultTimeModalVisible, setDefaultTimeModalVisible] = useState(false);
  const [tempDefaultOpenTime, setTempDefaultOpenTime] = useState<string>('09:00');
  const [tempDefaultCloseTime, setTempDefaultCloseTime] = useState<string>('18:00');

  // accessToken이나 user가 없으면 로딩 상태 유지
  useEffect(() => {
    if (!accessToken || !user) {
      setIsLoading(true);
    }
  }, [accessToken, user]);

  // 데이터 로드 함수
  const loadAdminData = async () => {
    console.log('🔍 AdminMain - loadAdminData 호출됨');
    console.log('🔍 accessToken 상태:', accessToken ? '존재함' : '없음');
    console.log('🔍 user 상태:', user ? `${user.name} (${user.role})` : '없음');

    if (!accessToken) {
      console.log('❌ accessToken이 없어서 로그인 화면으로 이동');
      Alert.alert('인증 오류', '로그인이 필요합니다.');
      navigation.replace('Login');
      return;
    }

    try {
      setIsLoading(true);
      console.log('🏢 관리자 데이터 로드 시작');

      // 관리자의 장소 목록 조회
      const placesResponse = await ApiService.getAdminPlaces(accessToken);

      if (placesResponse.success && placesResponse.data) {
        setAdminPlace(placesResponse.data);
        setMaxUsageMinutes(placesResponse.data.maxUsageMinutes || 10);
        setMaxCapacity(placesResponse.data.maxCapacity || 6);
        console.log('✅ 관리자 장소 정보 로드:', placesResponse.data);

        // 영업시간 조회
        const businessHoursResponse = await ApiService.getBusinessHours(placesResponse.data.id, accessToken);
        if (businessHoursResponse.success && businessHoursResponse.data) {
          // 시간 형식 변환 (HH:MM:SS -> HH:MM)
          const normalizedHours = businessHoursResponse.data.items.map(item => ({
            ...item,
            // closed가 true면 기본값 사용, false면 실제 시간 사용
            openTime: item.closed ? '09:00' : (item.openTime ? item.openTime.substring(0, 5) : '09:00'),
            closeTime: item.closed ? '18:00' : (item.closeTime ? item.closeTime.substring(0, 5) : '18:00'),
            breakStart: item.breakStart ? item.breakStart.substring(0, 5) : undefined,
            breakEnd: item.breakEnd ? item.breakEnd.substring(0, 5) : undefined,
          }));
          setBusinessHours(normalizedHours);
          console.log('✅ 영업시간 정보 로드:', normalizedHours);
        } else {
          // 기본 영업시간 설정 (모든 요일 09:00-18:00)
          const defaultHours: DayOfWeek[] = [
            'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'
          ].map(day => ({
            dayOfWeek: day as DayOfWeek['dayOfWeek'],
            openTime: '09:00',
            closeTime: '18:00',
            closed: false
          }));
          setBusinessHours(defaultHours);
        }

        // 현재 이용자 목록 조회
        const usersResponse = await ApiService.getCurrentRentals(accessToken);
        if (usersResponse.success && usersResponse.data) {
          setUsers(usersResponse.data);
          console.log('✅ 현재 이용자 목록 로드:', usersResponse.data);
        } else {
          console.log('❌ 현재 이용자 목록 조회 실패:', usersResponse.message);
          setUsers([]);
        }

        // 편지 개수 조회
        const letterCountResponse = await ApiService.getLetterCount(accessToken);
        if (letterCountResponse.success && letterCountResponse.data) {
          setLetterCount(letterCountResponse.data);
          console.log('✅ 편지 개수 로드:', letterCountResponse.data);
        } else {
          console.log('❌ 편지 개수 조회 실패:', letterCountResponse.message);
        }
      } else {
        console.log('❌ 관리자 장소 조회 실패:', placesResponse.message);
        Alert.alert('장소 정보 없음', '등록된 장소가 없습니다.');
      }
    } catch (error) {
      console.error('💥 관리자 데이터 로드 오류:', error);
      Alert.alert('데이터 로드 실패', '정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 초기 데이터 로드 (최초 1회만)
  useEffect(() => {
    if (accessToken && user && !adminPlace) {
      console.log('🔍 useEffect 트리거됨 - 초기 데이터 로드 시작');
      loadAdminData();
    }
  }, [accessToken, user, adminPlace]);

  // SSE 연결 (adminPlace가 로드된 후)
  useEffect(() => {
    if (accessToken && adminPlace?.id) {
      console.log('🔌 SSE 연결 시작:', adminPlace.id);
      const sseConnection = connectSSE(
        adminPlace.id,
        accessToken,
        handleSSEMessage,
        (error) => {
          console.error('❌ SSE 오류:', error);
        }
      );

      return () => {
        console.log('🔌 SSE 연결 해제');
        disconnectSSE();
      };
    }
  }, [accessToken, adminPlace?.id]);

  // 화면 포커스 시 데이터 새로고침
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (accessToken && user) {
        console.log('🔄 화면 포커스 - 데이터 새로고침');
        loadAdminData();
      }
    });

    return unsubscribe;
  }, [navigation, accessToken, user]);

  const handleEditProfile = () => {
    if (adminPlace) {
      navigation.navigate('AdminSpaceEdit', { place: adminPlace });
    } else {
      Alert.alert('오류', '장소 정보를 불러올 수 없습니다.');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigation.replace('Login');
    } catch (error) {
      console.error('❌ 로그아웃 오류:', error);
    }
  };

  const handleUserPress = (user: any) => {
    setSelectedUser(user);
    setUserModalVisible(true);
  };

  const handleAdminExitUser = async () => {
    console.log('🔍 퇴장 버튼 클릭:', {
      selectedUser: selectedUser ? {
        rentalId: selectedUser.rentalId,
        userId: selectedUser.userId,
        nickname: selectedUser.nickname,
      } : null,
      hasAccessToken: !!accessToken,
    });

    if (!selectedUser || !accessToken) {
      console.log('❌ 퇴장 불가:', {
        noSelectedUser: !selectedUser,
        noAccessToken: !accessToken,
      });
      Alert.alert('오류', '사용자 정보 또는 인증 정보가 없습니다.');
      return;
    }

    // 웹 환경에서는 window.confirm 사용
    const isConfirmed = Platform.OS === 'web'
      ? window.confirm('해당 사용자를 퇴장 처리하시겠습니까?')
      : true;

    if (Platform.OS === 'web') {
      if (!isConfirmed) return;

      try {
        console.log('🚪 관리자 퇴장 처리 시작:', {
          rentalId: selectedUser.rentalId,
          userId: selectedUser.userId,
          nickname: selectedUser.nickname,
        });

        const kickResponse = await ApiService.adminKickRental(selectedUser.rentalId, accessToken);

        console.log('📥 Kick 응답:', kickResponse);

        if (kickResponse.success) {
          console.log('✅ 퇴장 성공, 모달 닫기 및 데이터 새로고침');
          window.alert('사용자가 퇴장 처리되었습니다.');
          setUserModalVisible(false);
          await loadAdminData();
        } else {
          console.log('❌ 퇴장 실패:', kickResponse.message);
          window.alert(kickResponse.message || '퇴장 처리에 실패했습니다.');
        }
      } catch (error) {
        console.error('💥 퇴장 처리 오류:', error);
        window.alert('퇴장 처리 중 오류가 발생했습니다.');
      }
    } else {
      Alert.alert(
        '퇴장 처리',
        '해당 사용자를 퇴장 처리하시겠습니까?',
        [
          {
            text: '취소',
            style: 'cancel',
          },
          {
            text: '퇴장',
            style: 'destructive',
            onPress: async () => {
              try {
                console.log('🚪 관리자 퇴장 처리 시작:', {
                  rentalId: selectedUser.rentalId,
                  userId: selectedUser.userId,
                  nickname: selectedUser.nickname,
                });

                const kickResponse = await ApiService.adminKickRental(selectedUser.rentalId, accessToken);

                console.log('📥 Kick 응답:', kickResponse);

                if (kickResponse.success) {
                  console.log('✅ 퇴장 성공, 모달 닫기 및 데이터 새로고침');
                  Alert.alert('퇴장 완료', '사용자가 퇴장 처리되었습니다.');
                  setUserModalVisible(false);
                  await loadAdminData();
                } else {
                  console.log('❌ 퇴장 실패:', kickResponse.message);
                  Alert.alert('오류', kickResponse.message || '퇴장 처리에 실패했습니다.');
                }
              } catch (error) {
                console.error('💥 퇴장 처리 오류:', error);
                Alert.alert('오류', '퇴장 처리 중 오류가 발생했습니다.');
              }
            },
          },
        ]
      );
    }
  };

  const handleReportUser = () => {
    console.log('🚨 신고 버튼 클릭:', selectedUser ? {
      userId: selectedUser.userId,
      nickname: selectedUser.nickname,
    } : 'selectedUser 없음');
    setUserModalVisible(false);
    setReportModalVisible(true);
  };

  const handleReportConfirm = async (reason: ReportReason, content: string) => {
    if (!selectedUser || !accessToken) return;

    try {
      const reportResponse = await ApiService.createReport(
        {
          reportedUserId: selectedUser.userId,
          rentalId: selectedUser.rentalId,
          reason,
          content,
        },
        accessToken
      );

      if (reportResponse.success) {
        Alert.alert('신고 완료', `${selectedUser.nickname}님이 신고되었습니다.\n3회 누적 시 자동 제재됩니다.`);
        setReportModalVisible(false);
        setSelectedUser(null);
      } else {
        Alert.alert('오류', reportResponse.message || '신고에 실패했습니다.');
      }
    } catch (error) {
      console.error('💥 신고 처리 오류:', error);
      Alert.alert('오류', '신고 처리 중 오류가 발생했습니다.');
    }
  };

  const handleBlockUser = () => {
    console.log('🚫 차단 버튼 클릭:', selectedUser ? {
      userId: selectedUser.userId,
      nickname: selectedUser.nickname,
    } : 'selectedUser 없음');
    setUserModalVisible(false);
    setBlockModalVisible(true);
  };

  const handleBlockConfirm = async (reason: BlockReason, detail: string) => {
    if (!selectedUser || !accessToken || !adminPlace) return;

    try {
      // 7일 후 차단 해제 날짜 계산
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);
      const endAt = endDate.toISOString();

      const blockResponse = await ApiService.blockUser(
        selectedUser.userId,
        { reason, detail, endAt, placeId: adminPlace.id },
        accessToken
      );

      if (blockResponse.success) {
        Alert.alert('차단 완료', `${selectedUser.nickname}님이 차단되었습니다.`);
        setBlockModalVisible(false);
        setSelectedUser(null);
        // 데이터 새로고침
        loadAdminData();
      } else {
        Alert.alert('오류', blockResponse.message || '차단에 실패했습니다.');
      }
    } catch (error) {
      console.error('💥 차단 처리 오류:', error);
      Alert.alert('오류', '차단 처리 중 오류가 발생했습니다.');
    }
  };

  // SSE 메시지 핸들러
  const handleSSEMessage = (event: SSEEvent) => {
    console.log('📨 SSE 메시지 수신:', event);

    switch (event.type) {
      case 'hello':
        console.log('✅ SSE 연결 확인');
        break;
      case 'rental-started':
        console.log('🔔 입장 이벤트:', event.data);
        loadAdminData(); // 실시간 갱신
        break;
      case 'rental-ended':
        console.log('🔔 퇴장 이벤트:', event.data);
        loadAdminData(); // 실시간 갱신
        break;
      case 'rental-kicked':
        console.log('🔔 강퇴 이벤트:', event.data);
        loadAdminData(); // 실시간 갱신
        break;
      case 'ping':
        // 연결 유지용 ping - 로그 불필요
        break;
      default:
        console.log('📨 알 수 없는 SSE 이벤트:', event);
    }
  };

  // 대여 상태 텍스트 변환
  const getRentalStatusText = (status: RentalStatus) => {
    switch (status) {
      case 'USING':
        return '이용 중';
      case 'TIME_EXCEEDED':
        return '시간 초과';
      case 'ENDED':
        return '종료';
      case 'CANCELED':
        return '취소됨';
      case 'KICKED':
        return '강퇴됨';
      default:
        return status;
    }
  };

  // 대여 상태 색상
  const getRentalStatusColor = (status: RentalStatus) => {
    switch (status) {
      case 'USING':
        return '#4CAF50'; // 녹색
      case 'TIME_EXCEEDED':
        return '#FF9800'; // 주황색
      case 'ENDED':
        return '#9E9E9E'; // 회색
      case 'CANCELED':
        return '#9E9E9E'; // 회색
      case 'KICKED':
        return '#F44336'; // 빨간색
      default:
        return '#9E9E9E';
    }
  };

  const handleStatusChange = async (status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE') => {
    if (!accessToken) return;

    const statusText = status === 'ACTIVE' ? '운영 중' : status === 'INACTIVE' ? '운영 중지' : '점검 중';

    Alert.alert(
      '상태 변경',
      `쉼터를 "${statusText}"으로 변경하시겠습니까?`,
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '변경',
          onPress: async () => {
            try {
              const response = await ApiService.updatePlaceStatus(status, accessToken);

              if (response.success) {
                Alert.alert('변경 완료', `쉼터 상태가 "${statusText}"으로 변경되었습니다.`);
                setStatusModalVisible(false);
                loadAdminData();
              } else {
                Alert.alert('오류', response.message || '상태 변경에 실패했습니다.');
              }
            } catch (error) {
              console.error('💥 상태 변경 오류:', error);
              Alert.alert('오류', '상태 변경 중 오류가 발생했습니다.');
            }
          },
        },
      ]
    );
  };


  const getStatusText = (status?: string) => {
    switch (status) {
      case 'ACTIVE': return '운영 중';
      case 'INACTIVE': return '운영 중지';
      case 'MAINTENANCE': return '점검 중';
      default: return '운영 중';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'ACTIVE': return Colors.primary;
      case 'INACTIVE': return '#FF4444';
      case 'MAINTENANCE': return '#FFA500';
      default: return Colors.primary;
    }
  };

  const getDayName = (day: string) => {
    const names: Record<string, string> = {
      MONDAY: '월',
      TUESDAY: '화',
      WEDNESDAY: '수',
      THURSDAY: '목',
      FRIDAY: '금',
      SATURDAY: '토',
      SUNDAY: '일'
    };
    return names[day] || day;
  };

  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const handleEditDay = (day: DayOfWeek) => {
    console.log('🖊️ 요일 편집 시작:', day);

    const dayName = getDayName(day.dayOfWeek);
    const isClosed = day.closed;

    Alert.alert(
      `${dayName}요일 설정`,
      isClosed ? '현재 휴무일입니다' : `영업시간: ${day.openTime} - ${day.closeTime}`,
      [
        {
          text: '취소',
          style: 'cancel'
        },
        {
          text: isClosed ? '영업일로 변경' : '휴무일로 변경',
          onPress: () => {
            // 휴무일 -> 영업일: 기본 영업시간 사용
            // 영업일 -> 휴무일: 기존 시간 유지
            const updatedDay = isClosed
              ? { ...day, closed: false, openTime: defaultOpenTime, closeTime: defaultCloseTime }
              : { ...day, closed: true };
            const updatedHours = tempBusinessHours.map(d =>
              d.dayOfWeek === day.dayOfWeek ? updatedDay : d
            );
            setTempBusinessHours(updatedHours);
          }
        },
        ...(!isClosed ? [{
          text: '시간 변경',
          onPress: () => showTimeChangeAlert(day)
        }] : [])
      ]
    );
  };

  const showTimeChangeAlert = (day: DayOfWeek) => {
    // 30분 단위 시간 옵션 생성
    const timeOptions = Array.from({ length: 48 }, (_, i) => {
      const hours = Math.floor(i / 2);
      const minutes = (i % 2) * 30;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    });

    Alert.alert(
      `${getDayName(day.dayOfWeek)}요일 시간 변경`,
      '오픈 시간을 선택하세요',
      timeOptions.map(time => ({
        text: time,
        onPress: () => {
          // 오픈 시간 선택 후 마감 시간 선택
          Alert.alert(
            `${getDayName(day.dayOfWeek)}요일 시간 변경`,
            '마감 시간을 선택하세요',
            timeOptions.map(closeTime => ({
              text: closeTime,
              onPress: () => {
                const updatedDay = { ...day, openTime: time, closeTime: closeTime };
                const updatedHours = tempBusinessHours.map(d =>
                  d.dayOfWeek === day.dayOfWeek ? updatedDay : d
                );
                setTempBusinessHours(updatedHours);
                Alert.alert('변경 완료', `${getDayName(day.dayOfWeek)}요일: ${time} - ${closeTime}\n\n저장 버튼을 눌러 적용하세요.`);
              }
            })).concat([{ text: '취소', style: 'cancel' } as AlertButton]),
            { cancelable: true }
          );
        }
      })).concat([{ text: '취소', style: 'cancel' } as AlertButton]),
      { cancelable: true }
    );
  };


  const handleOpenTimeModal = () => {
    setTempMaxUsageMinutes(maxUsageMinutes);
    setTimeModalVisible(true);
  };

  const handleCloseTimeModal = () => {
    setTimeModalVisible(false);
  };

  const handleMaxTimeUpdate = async () => {
    if (!accessToken || !adminPlace) return;

    if (tempMaxUsageMinutes < 1) {
      Alert.alert('오류', '최소 1분 이상 입력해주세요.');
      return;
    }

    try {
      const response = await ApiService.updatePlace(
        {
          name: adminPlace.name,
          content: adminPlace.content,
          maxCapacity: adminPlace.maxCapacity ?? 0,
          maxUsageMinutes: tempMaxUsageMinutes,
          address: adminPlace.address,
        },
        accessToken
      );

      if (response.success) {
        setMaxUsageMinutes(tempMaxUsageMinutes);
        Alert.alert('수정 완료', `최대 이용 시간이 ${tempMaxUsageMinutes}분으로 변경되었습니다.`);
        setTimeModalVisible(false);
        loadAdminData();
      } else {
        Alert.alert('오류', response.message || '수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('💥 최대 시간 수정 오류:', error);
      Alert.alert('오류', '수정 중 오류가 발생했습니다.');
    }
  };

  const handleOpenCapacityModal = () => {
    setTempMaxCapacity(maxCapacity);
    setCapacityModalVisible(true);
  };

  const handleCloseCapacityModal = () => {
    setCapacityModalVisible(false);
  };

  const handleMaxCapacityUpdate = async () => {
    if (!accessToken || !adminPlace) return;

    if (tempMaxCapacity < 1) {
      Alert.alert('오류', '최소 1명 이상 입력해주세요.');
      return;
    }

    try {
      const response = await ApiService.updatePlace(
        {
          name: adminPlace.name,
          content: adminPlace.content,
          maxCapacity: tempMaxCapacity,
          maxUsageMinutes: adminPlace.maxUsageMinutes,
          address: adminPlace.address,
        },
        accessToken
      );

      if (response.success) {
        setMaxCapacity(tempMaxCapacity);
        Alert.alert('수정 완료', `최대 인원수가 ${tempMaxCapacity}명으로 변경되었습니다.`);
        setCapacityModalVisible(false);
        loadAdminData();
      } else {
        Alert.alert('오류', response.message || '수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('💥 최대 인원수 수정 오류:', error);
      Alert.alert('오류', '수정 중 오류가 발생했습니다.');
    }
  };

  const handleSaveBusinessHours = async () => {
    if (!accessToken || !adminPlace) return;

    const formattedHours = tempBusinessHours.map(item => ({
      dayOfWeek: item.dayOfWeek,
      openTime: item.openTime + ':00',
      closeTime: item.closeTime + ':00',
      breakStart: item.breakStart ? (item.breakStart + ':00') : undefined,
      breakEnd: item.breakEnd ? (item.breakEnd + ':00') : undefined,
      closed: item.closed,
    }));

    console.log('📤 영업시간 저장 요청:', JSON.stringify({ items: formattedHours }, null, 2));

    try {
      const response = await ApiService.updateBusinessHours(
        adminPlace.id,
        { items: formattedHours },
        accessToken
      );

      if (response.success) {
        setBusinessHours(tempBusinessHours);
        Alert.alert('저장 완료', '영업시간이 저장되었습니다.');
        setBusinessHoursModalVisible(false);
        loadAdminData();
      } else {
        Alert.alert('오류', response.message || '저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('💥 영업시간 저장 오류:', error);
      Alert.alert('오류', '저장 중 오류가 발생했습니다.');
    }
  };

  const handleCloseBusinessHoursModal = () => {
    console.log('❌ 영업시간 모달 닫기');
    setBusinessHoursModalVisible(false);
  };

  const handleOpenDefaultTimeModal = () => {
    setTempDefaultOpenTime(defaultOpenTime);
    setTempDefaultCloseTime(defaultCloseTime);
    setDefaultTimeModalVisible(true);
  };

  const handleCloseDefaultTimeModal = () => {
    setDefaultTimeModalVisible(false);
  };

  const getTodayBusinessHours = () => {
    if (!businessHours || businessHours.length === 0) {
      return '영업시간 정보 없음';
    }
    const dayIndex = new Date().getDay();
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const today = days[dayIndex];

    const todayHours = businessHours.find(h => h.dayOfWeek === today);

    if (!todayHours) {
      return '영업시간 정보 없음';
    }

    if (todayHours.closed) {
      return '오늘 휴무';
    }

    return `오늘 ${todayHours.openTime} - ${todayHours.closeTime}`;
  };

  const handleSaveDefaultTime = () => {
    setDefaultOpenTime(tempDefaultOpenTime);
    setDefaultCloseTime(tempDefaultCloseTime);
    Alert.alert('변경 완료', `영업시간: ${tempDefaultOpenTime} - ${tempDefaultCloseTime}`);
    setDefaultTimeModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />



      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 환영 메시지 */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>
            {adminPlace?.name || user?.name || '관리자'} 사장님 환영합니다 !
          </Text>

        </View>

        {/* 공간 프로필 카드 */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Text style={styles.profileTitle}>공간 프로필</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEditProfile}
            >
              <Ionicons name="create" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 20 }} />
          ) : adminPlace ? (
            <>
              <View style={styles.profileContent}>
                <Image
                  source={{
                    uri: (adminPlace.imageUrl && !adminPlace.imageUrl.includes('example.com'))
                      ? adminPlace.imageUrl
                      : 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
                  }}
                  style={styles.shopImage}
                />
                <View style={styles.shopInfo}>
                  <Text style={styles.shopName}>{adminPlace.name}</Text>
                  <View style={styles.shopDetails}>
                    <Ionicons name="time-outline" size={16} color={Colors.text.secondary} />
                    <Text style={styles.shopTime}>{getTodayBusinessHours()}</Text>
                  </View>
                  <View style={styles.shopLocation}>
                    <Ionicons name="location" size={16} color={Colors.text.secondary} />
                    <Text style={styles.shopAddress}>{adminPlace.address}</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.shopDescription}>{adminPlace.content}</Text>

              {/* 운영 상태 및 설정 */}
              <View style={styles.settingsSection}>
                <View style={styles.settingRow}>
                  <View style={styles.settingLabel}>
                    <Ionicons name="radio-button-on" size={20} color={getStatusColor(adminPlace.status)} />
                    <Text style={styles.settingText}>운영 상태</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.settingButton}
                    onPress={() => setStatusModalVisible(true)}
                  >
                    <Text style={[styles.settingValue, { color: getStatusColor(adminPlace.status) }]}>
                      {getStatusText(adminPlace.status)}
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color={Colors.text.light} />
                  </TouchableOpacity>
                </View>

                <View style={styles.settingRow}>
                  <View style={styles.settingLabel}>
                    <Ionicons name="people-outline" size={20} color={Colors.primary} />
                    <Text style={styles.settingText}>최대 인원수</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.settingButton}
                    onPress={handleOpenCapacityModal}
                  >
                    <Text style={styles.settingValue}>{maxCapacity}명</Text>
                    <Ionicons name="chevron-forward" size={18} color={Colors.text.light} />
                  </TouchableOpacity>
                </View>

                <View style={styles.settingRow}>
                  <View style={styles.settingLabel}>
                    <Ionicons name="time-outline" size={20} color={Colors.primary} />
                    <Text style={styles.settingText}>최대 이용 시간</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.settingButton}
                    onPress={handleOpenTimeModal}
                  >
                    <Text style={styles.settingValue}>{maxUsageMinutes}분</Text>
                    <Ionicons name="chevron-forward" size={18} color={Colors.text.light} />
                  </TouchableOpacity>
                </View>

                <View style={styles.settingRow}>
                  <View style={styles.settingLabel}>
                    <Ionicons name="time-outline" size={20} color={Colors.primary} />
                    <Text style={styles.settingText}>영업시간</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.settingButton}
                    onPress={handleOpenDefaultTimeModal}
                  >
                    <Text style={styles.settingValue}>{defaultOpenTime} - {defaultCloseTime}</Text>
                    <Ionicons name="chevron-forward" size={18} color={Colors.text.light} />
                  </TouchableOpacity>
                </View>

                <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
                  <View style={styles.settingLabel}>
                    <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
                    <Text style={styles.settingText}>정기 휴무</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.settingButton}
                    onPress={() => {
                      setTempBusinessHours(JSON.parse(JSON.stringify(businessHours)));
                      setBusinessHoursModalVisible(true);
                    }}
                  >
                    <Text style={styles.settingValue}>
                      {businessHours.filter(d => d.closed).length > 0
                        ? `${businessHours.filter(d => d.closed).map(d => getDayName(d.dayOfWeek)).join(', ')} 휴무`
                        : '설정'}
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color={Colors.text.light} />
                  </TouchableOpacity>
                </View>
              </View>
            </>
          ) : (
            <Text style={styles.noDataText}>장소 정보를 불러올 수 없습니다.</Text>
          )}
        </View>

        {/* 인원 현황 */}
        <View style={styles.statsSection}>
          <Text style={styles.statsTitle}>
            인원 현황 ({users.length}/{adminPlace?.maxCapacity || 6})
          </Text>
          <View style={styles.statsGrid}>
            {/* 현재 사용자들 */}
            {users.map((user) => (
              <TouchableOpacity
                key={user.rentalId}
                style={styles.userStats}
                onPress={() => handleUserPress(user)}
              >
                <Image
                  source={{
                    uri: (user.imageUrl && !user.imageUrl.includes('example.com'))
                      ? user.imageUrl
                      : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
                  }}
                  style={styles.userProfile}
                />
                <Text style={styles.userName}>{user.nickname || user.userName}</Text>
                <Text style={styles.userTimeLeft}>
                  {(() => {
                    const startTime = new Date(user.startTime);
                    const maxMinutes = maxUsageMinutes || 10;
                    const endTime = new Date(startTime.getTime() + maxMinutes * 60 * 1000);
                    return `${endTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 종료 예정`;
                  })()}
                </Text>
              </TouchableOpacity>
            ))}

            {/* 빈 자리들 */}
            {Array.from({ length: (adminPlace?.maxCapacity || 6) - users.length }, (_, index) => (
              <View key={`empty-${index}`} style={styles.emptySlot}>
                <View style={styles.emptyProfile}>
                  <Ionicons name="person-outline" size={24} color={Colors.text.light} />
                </View>
                <Text style={styles.emptyText}>빈 자리</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 편지함 섹션 */}
        <TouchableOpacity
          style={styles.letterSection}
          onPress={() => navigation.navigate('AdminLetterList')}
        >
          <View style={styles.letterSectionHeader}>
            <Text style={styles.sectionTitle}>편지함</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.text.primary} />
          </View>
          {letterCount.unRead > 0 && (
            <View style={styles.letterCount}>
              <Ionicons name="alert-circle" size={16} color={Colors.primary} />
              <Text style={styles.countText}>새로운 편지가 {letterCount.unRead}개 도착했습니다.</Text>
            </View>
          )}
          <View style={styles.notificationBanner}>
            <Ionicons name="mail" size={20} color={Colors.text.primary} />
            <Text style={styles.notificationText}>지금까지 총 {letterCount.total}개의 감사 편지를 받았어요 !</Text>
          </View>
        </TouchableOpacity>

        {/* 차단 관리 섹션 */}
        <TouchableOpacity
          style={styles.blockSection}
          onPress={() => navigation.navigate('BlockedUsers')}
        >
          <View style={styles.blockSectionHeader}>
            <View style={styles.blockSectionLeft}>
              
              <Text style={styles.blockSectionTitle}>차단 관리</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.text.primary} />
          </View>
          <Text style={styles.blockSectionDescription}>차단한 사용자를 관리합니다</Text>
        </TouchableOpacity>

        {/* 로그아웃 버튼 */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#FF4444" style={styles.logoutIcon} />
          <Text style={styles.logoutButtonText}>로그아웃</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.text.light} />
        </TouchableOpacity>
      </ScrollView>

      {/* 사용자 프로필 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isUserModalVisible}
        onRequestClose={() => setUserModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setUserModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.userModalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.userModalHeader}>
              <TouchableOpacity onPress={() => setUserModalVisible(false)}>
                <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
              <Text style={styles.userModalTitle}>사용자 프로필</Text>
              <View style={{ width: 24 }} />
            </View>

            <View style={styles.userModalProfile}>
              <Image
                source={{ uri: selectedUser?.imageUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face' }}
                style={styles.userModalProfileCircle}
              />
              <Text style={styles.userModalName}>{selectedUser?.nickname || selectedUser?.userName}</Text>
              {selectedUser?.bio && (
                <Text style={styles.userModalBio}>{selectedUser.bio}</Text>
              )}
            </View>

            <View style={styles.userModalInfoSection}>
              {/* 상태 표시 */}
              <View style={styles.userModalInfoRow}>
                <Text style={styles.userModalLabel}>상태</Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getRentalStatusColor(selectedUser?.status || 'USING') }
                ]}>
                  <Text style={styles.statusBadgeText}>{getRentalStatusText(selectedUser?.status || 'USING')}</Text>
                </View>
              </View>

              <View style={styles.userModalInfoRow}>
                <Text style={styles.userModalLabel}>입실 시간</Text>
                <Text style={styles.userModalInfoText}>
                  {selectedUser?.startTime ? new Date(selectedUser.startTime).toLocaleString('ko-KR') : '-'}
                </Text>
              </View>

              <View style={styles.userModalInfoRow}>
                <Text style={styles.userModalLabel}>종료 예정</Text>
                <Text style={styles.userModalInfoText}>
                  {selectedUser?.dueTime ? new Date(selectedUser.dueTime).toLocaleString('ko-KR') : '-'}
                </Text>
              </View>

              {selectedUser?.userEmail && (
                <View style={styles.userModalInfoRow}>
                  <Text style={styles.userModalLabel}>이메일</Text>
                  <Text style={styles.userModalInfoText}>{selectedUser.userEmail}</Text>
                </View>
              )}

              {selectedUser?.userPhone && (
                <View style={styles.userModalInfoRow}>
                  <Text style={styles.userModalLabel}>전화번호</Text>
                  <Text style={styles.userModalInfoText}>{selectedUser.userPhone}</Text>
                </View>
              )}
            </View>

            <View style={styles.userModalActions}>
              <TouchableOpacity style={styles.reportUserButton} onPress={handleReportUser}>
                <Ionicons name="alert-circle-outline" size={18} color="white" />
                <Text style={styles.reportUserButtonText}>신고</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.blockUserButton} onPress={handleBlockUser}>
                <Ionicons name="ban-outline" size={18} color="white" />
                <Text style={styles.blockUserButtonText}>차단</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.exitUserButton} onPress={handleAdminExitUser}>
                <Ionicons name="log-out-outline" size={18} color="white" />
                <Text style={styles.exitUserButtonText}>퇴장</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* 신고 사유 선택 모달 */}
      <ReportReasonModal
        visible={isReportModalVisible}
        userNickname={selectedUser?.nickname || ''}
        onClose={() => setReportModalVisible(false)}
        onConfirm={handleReportConfirm}
      />

      {/* 차단 사유 선택 모달 */}
      <BlockReasonModal
        visible={isBlockModalVisible}
        userNickname={selectedUser?.nickname || ''}
        onClose={() => setBlockModalVisible(false)}
        onConfirm={handleBlockConfirm}
      />

      {/* 상태 변경 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isStatusModalVisible}
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setStatusModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.statusModalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>운영 상태 변경</Text>
              <TouchableOpacity onPress={() => setStatusModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.statusOption, adminPlace?.status === 'ACTIVE' && styles.statusOptionSelected]}
              onPress={() => handleStatusChange('ACTIVE')}
            >
              <Ionicons name="radio-button-on" size={24} color={Colors.primary} />
              <View style={styles.statusOptionText}>
                <Text style={styles.statusOptionTitle}>운영 중</Text>
                <Text style={styles.statusOptionDescription}>정상 운영 중입니다</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statusOption, adminPlace?.status === 'INACTIVE' && styles.statusOptionSelected]}
              onPress={() => handleStatusChange('INACTIVE')}
            >
              <Ionicons name="radio-button-on" size={24} color="#FF4444" />
              <View style={styles.statusOptionText}>
                <Text style={styles.statusOptionTitle}>운영 중지</Text>
                <Text style={styles.statusOptionDescription}>일시적으로 운영을 중지합니다</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statusOption, adminPlace?.status === 'MAINTENANCE' && styles.statusOptionSelected]}
              onPress={() => handleStatusChange('MAINTENANCE')}
            >
              <Ionicons name="radio-button-on" size={24} color="#FFA500" />
              <View style={styles.statusOptionText}>
                <Text style={styles.statusOptionTitle}>점검 중</Text>
                <Text style={styles.statusOptionDescription}>시설 점검 중입니다</Text>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* 최대 이용 시간 설정 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isTimeModalVisible}
        onRequestClose={handleCloseTimeModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleCloseTimeModal}
        >
          <TouchableOpacity
            style={styles.timeModalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>최대 이용 시간 설정</Text>
              <TouchableOpacity onPress={handleCloseTimeModal}>
                <Ionicons name="close" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.timeInputSection}>
              <Text style={styles.pickerTitle}>현재 설정: {tempMaxUsageMinutes}분</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={tempMaxUsageMinutes}
                  onValueChange={(value) => setTempMaxUsageMinutes(value)}
                  style={styles.picker}
                  itemStyle={{ color: Colors.text.primary, fontSize: 20 }}
                >
                  {[...Array(24)].map((_, i) => {
                    const minutes = (i + 1) * 5;
                    return <Picker.Item key={minutes} label={`${minutes}분`} value={minutes} color={Colors.text.primary} />;
                  })}
                </Picker>
              </View>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleMaxTimeUpdate}>
              <Text style={styles.saveButtonText}>저장</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* 최대 인원수 설정 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isCapacityModalVisible}
        onRequestClose={handleCloseCapacityModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleCloseCapacityModal}
        >
          <TouchableOpacity
            style={styles.timeModalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>최대 인원수 설정</Text>
              <TouchableOpacity onPress={handleCloseCapacityModal}>
                <Ionicons name="close" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.timeInputSection}>
              <Text style={styles.pickerTitle}>현재 설정: {tempMaxCapacity}명</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={tempMaxCapacity}
                  onValueChange={(value) => setTempMaxCapacity(value)}
                  style={styles.picker}
                  itemStyle={{ color: Colors.text.primary, fontSize: 20 }}
                >
                  {[...Array(20)].map((_, i) => {
                    const capacity = i + 1;
                    return <Picker.Item key={capacity} label={`${capacity}명`} value={capacity} color={Colors.text.primary} />;
                  })}
                </Picker>
              </View>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleMaxCapacityUpdate}>
              <Text style={styles.saveButtonText}>저장</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* 영업시간 설정 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isBusinessHoursModalVisible}
        onRequestClose={handleCloseBusinessHoursModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.businessHoursModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>정기휴무</Text>
              <TouchableOpacity onPress={handleCloseBusinessHoursModal}>
                <Ionicons name="close" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.daysList} showsVerticalScrollIndicator={false}>
              {tempBusinessHours.map((day) => (
                <TouchableOpacity
                  key={day.dayOfWeek}
                  style={styles.dayItem}
                  onPress={() => handleEditDay(day)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dayName}>{getDayName(day.dayOfWeek)}</Text>

                  <View style={styles.dayContent}>
                    {day.closed ? (
                      <Text style={styles.closedText}>휴무</Text>
                    ) : (
                      <Text style={styles.hoursText}>
                        {day.openTime} - {day.closeTime}
                      </Text>
                    )}
                    <Ionicons name="chevron-forward" size={18} color={Colors.text.light} />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveBusinessHours}>
              <Text style={styles.saveButtonText}>저장</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 영업시간 설정 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isDefaultTimeModalVisible}
        onRequestClose={handleCloseDefaultTimeModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleCloseDefaultTimeModal}
        >
          <TouchableOpacity
            style={styles.timeModalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>영업시간 설정</Text>
              <TouchableOpacity onPress={handleCloseDefaultTimeModal}>
                <Ionicons name="close" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.timePickerRow}>
              <View style={styles.timePickerHalf}>
                <Text style={styles.timeInputLabel}>오픈 시간</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={tempDefaultOpenTime}
                    onValueChange={(value) => setTempDefaultOpenTime(value)}
                    style={styles.picker}
                    itemStyle={{ color: Colors.text.primary, fontSize: 18 }}
                  >
                    {Array.from({ length: 48 }, (_, i) => {
                      const hours = Math.floor(i / 2);
                      const minutes = (i % 2) * 30;
                      const time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                      return <Picker.Item key={time} label={time} value={time} color={Colors.text.primary} />;
                    })}
                  </Picker>
                </View>
              </View>

              <View style={styles.timePickerHalf}>
                <Text style={styles.timeInputLabel}>마감 시간</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={tempDefaultCloseTime}
                    onValueChange={(value) => setTempDefaultCloseTime(value)}
                    style={styles.picker}
                    itemStyle={{ color: Colors.text.primary, fontSize: 18 }}
                  >
                    {Array.from({ length: 49 }, (_, i) => {
                      const hours = Math.floor(i / 2);
                      const minutes = (i % 2) * 30;
                      const time = i === 48 ? '24:00' : `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                      return <Picker.Item key={time} label={time} value={time} color={Colors.text.primary} />;
                    })}
                  </Picker>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveDefaultTime}>
              <Text style={styles.saveButtonText}>저장</Text>
            </TouchableOpacity>
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

  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  welcomeSection: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 5,
  },

  profileCard: {
    backgroundColor: 'transparent',
    borderRadius: 15,
    paddingVertical: 20,
    marginBottom: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  editButton: {
    padding: 5,
  },
  profileContent: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  shopImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 5,
  },
  shopDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  shopTime: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginLeft: 5,
  },
  shopSubtext: {
    fontSize: 12,
    color: Colors.text.light,
    marginBottom: 5,
  },
  shopLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopAddress: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginLeft: 5,
    marginRight: 5,
  },
  shopBuilding: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  shopDescription: {
    fontSize: Platform.OS === 'android' ? 12 : 14,
    color: Colors.text.primary,
    marginTop: 15,
    marginBottom: 5,
    lineHeight: 22, // Add some line height for readability
  },
  letterSection: {
    backgroundColor: 'transparent',
    borderRadius: 15,
    paddingVertical: 20,
    marginBottom: 15,
  },
  letterSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  blockSection: {
    backgroundColor: 'transparent',
    borderRadius: 15,
    paddingVertical: 20,
    marginBottom: 15,
  },
  blockSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  blockSectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  blockSectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  blockSectionDescription: {
    fontSize: 14,
    color: Colors.text.light,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  letterCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  countText: {
    fontSize: 14,
    color: Colors.primary,
    marginLeft: 5,
    fontWeight: '600',
  },
  notificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  notificationText: {
    fontSize: 14,
    color: Colors.text.primary,
    marginLeft: 10,
    fontWeight: '500',
  },
  statsSection: {
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  userStats: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 15,
    borderRadius: 12,
    width: '31%',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  emptySlot: {
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 12,
    width: '31%',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderStyle: 'dashed',
  },
  userProfile: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFE4B5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyProfile: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderStyle: 'dashed',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 3,
  },
  userBio: {
    fontSize: 12,
    color: Colors.text.light,
    marginTop: 2,
    fontStyle: 'italic',
  },
  userTime: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  userTimeLeft: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.text.light,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginBottom: 30,
  },
  logoutIcon: {
    marginRight: 15,
  },
  logoutButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#FF4444',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userModalContent: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    maxHeight: '70%',
  },
  userModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  userModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  userModalProfile: {
    alignItems: 'center',
    marginBottom: 25,
  },
  userModalProfileCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFE4B5',
    marginBottom: 15,
  },
  userModalName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  userModalNickname: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 5,
  },
  userModalBio: {
    fontSize: 14,
    color: Colors.text.light,
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  userModalInfoSection: {
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
  },
  userModalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userModalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.light,
  },
  userModalInfoText: {
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  userModalBioSection: {
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
  },
  userModalBioText: {
    fontSize: 16,
    color: Colors.text.primary,
    lineHeight: 24,
    marginTop: 10,
  },
  userModalActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  reportUserButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9C27B0',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  reportUserButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  blockUserButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF8C00',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  blockUserButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  exitUserButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF4444',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  exitUserButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'white',
  },
  noDataText: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginVertical: 20,
  },
  settingsSection: {
    marginTop: 15,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  settingText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  settingValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  statusModalContent: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 10,
    gap: 15,
  },
  statusOptionSelected: {
    backgroundColor: '#E8F4FD',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  statusOptionText: {
    flex: 1,
  },
  statusOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 3,
  },
  statusOptionDescription: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  timeModalContent: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
  },
  timeInputSection: {
    marginBottom: 20,
  },
  timePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
    marginBottom: 20,
  },
  timePickerHalf: {
    flex: 1,
  },
  timeInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
    marginBottom: 20,
  },
  timeInputHalf: {
    flex: 1,
  },
  timeInput: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    textAlign: 'center',
  },
  timeInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 10,
    textAlign: 'center',
  },
  helperText: {
    fontSize: 12,
    color: Colors.text.light,
    marginTop: 5,
    textAlign: 'center',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 15,
    textAlign: 'center',
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  picker: {
    height: 200,
    width: '100%',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  businessHoursModalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  daysList: {
    maxHeight: 400,
    marginBottom: 20,
  },
  dayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 10,
  },
  dayName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text.primary,
    width: 40,
  },
  dayContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 15,
  },
  hoursText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  closedText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF4444',
  },
  editDayModalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  closedToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 20,
  },
  closedToggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  timeSliderSection: {
    marginBottom: 25,
  },
  timeSliderLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  timeSliderValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 10,
  },
  slider: {
    width: '100%',
    height: 40,
  },
});

export default AdminMainScreen;