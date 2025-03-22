// 图库存储管理工具
import { getImageUrlFromContSign } from './bosStorage';

// 本地存储键名
const LIBRARY_STORAGE_KEY = 'image_library';

/**
 * 获取完整图库列表
 * @returns {Array} 图库项目数组
 */
export function getLibrary() {
  if (typeof window === 'undefined') return []; // 服务器端返回空数组
  
  try {
    const libraryJson = localStorage.getItem(LIBRARY_STORAGE_KEY);
    return libraryJson ? JSON.parse(libraryJson) : [];
  } catch (e) {
    console.error('获取图库数据失败:', e);
    return [];
  }
}

/**
 * 添加图片到图库
 * @param {Object} imageData 图片数据对象
 * @returns {Array} 更新后的图库
 */
export function addToLibrary(imageData) {
  if (typeof window === 'undefined') return []; // 服务器端不执行
  
  try {
    const library = getLibrary();
    
    // 创建新的图库项
    const newItem = {
      id: `img_${Date.now()}`, // 生成唯一ID
      timestamp: Date.now(),
      dateAdded: new Date().toISOString(),
      ...imageData,
      bosUrl: imageData.bosUrl || (imageData.cont_sign ? getImageUrlFromContSign(imageData.cont_sign) : null),
    };
    
    // 添加到图库并保存
    const updatedLibrary = [newItem, ...library];
    localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(updatedLibrary));
    
    return updatedLibrary;
  } catch (e) {
    console.error('添加到图库失败:', e);
    return getLibrary(); // 返回原始图库
  }
}

/**
 * 从图库中删除图片
 * @param {String} id 图片ID
 * @returns {Array} 更新后的图库
 */
export function removeFromLibrary(id) {
  if (typeof window === 'undefined') return []; // 服务器端不执行
  
  try {
    const library = getLibrary();
    const updatedLibrary = library.filter(item => item.id !== id);
    localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(updatedLibrary));
    return updatedLibrary;
  } catch (e) {
    console.error('从图库删除失败:', e);
    return getLibrary(); // 返回原始图库
  }
}

/**
 * 筛选图库
 * @param {Object} filters 筛选条件
 * @returns {Array} 筛选后的图库项目数组
 */
export function filterLibrary(filters = {}) {
  const library = getLibrary();
  
  return library.filter(item => {
    // 日期范围筛选
    if (filters.dateFrom) {
      const dateFrom = new Date(filters.dateFrom).getTime();
      if (new Date(item.dateAdded).getTime() < dateFrom) return false;
    }
    
    if (filters.dateTo) {
      const dateTo = new Date(filters.dateTo).getTime();
      if (new Date(item.dateAdded).getTime() > dateTo) return false;
    }
    
    // 名称搜索
    if (filters.searchText && item.filename) {
      const searchLower = filters.searchText.toLowerCase();
      const filenameLower = item.filename.toLowerCase();
      if (!filenameLower.includes(searchLower)) return false;
    }
    
    return true;
  });
}

/**
 * 排序图库
 * @param {Array} library 图库数组
 * @param {String} sortBy 排序字段
 * @param {Boolean} ascending 升序/降序
 * @returns {Array} 排序后的图库
 */
export function sortLibrary(library, sortBy = 'dateAdded', ascending = false) {
  return [...library].sort((a, b) => {
    let valueA, valueB;
    
    switch (sortBy) {
      case 'dateAdded':
        valueA = new Date(a.dateAdded).getTime();
        valueB = new Date(b.dateAdded).getTime();
        break;
      case 'filename':
        valueA = a.filename || '';
        valueB = b.filename || '';
        return ascending 
          ? valueA.localeCompare(valueB) 
          : valueB.localeCompare(valueA);
      case 'filesize':
        valueA = a.filesize || 0;
        valueB = b.filesize || 0;
        break;
      default:
        valueA = a.timestamp || 0;
        valueB = b.timestamp || 0;
    }
    
    return ascending ? valueA - valueB : valueB - valueA;
  });
} 