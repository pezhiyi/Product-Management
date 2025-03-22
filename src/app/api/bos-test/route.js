import { NextResponse } from 'next/server';
import { BosClient } from '@baiducloud/sdk';

export async function GET() {
  const BOS_ENDPOINT = process.env.BAIDU_BOS_ENDPOINT || 'https://gz.bcebos.com';
  const BOS_BUCKET = process.env.BAIDU_BOS_BUCKET || 'ynnaiiamge';
  const BOS_AK = process.env.BAIDU_BOS_AK;
  const BOS_SK = process.env.BAIDU_BOS_SK ? '已设置(保密)' : '未设置';
  
  // 打印完整配置（注意不要泄露SK）
  console.log('BOS配置:', {
    endpoint: BOS_ENDPOINT,
    bucket: BOS_BUCKET,
    ak_status: BOS_AK ? '已设置' : '未设置',
    sk_status: BOS_SK
  });
  
  // 提取区域信息
  let region = 'gz';
  if (BOS_ENDPOINT) {
    const match = BOS_ENDPOINT.match(/https?:\/\/([^.]+)\.bcebos\.com/);
    if (match && match[1]) {
      region = match[1];
    }
  }
  
  console.log(`测试BOS连接，桶: ${BOS_BUCKET}, 区域: ${region}, 端点: ${BOS_ENDPOINT}`);
  
  if (!BOS_AK || !BOS_SK) {
    return NextResponse.json({ error: '缺少BOS凭证' }, { status: 400 });
  }
  
  try {
    const client = new BosClient({
      endpoint: BOS_ENDPOINT,
      credentials: {
        ak: BOS_AK,
        sk: BOS_SK
      },
      region: region
    });
    
    // 尝试使用headBucket检查存储桶是否存在
    try {
      const headResult = await client.headBucket(BOS_BUCKET);
      console.log('存储桶存在检查结果:', headResult);
    } catch (headError) {
      console.error('检查存储桶存在时出错:', headError);
    }
    
    // 尝试列出存储桶
    const result = await client.listObjects(BOS_BUCKET);
    
    return NextResponse.json({
      success: true,
      objects: result.contents.length,
      bucket: BOS_BUCKET,
      region: region,
      endpoint: BOS_ENDPOINT
    });
  } catch (error) {
    console.error('完整错误对象:', error);
    return NextResponse.json({
      error: error.message,
      code: error.code,
      status: error.status,
      region: region,
      bucket: BOS_BUCKET,
      endpoint: BOS_ENDPOINT
    }, { status: 500 });
  }
} 