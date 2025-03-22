// 处理添加结果
if (response.ok) {
  let data;
  try {
    data = await response.json();
  } catch (e) {
    setMessage({
      type: 'error',
      text: '解析服务器响应失败：' + e.message
    });
    return;
  }
  
  // 检查是否至少部分成功（添加到搜索库成功）
  if (data.cont_sign) {
    setMessage({
      type: data.partial_success ? 'warning' : 'success',
      text: data.message || (data.imageUrl 
        ? '图片已成功添加到搜索库！' 
        : '图片已添加到搜索库，但高质量版本存储失败。搜索功能不受影响。')
    });
    onSuccess && onSuccess(data);
  } else {
    // 完全失败的情况
    setMessage({
      type: 'error',
      text: data.message || '添加失败，请重试'
    });
  }
} else {
  // HTTP错误
  try {
    const errorData = await response.json();
    setMessage({
      type: 'error',
      text: errorData.message || `请求失败 (${response.status})`
    });
  } catch (e) {
    // 响应不是JSON格式
    setMessage({
      type: 'error',
      text: `请求失败 (${response.status}): 服务器返回非JSON响应`
    });
  }
} 