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
    try {
      const endpoint = process.env.BAIDU_BOS_ENDPOINT || 'https://gz.bcebos.com';
      // 处理可能的密钥格式问题
      const ak = process.env.BAIDU_API_KEY ? process.env.BAIDU_API_KEY.trim() : '';
      const sk = process.env.BAIDU_SECRET_KEY ? process.env.BAIDU_SECRET_KEY.trim() : '';
      
      console.log(`初始化BOS客户端: 端点=${endpoint}, AK长度=${ak.length}, SK长度=${sk.length}`);
      
      bosClient = new BosClient({
        endpoint: endpoint,
        credentials: {
          ak: ak,
          sk: sk
        }
        // 移除其他可能导致问题的参数
      });
    } catch (error) {
      console.error('初始化BOS客户端失败:', error);
      throw error;
    }
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
    const bucket = process.env.BAIDU_BOS_BUCKET || 'ynnaiiamge';
    
    console.log('尝试上传图片到BOS:', { bucket, fileName, contentType });
    
    // 验证桶存在
    console.log('检查桶是否存在...');
    await client.headBucket(bucket);
    
    console.log('桶已确认存在，开始上传...');
    const result = await client.putObject(bucket, fileName, imageBuffer, {
      contentType: contentType
    });
    
    // 构建图片URL
    const imageUrl = getUrlFromBosKey(fileName);
    console.log('图片上传成功，URL:', imageUrl);
    
    return imageUrl;
  } catch (error) {
    console.error('上传图片到BOS失败:', error);
    
    // 提供更详细的错误信息
    if (error.message.includes('bucket does not exist')) {
      console.error('桶不存在错误，请检查桶名称和权限');
    } else if (error.message.includes('signature')) {
      console.error('签名错误，请检查AK/SK是否正确');
    }
    
    throw new Error(`上传图片到BOS失败: ${error.message}`);
  }
}

// 修改 uploadToBos 函数
export async function uploadToBos(file, key) {
  try {
    console.log('开始BOS上传:', {
      fileSize: file.size,
      fileName: file.name,
      key
    });

    // 获取BOS客户端
    const client = getBosClient();
    
    if (!client) {
      throw new Error('无法初始化BOS客户端');
    }
    
    // 准备文件内容
    const buffer = await file.arrayBuffer();
    
    // 确定内容类型，默认为PNG
    const contentType = file.type || 'image/png';
    
    // 获取正确的桶名
    const bucket = process.env.BAIDU_BOS_BUCKET || 'ynnaiiamge';
    
    console.log('尝试上传文件到BOS:', { bucket, key, contentType });
    
    // 验证桶存在
    try {
      await client.headBucket(bucket);
      console.log('桶已确认存在，开始上传...');
    } catch (err) {
      console.error('检查桶失败:', err);
      return {
        success: false,
        message: `桶访问错误: ${err.message}`
      };
    }

    // 使用分块上传
    const partSize = 5 * 1024 * 1024; // 5MB 分块大小
    const totalSize = buffer.byteLength;
    const parts = Math.ceil(totalSize / partSize);

    // 初始化分块上传
    const initResult = await client.initiateMultipartUpload(bucket, key, {
      'Content-Type': contentType,
      'x-bce-meta-original-filename': file.name || 'image.png',
      'x-bce-meta-upload-time': new Date().toISOString()
    });

    console.log('初始化分块上传:', initResult);

    // 上传各个分块
    const uploadPromises = [];
    for (let i = 0; i < parts; i++) {
      const start = i * partSize;
      const end = Math.min(start + partSize, totalSize);
      const partBuffer = buffer.slice(start, end);
      
      uploadPromises.push(
        client.uploadPartFromBlob(
          bucket,
          key,
          initResult.uploadId,
          i + 1,
          Buffer.from(partBuffer)
        )
      );
    }

    // 等待所有分块上传完成
    const uploadResults = await Promise.all(uploadPromises);
    console.log('所有分块上传完成:', uploadResults);

    // 完成分块上传
    const completeResult = await client.completeMultipartUpload(
      bucket,
      key,
      initResult.uploadId,
      uploadResults.map((_, index) => ({
        partNumber: index + 1,
        eTag: `"${index + 1}"` // BOS 不要求实际的 ETag
      }))
    );

    console.log('完成分块上传:', completeResult);
    
    // 构建文件URL
    const fileUrl = getUrlFromBosKey(key);
    console.log('文件上传成功，URL:', fileUrl);

    return {
      success: true,
      url: fileUrl,
      key: key,
      contentType: contentType,
      response: completeResult
    };
  } catch (error) {
    console.error('上传到BOS失败:', error);
    
    // 提供更详细的错误信息
    if (error.message.includes('bucket does not exist')) {
      console.error('桶不存在错误，请检查桶名称和权限');
    } else if (error.message.includes('signature')) {
      console.error('签名错误，请检查AK/SK是否正确');
    }
    
    return {
      success: false,
      message: error.message,
      error: error
    };
  }
}

// 从BOS key获取URL
export function getUrlFromBosKey(key) {
  // 使用完整URL格式，避免DNS解析问题
  const domain = process.env.BAIDU_BOS_DOMAIN || `${process.env.BAIDU_BOS_BUCKET}.${process.env.BAIDU_BOS_ENDPOINT.replace(/^https?:\/\//, '')}`;
  
  // 确保不重复 https://
  const cleanDomain = domain.replace(/^https?:\/\//, '');
  
  return `https://${cleanDomain}/${key}`;
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