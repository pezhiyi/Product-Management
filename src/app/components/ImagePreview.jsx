import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { saveToShipmentManagement } from '../utils/shipmentStorage';

export default function ImagePreview({ imageUrl, onClose, alt = '图片预览', imageData = {} }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showShippingForm, setShowShippingForm] = useState(true);
  const [shipmentInfo, setShipmentInfo] = useState({
    address: '',
    size: '',
    material: '',
    quantity: 1,
    notes: '',
    status: '待发货'
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  
  // 添加refs用于粘贴识别
  const addressRef = useRef(null);
  const sizeRef = useRef(null);
  const materialRef = useRef(null);
  
  // 设置ESC键关闭
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);
  
  // 准备下载链接
  useEffect(() => {
    if (imageUrl) {
      const fileName = imageUrl.split('/').pop() || 'image.jpg';
      setDownloadUrl(imageUrl);
    }
  }, [imageUrl]);
  
  // 从imageData中提取初始信息，如果有
  useEffect(() => {
    if (imageData) {
      // 尝试从图片数据中提取规格、材质等信息
      const extractedInfo = extractProductInfo(imageData);
      setShipmentInfo(prev => ({
        ...prev,
        ...extractedInfo
      }));
    }
  }, [imageData]);
  
  // 尝试从图片数据中提取产品信息
  const extractProductInfo = (data) => {
    const info = {};
    
    // 如果有描述信息，尝试提取规格和材质
    if (data.title || data.description) {
      const text = `${data.title || ''} ${data.description || ''}`;
      
      // 尝试提取规格信息
      const sizeMatches = text.match(/(\d+(\.\d+)?)(cm|mm|m)\s*[x×]\s*(\d+(\.\d+)?)(cm|mm|m)/i);
      if (sizeMatches) {
        info.size = sizeMatches[0];
      }
      
      // 尝试提取材质信息 - 更新为新的材质列表
      const materialKeywords = ['硅藻泥', '丝圈', '水晶绒', '仿羊绒', 'PVC'];
      for (const material of materialKeywords) {
        if (text.includes(material)) {
          info.material = material;
          break;
        }
      }
    }
    
    return info;
  };
  
  // 复制图片到剪贴板
  const handleCopyImage = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      if (navigator.clipboard && navigator.clipboard.write) {
        const item = new ClipboardItem({
          [blob.type]: blob
        });
        
        await navigator.clipboard.write([item]);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } else {
        alert('您的浏览器不支持直接复制图片，请右键图片另存为');
      }
    } catch (err) {
      console.error('复制图片失败:', err);
      alert('复制图片失败，请重试');
    }
  };
  
  // 处理表单字段变更
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShipmentInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 处理粘贴事件，自动提取规格和材质
  const handlePaste = (e, fieldName) => {
    const pastedText = e.clipboardData.getData('text');
    if (!pastedText) return;
    
    if (fieldName === 'address') {
      // 如果是地址字段，可以直接使用粘贴的全部内容
      return;
    }
    
    // 提取尺寸规格
    if (fieldName === 'size' && !shipmentInfo.size) {
      const sizeMatches = pastedText.match(/(\d+(\.\d+)?)(cm|mm|m)\s*[x×]\s*(\d+(\.\d+)?)(cm|mm|m)/i);
      if (sizeMatches) {
        setShipmentInfo(prev => ({
          ...prev,
          size: sizeMatches[0]
        }));
        // 如果文本中还包含材质信息，同步更新材质
        if (!shipmentInfo.material) {
          checkAndUpdateMaterial(pastedText);
        }
      }
    }
    
    // 提取材质
    if (fieldName === 'material' && !shipmentInfo.material) {
      checkAndUpdateMaterial(pastedText);
    }
  };
  
  // 检查并更新材质信息
  const checkAndUpdateMaterial = (text) => {
    const materialKeywords = ['硅藻泥', '丝圈', '水晶绒', '仿羊绒', 'PVC'];
    for (const material of materialKeywords) {
      if (text.includes(material)) {
        setShipmentInfo(prev => ({
          ...prev,
          material: material
        }));
        return true;
      }
    }
    return false;
  };
  
  // 保存到发货管理
  const handleSaveShipment = () => {
    // 创建完整的发货信息对象
    const fullShipmentData = {
      ...shipmentInfo,
      imageUrl,
      productData: imageData,
      dateAdded: new Date().toISOString(),
      id: `ship_${Date.now()}`
    };
    
    // 保存数据
    if (saveToShipmentManagement(fullShipmentData)) {
      // 显示简短的成功提示
      setSaveSuccess(true);
      
      // 短暂延迟后关闭窗口
      setTimeout(() => {
        onClose();
      }, 800);
    }
  };
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" 
      onClick={onClose}
    >
      <div 
        className="relative bg-white rounded-lg max-w-[1500px] w-[85%] max-h-[85vh] min-h-[700px] flex flex-col" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">图片预览与发货信息</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyImage}
              className="p-2 text-gray-600 hover:text-blue-600 rounded-full hover:bg-gray-100 flex items-center"
              title="复制图片"
            >
              {copySuccess ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              )}
              <span className="text-sm">复制图片</span>
            </button>
            
            <a
              href={downloadUrl}
              download
              className="p-2 text-gray-600 hover:text-blue-600 rounded-full hover:bg-gray-100 flex items-center"
              title="下载图片"
              onClick={e => e.stopPropagation()}
            >
              <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="text-sm">下载</span>
            </a>
            
            <button onClick={onClose} className="p-2 text-gray-600 hover:text-red-600 rounded-full hover:bg-gray-100">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* 灵活布局：图片和表单并排显示 */}
        <div className="relative flex-grow overflow-auto flex flex-col md:flex-row">
          {/* 图片显示区域 */}
          <div className="md:w-1/2 p-4 flex items-center justify-center bg-gray-50 min-h-[500px]">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-70 z-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            )}
            
            {error ? (
              <div className="flex flex-col items-center justify-center text-red-500 py-12">
                <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="mt-2">图片加载失败</p>
              </div>
            ) : (
              <div className="relative h-full w-full min-h-[450px]">
                <Image
                  src={imageUrl}
                  alt={alt}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                  onLoadingComplete={() => setLoading(false)}
                  onError={() => {
                    setLoading(false);
                    setError(true);
                  }}
                />
              </div>
            )}
          </div>
            
          {/* 发货信息表单 */}
          <div className="md:w-1/2 p-4">
            <div className="bg-white rounded-lg">
              {saveSuccess ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
                  <svg className="w-6 h-6 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-green-800">发货信息保存成功!</h3>
                    <p className="text-xs text-green-700 mt-1">
                      您可以在"发货管理"标签页中查看和管理所有发货信息。
                    </p>
                  </div>
                </div>
              ) : (
                <form className="space-y-4">
                  <div className="text-base font-medium text-gray-700 mb-2">
                    发货信息
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      收货地址 <span className="text-xs text-gray-500">(支持粘贴)</span>
                    </label>
                    <textarea
                      ref={addressRef}
                      name="address"
                      value={shipmentInfo.address}
                      onChange={handleInputChange}
                      onPaste={(e) => handlePaste(e, 'address')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      rows="3"
                      placeholder="请输入或粘贴完整收货地址"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        尺寸规格 <span className="text-xs text-gray-500">(支持粘贴识别)</span>
                      </label>
                      <input
                        ref={sizeRef}
                        type="text"
                        name="size"
                        value={shipmentInfo.size}
                        onChange={handleInputChange}
                        onPaste={(e) => handlePaste(e, 'size')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="如: 10cm x 15cm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        材质
                      </label>
                      <select
                        name="material"
                        value={shipmentInfo.material}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">请选择材质</option>
                        <option value="硅藻泥">硅藻泥</option>
                        <option value="丝圈">丝圈</option>
                        <option value="水晶绒">水晶绒</option>
                        <option value="仿羊绒">仿羊绒</option>
                        <option value="PVC">PVC</option>
                        <option value="其他">其他</option>
                      </select>
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
                        value={shipmentInfo.quantity}
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
                        value={shipmentInfo.status}
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
                      value={shipmentInfo.notes}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      rows="2"
                      placeholder="其他备注信息"
                    />
                  </div>
                  
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleSaveShipment}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      保存到发货管理
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 