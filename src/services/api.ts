const BASE_URL = 'https://shympyo.kro.kr/api';

interface ApiResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
}

interface UserSignUpRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
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
        const errorText = await response.text();
        console.error('응답 내용:', errorText);
        throw new Error(`${response.status}: ${response.statusText}`);
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
    updateData: Partial<Pick<User, 'name' | 'phone'>>
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
}

export default ApiService;
export type { ApiResponse, UserSignUpRequest, UserLoginRequest, AuthTokens, User, MapLocation, NearbyPlace, PlaceDetail };