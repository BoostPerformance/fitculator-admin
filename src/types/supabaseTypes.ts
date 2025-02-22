// Supabase 데이터베이스 에러 타입 정의
export interface PostgrestError {
  message: string;      // 에러 메시지
  details: string;      // 상세 에러 정보
  hint?: string;        // 에러 해결을 위한 힌트 (선택적)
  code: string;         // 에러 코드
}

// Supabase 응답 타입 정의
export interface SupabaseResponse<T> {
  data: T | null;                   // 응답 데이터
  error: PostgrestError | null;     // 에러 정보
}
