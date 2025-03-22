import { NextResponse } from 'next/server';
import { BosClient } from '@baiducloud/sdk';

export async function GET() {
  const BOS_ENDPOINT = process.env.BAIDU_BOS_ENDPOINT || 'https://gz.bcebos.com';
  const BOS_AK = process.env.BAIDU_BOS_AK;
  const BOS_SK = process.env.BAIDU_BOS_SK;
  
  try {
    const client = new BosClient({
      endpoint: BOS_ENDPOINT,
      credentials: { ak: BOS_AK, sk: BOS_SK },
      region: 'gz'
    });
    
    // 获取客户端上可用的所有方法
    const methods = Object.getOwnPropertyNames(BosClient.prototype)
      .filter(name => typeof client[name] === 'function')
      .sort();
    
    // 检查是否有与CORS相关的方法
    const corsMethods = methods.filter(m => m.toLowerCase().includes('cors'));
    
    return NextResponse.json({
      totalMethods: methods.length,
      methods: methods,
      corsMethods: corsMethods
    });
  } catch (error) {
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
} 