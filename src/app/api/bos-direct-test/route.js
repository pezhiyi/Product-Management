import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
  const BOS_DOMAIN = process.env.BAIDU_BOS_DOMAIN || 'ynnaiiamge.gz.bcebos.com';
  
  try {
    // 尝试直接访问存储桶根目录
    const response = await axios.get(`https://${BOS_DOMAIN}`, {
      validateStatus: () => true // 不抛出HTTP错误
    });
    
    return NextResponse.json({
      success: true,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      domain: BOS_DOMAIN
    });
  } catch (error) {
    return NextResponse.json({
      error: error.message,
      domain: BOS_DOMAIN
    }, { status: 500 });
  }
} 