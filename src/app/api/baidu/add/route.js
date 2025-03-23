import { NextResponse } from 'next/server';
import { addToImageSearchLibrary } from '../../../utils/baiduApi';
import { uploadToBos, generateBosKey, getUrlFromBosKey } from '../../../utils/bosStorage';
import { updateImageBrief } from '../../../utils/baiduApi';
import { compressImage } from '../../../utils/imageProcessor';

export async function POST(request) {
  try {
    const formData = await request.formData();
    
    // 处理图片上传
    const originalImageFile = formData.get('image');
    const filename = formData.get('filename') || originalImageFile.name || 'upload.jpg';
    const filesize = originalImageFile.size;
    
    console.log('添加图库 - 接收到请求:', {
      filename,
      filesize: `${(filesize / 1024 / 1024).toFixed(2)}MB`,
      type: originalImageFile.type,
      hasFile: !!originalImageFile
    });
    
    if (!originalImageFile) {
      console.warn('添加图库 - 未提供图片文件');
      return NextResponse.json(
        { success: false, message: '请提供图片' },
        { status: 400 }
      );
    }
    
    // 获取原始buffer
    const originalBuffer = await originalImageFile.arrayBuffer();
    console.log('添加图库 - 原始图片大小:', {
      bytes: originalBuffer.byteLength,
      mb: (originalBuffer.byteLength / 1024 / 1024).toFixed(2) + 'MB'
    });
    
    // 压缩处理
    let searchImageBuffer;
    let isCompressed = false;
    
    if (filesize > 3 * 1024 * 1024) {
      console.log('添加图库 - 开始压缩图片...');
      try {
        searchImageBuffer = await compressImage(originalBuffer, {
          maxSize: 3 * 1024 * 1024,
          minWidth: 50,
          maxWidth: 1024,
          quality: 80,
          preserveFormat: true
        });
        isCompressed = true;
        console.log('添加图库 - 压缩完成:', {
          originalSize: `${(filesize / 1024 / 1024).toFixed(2)}MB`,
          compressedSize: `${(searchImageBuffer.length / 1024 / 1024).toFixed(2)}MB`,
          compressionRatio: `${((1 - searchImageBuffer.length / filesize) * 100).toFixed(1)}%`
        });
      } catch (compressError) {
        console.error('添加图库 - 压缩失败:', compressError);
        searchImageBuffer = Buffer.from(originalBuffer);
        isCompressed = false;
      }
    } else {
      console.log('添加图库 - 图片小于3MB，跳过压缩');
      searchImageBuffer = Buffer.from(originalBuffer);
      isCompressed = false;
    }
    
    // 创建搜索用的File对象
    const searchImageFile = new File(
      [searchImageBuffer], 
      filename, 
      { type: originalImageFile.type || 'image/png' }
    );
    
    console.log('添加图库 - 开始添加到搜索库:', {
      filename,
      size: `${(searchImageFile.size / 1024 / 1024).toFixed(2)}MB`,
      type: searchImageFile.type
    });
    
    // 添加到图像搜索库
    const searchLibraryResult = await addToImageSearchLibrary(searchImageFile);
    console.log('添加图库 - 搜索库添加结果:', searchLibraryResult);
    
    if (!searchLibraryResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: `添加到搜图图库失败: ${searchLibraryResult.message}`,
          error: searchLibraryResult
        },
        { status: 500 }
      );
    }
    
    // 获取cont_sign，这是百度为图片分配的唯一标识
    const contSign = searchLibraryResult.cont_sign;
    
    // 使用统一的生成函数生成BOS Key
    const bosKey = generateBosKey(null, contSign); // 总是基于cont_sign
    
    // 上传到BOS - 原始版本保持高质量
    const bosUploadResult = await uploadToBos(originalImageFile, bosKey);
    
    if (!bosUploadResult.success) {
      return NextResponse.json({
        success: true, // 整体仍视为成功
        message: searchLibraryResult.isExisting 
          ? '图片已存在于图库中，但未能上传到BOS' 
          : '图片已添加到图库，但未能上传到BOS',
        cont_sign: contSign,
        bosError: bosUploadResult.message,
        isExisting: searchLibraryResult.isExisting,
        isCompressed
      });
    }
    
    // 构建标准化的URL
    const standardImageUrl = getUrlFromBosKey(bosKey);
    
    // 更新brief - 使用标准化的URL
    const briefUpdateResult = await updateImageBrief(contSign, standardImageUrl, {
      filename,
      filesize: originalImageFile.size,
      bosKey,
      isCompressed,
      originalSize: originalImageFile.size,
      compressedSize: isCompressed ? searchImageBuffer.length : null,
      updateTime: new Date().toISOString()
    });
    
    // 全部成功，返回结果
    return NextResponse.json({
      success: true,
      message: searchLibraryResult.isExisting 
        ? `图片已存在于图库中，更新了BOS存储链接${isCompressed ? '（搜索版本已压缩）' : ''}` 
        : `图片已成功添加到搜图图库和BOS存储${isCompressed ? '（搜索版本已压缩）' : ''}`,
      cont_sign: contSign,
      imageUrl: standardImageUrl,
      bosUrl: standardImageUrl,
      bosKey: bosKey,
      filename: filename,
      filesize: filesize,
      isExisting: searchLibraryResult.isExisting,
      isCompressed,
      briefUpdateSuccess: briefUpdateResult.success
    });
    
  } catch (error) {
    console.error('添加图库 - 完整错误:', error);
    return NextResponse.json(
      { success: false, message: `添加图片失败: ${error.message}` },
      { status: 500 }
    );
  }
} 