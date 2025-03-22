import { NextResponse } from 'next/server';
import { BosClient } from '@baiducloud/sdk';

export async function GET() {
  const BOS_ENDPOINT = process.env.BAIDU_BOS_ENDPOINT || 'https://gz.bcebos.com';
  const BOS_AK = process.env.BAIDU_BOS_AK;
  const BOS_SK = process.env.BAIDU_BOS_SK;
  const BOS_BUCKET = process.env.BAIDU_BOS_BUCKET || 'ynnaiiamge';
  
  try {
    const client = new BosClient({
      endpoint: BOS_ENDPOINT,
      credentials: { ak: BOS_AK, sk: BOS_SK },
      region: 'gz'
    });
    
    console.log('获取现有CORS配置...');
    // 先尝试获取现有配置
    try {
      const currentCors = await client.getBucketCors(BOS_BUCKET);
      console.log('当前CORS配置:', currentCors);
    } catch (e) {
      console.log('获取现有CORS失败:', e.message);
    }
    
    // 设置CORS规则
    const corsRules = [{
      allowedOrigins: ['*'],
      allowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
      allowedHeaders: ['*'],
      maxAgeSeconds: 3600
    }];
    
    // 尝试使用正确的API名称
    console.log('正在设置CORS规则...');
    await client.setBucketCors(BOS_BUCKET, { 
      corsConfiguration: corsRules 
    });
    
    return NextResponse.json({
      success: true,
      message: '已成功设置CORS规则'
    });
  } catch (error) {
    console.error('CORS设置完整错误:', error);
    return NextResponse.json({
      error: error.message,
      code: error.code,
      stack: error.stack
    }, { status: 500 });
  }
} 