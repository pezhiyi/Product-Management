/**
 * 发货管理存储工具
 * @tag #shipment #storage #management
 */

const STORAGE_KEY = 'shipments';

/**
 * 获取所有发货信息
 * @returns {Array} 发货信息列表
 */
export function getShipments() {
  const shipmentsString = localStorage.getItem(STORAGE_KEY);
  return shipmentsString ? JSON.parse(shipmentsString) : [];
}

/**
 * 保存发货信息
 * @param {Object} shipmentData 发货信息数据
 */
export function saveToShipmentManagement(shipmentData) {
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    const currentShipments = getShipments();
    const updatedShipments = [shipmentData, ...currentShipments];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedShipments));
    
    // 触发存储事件，通知其他标签页
    window.dispatchEvent(new Event('storage'));
    return true;
  } catch (error) {
    console.error('保存发货管理数据失败:', error);
    return false;
  }
}

/**
 * 更新发货信息
 * @param {string} id 发货信息ID
 * @param {Object} newData 新的数据
 */
export function updateShipment(id, newData) {
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    const shipments = getShipments();
    const index = shipments.findIndex(item => item.id === id);
    
    if (index !== -1) {
      shipments[index] = { ...shipments[index], ...newData };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(shipments));
      window.dispatchEvent(new Event('storage'));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('更新发货信息失败:', error);
    return false;
  }
}

/**
 * 删除发货信息
 * @param {string} id 发货信息ID
 */
export function deleteShipment(id) {
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    const shipments = getShipments();
    const filteredShipments = shipments.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredShipments));
    window.dispatchEvent(new Event('storage'));
    return true;
  } catch (error) {
    console.error('删除发货信息失败:', error);
    return false;
  }
} 