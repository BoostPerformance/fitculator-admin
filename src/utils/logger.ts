// 개발/프로덕션 환경에 따른 로그 유틸리티

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  // 개발 환경에서만 로그 출력
  dev: (message: string, ...args: any[]) => {
    if (isDevelopment) {
// console.log(`🔧 ${message}`, ...args);
    }
  },
  
  // API 관련 로그
  api: (message: string, ...args: any[]) => {
    if (isDevelopment) {
// console.log(`🔗 ${message}`, ...args);
    }
  },
  
  // 데이터 로그
  data: (message: string, ...args: any[]) => {
    if (isDevelopment) {
// console.log(`📊 ${message}`, ...args);
    }
  },
  
  // 성공 로그
  success: (message: string, ...args: any[]) => {
    if (isDevelopment) {
// console.log(`✅ ${message}`, ...args);
    }
  },
  
  // 경고 로그 (프로덕션에서도 출력)
  warn: (message: string, ...args: any[]) => {
// console.warn(`⚠️ ${message}`, ...args);
  },
  
  // 에러 로그 (프로덕션에서도 출력)
  error: (message: string, ...args: any[]) => {
// console.error(`❌ ${message}`, ...args);
  },
  
  // 성능 로그 (개발 환경에서만)
  perf: (message: string, startTime?: number) => {
    if (isDevelopment) {
      const duration = startTime ? Date.now() - startTime : 0;
// console.log(`⚡ ${message}${startTime ? ` (${duration}ms)` : ''}`);
    }
  },
  
  // 배치 로그 (많은 데이터 처리 시)
  batch: (message: string, count: number) => {
    if (isDevelopment) {
// console.log(`📦 ${message} (${count}개 처리)`);
    }
  }
};

// 에러 타입별 처리
export const handleApiError = (error: any, context: string) => {
  const errorInfo = {
    context,
    message: error instanceof Error ? error.message : String(error),
    status: error?.status || 'Unknown',
    timestamp: new Date().toISOString()
  };

  if (isDevelopment) {
    console.group(`❌ API Error - ${context}`);
// console.error('Message:', errorInfo.message);
// console.error('Status:', errorInfo.status);
// console.error('Time:', errorInfo.timestamp);
    if (error instanceof Error && error.stack) {
// console.error('Stack:', error.stack);
    }
    console.groupEnd();
  } else {
    // 프로덕션에서는 간단히
// console.error(`API Error in ${context}:`, errorInfo.message);
  }

  return errorInfo;
};