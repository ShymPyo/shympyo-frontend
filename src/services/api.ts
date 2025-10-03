const BASE_URL = 'https://shympyo.kro.kr/api';

interface ApiResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: T | null;
}

interface UserSignUpRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
  nickname: string;
  imageUrl?: string;
  bio?: string;
  role: 'USER';
}

interface UserLoginRequest {
  email: string;
  password: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface User {
  id: number;
  email: string;
  name: string;
  phone: string;
  nickname: string;
  imageUrl?: string;
  bio?: string;
  role: string;
}

interface MapLocation {
  id: number;
  latitude: number;
  longitude: number;
  type: 'SHELTER' | 'CAFE' | 'RESTAURANT' | 'STORE';
}

interface NearbyPlace {
  id: number;
  name: string;
  address: string;
  content: string;
  type: 'SHELTER' | 'CAFE' | 'RESTAURANT' | 'STORE';
  distanceM: number;
}

interface PlaceDetail {
  id: number;
  name: string;
  address: string;
  content: string;
  latitude: number;
  longitude: number;
  type: 'SHELTER' | 'CAFE' | 'RESTAURANT' | 'STORE';
  currentUserCount?: number;  // 현재 이용 중인 사용자 수
  maxCapacity?: number;       // 최대 수용 인원
}

interface RentalEnterRequest {
  placeCode: string;
}

interface QRCodeResponse {
  placeCode: string;
}

interface RentalEnterResponse {
  rentalId: number;
  placeId: number;
  placeName: string;
  startTime: string;
  maxTime: number;
  status: string;
}

interface RentalExitResponse {
  rentalId: number;
  placeId: number;
  placeName: string;
  startTime: string;
  endTime: string;
  status: string;
}

interface VisitedPlace {
  rentalId: number;
  placeId: string;
  placeName: string;
  startTime: string;
  endTime: string;
  isWritten?: boolean;  // letterSent → isWritten 변경
  letterRead?: boolean;
  letterId?: number;
}

interface VisitedPlacesResponse {
  content: VisitedPlace[];
  hasNext: boolean;
}

interface SendLetterRequest {
  placeId: number;   // 백엔드가 아직 placeId 요구
  rentalId: number;  // rentalId도 추가
  content: string;
}

interface AdminPlace {
  id: number;
  name: string;
  address: string;
  content: string;
  openTime: string;
  closeTime: string;
  imageUrl?: string;
  currentUsers?: number;
  maxCapacity?: number;
  maxUsageMinutes?: number;
  status?: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'DELETED';
}

interface DayOfWeek {
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  openTime: string;
  closeTime: string;
  breakStart?: string;
  breakEnd?: string;
  closed: boolean;
}

interface BusinessHours {
  placeId: number;
  items: DayOfWeek[];
}

interface SendLetterResponse {
  id: number;
  placeId: number;
  placeName: string;
  writerId: number;
  writeName: string;
  content: string;
  readAt?: string;
  createdAt: string;
  read: boolean;
}

interface ReceivedLetter {
  letterId: number;  // id → letterId 변경 (백엔드 스펙)
  writerInfo: {
    id: number;
    nickname: string;
    bio?: string;
    imageUrl?: string;
  };
  createdAt: string;
  read: boolean;
}

interface ReceivedLettersResponse {
  content: ReceivedLetter[];
  hasNext: boolean;
}

interface LetterDetail {
  letterId: number;  // id → letterId 변경
  content: string;
  writerInfo: {
    id: number;
    nickname: string;
    bio?: string;
    imageUrl?: string;
  };
  createdAt: string;
}

interface LetterCount {
  total: number;
  unRead: number;
  read: number;
}

interface CurrentRental {
  rentalId: number;
  userId: number;
  userName?: string;
  nickname: string;
  bio?: string;
  imageUrl: string;
  startTime: string;
  userEmail?: string;
  userPhone?: string;
}

interface RentalHistory {
  rentalId: number;
  userId: number;
  userName: string;
  startTime: string;
  endTime: string;
  status: string;
  durationMinutes: number;
}


class ApiService {
  private static refreshTokenCallback?: () => Promise<string | null>;

