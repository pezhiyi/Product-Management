export function validateImage(file) {
  // 只检查是否为图片文件
  if (!file.type.startsWith('image/')) {
    throw new Error('请上传图片文件');
  }

  // 返回成功
  return Promise.resolve(true);
} 