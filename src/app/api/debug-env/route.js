import { NextResponse } from 'next/server';
import { getBosClient } from '../../utils/bosStorage';

export async function GET() {
  try {
    // 尝试初始化 BOS 客户端
    const bosClient = getBosClient();
    
    // 收集环境变量信息（不暴露实际密钥）
    const envInfo = {
      BOS_ENDPOINT: process.env.BAIDU_BOS_ENDPOINT ? '已设置' : '未设置',
      BOS_BUCKET: process.env.BAIDU_BOS_BUCKET || 'ynnaiiamge',
      BOS_DOMAIN: process.env.BAIDU_BOS_DOMAIN || '未设置',
      BAIDU_API_KEY: process.env.BAIDU_API_KEY ? '已设置' : '未设置',
      BAIDU_SECRET_KEY: process.env.BAIDU_SECRET_KEY ? '已设置' : '未设置',
    };
    
    // 测试 BOS 连接
    let bosStatus = '未测试';
    const bucket = process.env.BAIDU_BOS_BUCKET || 'ynnaiiamge';
    console.log('尝试列出对象，桶:', bucket);
    try {
      // 尝试直接访问桶
      const listResult = await bosClient.listObjects(bucket, {
        maxKeys: 1
      });
      bosStatus = '连接成功';
      
      return NextResponse.json({
        environment: envInfo,
        bosClient: 'BOS客户端初始化成功',
        bosStatus: bosStatus,
        listResult: {
          bucket: listResult.bucket,
          prefix: listResult.prefix,
          marker: listResult.marker,
          isTruncated: listResult.isTruncated,
          contents: listResult.contents ? `找到 ${listResult.contents.length} 个对象` : '无对象'
        }
      });
    } catch (error) {
      console.error('BOS操作失败:', error);
      bosStatus = `BOS测试失败: ${error.message}`;
      
      return NextResponse.json({
        environment: envInfo,
        bosClient: 'BOS客户端初始化成功，但操作失败',
        bosDetail: {
          endpoint: bosClient.config.endpoint,
          region: bosClient.config.region || '未指定',
          bucket: bucket
        },
        error: error.message,
        stack: error.stack
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({
      error: '调试 API 错误',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
} 