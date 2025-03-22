import { BosClient } from '@baiducloud/sdk';

// 从环境变量获取百度云存储配置
const BOS_ENDPOINT = process.env.BAIDU_BOS_ENDPOINT || 'https://gz.bcebos.com';
const BOS_AK = process.env.BAIDU_BOS_AK || process.env.BAIDU_API_KEY;
const BOS_SK = process.env.BAIDU_BOS_SK || process.env.BAIDU_SECRET_KEY;
const BOS_BUCKET = process.env.BAIDU_BOS_BUCKET || 'ynnaiiamge';
const BOS_DOMAIN = process.env.BAIDU_BOS_DOMAIN || 'ynnaiiamge.gz.bcebos.com';

// 初始化客户端
let bosClient = null;

export function getBosClient() {
  if (!bosClient) {
    bosClient = new BosClient({
      endpoint: BOS_ENDPOINT,
      credentials: {
        ak: BOS_AK,
        sk: BOS_SK
      }
    });
  }
  return bosClient;
}

/**
 * 构建BOS对象Key (文件路径)
 * @param {string} contSign - 图像签名
 * @returns {string} BOS对象Key
 */
export function getBosObjectKey(contSign) {
  return `images/${contSign.replace(/[,\/]/g, '_')}.jpg`;
}

/**
 * 根据cont_sign获取图片URL
 * @param {string} contSign - 图像签名
 * @returns {string} 图片URL
 */
export function getImageUrlFromContSign(contSign) {
  if (!contSign) return null;
  const bosKey = generateBosKey(null, contSign);
  return getUrlFromBosKey(bosKey);
}

/**
 * 生成预设的BOS对象key格式
 * @param {string} filename - 原始文件名
 * @param {string} contSign - 图片的cont_sign (可选)
 * @returns {string} BOS对象key
 */
export function generateBosKey(filename, contSign = null) {
  // 如果提供了cont_sign，总是使用cont_sign作为BOS Key的基础
  if (contSign) {
    // 替换cont_sign中可能的非法字符
    const safeContSign = contSign.replace(/[,\/]/g, '_');
    return `images/${safeContSign}.png`; // 使用PNG作为默认格式
  }
  
  // 否则使用时间戳和文件名
  // 尝试从文件名获取扩展名
  let extension = '.png'; // 默认扩展名
  if (filename && filename.includes('.')) {
    const origExt = filename.split('.').pop().toLowerCase();
    // 如果是支持的图片格式，使用原始扩展名
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(origExt)) {
      extension = `.${origExt}`;
    }
  }
  
  const sanitizedName = filename
    ? filename.replace(/[^\w\d.-]/g, '_').replace(/\.[^.]+$/, '') // 移除原始扩展名
    : `image_${Date.now()}`;
    
  return `images/${Date.now()}-${sanitizedName}${extension}`;
}

/**
 * 上传图片到BOS，保留透明通道
 * @param {Buffer} imageBuffer - 图像数据
 * @param {string} contSign - 图像签名（作为文件名）
 * @param {string} contentType - 内容类型，默认为PNG
 * @returns {Promise<string>} 上传后的图片URL
 */
export async function uploadImageToBos(imageBuffer, contSign, contentType = 'image/png') {
  try {
    const client = getBosClient();
    const fileName = generateBosKey(null, contSign);
    
    console.log('上传图片到BOS:', { bucket: BOS_BUCKET, fileName, contentType });
    
    const result = await client.putObject(BOS_BUCKET, fileName, imageBuffer, {
      contentType: contentType, // 使用传入的内容类型，默认为PNG
      // 添加自定义元数据
      metadata: {
        'x-bce-meta-cont-sign': contSign,
        'x-bce-meta-upload-time': new Date().toISOString(),
        'x-bce-meta-content-type': contentType
      }
    });
    
    // 构建图片的公开访问URL
    const imageUrl = getUrlFromBosKey(fileName);
    console.log('图片上传成功，URL:', imageUrl);
    
    return imageUrl;
  } catch (error) {
    console.error('上传图片到BOS失败:', error);
    throw new Error(`上传图片到BOS失败: ${error.message}`);
  }
}

// 修改 uploadToBos 函数，确保保留原始格式和透明通道
export async function uploadToBos(file, key) {
  try {
    // 获取BOS客户端
    const client = getBosClient();
    
    if (!client) {
      throw new Error('无法初始化BOS客户端');
    }
    
    // 准备文件内容
    const buffer = await file.arrayBuffer();
    
    // 确定内容类型，默认为PNG
    const contentType = file.type || 'image/png';
    
    // 使用正确的参数顺序上传到BOS
    const result = await client.putObject(
      process.env.BAIDU_BOS_BUCKET,
      key,
      Buffer.from(buffer),
      {
        contentType: contentType,
        metadata: {
          'x-bce-meta-original-filename': file.name || 'image.png',
          'x-bce-meta-upload-time': new Date().toISOString()
        }
      }
    );
    
    // 构建文件URL
    const fileUrl = getUrlFromBosKey(key);
    
    return {
      success: true,
      url: fileUrl,
      key: key,
      contentType: contentType,
      response: result
    };
  } catch (error) {
    console.error('上传到BOS失败:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

// 从BOS key获取URL
export function getUrlFromBosKey(key) {
  // 首选自定义域名
  if (process.env.BAIDU_BOS_DOMAIN) {
    return `https://${process.env.BAIDU_BOS_DOMAIN}/${key}`;
  }
  
  // 备用BOS域名
  return `https://${process.env.BAIDU_BOS_BUCKET}.${process.env.BAIDU_BOS_ENDPOINT}/${key}`;
}

/**
 * 从搜索结果中获取图片URL的统一函数
 * @param {Object} item - 搜索结果项
 * @returns {string|null} 图片URL
 */
export function getImageUrlFromSearchItem(item) {
  // 优先使用已有的 bosUrl
  if (item.bosUrl) {
    return item.bosUrl;
  }
  
  // 其次尝试从brief中提取
  try {
    if (item.brief && typeof item.brief === 'string') {
      const briefData = JSON.parse(item.brief);
      if (briefData.imageUrl) {
        return briefData.imageUrl;
      }
    }
  } catch (e) {
    console.error('解析brief数据失败:', e);
  }
  
  // 最后从cont_sign生成
  if (item.cont_sign) {
    return getImageUrlFromContSign(item.cont_sign);
  }
  
  return null;
} 