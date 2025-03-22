import sharp from 'sharp';

/**
 * 压缩图片以满足百度图库要求
 * @param {Buffer|ArrayBuffer} imageBuffer - 原始图片数据
 * @param {Object} options - 压缩选项
 * @returns {Promise<Buffer>} 压缩后的图片数据
 */
export async function compressImage(imageBuffer, options = {}) {
  const {
    maxSize = 3 * 1024 * 1024, // 3MB
    minWidth = 50,
    maxWidth = 1024,
    quality = 80,
    preserveFormat = true // 新增选项：保留原始格式
  } = options;

  try {
    // 转换ArrayBuffer为Buffer
    const buffer = imageBuffer instanceof ArrayBuffer 
      ? Buffer.from(imageBuffer) 
      : imageBuffer;
    
    // 获取图片信息
    const metadata = await sharp(buffer).metadata();
    
    // 如果图片已经小于最大尺寸，直接返回
    if (buffer.length <= maxSize && metadata.width >= minWidth) {
      return buffer;
    }
    
    // 计算适当的调整尺寸
    let width = metadata.width;
    let height = metadata.height;
    
    // 确保图片最小边至少为50px
    if (Math.min(width, height) < minWidth) {
      const scale = minWidth / Math.min(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }
    
    // 如果图片太大，缩小它
    if (width > maxWidth) {
      const scale = maxWidth / width;
      width = maxWidth;
      height = Math.round(height * scale);
    }
    
    // 压缩图片 - 先调整大小
    let processedImage = sharp(buffer)
      .resize(width, height, { fit: 'inside' });
    
    // 根据原始格式选择输出格式
    let format = metadata.format;
    
    // 如果需要保留原始格式，但不是常见格式，使用PNG作为默认
    if (!['jpeg', 'png', 'webp', 'gif'].includes(format)) {
      format = 'png'; // 默认使用PNG以支持透明
    }
    
    // 应用适当的压缩格式，PNG优先
    if (format === 'png') {
      // PNG格式保留透明通道
      processedImage = processedImage.png({ 
        compressionLevel: 9,
        adaptiveFiltering: true,
        palette: true // 尝试使用调色板减小文件大小
      });
    } else if (format === 'jpeg') {
      processedImage = processedImage.jpeg({ quality });
    } else if (format === 'webp') {
      // WebP也支持透明
      processedImage = processedImage.webp({ 
        quality,
        alphaQuality: 100, // 保持高质量的透明通道
        lossless: false // 设置为true可获得更好的透明度，但文件更大
      });
    } else {
      // 其他格式使用PNG以支持透明
      processedImage = processedImage.png({ compressionLevel: 9 });
    }
    
    // 获取压缩后的buffer
    let compressedBuffer = await processedImage.toBuffer();
    
    // 如果仍然太大，采取进一步措施
    let attempts = 0;
    const maxAttempts = 3;
    
    while (compressedBuffer.length > maxSize && attempts < maxAttempts) {
      attempts++;
      
      if (format === 'png') {
        // PNG通过降低位深和增加压缩来减小大小
        width = Math.round(width * 0.9);
        height = Math.round(height * 0.9);
        
        processedImage = sharp(buffer)
          .resize(width, height, { fit: 'inside' })
          .png({ 
            compressionLevel: 9,
            adaptiveFiltering: true,
            palette: true,
            quality: 90 - (attempts * 15) // 逐步降低质量
          });
      } else if (format === 'jpeg' || format === 'webp') {
        // JPEG和WebP通过降低质量来减小大小
        const reducedQuality = Math.max(quality - (attempts * 20), 20);
        
        processedImage = sharp(buffer)
          .resize(width, height, { fit: 'inside' });
          
        if (format === 'jpeg') {
          processedImage = processedImage.jpeg({ quality: reducedQuality });
        } else {
          processedImage = processedImage.webp({ quality: reducedQuality });
        }
      }
      
      compressedBuffer = await processedImage.toBuffer();
    }
    
    return compressedBuffer;
  } catch (error) {
    console.error('压缩图片失败:', error);
    throw new Error(`图片压缩失败: ${error.message}`);
  }
} 