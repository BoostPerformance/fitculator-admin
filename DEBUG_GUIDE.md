# 운동 데이터 로딩 문제 디버깅 가이드

## 🔍 문제 상황
라이브 환경(Vercel)에서 운동 데이터가 일부만 로드되는 문제

## 📊 진단 도구

### 1. 디버그 엔드포인트 확인
```bash
# 라이브 환경에서 실행
curl https://your-domain.vercel.app/api/workouts/debug?challengeId=YOUR_CHALLENGE_ID

# 또는 브라우저에서 직접 접속
https://your-domain.vercel.app/api/workouts/debug?challengeId=YOUR_CHALLENGE_ID
```

### 2. 테스트 엔드포인트 확인
```bash
curl https://your-domain.vercel.app/api/workouts/test
```

### 3. Vercel 로그 확인
1. Vercel 대시보드 접속
2. Functions 탭 클릭
3. `api/workouts/user-detail` 함수 선택
4. Logs 확인 (타임아웃 에러 확인)

## 🛠️ 적용된 해결책

### 1. **즉시 적용 (현재 버전)**
- ✅ 초기 10명만 먼저 로드 (나머지는 지연 로드)
- ✅ 8초 타임아웃 설정
- ✅ 순차적 쿼리 실행
- ✅ 간단한 훅으로 전환 (`useWorkoutDataSimple`)
- ✅ Vercel 함수 타임아웃 30초 설정

### 2. **vercel.json 설정**
```json
{
  "functions": {
    "src/app/api/workouts/user-detail/route.ts": {
      "maxDuration": 30
    }
  }
}
```

### 3. **환경 변수 확인**
Vercel 대시보드에서 다음 환경 변수가 설정되어 있는지 확인:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 🚨 문제가 계속될 경우

### 옵션 1: 데이터 캐싱 활성화
```typescript
// src/app/api/workouts/user-detail/route.ts
export const dynamic = 'force-static';
export const revalidate = 60; // 60초마다 재검증
```

### 옵션 2: Edge Runtime 사용
```typescript
// src/app/api/workouts/user-detail/route.ts
export const runtime = 'edge';
```

### 옵션 3: 클라이언트 사이드 페칭
```typescript
// 완전히 클라이언트에서 처리
useEffect(() => {
  // 직접 Supabase 클라이언트 사용
}, []);
```

## 📈 모니터링

### 콘솔 로그 확인
브라우저 개발자 도구에서:
- `📦 Loading initial X users` - 초기 로드
- `✅ Initial batch loaded` - 성공
- `⏱️ Request timeout` - 타임아웃
- `❌ Request failed` - 실패

### 성능 지표
- 초기 로드: 10명 (< 3초)
- 전체 로드: 점진적 (백그라운드)
- 타임아웃: 8초

## 🔄 롤백 방법

원래 훅으로 되돌리기:
```typescript
// src/app/[challengeId]/workout/page.tsx
import { useWorkoutDataQuery } from '@/components/hooks/useWorkoutDataQuery';
// import { useWorkoutDataSimple } from '@/components/hooks/useWorkoutDataSimple';

// 원래 훅 사용
} = useWorkoutDataQuery(params.challengeId as string, refreshParam);
```

## 📞 추가 지원
문제가 지속되면 다음 정보와 함께 보고:
1. `/api/workouts/debug` 응답 결과
2. Vercel Functions 로그
3. 브라우저 콘솔 에러
4. 네트워크 탭 스크린샷