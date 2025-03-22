import { NextResponse } from 'next/server';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { createCanvas } from 'canvas';

// 百度API参数
const AK = process.env.BAIDU_API_KEY;
const SK = process.env.BAIDU_SECRET_KEY;
const TOKEN_URL = 'https://aip.baidubce.com/oauth/2.0/token';
const SAME_HQ_SEARCH_URL = 'https://aip.baidubce.com/rest/2.0/realtime_search/same_hq/add';

/**
 * 获取百度API访问令牌
 * @returns {Promise<string>} 访问令牌
 */
async function getAccessToken() {
  try {
    const response = await axios.get(TOKEN_URL, {
      params: {
        grant_type: 'client_credentials',
        client_id: AK,
        client_secret: SK
      }
    });

    if (response.data && response.data.access_token) {
      return response.data.access_token;
    } else {
      throw new Error('未能获取访问令牌');
    }
  } catch (error) {
    console.error('获取访问令牌失败:', error);
    throw new Error(`获取访问令牌失败: ${error.message}`);
  }
}

/**
 * 创建一个符合百度图像搜索要求的测试图片
 * @returns {Buffer} 图片数据
 */
function createTestImage(width = 60, height = 60) {
  // 创建一个随机色彩的图片
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // 使用随机背景色
  const r = Math.floor(Math.random() * 255);
  const g = Math.floor(Math.random() * 255);
  const b = Math.floor(Math.random() * 255);
  ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
  ctx.fillRect(0, 0, width, height);
  
  // 添加随机形状
  for (let i = 0; i < 5; i++) {
    // 随机颜色
    ctx.fillStyle = `rgb(${Math.floor(Math.random() * 255)}, 
                          ${Math.floor(Math.random() * 255)}, 
                          ${Math.floor(Math.random() * 255)})`;
    
    // 随机位置和大小
    const x = Math.floor(Math.random() * width);
    const y = Math.floor(Math.random() * height);
    const size = 5 + Math.floor(Math.random() * 15);
    
    // 随机形状 (圆形或矩形)
    if (Math.random() > 0.5) {
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(x, y, size, size);
    }
  }
  
  // 添加时间戳文本，确保每次都不同
  ctx.fillStyle = 'white';
  ctx.font = '10px Arial';
  const timestamp = Date.now() + Math.random().toString(36).substring(2, 8);
  ctx.fillText(`Test ${timestamp}`, 5, height - 5);
  
  return canvas.toBuffer('image/jpeg');
}

/**
 * 测试上传图片到百度搜索库
 */
