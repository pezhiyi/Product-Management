import { NextResponse } from 'next/server';
import axios from 'axios';
import { getAccessToken } from '../../../utils/baiduApi';

// 列出所有图片的API端点
export async function GET(request) {
  try {
    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const start = parseInt(searchParams.get('start') || '0');
    const count = parseInt(searchParams.get('count') || '20');
    
    // 获取访问令牌
    const accessToken = await getAccessToken();
    
    // 查询百度图像搜索库中的所有图片
    const response = await axios({
      method: 'GET',
      url: `https://aip.baidubce.com/rest/2.0/image-classify/v1/realtime_search/similar/list?access_token=${accessToken}&start=${start}&num=${count}`,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    // 处理响应
    if (response.data.error_code) {
      return NextResponse.json({
        success: false,
        message: `查询图库失败: ${response.data.error_msg}`,
        error_code: response.data.error_code
      });
    }
    
    // 处理返回的图片数据
    const images = response.data.result || [];
    
    // 增强图片数据，添加完整URL
    const enhancedImages = images.map(img => ({
      ...img,
      imageUrl: img.brief ? extractImageUrlFromBrief(img.brief) : null
    }));
    
    return NextResponse.json({
      success: true,
      total: response.data.total_num || 0,
      start,
      count,
      images: enhancedImages
    });
    
  } catch (error) {
    console.error('获取图库列表失败:', error);
    return NextResponse.json(
      { success: false, message: `获取图库列表失败: ${error.message}` },
      { status: 500 }
    );
  }
}

// 从brief JSON字符串中提取imageUrl
function extractImageUrlFromBrief(briefStr) {
  try {
    if (!briefStr) return null;
    const brief = JSON.parse(briefStr);
    return brief.imageUrl || null;
  } catch (e) {
    console.error('解析brief失败:', e);
    return null;
  }
} 