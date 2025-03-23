import sharp from 'sharp';

/**
 * 压缩图片以满足百度图库要求
 * @param {Buffer|ArrayBuffer} imageBuffer - 原始图片数据
 * @param {Object} options - 压缩选项
 * @returns {Promise<Buffer>} 压缩后的图片数据
 */
export async function compressImage(imageBuffer, options = {}) {
  console.log('图片压缩 - 开始处理:', {
    inputSize: `${imageBuffer.byteLength / 1024 / 1024}MB`,
    options: {
      maxSize: options.maxSize ? `${options.maxSize / 1024 / 1024}MB` : '未指定',
      minWidth: options.minWidth || '未指定',
      maxWidth: options.maxWidth || '未指定',
      quality: options.quality || '未指定',
      preserveFormat: options.preserveFormat || false
    }
  });

  const {
    maxSize = 3 * 1024 * 1024, // 3MB
    minWidth = 50,
    maxWidth = 1024,
    quality = 80,
    preserveFormat = true // 新增选项：保留原始格式
  } = options;

  try {
    const buffer = imageBuffer instanceof ArrayBuffer 
      ? Buffer.from(imageBuffer) 
      : imageBuffer;
    
    const metadata = await sharp(buffer).metadata();
    console.log('图片压缩 - 原始图片信息:', {
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      channels: metadata.channels,
      hasAlpha: metadata.hasAlpha
    });
    
    // 如果图片已经符合要求，直接返回
    if (buffer.length <= maxSize && metadata.width >= minWidth) {
      console.log('图片压缩 - 跳过压缩:', {
        currentSize: `${buffer.length / 1024 / 1024}MB`,
        maxSize: `${maxSize / 1024 / 1024}MB`,
        width: metadata.width,
        minWidth
      });
      return buffer;
    }
    
    // 计算尺寸时添加日志
    let width = metadata.width;
    let height = metadata.height;
    
    if (Math.min(width, height) < minWidth) {
      const scale = minWidth / Math.min(width, height);
      const newWidth = Math.round(width * scale);
      const newHeight = Math.round(height * scale);
      console.log('图片压缩 - 调整最小尺寸:', {
        originalWidth: width,
        originalHeight: height,
        newWidth,
        newHeight,
        scale: scale.toFixed(2)
      });
      width = newWidth;
      height = newHeight;
    }
    
    if (width > maxWidth) {
      const scale = maxWidth / width;
      const newHeight = Math.round(height * scale);
      console.log('图片压缩 - 调整最大尺寸:', {
        originalWidth: width,
        originalHeight: height,
        newWidth: maxWidth,
        newHeight,
        scale: scale.toFixed(2)
      });
      width = maxWidth;
      height = newHeight;
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
    
    // 记录选择的格式
    console.log('图片压缩 - 选择输出格式:', {
      originalFormat: metadata.format,
      selectedFormat: format,
      reason: !['jpeg', 'png', 'webp', 'gif'].includes(metadata.format) ? '不支持的原始格式' : '保持原格式'
    });
    
    // 在压缩循环中添加更详细的日志
    let attempts = 0;
    const maxAttempts = 3;
    
    while (compressedBuffer.length > maxSize && attempts < maxAttempts) {
      attempts++;
      console.log('图片压缩 - 额外压缩尝试:', {
        attempt: attempts,
        currentSize: `${compressedBuffer.length / 1024 / 1024}MB`,
        targetSize: `${maxSize / 1024 / 1024}MB`,
        format,
        width,
        height,
        quality: format === 'png' ? 90 - (attempts * 15) : Math.max(quality - (attempts * 20), 20)
      });
      
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
      console.log('图片压缩 - 尝试结果:', {
        attempt: attempts,
        newSize: `${compressedBuffer.length / 1024 / 1024}MB`,
        reduction: `${((1 - compressedBuffer.length / buffer.length) * 100).toFixed(1)}%`
      });
    }
    
    // 最终结果日志
    console.log('图片压缩 - 最终结果:', {
      originalSize: `${buffer.length / 1024 / 1024}MB`,
      finalSize: `${compressedBuffer.length / 1024 / 1024}MB`,
      compressionRatio: `${((1 - compressedBuffer.length / buffer.length) * 100).toFixed(1)}%`,
      attempts,
      finalFormat: format,
      finalWidth: width,
      finalHeight: height,
      metTarget: compressedBuffer.length <= maxSize ? '是' : '否'
    });
    
    return compressedBuffer;
  } catch (error) {
    console.error('图片压缩 - 失败:', {
      error: error.message,
      stack: error.stack
    });
    throw new Error(`图片压缩失败: ${error.message}`);
  }
} 