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


class ApiService {
  private static async request<T>(
    endpoint: string,
    options?: RequestInit
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
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API 요청 실패');
      }

      return data;
    } catch (error: any) {
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

  static async logout(refreshToken: string): Promise<ApiResponse<string>> {
    return this.request<string>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
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
export type { ApiResponse, UserSignUpRequest, UserLoginRequest, AuthTokens, User };