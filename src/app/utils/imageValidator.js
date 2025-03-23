export function validateImage(file) {
  // 1. 检查文件类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('不支持的图片格式，请使用 JPG, PNG 或 WebP 格式');
  }

  // 2. 检查文件大小
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error('图片太大，请使用小于 10MB 的图片');
  }

  // 3. 检查图片尺寸
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      if (width < 50 || height < 50) {
        reject(new Error('图片尺寸太小，最小尺寸为 50x50'));
      }
      if (width > 4096 || height > 4096) {
        reject(new Error('图片尺寸太大，最大尺寸为 4096x4096'));
      }
      resolve(true);
    };
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = URL.createObjectURL(file);
  });
} 