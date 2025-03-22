import { NextResponse } from 'next/server';
import { getUrlFromBosKey, generateBosKey, uploadToBos } from '../../../utils/bosStorage';

// 使用新的配置方式
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  // 设置响应头，允许大文件上传
  const response = new NextResponse();
  response.headers.set('Transfer-Encoding', 'chunked');
  
  try {
    // 获取表单数据
    const formData = await request.formData();
    const imageFile = formData.get('image');
    
    if (!imageFile) {
      return NextResponse.json(
        { success: false, message: '未提供图片文件' },
        { status: 400 }
      );
    }
    
    // 记录原始图片信息
    console.log('收到发货图片上传请求:', {
      filename: imageFile.name,
      filesize: imageFile.size,
      type: imageFile.type
    });
    
    // 获取文件数据
    const fileBuffer = await imageFile.arrayBuffer();
    
    // 生成唯一标识符 - 不使用百度图像签名
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 10);
    const cont_sign = `shipment_${timestamp}_${randomId}`;
    
    // 生成BOS路径
    const bosKey = generateBosKey(imageFile.name, cont_sign);
    
    // 使用uploadToBos直接上传到BOS，不通过百度图像API
    try {
      const uploadResult = await uploadToBos(
        new Blob([fileBuffer], { type: imageFile.type || 'image/jpeg' }), 
        bosKey
      );
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.message || '存储文件失败');
      }
      
      // 返回结果
      return NextResponse.json({
        success: true,
        message: '图片上传成功',
        cont_sign: cont_sign,
        url: uploadResult.url,
        bosKey: bosKey
      });
    } catch (bosError) {
      console.error('BOS存储错误:', bosError);
      return NextResponse.json(
        { success: false, message: `BOS存储失败: ${bosError.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('发货图片上传错误:', error);
    return NextResponse.json(
      { success: false, message: `上传失败: ${error.message}` },
      { status: 500 }
    );
  }
} 