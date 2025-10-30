// SSE 연결 관리 서비스
// React Native에서는 EventSource가 없으므로 fetch를 사용한 폴리필 구현

const BASE_URL = 'http://shympyo.kro.kr';

export interface SSEEvent {
  type: 'hello' | 'rental-started' | 'rental-ended' | 'rental-kicked' | 'ping';
  data: any;
}

export class SSEConnection {
  private abortController: AbortController | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isConnected = false;
  private placeId: number;
  private accessToken: string;
  private onMessage: (event: SSEEvent) => void;
  private onError?: (error: Error) => void;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(
    placeId: number,
    accessToken: string,
    onMessage: (event: SSEEvent) => void,
    onError?: (error: Error) => void
  ) {
    this.placeId = placeId;
    this.accessToken = accessToken;
    this.onMessage = onMessage;
    this.onError = onError;
  }

  connect() {
    if (this.isConnected) {
      console.log('🔌 SSE already connected');
      return;
    }

    console.log(`🔌 SSE 연결 시작: placeId=${this.placeId}`);

    this.abortController = new AbortController();
    const url = `${BASE_URL}/sse/places/${this.placeId}`;

    fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        Accept: 'text/event-stream',
      },
      signal: this.abortController.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`SSE connection failed: ${response.status}`);
        }

        this.isConnected = true;
        this.reconnectAttempts = 0;
        console.log('✅ SSE 연결 성공');

        return this.readStream(response.body);
      })
      .catch((error) => {
        if (error.name === 'AbortError') {
          console.log('🔌 SSE 연결 중단됨');
          return;
        }

        console.error('❌ SSE 연결 오류:', error);
        this.isConnected = false;

        if (this.onError) {
          this.onError(error);
        }

        // 재연결 시도
        this.scheduleReconnect();
      });
  }

  private async readStream(body: ReadableStream<Uint8Array> | null) {
    if (!body) {
      throw new Error('Response body is null');
    }

    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log('🔌 SSE 스트림 종료');
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        // 이벤트 파싱
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const eventStr of events) {
          if (eventStr.trim()) {
            this.parseEvent(eventStr);
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('❌ SSE 스트림 읽기 오류:', error);
        this.isConnected = false;
        this.scheduleReconnect();
      }
    } finally {
      reader.releaseLock();
    }
  }

  private parseEvent(eventStr: string) {
    const lines = eventStr.split('\n');
    let eventType = 'message';
    let eventData = '';

    for (const line of lines) {
      if (line.startsWith('event:')) {
        eventType = line.substring(6).trim();
      } else if (line.startsWith('data:')) {
        eventData = line.substring(5).trim();
      }
    }

    if (eventType && eventData) {
      console.log(`📨 SSE 이벤트 수신: ${eventType}`, eventData);

      try {
        const parsedData = eventData === 'connected' ? eventData : JSON.parse(eventData);
        this.onMessage({
          type: eventType as any,
          data: parsedData,
        });
      } catch (error) {
        console.error('❌ SSE 이벤트 파싱 오류:', error);
      }
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('❌ SSE 재연결 최대 시도 횟수 초과');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // 최대 30초

    console.log(`🔄 SSE 재연결 예정 (${this.reconnectAttempts}/${this.maxReconnectAttempts}): ${delay}ms 후`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  disconnect() {
    console.log('🔌 SSE 연결 종료');

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    this.isConnected = false;
    this.reconnectAttempts = 0;
  }

  getIsConnected() {
    return this.isConnected;
  }
}

// 싱글톤 인스턴스 관리
let currentConnection: SSEConnection | null = null;

export const connectSSE = (
  placeId: number,
  accessToken: string,
  onMessage: (event: SSEEvent) => void,
  onError?: (error: Error) => void
): SSEConnection => {
  // 기존 연결이 있으면 종료
  if (currentConnection) {
    currentConnection.disconnect();
  }

  currentConnection = new SSEConnection(placeId, accessToken, onMessage, onError);
  currentConnection.connect();

  return currentConnection;
};

export const disconnectSSE = () => {
  if (currentConnection) {
    currentConnection.disconnect();
    currentConnection = null;
  }
};
