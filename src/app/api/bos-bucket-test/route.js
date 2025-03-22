import { NextResponse } from 'next/server';
import { BosClient } from '@baiducloud/sdk';

export async function GET() {
  try {
    // 基本配置
    const endpoint = process.env.BAIDU_BOS_ENDPOINT || 'https://gz.bcebos.com';
    const ak = process.env.BAIDU_API_KEY ? process.env.BAIDU_API_KEY.trim() : '';
    const sk = process.env.BAIDU_SECRET_KEY ? process.env.BAIDU_SECRET_KEY.trim() : '';
    const bucket = process.env.BAIDU_BOS_BUCKET || 'ynnaiiamge';
    
    // 创建多种配置的客户端
    const client = new BosClient({
      endpoint,
      credentials: { ak, sk }
    });
    
    // 测试结果
    const results = {
      config: {
        endpoint,
        bucket,
        akLength: ak.length,
        skLength: sk.length
      },
      tests: {}
    };
    
    // 测试1: 检查桶是否存在
    try {
      results.tests.headBucket = await client.headBucket(bucket);
      results.tests.headBucketStatus = '成功';
    } catch (error) {
      results.tests.headBucketStatus = `失败: ${error.message}`;
      results.tests.headBucketError = error.toString();
    }
    
    // 测试2: 尝试列出所有桶
    try {
      results.tests.listBuckets = await client.listBuckets();
      results.tests.listBucketsStatus = '成功';
    } catch (error) {
      results.tests.listBucketsStatus = `失败: ${error.message}`;
      results.tests.listBucketsError = error.toString();
    }
    
    // 测试3: 尝试使用不同的桶格式
    try {
      // 尝试小写格式
      const result = await client.listObjects(bucket.toLowerCase(), { maxKeys: 1 });
      results.tests.lowerCaseBucket = '成功';
      results.tests.lowerCaseResult = { 
        bucket: result.bucket,
        contents: result.contents ? result.contents.length : 0
      };
    } catch (error) {
      results.tests.lowerCaseBucket = `失败: ${error.message}`;
    }
    
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({
      error: '测试失败',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
} 