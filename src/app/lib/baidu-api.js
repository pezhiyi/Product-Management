const ACCESS_TOKEN_KEY = 'baiduAccessToken';
const ACCESS_TOKEN_EXPIRES_KEY = 'baiduAccessTokenExpires';

/**
 * 获取百度API访问令牌
 */
async function getAccessToken() {
  // 检查本地缓存的令牌是否有效
  const cachedToken = typeof localStorage !== 'undefined' ? localStorage.getItem(ACCESS_TOKEN_KEY) : null;
  const expiresTime = typeof localStorage !== 'undefined' ? localStorage.getItem(ACCESS_TOKEN_EXPIRES_KEY) : null;
  
  if (cachedToken && expiresTime && Date.now() < parseInt(expiresTime)) {
    return cachedToken;
  }
  
  // 获取新令牌
  const apiKey = process.env.BAIDU_API_KEY;
  const secretKey = process.env.BAIDU_SECRET_KEY;
  
  const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.access_token) {
      // 缓存令牌，设置过期时间（比实际过期时间提前5分钟）
      const expiresIn = data.expires_in - 300;
      const expiresTime = Date.now() + expiresIn * 1000;
      
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
        localStorage.setItem(ACCESS_TOKEN_EXPIRES_KEY, expiresTime.toString());
      }
      
      return data.access_token;
    } else {
      throw new Error('获取访问令牌失败');
    }
  } catch (error) {
    console.error('获取百度API访问令牌出错:', error);
    throw error;
  }
}

/**
 * 添加图片到百度相似图搜索库
 */
export async function addImageToLibrary(imageBase64) {
  try {
    const accessToken = await getAccessToken();
    const url = `https://aip.baidubce.com/rest/2.0/image-classify/v1/realtime_search/similar/add?access_token=${accessToken}`;
    
    const params = new URLSearchParams();
    params.append('image', imageBase64.split(',')[1]); // 移除Base64前缀
    params.append('brief', JSON.stringify({ 
      upload_time: new Date().toISOString(),
    }));
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });
    
    const data = await response.json();
    
    if (data.error_code) {
      throw new Error(`百度API错误: ${data.error_msg}`);
    }
    
    return data;
  } catch (error) {
    console.error('添加图片到库中时出错:', error);
    throw error;
  }
}

/**
 * 使用百度相似图搜索API搜索相似图片
 */
export async function searchSimilarImages(imageBase64) {
  try {
    const accessToken = await getAccessToken();
    const url = `https://aip.baidubce.com/rest/2.0/image-classify/v1/realtime_search/similar/search?access_token=${accessToken}`;
    
    const params = new URLSearchParams();
    params.append('image', imageBase64.split(',')[1]); // 移除Base64前缀
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });
    
    const data = await response.json();
    
    if (data.error_code) {
      throw new Error(`百度API错误: ${data.error_msg}`);
    }
    
    return data.result || [];
  } catch (error) {
    console.error('搜索相似图片时出错:', error);
    throw error;
  }
} 