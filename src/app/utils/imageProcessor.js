import sharp from 'sharp';

/**
 * 压缩图像
 * @param {Buffer|ArrayBuffer} buffer 图像缓冲区
 * @param {Object} options 压缩选项
 * @returns {Promise<Buffer>} 压缩后的图像缓冲区
 */
export async function compressImage(buffer, options = {}) {
  try {
    const {
      maxSize = 1024 * 1024, // 默认最大1MB
      minWidth = 50,
      maxWidth = 800,
      quality = 80,
      preserveFormat = false
    } = options;

    // 将 ArrayBuffer 转换为 Buffer (如果需要)
    const inputBuffer = buffer instanceof ArrayBuffer ? Buffer.from(buffer) : buffer;

    // 获取图像元数据
    const metadata = await sharp(inputBuffer).metadata();
    
    // 确定目标宽度
    let targetWidth = metadata.width;
    if (targetWidth > maxWidth) {
      targetWidth = maxWidth;
    }
    if (targetWidth < minWidth) {
      targetWidth = minWidth;
    }

    // 计算调整比例
    const scale = targetWidth / metadata.width;
    const targetHeight = Math.round(metadata.height * scale);
    
    console.log(`压缩图像: ${metadata.width}x${metadata.height} -> ${targetWidth}x${targetHeight}`);

    // 根据原始格式选择输出格式
    let transformer = sharp(inputBuffer)
      .resize(targetWidth, targetHeight);
      
    // 如果保留原格式
    if (preserveFormat && metadata.format) {
      switch (metadata.format.toLowerCase()) {
        case 'jpeg':
        case 'jpg':
          return await transformer.jpeg({ quality }).toBuffer();
        case 'png':
          return await transformer.png({ quality: quality / 100 * 9 }).toBuffer();
        case 'webp':
          return await transformer.webp({ quality }).toBuffer();
        default:
          // 默认转为JPEG
          return await transformer.jpeg({ quality }).toBuffer();
      }
    } else {
      // 默认转为JPEG格式 (更小的文件尺寸)
      return await transformer.jpeg({ quality }).toBuffer();
    }
  } catch (error) {
    console.error('图像压缩失败:', error);
    // 压缩失败时返回原始buffer
    return buffer instanceof ArrayBuffer ? Buffer.from(buffer) : buffer;
  }
} 