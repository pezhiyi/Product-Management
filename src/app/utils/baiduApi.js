import axios from 'axios';
import { uploadImageToBos, generateBosKey, getUrlFromBosKey } from './bosStorage';
import FormData from 'form-data';

// 从环境变量读取API密钥，如果不存在则使用示例代码中的值
const AK = process.env.BAIDU_API_KEY || "C0jafWvaUt3vuvizGYsPDLV5";
const SK = process.env.BAIDU_SECRET_KEY || "vAD7rECr7Ct0Bx8hkpKHvfdpz3tOhb7y";

// 打印当前使用的密钥状态（不显示具体值，只显示是否有值）
console.log('API密钥状态:', {
  AK: AK ? '已设置' : '未设置',
  SK: SK ? '已设置' : '未设置'
});

// 百度云 API 参数
const CLIENT_ID = process.env.BAIDU_API_KEY;
const CLIENT_SECRET = process.env.BAIDU_SECRET_KEY;
const TOKEN_URL = 'https://aip.baidubce.com/oauth/2.0/token';
const SIMILAR_SEARCH_ADD_URL = 'https://aip.baidubce.com/rest/2.0/image-classify/v1/realtime_search/similar/add';
const SIMILAR_SEARCH_SEARCH_URL = 'https://aip.baidubce.com/rest/2.0/image-classify/v1/realtime_search/similar/search';
const SIMILAR_SEARCH_UPDATE_URL = 'https://aip.baidubce.com/rest/2.0/image-classify/v1/realtime_search/similar/update';
const SIMILAR_SEARCH_LIST_URL = 'https://aip.baidubce.com/rest/2.0/image-classify/v1/realtime_search/similar/list';

/**
 * 获取百度API访问令牌
 * 使用示例代码中的逻辑重新实现
 * @returns {Promise<string>} 访问令牌
 */
