import { NextResponse } from 'next/server';
import { getUrlFromBosKey } from '../../utils/bosStorage';

export async function GET() {
  const testKey = 'test-file.txt';
  const url = getUrlFromBosKey(testKey);
  
  // 显示 URL 构建过程中使用的环境变量
  return NextResponse.json({
    testKey,
    resultUrl: url,
    variables: {
      BAIDU_BOS_DOMAIN: process.env.BAIDU_BOS_DOMAIN || '未设置',
      BAIDU_BOS_BUCKET: process.env.BAIDU_BOS_BUCKET || '未设置',
      BAIDU_BOS_ENDPOINT: process.env.BAIDU_BOS_ENDPOINT || '未设置'
    }
  });
} 