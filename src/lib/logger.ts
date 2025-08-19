/**
 * 로그 레벨을 정의합니다.
 */
export enum LogLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
}

/**
 * 현재 로그 레벨을 설정합니다.
 * 개발 환경에서는 INFO 레벨, 프로덕션 환경에서는 ERROR 레벨을 기본값으로 사용합니다.
 * 메모리 누수가 발생하는 경우 개발 환경에서도 WARN 또는 ERROR 레벨로 설정할 수 있습니다.
 */
let currentLogLevel =
  process.env.NODE_ENV === 'production'
    ? LogLevel.ERROR
    : process.env.NEXT_PUBLIC_LOG_LEVEL
    ? parseInt(process.env.NEXT_PUBLIC_LOG_LEVEL)
    : LogLevel.INFO;

/**
 * 로그 레벨을 설정합니다.
 */
export function setLogLevel(level: LogLevel) {
  currentLogLevel = level;
}

/**
 * 현재 로그 레벨을 반환합니다.
 */
export function getLogLevel(): LogLevel {
  return currentLogLevel;
}

/**
 * 로그를 출력합니다.
 * @param level 로그 레벨
 * @param message 로그 메시지
 * @param args 추가 인자
 */
function log(level: LogLevel, message: string, ...args: any[]) {
  if (level <= currentLogLevel) {
    switch (level) {
      case LogLevel.ERROR:
// console.error(message, ...args);
        break;
      case LogLevel.WARN:
// console.warn(message, ...args);
        break;
      case LogLevel.INFO:
        console.info(message, ...args);
        break;
      case LogLevel.DEBUG:
        console.debug(message, ...args);
        break;
    }
  }
}

/**
 * 에러 로그를 출력합니다.
 */
export function error(message: string, ...args: any[]) {
  log(LogLevel.ERROR, message, ...args);
}

/**
 * 경고 로그를 출력합니다.
 */
export function warn(message: string, ...args: any[]) {
  log(LogLevel.WARN, message, ...args);
}

/**
 * 정보 로그를 출력합니다.
 */
export function info(message: string, ...args: any[]) {
  log(LogLevel.INFO, message, ...args);
}

/**
 * 디버그 로그를 출력합니다.
 */
export function debug(message: string, ...args: any[]) {
  log(LogLevel.DEBUG, message, ...args);
}

/**
 * 로그 레벨을 설정하는 환경 변수를 설정하는 방법:
 *
 * 1. .env.local 파일에 다음과 같이 설정합니다:
 *    NEXT_PUBLIC_LOG_LEVEL=2  # WARN 레벨
 *
 * 2. 또는 실행 시 환경 변수를 설정합니다:
 *    NEXT_PUBLIC_LOG_LEVEL=1 npm run dev  # ERROR 레벨
 *
 * 로그 레벨:
 * - 0: NONE (로그 출력 안 함)
 * - 1: ERROR (에러 로그만 출력)
 * - 2: WARN (경고 및 에러 로그 출력)
 * - 3: INFO (정보, 경고, 에러 로그 출력)
 * - 4: DEBUG (모든 로그 출력)
 */

export default {
  setLogLevel,
  getLogLevel,
  error,
  warn,
  info,
  debug,
  LogLevel,
};
