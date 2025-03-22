import { NextResponse } from 'next/server';
import { BosClient } from '@baiducloud/sdk';

export async function GET() {
  const BOS_ENDPOINT = process.env.BAIDU_BOS_ENDPOINT || 'https://gz.bcebos.com';
  const BOS_AK = process.env.BAIDU_BOS_AK;
  const BOS_SK = process.env.BAIDU_BOS_SK;
  const BOS_BUCKET = process.env.BAIDU_BOS_BUCKET || 'ynnaiiamge';
  const BOS_DOMAIN = process.env.BAIDU_BOS_DOMAIN || 'ynnaiiamge.gz.bcebos.com';
  
  // 提取区域
  let region = 'gz';
  if (BOS_ENDPOINT) {
    const match = BOS_ENDPOINT.match(/https?:\/\/([^.]+)\.bcebos\.com/);
    if (match && match[1]) {
      region = match[1];
    }
  }
  
  console.log(`尝试上传测试文件到 ${BOS_BUCKET} (${region})`);
  
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
    
    // 生成测试文件名
    const testObjectKey = `test-file-${Date.now()}.txt`;
    
    // 尝试上传一个简单字符串
    const result = await client.putObjectFromString(
      BOS_BUCKET,
      testObjectKey,
      'BOS上传测试成功，当前时间: ' + new Date().toISOString()
    );
    
    // 生成文件URL
    const fileUrl = `https://${BOS_DOMAIN}/${testObjectKey}`;
    
    return NextResponse.json({
      success: true,
      result: result,
      file_url: fileUrl,
      bucket: BOS_BUCKET,
      region: region
    });
  } catch (error) {
    return NextResponse.json({
      error: error.message,
      code: error.code,
      status: error.status,
      bucket: BOS_BUCKET,
      region: region
    }, { status: 500 });
  }
} 