  static setRefreshTokenCallback(callback: () => Promise<string | null>) {
    this.refreshTokenCallback = callback;
  }

  private static async request<T>(
    endpoint: string,
    options?: RequestInit,
    isRetry: boolean = false
  ): Promise<ApiResponse<T>> {
    const url = `${BASE_URL}${endpoint}`;

    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options?.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 403 && !isRetry && this.refreshTokenCallback) {
        console.log('🔄 토큰 만료 감지, 재발급 시도...');
        const newAccessToken = await this.refreshTokenCallback();

        if (newAccessToken) {
          // 새 토큰으로 재시도
          const updatedConfig: RequestInit = {
            ...config,
            headers: {
              ...config.headers,
              Authorization: `Bearer ${newAccessToken}`,
            },
          };
          return this.request<T>(endpoint, updatedConfig, true);
        } else {
          console.log('🔐 로그인이 필요합니다.');
          throw new Error('인증이 필요합니다');
        }
      }

      if (!response.ok) {
        try {
          const errorData = await response.json();

          // 특정 API는 에러 로그를 완전히 숨김
          const isSilentError = url.includes('/letters/sent') ||
                                 url.includes('/map/user/') ||
                                 url.includes('/map/public/') ||
                                 (url.includes('/letters/') && url.includes('/read') && errorData.message?.includes('이미 읽은')) ||
                                 (url.includes('/rental/enter') && errorData.message?.includes('이미 진행 중인 대여'));

          if (!isSilentError) {
            console.error(`❌ API 실패: ${response.status} ${response.statusText} - ${url}`);
            console.error('응답 내용:', errorData);
          }

          // 백엔드에서 보낸 에러 메시지를 그대로 반환
          return {
            success: false,
            code: response.status,
            message: errorData.message || `${response.status}: ${response.statusText}`,
            data: errorData.data || null
          };
        } catch (parseError) {
          // JSON 파싱에 실패한 경우 기본 에러 응답
          const errorText = await response.text();

          const isSilentError = url.includes('/letters/sent') ||
                                 url.includes('/map/user/') ||
                                 url.includes('/map/public/') ||
                                 (url.includes('/letters/') && url.includes('/read'));

          if (!isSilentError) {
            console.log(`⚠️ 파싱 실패: ${url}`, errorText.substring(0, 100));
          }

          return {
            success: false,
            code: response.status,
            message: `${response.status}: ${response.statusText}`,
            data: null
          };
        }
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error(`💥 API 오류 [${url}]:`, error);

      if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
        throw new Error('네트워크 연결 오류');
      }

