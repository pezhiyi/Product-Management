import { NextResponse } from 'next/server';
import { getAccessToken, addImageToLibrary, searchSimilarImages } from '../../../utils/baiduApi';
import { getImageUrlFromContSign, getUrlFromBosKey, generateBosKey } from '../../../utils/bosStorage';
import { compressImage } from '../../../utils/imageProcessor';
import { getImageUrlFromSearchItem } from '../../../utils/bosStorage';

export async function POST(request) {
  try {
    // 获取表单数据
    const formData = await request.formData();
    const imageFile = formData.get('image');
    const mode = formData.get('mode') || 'search'; // 默认为搜索模式
    
    if (!imageFile) {
      return NextResponse.json(
        { success: false, message: '未提供图片文件' },
        { status: 400 }
      );
    }
    
    // 仅在添加模式下检查文件大小限制
    if (mode === 'add') {
      const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
      if (imageFile.size > MAX_FILE_SIZE) {
        return NextResponse.json({ 
          message: '添加图库时，图片不能超过3MB' 
        }, { status: 400 });
      }
    } else {
      // 搜索模式下使用较大的限制
      const MAX_SEARCH_FILE_SIZE = 100 * 1024 * 1024; // 100MB
      if (imageFile.size > MAX_SEARCH_FILE_SIZE) {
        return NextResponse.json({ 
          message: '搜索图片不能超过100MB' 
        }, { status: 400 });
      }
    }
    
    // 记录原始图片信息
    console.log('收到搜索请求:', {
      filename: imageFile.name,
      filesize: imageFile.size,
      type: imageFile.type
    });
    
    // 处理图片 - 准备用于搜索的版本
    const originalBuffer = await imageFile.arrayBuffer();
    let searchImageBuffer;
    let isCompressed = false;
    
    // 检查图片大小，如果超过3MB，则压缩用于搜索
    if (imageFile.size > 3 * 1024 * 1024) {
      // 压缩图片用于搜索
      searchImageBuffer = await compressImage(originalBuffer, {
        maxSize: 3 * 1024 * 1024,
        minWidth: 50,
        maxWidth: 1024,
        quality: 80
      });
      isCompressed = true;
      console.log(`搜索图片已压缩: ${imageFile.size} → ${searchImageBuffer.length} 字节`);
    } else {
      // 图片已经小于3MB，直接使用
      searchImageBuffer = Buffer.from(originalBuffer);
    }
    
    // 创建File对象用于搜索
    const searchImageFile = new File(
      [searchImageBuffer], 
      imageFile.name || 'search.jpg', 
      { type: imageFile.type || 'image/jpeg' }
    );
    
    // 获取访问令牌
    const accessToken = await getAccessToken();
    
    let responseData;
    // 根据模式选择操作
    if (mode === 'add') {
      // 添加图片到库中
      responseData = await addImageToLibrary(searchImageBuffer, accessToken);
    } else {
      // 搜索相似图片
      const searchResults = await searchSimilarImages(searchImageFile);
      
      if (!searchResults.success) {
        return NextResponse.json(
          { 
            success: false, 
            message: `图片搜索失败: ${searchResults.message}`,
            error: searchResults
          },
          { status: 500 }
        );
      }
      
      // 处理搜索结果，优化返回格式
      const enhancedResults = searchResults.results.map(item => {
        // 使用cont_sign生成标准URL
        const bosKey = generateBosKey(null, item.cont_sign);
        const standardImageUrl = getUrlFromBosKey(bosKey);
        
        // 尝试解析brief数据
        let briefData = {};
        try {
          if (item.brief && typeof item.brief === 'string') {
            briefData = JSON.parse(item.brief);
          }
        } catch (e) {
          console.warn('解析brief数据失败:', e);
        }
        
        // 构建增强的结果项 - 优先使用标准URL
        return {
          score: item.score,
          cont_sign: item.cont_sign,
          imageUrl: standardImageUrl,
          bosUrl: standardImageUrl,
          filename: briefData.filename || null,
          filesize: briefData.filesize || null,
          uploadTime: briefData.uploadTime || null,
          bosKey: bosKey,
          additionalInfo: briefData
        };
      });
      
      responseData = {
        success: true,
        message: `找到 ${enhancedResults.length} 个相似图片`,
        isCompressed,
        originalSize: imageFile.size,
        searchSize: searchImageBuffer.length,
        results: enhancedResults
      };
    }
    
    // 返回处理结果
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('搜索处理错误:', error);
    return NextResponse.json(
      { success: false, message: `搜索失败: ${error.message}` },
      { status: 500 }
    );
  }
} 