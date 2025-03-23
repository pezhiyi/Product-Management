import { NextResponse } from 'next/server';
import { uploadToBos, generateBosKey } from '../../utils/bosStorage';

// 移除 edge runtime 配置
// export const runtime = 'edge';

// 添加 OPTIONS 处理
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const contSign = formData.get('cont_sign');
    
    console.log('收到BOS上传请求:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      contSign
    });
    
    if (!file) {
      return NextResponse.json(
        { success: false, message: '未提供文件' },
        { status: 400 }
      );
    }
    
    // 使用cont_sign生成BOS key
    const bosKey = generateBosKey(null, contSign);
    
    // 上传到BOS
    const result = await uploadToBos(file, bosKey);
    
    console.log('BOS上传结果:', result);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      url: result.url,
      key: result.key
    });
    
  } catch (error) {
    console.error('BOS上传错误:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
} 