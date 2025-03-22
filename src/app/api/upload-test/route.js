import { NextResponse } from 'next/server';
import { uploadToBos, generateBosKey } from '../../utils/bosStorage';

export async function POST(request) {
  try {
    console.log('收到上传请求');
    
    // 检查是否是 multipart 表单数据
    if (!request.headers.get('content-type')?.includes('multipart/form-data')) {
      return NextResponse.json({ 
        error: '需要 multipart/form-data 格式的请求' 
      }, { status: 400 });
    }

    // 解析表单数据
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json({ 
        error: '未找到文件' 
      }, { status: 400 });
    }
    
    console.log('接收到文件:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // 生成唯一的文件路径
    const key = generateBosKey(file.name);
    console.log('生成的BOS Key:', key);

    // 上传文件到BOS
    console.log('开始上传到BOS...');
    const result = await uploadToBos(file, key);
    console.log('BOS上传结果:', result);

    if (!result.success) {
      return NextResponse.json({
        error: result.message || '上传失败'
      }, { status: 500 });
    }

    // 检查是否是图片类型
    const isImage = file.type?.startsWith('image/');

    return NextResponse.json({
      success: true,
      url: result.url,
      key: result.key,
      contentType: result.contentType,
      imagePreview: isImage
    });
  } catch (error) {
    console.error('上传处理错误:', error);
    return NextResponse.json({
      error: `上传处理失败: ${error.message}`
    }, { status: 500 });
  }
} 