import { NextResponse } from 'next/server';

// 간단한 테스트 엔드포인트
export async function GET() {
  return NextResponse.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    message: 'Workout API is accessible'
  });
}