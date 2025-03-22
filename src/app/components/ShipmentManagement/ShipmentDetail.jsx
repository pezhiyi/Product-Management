import { useState } from 'react';
import Image from 'next/image';
import { updateShipment } from '../../utils/shipmentStorage';

export default function ShipmentDetail({ shipment, onClose, onUpdateStatus }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({...shipment});
  
  // 处理表单字段变更
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 保存编辑
  const handleSaveChanges = () => {
    if (updateShipment(shipment.id, editedData)) {
      onUpdateStatus(shipment.id, editedData.status);
      setIsEditing(false);
    }
  };
  
  // 格式化日期
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return '未知日期';
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">发货详情</h2>
          <button onClick={onClose}>
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="flex flex-col md:flex-row gap-6">
            {/* 左侧：图片和基本信息 */}
            <div className="md:w-1/3">
              <div className="bg-gray-100 rounded-lg overflow-hidden mb-4 relative aspect-square">
                <Image
                  src={shipment.imageUrl}
                  alt="商品图片"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500">添加时间</h3>
                <p className="text-sm text-gray-900">{formatDate(shipment.dateAdded)}</p>
              </div>
              
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500">当前状态</h3>
                <div className="mt-1">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    shipment.status === '待发货' ? 'bg-yellow-100 text-yellow-800' :
                    shipment.status === '已发货' ? 'bg-blue-100 text-blue-800' :
                    shipment.status === '已完成' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {shipment.status}
                  </span>
                </div>
              </div>
              
              {!isEditing && (
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    编辑信息
                  </button>
                  
                  {shipment.status === '待发货' && (
                    <button
                      onClick={() => onUpdateStatus(shipment.id, '已发货')}
                      className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      标记为已发货
                    </button>
                  )}
                  
                  {shipment.status === '已发货' && (
                    <button
                      onClick={() => onUpdateStatus(shipment.id, '已完成')}
                      className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                    >
                      标记为已完成
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {/* 右侧：详细信息或编辑表单 */}
            <div className="md:w-2/3">
              {isEditing ? (
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      收货地址
                    </label>
                    <textarea
                      name="address"
                      value={editedData.address}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      rows="3"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        尺寸规格
                      </label>
                      <input
                        type="text"
                        name="size"
                        value={editedData.size}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        材质
                      </label>
                      <input
                        type="text"
                        name="material"
                        value={editedData.material}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        数量
                      </label>
                      <input
                        type="number"
                        min="1"
                        name="quantity"
                        value={editedData.quantity}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        状态
                      </label>
                      <select
                        name="status"
                        value={editedData.status}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="待发货">待发货</option>
                        <option value="已发货">已发货</option>
                        <option value="已完成">已完成</option>
                        <option value="已取消">已取消</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      备注
                    </label>
                    <textarea
                      name="notes"
                      value={editedData.notes}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      rows="3"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveChanges}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      保存更改
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">收货地址</h3>
                    <p className="text-sm text-gray-900 whitespace-pre-line">{shipment.address || '未填写'}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">尺寸规格</h3>
                      <p className="text-sm text-gray-900">{shipment.size || '未填写'}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">材质</h3>
                      <p className="text-sm text-gray-900">{shipment.material || '未填写'}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">数量</h3>
                      <p className="text-sm text-gray-900">{shipment.quantity}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">备注</h3>
                    <p className="text-sm text-gray-900 whitespace-pre-line">{shipment.notes || '无备注'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 