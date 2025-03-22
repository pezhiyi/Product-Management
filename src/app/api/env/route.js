import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    appId: process.env.BAIDU_APP_ID,
    // 不要包含敏感密钥
  });
} 