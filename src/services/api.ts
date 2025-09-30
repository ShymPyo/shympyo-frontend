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
}

interface RentalEnterRequest {
  placeCode: string;
}

interface QRCodeResponse {
  placeCode: string;
}

interface RentalEnterResponse {
  rentalId: number;
  placeName: string;
  startTime: string;
}

interface VisitedPlace {
  id: number;
  placeId: number;
  placeName: string;
  visitDate: string;
  rentalId: number;
}

interface SendLetterRequest {
  placeId: number;
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
  id: number;
  placeId: number;
  placeName: string;
  writerInfo: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
  content: string;
  readAt?: string;
  createdAt: string;
  read: boolean;
}

interface LetterCount {
  total: number;
  unRead: number;
  read: number;
}

interface CurrentRental {
  rentalId: number;
  userId: number;
  userName: string;
  imageUrl: string;
  startTime: string;
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
        console.error(`❌ API 실패: ${response.status} ${response.statusText} - ${url}`);

        try {
          const errorData = await response.json();
          console.error('응답 내용:', errorData);

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
          console.error('파싱 실패, 원본 응답:', errorText);

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

    return this.request<PlaceDetail>(`/map/${id}`, {
      method: 'GET',
      headers,
    });
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

  static async verifyQRCode(
    qrUrl: string,
    accessToken: string
  ): Promise<ApiResponse<QRCodeResponse>> {
    console.log('🔍 verifyQRCode API 호출:', {
      qrUrl,
      hasAccessToken: !!accessToken
    });

    // URL에서 c 파라미터 추출
    const url = new URL(qrUrl);
    const code = url.searchParams.get('c');

    if (!code) {
      return {
        success: false,
        code: 400,
        message: 'QR 코드에서 코드를 찾을 수 없습니다.',
        data: null
      };
    }

    console.log('📡 QR 코드 API 요청:', {
      endpoint: `/enter-code?c=${code}`,
      method: 'GET',
      code: code
    });

    return this.request<QRCodeResponse>(`/enter-code?c=${code}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
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

  static async getVisitedPlaces(accessToken: string): Promise<ApiResponse<VisitedPlace[]>> {
    console.log('📋 방문한 장소 목록 API 호출');

    return this.request<VisitedPlace[]>('/rental/history', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  static async sendLetter(
    accessToken: string,
    placeId: number,
    content: string
  ): Promise<ApiResponse<SendLetterResponse>> {
    console.log('✉️ 편지 보내기 API 호출:', { placeId, content });

    const requestBody = { placeId, content };
    console.log('📤 편지 요청 본문:', JSON.stringify(requestBody));

    return this.request<SendLetterResponse>('/letters/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(requestBody),
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
      imageUrl?: string;
      address: string;
      openTime: string;
      closeTime: string;
      weeklyHoliday: string;
    },
    accessToken: string
  ): Promise<ApiResponse<AdminPlace>> {
    console.log('🏢 쉼터 정보 수정 API 호출');
    return this.request<AdminPlace>('/places', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(placeData),
    });
  }

  // 받은 편지함 조회
  static async getReceivedLetters(accessToken: string): Promise<ApiResponse<ReceivedLetter[]>> {
    console.log('📬 받은 편지함 조회 API 호출');
    return this.request<ReceivedLetter[]>('/letters/received', {
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

  // 편지 상세 조회
  static async getLetterDetail(letterId: number, accessToken: string): Promise<ApiResponse<string>> {
    console.log('📖 편지 상세 조회 API 호출:', letterId);
    return this.request<string>(`/letters/${letterId}`, {
      method: 'GET',
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
  SendLetterRequest,
  SendLetterResponse,
  AdminPlace,
  ReceivedLetter,
  LetterCount,
  CurrentRental,
  RentalHistory
};