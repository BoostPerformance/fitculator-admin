import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * Instagram-style relative timestamp
 * - < 1min: 방금
 * - 1~59min: N분 전
 * - 1~23hr: N시간 전
 * - 1~6d: N일 전
 * - 7d+, same year: M월 d일
 * - previous year: yyyy년 M월 d일
 */
export function formatTime(timestamp: string | Date): string {
 try {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return '방금';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  if (date.getFullYear() === now.getFullYear()) {
   return format(date, 'M월 d일', { locale: ko });
  }
  return format(date, 'yyyy년 M월 d일', { locale: ko });
 } catch {
  return '';
 }
}
