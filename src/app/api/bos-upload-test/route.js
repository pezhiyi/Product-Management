import { NextResponse } from 'next/server';
import { getBosClient } from '../../utils/bosStorage';

export async function GET() {
  try {
    const client = getBosClient();
    const bucket = process.env.BAIDU_BOS_BUCKET || 'ynnaiiamge';
    const testKey = `test-file-${Date.now()}.txt`;
    const testContent = `Test content generated at ${new Date().toISOString()}`;
    
    console.log('开始简单上传测试...');
    console.log(`桶: ${bucket}, 键: ${testKey}`);
    
    // 先验证桶存在
    await client.headBucket(bucket);
    console.log('桶验证成功');
    
    // 尝试简单上传
    const result = await client.putObject(
      bucket,
      testKey,
      Buffer.from(testContent),
      { contentType: 'text/plain' }
    );
    
    console.log('上传成功:', result);
    
    return NextResponse.json({
      success: true,
      message: '上传测试成功',
      key: testKey,
      uploadResult: result
    });
  } catch (error) {
    console.error('上传测试失败:', error);
    return NextResponse.json({
      success: false,
      message: `上传测试失败: ${error.message}`,
      stack: error.stack
    }, { status: 500 });
  }
} 