export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  try {
    // 1. 获取访问令牌
    const accessToken = await getAccessToken();
    results.accessToken = `成功获取 (${accessToken.substring(0, 10)}...)`;

    // 2. 创建符合要求的测试图片 (60x60像素)
    const testImageBuffer1 = createTestImage(60, 60);
    
    // 3. 保存测试图片到临时目录
    const tempDir = os.tmpdir();
    const tempFilePath1 = path.join(tempDir, `test-image-${Date.now()}-1.jpg`);
    fs.writeFileSync(tempFilePath1, testImageBuffer1);

    // 4. 测试图片上传
    try {
      // 转换为base64
      const base64Image1 = testImageBuffer1.toString('base64');
      
      // 准备请求参数
      const params = new URLSearchParams();
      params.append('image', base64Image1);
      params.append('brief', JSON.stringify({
        test: true,
        uploadTime: new Date().toISOString(),
        type: 'test-image'
      }));
      
      // 发送请求
      const response = await axios({
        method: 'POST',
        url: `https://aip.baidubce.com/rest/2.0/realtime_search/same_hq/add?access_token=${accessToken}`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: params
      });
      
      results.tests.push({
        name: '测试图片上传',
        success: !response.data.error_code,
        response: response.data,
        cont_sign: response.data.cont_sign || null,
        error: response.data.error_msg || null
      });
    } catch (error) {
      results.tests.push({
        name: '测试图片上传',
        success: false,
        error: error.message,
        details: error.response?.data || null
      });
    }
    
    // 5. 从文件上传测试
    try {
      const fileData = fs.readFileSync(tempFilePath1);
      const base64Image = fileData.toString('base64');
      
      const params = new URLSearchParams();
      params.append('image', base64Image);
      params.append('brief', JSON.stringify({
        test: true,
        uploadTime: new Date().toISOString(),
        type: 'file-test',
        path: tempFilePath1
      }));
      
      const response = await axios({
        method: 'POST',
        url: `https://aip.baidubce.com/rest/2.0/realtime_search/same_hq/add?access_token=${accessToken}`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: params
      });
      
      results.tests.push({
        name: '文件图片上传',
        success: !response.data.error_code,
        response: response.data,
        cont_sign: response.data.cont_sign || null,
        error: response.data.error_msg || null
      });
    } catch (error) {
      results.tests.push({
        name: '文件图片上传',
        success: false,
        error: error.message,
        details: error.response?.data || null
      });
    }

    // 为第二个测试创建不同的图片
    const testImageBuffer2 = createTestImage(70, 70);
    
    // 保存第二个测试图片到临时目录
    const tempFilePath2 = path.join(tempDir, `test-image-${Date.now()}-2.jpg`);
    fs.writeFileSync(tempFilePath2, testImageBuffer2);

    // 6. 测试第二个图片上传
    try {
      // 转换为base64
      const base64Image2 = testImageBuffer2.toString('base64');
      
      // 准备请求参数
      const params = new URLSearchParams();
      params.append('image', base64Image2);
      params.append('brief', JSON.stringify({
        test: true,
        uploadTime: new Date().toISOString(),
        type: 'test-image'
      }));
      
      // 发送请求
      const response = await axios({
        method: 'POST',
        url: `https://aip.baidubce.com/rest/2.0/realtime_search/same_hq/add?access_token=${accessToken}`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: params
      });
      
      results.tests.push({
        name: '测试第二个图片上传',
        success: !response.data.error_code,
        response: response.data,
        cont_sign: response.data.cont_sign || null,
        error: response.data.error_msg || null
      });
    } catch (error) {
      results.tests.push({
        name: '测试第二个图片上传',
        success: false,
        error: error.message,
        details: error.response?.data || null
      });
    }

    // 7. 从文件上传第二个测试图片
    try {
      const fileData = fs.readFileSync(tempFilePath2);
      const base64Image = fileData.toString('base64');
      
      const params = new URLSearchParams();
      params.append('image', base64Image);
      params.append('brief', JSON.stringify({
        test: true,
        uploadTime: new Date().toISOString(),
        type: 'file-test',
        path: tempFilePath2
      }));
      
      const response = await axios({
        method: 'POST',
        url: `https://aip.baidubce.com/rest/2.0/realtime_search/same_hq/add?access_token=${accessToken}`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: params
      });
      
      results.tests.push({
        name: '文件第二个图片上传',
        success: !response.data.error_code,
        response: response.data,
        cont_sign: response.data.cont_sign || null,
        error: response.data.error_msg || null
      });
    } catch (error) {
      results.tests.push({
        name: '文件第二个图片上传',
        success: false,
        error: error.message,
        details: error.response?.data || null
      });
    }

    // 6. 测试图片搜索
    try {
      // 使用刚上传的图片进行搜索 (修正变量名)
      const params = new URLSearchParams();
      params.append('image', testImageBuffer2.toString('base64'));
      
      const searchResponse = await axios({
        method: 'POST',
        url: `https://aip.baidubce.com/rest/2.0/image-classify/v1/realtime_search/same_hq/search?access_token=${accessToken}`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: params
      });
      
      results.tests.push({
        name: '图片搜索测试',
        success: !searchResponse.data.error_code,
        response: searchResponse.data,
        results_count: searchResponse.data.result ? searchResponse.data.result.length : 0,
        error: searchResponse.data.error_msg || null
      });
    } catch (error) {
      results.tests.push({
        name: '图片搜索测试',
        success: false,
        error: error.message,
        details: error.response?.data || null
      });
    }

    // 设置测试汇总信息
    results.summary = {
      total: results.tests.length,
      successful: results.tests.filter(t => t.success).length,
      failed: results.tests.filter(t => !t.success).length
    };

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

/**
 * 处理POST请求，上传用户提供的图片
 */
export async function POST(request) {
  try {
    // 解析用户上传的图片
    const formData = await request.formData();
    const imageFile = formData.get('image');
    
    if (!imageFile) {
      return NextResponse.json({
        success: false,
        message: '请提供图片文件'
      }, { status: 400 });
    }
    
    // 获取访问令牌
    const accessToken = await getAccessToken();
    
    // 准备文件数据
    const buffer = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString('base64');
    
    // 准备请求参数
    const params = new URLSearchParams();
    params.append('image', base64Image);
    params.append('brief', JSON.stringify({
      fileName: imageFile.name,
      fileSize: imageFile.size,
      fileType: imageFile.type,
      uploadTime: new Date().toISOString()
    }));
    
    // 发送请求
    const response = await axios({
      method: 'POST',
      url: `https://aip.baidubce.com/rest/2.0/realtime_search/same_hq/add?access_token=${accessToken}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: params
    });
    
    if (response.data.error_code) {
      return NextResponse.json({
        success: false,
        message: `百度API错误: ${response.data.error_msg}`,
        error_code: response.data.error_code,
        data: response.data
      });
    }
    
    return NextResponse.json({
      success: true,
      message: '图片已成功添加到百度图片搜索库',
      cont_sign: response.data.cont_sign,
      data: response.data
    });
    
  } catch (error) {
    console.error('上传图片到百度搜索库失败:', error);
    return NextResponse.json({
      success: false,
      message: `上传失败: ${error.message}`,
      error: error.response?.data || error.message
    }, { status: 500 });
  }
} 