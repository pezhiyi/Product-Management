'use client';

// 客户端压缩图片
export async function compressImage(file, maxSizeMB = 2) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      
      img.onload = function() {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // 限制最大尺寸
        const MAX_WIDTH = 1920;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // 转换为Blob
        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name, { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.8);
      };
      
      img.onerror = reject;
      img.src = e.target.result;
    };
    
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function isValidImageFile(file) {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return file && file.type && validTypes.includes(file.type);
}

export function getFileDetails(file) {
  return {
    name: file.name,
    type: file.type,
    size: file.size,
    lastModified: file.lastModified
  };
} 