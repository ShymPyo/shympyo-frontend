# v1.0.6 업데이트 구현 내용

> 백엔드 v1.0.6 (SSE 기반 실시간 이용자 갱신 + Rental 상태 개선)에 맞춰 프론트엔드 구현

## 📋 목차
1. [RentalStatus Enum 타입 추가](#1-rentalstatus-enum-타입-추가)
2. [SSE 실시간 연결 구현](#2-sse-실시간-연결-구현)
3. [관리자 화면 실시간 업데이트](#3-관리자-화면-실시간-업데이트)
4. [신고/차단 기능 추가](#4-신고차단-기능-추가)
5. [대여 상태 UI 개선](#5-대여-상태-ui-개선)
6. [날씨 API 연결](#6-날씨-api-연결)

---

## 1. RentalStatus Enum 타입 추가

### 변경 사항
**파일**: `src/services/api.ts`

```typescript
// Rental 상태 enum 추가
type RentalStatus = 'USING' | 'TIME_EXCEEDED' | 'ENDED' | 'CANCELED' | 'KICKED';

interface CurrentRental {
  rentalId: number;
  userId: number;
  nickname: string;
  startTime: string;
  dueTime: string; // ✅ 새로 추가: 종료 예정 시간
  status: RentalStatus; // ✅ 새로 추가: 대여 상태
  // ...
}
```

### 상태 설명
- `USING`: 이용 중
- `TIME_EXCEEDED`: 시간 초과
- `ENDED`: 정상 종료
- `CANCELED`: 취소됨
- `KICKED`: 강퇴됨

---

## 2. SSE 실시간 연결 구현

### 새 파일 생성
**파일**: `src/services/sse.ts`

### 주요 기능
- React Native에서 SSE 연결 지원 (fetch 기반 폴리필)
- 자동 재연결 (최대 5회 시도, 지수 백오프)
- 연결 상태 관리
- 이벤트 파싱 (event/data 형식)

### SSE 이벤트 타입
```typescript
export interface SSEEvent {
  type: 'hello' | 'rental-started' | 'rental-ended' | 'rental-kicked' | 'ping';
  data: any;
}
```

### 사용 예시
```typescript
import { connectSSE, disconnectSSE } from '../services/sse';

// 연결
const connection = connectSSE(
  placeId,
  accessToken,
  (event) => {
    console.log('이벤트 수신:', event);
  },
  (error) => {
    console.error('SSE 오류:', error);
  }
);

// 연결 해제
disconnectSSE();
```

---

## 3. 관리자 화면 실시간 업데이트

### 변경 사항
**파일**: `src/screens/AdminMainScreen.tsx`

### 주요 개선사항

#### 3.1 SSE 연결 및 이벤트 핸들링
```typescript
useEffect(() => {
  if (accessToken && user && adminPlace) {
    // SSE 연결
    const sseConnection = connectSSE(
      adminPlace.id,
      accessToken,
      handleSSEMessage,
      (error) => console.error('SSE 오류:', error)
    );

    return () => {
      disconnectSSE();
    };
  }
}, [accessToken, user, adminPlace]);

const handleSSEMessage = (event: SSEEvent) => {
  switch (event.type) {
    case 'rental-started':
      loadAdminData(); // 입장 시 실시간 갱신
      break;
    case 'rental-ended':
      loadAdminData(); // 퇴장 시 실시간 갱신
      break;
    case 'rental-kicked':
      loadAdminData(); // 강퇴 시 실시간 갱신
      break;
  }
};
```

#### 3.2 API 호출 변경
- ❌ `adminCancelRental` → ✅ `adminKickRental`
- 새 엔드포인트: `POST /api/rental/{rentalId}/kick`

---

## 4. 신고/차단 기능 추가

### 4.1 신고 기능

#### 신고 사유 enum
```typescript
type ReportReason = 'ABUSE' | 'INAPPROPRIATE' | 'SCAM' | 'POLICY_VIOLATION' | 'OTHER';
```

#### 신고 API
```typescript
// 신고하기
static async createReport(reportData: ReportRequest, accessToken: string): Promise<ApiResponse<string>> {
  return this.request<string>('/reports', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(reportData),
  });
}
```

#### 신고 모달
**파일**: `src/components/ReportReasonModal.tsx`

- 5가지 신고 사유 선택
- 상세 내용 입력 (200자 제한)
- 허위 신고 경고 메시지

### 4.2 차단 기능

#### 차단 사유 enum
```typescript
type BlockReason = 'ABUSE' | 'INAPPROPRIATE' | 'SCAM' | 'POLICY_VIOLATION' | 'OTHER';
```

#### 차단 API
```typescript
// 사용자 차단
static async blockUser(userId: number, blockData: BlockRequest, accessToken: string): Promise<ApiResponse<number>>

// 차단 해제
static async unblockUser(userId: number, accessToken: string): Promise<ApiResponse<string>>

// 차단 목록 조회
static async getBlockedUsers(accessToken: string): Promise<ApiResponse<BlockedUser[]>>

// 차단 상세 정보
static async getBlockDetail(userId: number, accessToken: string): Promise<ApiResponse<BlockDetail>>
```

#### 차단 모달
**파일**: `src/components/BlockReasonModal.tsx`

- 5가지 차단 사유 선택
- 상세 사유 입력 (200자 제한)
- 차단 기간: 7일

#### 차단 목록 화면
**파일**: `src/screens/BlockedUsersScreen.tsx`

- 차단한 사용자 목록 표시
- 차단 상태 표시 (ACTIVE/EXPIRED/REVOKED)
- 차단 해제 기능
- 차단 상세 정보 확인

### 4.3 UI 개선
- 사용자 모달에 3개 버튼 추가:
  - 🟣 **신고** (보라색) - 신고 모달 열기
  - 🟠 **차단** (주황색) - 차단 모달 열기
  - 🔴 **퇴장** (빨간색) - 강퇴 처리

---

## 5. 대여 상태 UI 개선

### 상태 표시
**파일**: `src/screens/AdminMainScreen.tsx`

#### 상태 배지 색상
```typescript
const getRentalStatusColor = (status: RentalStatus) => {
  switch (status) {
    case 'USING': return '#4CAF50';        // 녹색 - 이용 중
    case 'TIME_EXCEEDED': return '#FF9800'; // 주황색 - 시간 초과
    case 'ENDED': return '#9E9E9E';        // 회색 - 종료
    case 'CANCELED': return '#9E9E9E';     // 회색 - 취소
    case 'KICKED': return '#F44336';       // 빨간색 - 강퇴
  }
};
```

#### 사용자 모달에 표시
```typescript
<View style={styles.userModalInfoRow}>
  <Text style={styles.userModalLabel}>상태</Text>
  <View style={[
    styles.statusBadge,
    { backgroundColor: getRentalStatusColor(selectedUser.status) }
  ]}>
    <Text style={styles.statusBadgeText}>
      {getRentalStatusText(selectedUser.status)}
    </Text>
  </View>
</View>
```

#### 종료 예정 시간 표시
```typescript
<View style={styles.userModalInfoRow}>
  <Text style={styles.userModalLabel}>종료 예정</Text>
  <Text style={styles.userModalInfoText}>
    {selectedUser.dueTime ? new Date(selectedUser.dueTime).toLocaleString('ko-KR') : '-'}
  </Text>
</View>
```

---

## 6. 날씨 API 연결

### 날씨 API
**파일**: `src/services/api.ts`

```typescript
interface WeatherData {
  weather: string;
  temperature: number;
  location: string;
}

static async getWeather(lat: number, lon: number): Promise<ApiResponse<WeatherData>> {
  return this.request<WeatherData>(`/weather?lat=${lat}&lon=${lon}`, {
    method: 'GET',
  });
}
```

### HomeScreen 적용
**파일**: `src/screens/HomeScreen.tsx`

- GPS 위치 기반 날씨 조회
- 온도계 컴포넌트에 실시간 온도 표시
- 날씨 상태 텍스트 표시 (맑음, 흐림 등)
- 에러 처리: 날씨 정보를 가져올 수 없으면 온도계 항상 표시 (`--°`)

---

## 7. PlaceDetail API 업데이트

### 변경 사항
**파일**: `src/services/api.ts`

```typescript
interface TodayAndHoliday {
  dayOfWeek: string;
  closed: boolean;
  openTime: string;
  closeTime: string;
  breakStart?: string;
  breakEnd?: string;
  holidays?: string[];
}

interface PlaceDetail {
  id: number;
  name: string;
  address: string;
  content: string;
  latitude: number;
  longitude: number;
  type: 'SHELTER' | 'CAFE' | 'RESTAURANT' | 'STORE' | 'STATION' | 'USER_SHELTER';
  maxCapacity?: number;           // 최대 수용 인원
  currentCapacity?: number;       // ✅ 새로 추가: 현재 이용 중인 사용자 수
  todayAndHoliday?: TodayAndHoliday; // ✅ 새로 추가: 오늘의 영업시간 및 휴일 정보
  imageUrl?: string;
}
```

---

## 📂 파일 구조

### 새로 추가된 파일
```
src/
├── services/
│   └── sse.ts                          # SSE 연결 관리 서비스
├── components/
│   ├── BlockReasonModal.tsx            # 차단 사유 선택 모달
│   └── ReportReasonModal.tsx           # 신고 사유 선택 모달
└── screens/
    └── BlockedUsersScreen.tsx          # 차단 목록 화면
```

### 수정된 파일
```
src/
├── services/
│   └── api.ts                          # RentalStatus, ReportReason, BlockReason 추가
├── screens/
│   ├── AdminMainScreen.tsx             # SSE 연결, 신고/차단 기능 추가
│   └── HomeScreen.tsx                  # 날씨 API 연결
├── navigation/
│   └── AppNavigator.tsx                # BlockedUsers 라우트 추가
└── types/
    └── index.ts                        # BlockedUsers 타입 추가
```

---

## 🔄 API 엔드포인트 변경 사항

### 추가된 API
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/sse/places/{placeId}` | SSE 스트리밍 구독 |
| POST | `/api/rental/{rentalId}/kick` | 강퇴 처리 |
| POST | `/api/reports` | 신고 생성 |
| POST | `/api/blocks/providers/me/{userId}` | 사용자 차단 |
| DELETE | `/api/blocks/providers/me/{userId}` | 차단 해제 |
| GET | `/api/blocks/providers/me/all` | 차단 목록 조회 |
| GET | `/api/blocks/providers/me/{userId}` | 차단 상세 조회 |
| GET | `/api/weather` | 날씨 정보 조회 |

### 변경된 API
| Before | After | 비고 |
|--------|-------|------|
| `POST /api/rental/{rentalId}/cancel` | `POST /api/rental/{rentalId}/kick` | 엔드포인트 이름 변경 |

---

## 🎨 UI/UX 개선사항

### 관리자 화면
1. **실시간 업데이트**
   - SSE 기반 자동 갱신 (5초 폴링 제거)
   - 입장/퇴장/강퇴 이벤트 실시간 반영

2. **사용자 모달**
   - 상태 배지 추가 (색상으로 상태 구분)
   - 종료 예정 시간 표시
   - 신고/차단/퇴장 버튼 3개로 확장

3. **차단 관리**
   - 차단 목록 화면 추가
   - 차단 상태 표시 (ACTIVE/EXPIRED/REVOKED)
   - 차단 해제 기능

### 홈 화면
1. **날씨 표시**
   - GPS 기반 현재 위치 날씨
   - 온도계 애니메이션
   - 날씨 상태 텍스트

---

## ✅ 테스트 체크리스트

### SSE 연결
- [ ] 관리자 화면 진입 시 SSE 연결 성공
- [ ] 사용자 입장 시 실시간 목록 갱신
- [ ] 사용자 퇴장 시 실시간 목록 갱신
- [ ] 강퇴 처리 시 실시간 목록 갱신
- [ ] 연결 끊김 시 자동 재연결
- [ ] 화면 이탈 시 연결 해제

### 신고/차단 기능
- [ ] 신고 모달에서 사유 선택 및 내용 입력
- [ ] 신고 완료 시 성공 메시지 표시
- [ ] 차단 모달에서 사유 선택 및 내용 입력
- [ ] 차단 완료 시 성공 메시지 표시
- [ ] 차단 목록 화면에서 차단된 사용자 목록 표시
- [ ] 차단 해제 기능 동작
- [ ] 차단 상세 정보 조회

### 대여 상태
- [ ] 사용자 모달에서 상태 배지 표시
- [ ] 상태별 색상 구분 (USING/TIME_EXCEEDED/KICKED 등)
- [ ] 종료 예정 시간 표시

### 날씨 API
- [ ] 홈 화면에서 현재 위치 날씨 표시
- [ ] 온도계 애니메이션 동작
- [ ] 날씨 정보 가져오기 실패 시 `--°` 표시

---

## 📝 주요 변경사항 요약

| 기능 | 변경 내용 | 파일 |
|-----|----------|------|
| **SSE 연결** | React Native에서 SSE 폴리필 구현 | `services/sse.ts` |
| **실시간 갱신** | 5초 폴링 → SSE 이벤트 기반 갱신 | `AdminMainScreen.tsx` |
| **대여 상태** | 문자열 → RentalStatus enum | `api.ts`, `AdminMainScreen.tsx` |
| **강퇴 처리** | `/cancel` → `/kick` 엔드포인트 | `api.ts`, `AdminMainScreen.tsx` |
| **신고 기능** | 신고 사유 선택 모달 및 API 연결 | `ReportReasonModal.tsx`, `AdminMainScreen.tsx` |
| **차단 기능** | 차단 관리 전체 기능 구현 | `BlockReasonModal.tsx`, `BlockedUsersScreen.tsx` |
| **날씨 표시** | GPS 기반 날씨 정보 표시 | `HomeScreen.tsx`, `api.ts` |

---

## 🚀 다음 단계

1. **신고 기능 완성**
   - 신고 목록 조회 화면 (선택사항)
   - 신고 처리 상태 표시

2. **차단 기능 개선**
   - 차단 사유별 필터링
   - 차단 기간 설정 옵션

3. **SSE 안정성 개선**
   - 네트워크 상태에 따른 재연결 전략 최적화
   - SSE 연결 상태 UI 표시

4. **날씨 기능 확장**
   - 시간대별 날씨 예보
   - 미세먼지 정보 추가

---

## 📞 문의

구현 관련 문의사항이 있으시면 개발팀에 연락주세요.

**작성일**: 2025-01-08
**버전**: v1.0.6
**작성자**: Claude Code Assistant