      throw error;
    }
  }

  static async signUp(userData: UserSignUpRequest): Promise<ApiResponse<AuthTokens>> {
    return this.request<AuthTokens>('/users/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  static async login(userData: UserLoginRequest): Promise<ApiResponse<AuthTokens>> {
    return this.request<AuthTokens>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  static async logout(accessToken: string): Promise<ApiResponse<string>> {
    return this.request<string>('/auth/logout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  static async refreshToken(refreshToken: string): Promise<ApiResponse<AuthTokens>> {
    return this.request<AuthTokens>('/auth/reissue', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }


  static async getMe(accessToken: string): Promise<ApiResponse<User>> {
    return this.request<User>('/users/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  static async updateMe(
    accessToken: string,
    updateData: Partial<Pick<User, 'name' | 'phone' | 'nickname' | 'imageUrl' | 'bio'>>
  ): Promise<ApiResponse<User>> {
    return this.request<User>('/users/me', {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(updateData),
    });
  }

  // 지도 관련 API
  static async getNearbyMap(
    lat: number,
    lon: number,
    radius: number = 100,
    limit: number = 100,
    accessToken?: string
  ): Promise<ApiResponse<MapLocation[]>> {
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    return this.request<MapLocation[]>(`/map/nearby?lat=${lat}&lon=${lon}&radius=${radius}&limit=${limit}`, {
      method: 'GET',
      headers,
    });
  }

  static async getNearbyList(
    lat: number,
    lon: number,
    radius: number = 100,
    limit: number = 50,
    accessToken?: string
  ): Promise<ApiResponse<NearbyPlace[]>> {
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    return this.request<NearbyPlace[]>(`/map/nearby-list?lat=${lat}&lon=${lon}&radius=${radius}&limit=${limit}`, {
      method: 'GET',
      headers,
    });
  }

  static async getPlaceDetail(id: number, accessToken?: string): Promise<ApiResponse<PlaceDetail>> {
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    // 먼저 user(민간) API 시도 (에러 무시)
    const userResponse = await this.request<PlaceDetail>(`/map/user/${id}`, {
      method: 'GET',
      headers,
    });

    if (userResponse.success) {
      return userResponse;
    }

    // user가 실패하면 public(공공) API 시도 (에러 무시)
    const publicResponse = await this.request<PlaceDetail>(`/map/public/${id}`, {
      method: 'GET',
      headers,
    });

    if (publicResponse.success) {
      return publicResponse;
    }

    // 둘 다 실패 시 (에러 로그는 이미 request에서 처리됨)
    return {
      success: false,
      code: 404,
      message: '장소를 찾을 수 없습니다.',
      data: null
    };
  }

  static async testConnection(): Promise<boolean> {
    try {
      const optionsResponse = await fetch(`${BASE_URL}/users/signup`, {
        method: 'OPTIONS',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:3000'
        }
      });

      const isConnected = optionsResponse.status === 200;
      console.log(isConnected ? '✅ 백엔드 연결 성공' : '❌ 백엔드 연결 실패');
      return isConnected;
    } catch (error: any) {
      console.log('❌ 백엔드 연결 실패');
      return false;
    }
  }

  static async enterPlace(
    accessToken: string,
    placeCode: string
  ): Promise<ApiResponse<RentalEnterResponse>> {
    console.log('🔑 enterPlace API 호출:', {
      endpoint: '/rental/enter',
      placeCode,
      hasAccessToken: !!accessToken
    });

    const requestBody = { placeCode };
    console.log('📤 요청 본문:', JSON.stringify(requestBody));

    return this.request<RentalEnterResponse>('/rental/enter', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(requestBody),
    });
  }

  // 퇴장 처리
  static async exitPlace(accessToken: string, rentalId: number): Promise<ApiResponse<RentalExitResponse>> {
    console.log('🚪 exitPlace API 호출 (rentalId:', rentalId, ')');

    return this.request<RentalExitResponse>('/rental/exit', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  static async getVisitedPlaces(
    accessToken: string,
    size: number = 10,
    cursorEndTime?: string,
    cursorId?: number
  ): Promise<ApiResponse<VisitedPlacesResponse>> {
    console.log('📋 방문한 장소 목록 API 호출');

    let endpoint = `/rental/user/history?status=ended&size=${size}`;
    if (cursorEndTime && cursorId) {
      endpoint += `&cursorEndTime=${encodeURIComponent(cursorEndTime)}&cursorId=${cursorId}`;
    }

    return this.request<VisitedPlacesResponse>(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  static async sendLetter(
    accessToken: string,
    rentalId: number,
    content: string,
    placeId?: number  // placeId도 선택적으로 받기
  ): Promise<ApiResponse<SendLetterResponse>> {
    console.log('✉️ 편지 보내기 API 호출:', { rentalId, placeId, content });

    const requestBody: any = { rentalId, content };
    if (placeId) {
      requestBody.placeId = placeId;
    }
    console.log('📤 편지 요청 본문:', JSON.stringify(requestBody));

    return this.request<SendLetterResponse>('/letters', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(requestBody),
    });
  }

  // 보낸 편지 목록 조회 (현재 백엔드에 없음 - 받은 편지함으로 대체)
  static async getSentLetters(accessToken: string): Promise<ApiResponse<SendLetterResponse[]>> {
    console.log('📮 보낸 편지 목록 조회 API 호출');
    // TODO: 백엔드에 /letters/sent API 추가 필요
    return this.request<SendLetterResponse[]>('/letters/sent', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  // 관리자의 장소 목록 조회
  static async getAdminPlaces(accessToken: string): Promise<ApiResponse<AdminPlace>> {
    console.log('🏢 관리자 장소 목록 조회 API 호출');
    return this.request<AdminPlace>('/places', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  // 쉼터 정보 수정
  static async updatePlace(
    placeData: {
      name: string;
      content: string;
      maxCapacity: number;
      maxUsageMinutes?: number;
      imageUrl?: string;
      address: string;
    },
    accessToken: string
  ): Promise<ApiResponse<string>> {
    console.log('🏢 쉼터 정보 수정 API 호출');
    return this.request<string>('/places', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(placeData),
    });
  }

  // 쉼터 상태 변경
  static async updatePlaceStatus(
    status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'DELETED',
    accessToken: string
  ): Promise<ApiResponse<string>> {
    console.log('🔄 쉼터 상태 변경 API 호출:', status);
    return this.request<string>(`/places/status?status=${status}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  // 영업시간 조회
  static async getBusinessHours(
    placeId: number,
    accessToken: string
  ): Promise<ApiResponse<BusinessHours>> {
    console.log('🕐 영업시간 조회 API 호출');
    return this.request<BusinessHours>(`/places/${placeId}/business-hours`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  // 영업시간 수정
  static async updateBusinessHours(
    placeId: number,
    businessHours: { items: DayOfWeek[] },
    accessToken: string
  ): Promise<ApiResponse<string>> {
    console.log('🕐 영업시간 수정 API 호출');
    return this.request<string>(`/places/${placeId}/business-hours`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(businessHours),
    });
  }

  // 받은 편지 목록 조회 (커서 페이징)
  static async getReceivedLetters(
    accessToken: string,
    size: number = 10,
    cursorCreatedAt?: string,
    cursorId?: number
  ): Promise<ApiResponse<ReceivedLettersResponse>> {
    console.log('📬 받은 편지 목록 조회 API 호출');

    let endpoint = `/letters/all?size=${size}`;
    if (cursorCreatedAt && cursorId) {
      endpoint += `&cursorCreatedAt=${encodeURIComponent(cursorCreatedAt)}&cursorId=${cursorId}`;
    }

    return this.request<ReceivedLettersResponse>(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  // 편지 상세 조회
  static async getLetterDetail(
    letterId: number,
    accessToken: string
  ): Promise<ApiResponse<LetterDetail>> {
    console.log('📬 편지 상세 조회 API 호출:', letterId);
    return this.request<LetterDetail>(`/letters/${letterId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  // 받은 편지 개수 조회
  static async getLetterCount(accessToken: string): Promise<ApiResponse<LetterCount>> {
    console.log('🔢 받은 편지 개수 조회 API 호출');
    return this.request<LetterCount>('/letters/count', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  // 편지 읽음 처리
  static async markLetterAsRead(letterId: number, accessToken: string): Promise<ApiResponse<string>> {
    console.log('✅ 편지 읽음 처리 API 호출:', letterId);
    return this.request<string>(`/letters/${letterId}/read`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  // 현재 이용자 조회
  static async getCurrentRentals(accessToken: string): Promise<ApiResponse<CurrentRental[]>> {
    console.log('👥 현재 이용자 조회 API 호출');
    return this.request<CurrentRental[]>('/rental', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  // 이용 내역 전체 조회
  static async getAllRentalHistory(accessToken: string): Promise<ApiResponse<RentalHistory[]>> {
    console.log('📋 이용 내역 전체 조회 API 호출');
    return this.request<RentalHistory[]>('/rental/all', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  // 관리자가 특정 대여 취소 (퇴장 처리)
  static async adminCancelRental(rentalId: number, accessToken: string): Promise<ApiResponse<RentalExitResponse>> {
    console.log('🚪 관리자 대여 취소 API 호출:', rentalId);
    return this.request<RentalExitResponse>(`/rental/${rentalId}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }
}

export default ApiService;
export type {
  ApiResponse,
  UserSignUpRequest,
  UserLoginRequest,
  AuthTokens,
  User,
  MapLocation,
  NearbyPlace,
  PlaceDetail,
  VisitedPlace,
  VisitedPlacesResponse,
  SendLetterRequest,
  SendLetterResponse,
  AdminPlace,
  ReceivedLetter,
  ReceivedLettersResponse,
  LetterDetail,
  LetterCount,
  CurrentRental,
  RentalHistory,
  RentalEnterResponse,
  RentalExitResponse,
  BusinessHours,
  DayOfWeek
};