/**
 * URL映射存储工具
 * 用于管理和存储图片URL的映射关系
 */

// 内存缓存
const urlMappings = new Map();

/**
 * 保存URL映射
 * @param {string} originalUrl - 原始URL
 * @param {string} mappedUrl - 映射后的URL
 * @param {Object} metadata - 额外的元数据
 * @returns {Object} 保存结果
 */
export function saveUrlMapping(originalUrl, mappedUrl, metadata = {}) {
  try {
    const timestamp = Date.now();
    const mapping = {
      originalUrl,
      mappedUrl,
      metadata,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    urlMappings.set(originalUrl, mapping);
    return { success: true, mapping };
  } catch (error) {
    console.error('保存URL映射失败:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 获取URL映射
 * @param {string} originalUrl - 原始URL
 * @returns {Object|null} 映射信息或null
 */
export function getUrlMapping(originalUrl) {
  try {
    return urlMappings.get(originalUrl) || null;
  } catch (error) {
    console.error('获取URL映射失败:', error);
    return null;
  }
}

/**
 * 获取所有URL映射
 * @returns {Array} 所有映射的数组
 */
export function getAllUrlMappings() {
  try {
    return Array.from(urlMappings.values());
  } catch (error) {
    console.error('获取所有URL映射失败:', error);
    return [];
  }
}

/**
 * 更新URL映射
 * @param {string} originalUrl - 原始URL
 * @param {Object} updates - 要更新的字段
 * @returns {Object} 更新结果
 */
export function updateUrlMapping(originalUrl, updates) {
  try {
    const existing = urlMappings.get(originalUrl);
    if (!existing) {
      return { success: false, error: '映射不存在' };
    }
    
    const updated = {
      ...existing,
      ...updates,
      updatedAt: Date.now()
    };
    
    urlMappings.set(originalUrl, updated);
    return { success: true, mapping: updated };
  } catch (error) {
    console.error('更新URL映射失败:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 删除URL映射
 * @param {string} originalUrl - 原始URL
 * @returns {boolean} 是否删除成功
 */
export function deleteUrlMapping(originalUrl) {
  try {
    return urlMappings.delete(originalUrl);
  } catch (error) {
    console.error('删除URL映射失败:', error);
    return false;
  }
} 