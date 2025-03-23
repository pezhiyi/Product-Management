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

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100mb',
    },
  },
};

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
    
    // 确保返回JSON响应
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('BOS上传错误:', error);
    // 确保错误也返回为JSON
    return NextResponse.json(
      { 
        success: false, 
        message: error.message,
        error: error.toString()
      },
      { status: 500 }
    );
  }
} 