export async function getAccessToken() {
  try {
    const response = await axios.get(TOKEN_URL, {
      params: {
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET
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
 * 添加图片到图像搜索库
 * @param {File|Blob} imageFile - 图片文件
 * @returns {Promise<Object>} 包含搜索结果的对象
 */
export async function addToImageSearchLibrary(imageFile) {
  try {
    // 获取访问令牌
    const accessToken = await getAccessToken();
    
    // 图片大小验证
    if (imageFile.size > 3 * 1024 * 1024) { // 3MB限制
      return {
        success: false,
        message: '图片大小超过3MB限制，请压缩后再上传'
      };
    }
    
    // 准备文件数据 - 转换为base64
    const buffer = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString('base64');
    
    // 准备请求参数 - 使用正确的格式
    const params = new URLSearchParams();
    params.append('image', base64Image);
    params.append('brief', JSON.stringify({
      fileName: imageFile.name || 'upload.jpg',
      fileSize: imageFile.size,
      fileType: imageFile.type || 'image/jpeg',
      uploadTime: new Date().toISOString()
    }));
    
    // 发送请求 - 使用已验证的请求格式
    const response = await axios({
      method: 'POST',
      url: `${SIMILAR_SEARCH_ADD_URL}?access_token=${accessToken}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: params
    });
    
    // 特殊处理：项目已存在的情况 (error_code: 216681)
    if (response.data.error_code === 216681) {
      return {
        success: true, // 视为成功，因为我们可以继续处理
        cont_sign: response.data.cont_sign,
        data: response.data,
        isExisting: true,
        message: '图片已存在于图库中'
      };
    }
    
    if (response.data.error_code) {
      return {
        success: false,
        message: `百度API错误: ${response.data.error_msg}`,
        error_code: response.data.error_code
      };
    }
    
    return {
      success: true,
      cont_sign: response.data.cont_sign,
      data: response.data,
      isExisting: false
    };
  } catch (error) {
    console.error('添加图片到搜索库失败:', error);
    return {
      success: false,
      message: `添加图片到搜索库失败: ${error.message}`
    };
  }
}

/**
 * 搜索相似图片
 * @param {File|Blob} imageFile - 图片文件
 * @returns {Promise<Object>} 包含搜索结果的对象
 */
export async function searchSimilarImages(imageFile) {
  try {
    // 获取访问令牌
    const accessToken = await getAccessToken();
    
    // 准备文件数据
    const buffer = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString('base64');
    
    // 准备请求参数
    const params = new URLSearchParams();
    params.append('image', base64Image);
    
    // 发送搜索请求
    const response = await axios({
      method: 'POST',
      url: `${SIMILAR_SEARCH_SEARCH_URL}?access_token=${accessToken}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: params
    });
    
    if (response.data.error_code) {
      return {
        success: false,
        message: `搜索失败: ${response.data.error_msg}`,
        error_code: response.data.error_code
      };
    }
    
    return {
      success: true,
      results: response.data.result || [],
      data: response.data
    };
  } catch (error) {
    console.error('搜索相似图片失败:', error);
    return {
      success: false,
      message: `搜索失败: ${error.message}`
    };
  }
}

/**
 * 添加图像到百度图库
 * @param {Buffer} imageBuffer - 图像二进制数据
 * @param {string} accessToken - 访问令牌
 * @returns {Promise<Object>} API响应对象
 */
export async function addImageToLibrary(imageBuffer, accessToken) {
  // 将图像转换为Base64编码
  const imageBase64 = imageBuffer.toString('base64');
  
  try {
    // 创建默认的brief对象 - 这是百度API必需的参数
    const defaultBrief = JSON.stringify({
      timestamp: Date.now(),
      filename: `image_${Date.now()}`
    });
    
    // 先添加到百度图像搜索库
    const options = {
      method: 'POST',
      url: `https://aip.baidubce.com/rest/2.0/image-classify/v1/realtime_search/similar/add?access_token=${accessToken}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      data: `image=${encodeURIComponent(imageBase64)}&brief=${encodeURIComponent(defaultBrief)}`
    };
    
    console.log('添加图像请求URL:', options.url);
    const response = await axios(options);
    console.log('添加图像响应:', response.data);
    
    // 如果添加成功，获取cont_sign
    if (response.data && response.data.cont_sign) {
      const contSign = response.data.cont_sign;
      
      try {
        // 上传同样的图像到BOS
        const imageUrl = await uploadImageToBos(imageBuffer, contSign);
        
        // 更新图片的brief，保存BOS URL
        await updateImageBrief(contSign, imageUrl, accessToken);
        
        // 返回带有BOS URL的响应
        return {
          ...response.data,
          imageUrl
        };
      } catch (bosError) {
        console.error('BOS上传失败，仅添加到图像库:', bosError);
        // 即使BOS上传失败，我们仍然返回图像库的添加结果
        return response.data;
      }
    }
    
    return response.data;
  } catch (error) {
    console.error('添加图像到百度库失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
    throw new Error(error.response?.data?.error_msg || `添加图像失败: ${error.message}`);
  }
}

/**
 * 更新图片brief，保存BOS URL和其他信息
 * @param {string} contSign - 图像签名
 * @param {string} imageUrl - BOS图片URL
 * @param {Object} metadata - 其他元数据
 * @returns {Promise<Object>} 更新结果
 */
export async function updateImageBrief(contSign, imageUrl, metadata = {}) {
  try {
    // 获取访问令牌
    const accessToken = await getAccessToken();
    
    // 计算标准化的BOS Key，确保一致性
    const bosKey = generateBosKey(null, contSign);
    const standardImageUrl = getUrlFromBosKey(bosKey);
    
    // 准备brief数据，使用标准化的URL
    const briefData = {
      imageUrl: standardImageUrl, // 使用标准化的URL
      bosUrl: standardImageUrl,   // 冗余字段，确保兼容性
      bosKey: bosKey,
      ...metadata,
      updateTime: new Date().toISOString(),
      cont_sign: contSign // 存储cont_sign便于后续查找
    };
    
    // 准备请求参数
    const params = new URLSearchParams();
    params.append('cont_sign', contSign);
    params.append('brief', JSON.stringify(briefData));
    
    // 使用正确的相似图库API
    const response = await axios({
      method: 'POST',
      url: `${SIMILAR_SEARCH_UPDATE_URL}?access_token=${accessToken}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: params
    });
    
    if (response.data.error_code) {
      return {
        success: false,
        message: `更新brief失败: ${response.data.error_msg}`,
        error_code: response.data.error_code
      };
    }
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('更新图片brief失败:', error);
    return {
      success: false,
      message: `更新brief失败: ${error.message}`
    };
  }
} 