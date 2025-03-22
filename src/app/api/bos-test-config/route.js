import { NextResponse } from 'next/server';
import { BosClient } from '@baiducloud/sdk';

export async function GET() {
  try {
    // 显示不同配置方式创建的客户端
    const endpoint = process.env.BAIDU_BOS_ENDPOINT || 'https://gz.bcebos.com';
    const ak = process.env.BAIDU_API_KEY;
    const sk = process.env.BAIDU_SECRET_KEY;
    const bucket = process.env.BAIDU_BOS_BUCKET || 'ynnaiiamge';
    
    // 创建不同配置的客户端
    const client1 = new BosClient({
      endpoint: endpoint,
      credentials: { ak, sk }
    });
    
    const client2 = new BosClient({
      endpoint: endpoint.replace(/^https?:\/\//, ''),
      credentials: { ak, sk }
    });
    
    // 显示客户端配置
    return NextResponse.json({
      message: 'BOS客户端配置',
      sdkVersion: require('@baiducloud/sdk/package.json').version,
      clientConfig1: {
        endpoint: client1.config.endpoint,
        region: client1.config.region,
        // 其他可以安全显示的配置
      },
      clientConfig2: {
        endpoint: client2.config.endpoint,
        region: client2.config.region,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: '配置测试失败',
      message: error.message
    }, { status: 500 });
  }
} 