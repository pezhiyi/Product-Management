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
    try {
      // 尝试列出桶中的对象
      const listResult = await bosClient.listObjects(process.env.BAIDU_BOS_BUCKET || 'ynnaiiamge', {
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
    } catch (bosError) {
      bosStatus = `BOS测试失败: ${bosError.message}`;
      
      return NextResponse.json({
        environment: envInfo,
        bosClient: 'BOS客户端初始化成功，但连接测试失败',
        bosStatus: bosStatus,
        error: bosError.message,
        stack: bosError.stack
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