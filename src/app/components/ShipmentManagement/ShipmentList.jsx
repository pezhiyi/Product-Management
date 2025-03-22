import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { getShipments, updateShipment, deleteShipment } from '../../utils/shipmentStorage';
import ShipmentDetail from './ShipmentDetail';

export default function ShipmentList() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [exportSuccess, setExportSuccess] = useState(false);
  
  // 分页和批量选择状态
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // 标签相关状态
  const [availableTags, setAvailableTags] = useState(['重要', '加急', '问题单', '已沟通', '特殊要求']);
  const [filterTag, setFilterTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [bulkTagInput, setBulkTagInput] = useState('');
  const [showBulkTagInput, setShowBulkTagInput] = useState(false);
  
  // 添加标签管理相关状态
  const [showTagManager, setShowTagManager] = useState(false);
  
  // 添加手动上传相关状态
  const [showAddForm, setShowAddForm] = useState(false);
  const [newShipment, setNewShipment] = useState({
    address: '',
    material: '',
    size: '',
    quantity: 1,
    notes: '',
    status: '待发货'
  });
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  // 加载发货数据
  useEffect(() => {
    const loadShipments = () => {
      const data = getShipments();
      setShipments(data);
      setLoading(false);
    };
    
    loadShipments();
    
    // 监听其他标签页更新
    const handleStorageChange = () => {
      loadShipments();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  // 根据状态筛选
  const filteredShipments = filterStatus === 'all' 
    ? shipments 
    : shipments.filter(shipment => shipment.status === filterStatus);
    
  // 如果设置了标签过滤，进一步过滤
  const tagFilteredShipments = filterTag 
    ? filteredShipments.filter(shipment => 
        shipment.tags && shipment.tags.includes(filterTag))
    : filteredShipments;
  
  // 计算分页数据
  const totalItems = tagFilteredShipments.length;
  const totalPages = Math.ceil(totalItems / perPage);
  const startIndex = (currentPage - 1) * perPage;
  const endIndex = Math.min(startIndex + perPage, totalItems);
  const currentShipments = tagFilteredShipments.slice(startIndex, endIndex);
  
  // 处理页码变更
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    // 切换页面时重置选择
    setSelectedIds([]);
    setSelectAll(false);
  };
  
  // 选择/取消选择单个项目
  const handleSelectItem = (id) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(itemId => itemId !== id);
      } else {
        return [...prev, id];
      }
    });
  };
  
  // 处理全选/取消全选
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
    } else {
      const allIds = currentShipments.map(shipment => shipment.id);
      setSelectedIds(allIds);
    }
    setSelectAll(!selectAll);
  };
  
  // 当选中的项目发生变化时更新全选状态
  useEffect(() => {
    if (currentShipments.length > 0 && selectedIds.length === currentShipments.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedIds, currentShipments]);
  
  // 批量更新状态
  const handleBulkUpdateStatus = (newStatus) => {
    if (selectedIds.length === 0) {
      alert('请先选择要操作的记录');
      return;
    }
    
    if (confirm(`确定要将选中的 ${selectedIds.length} 条记录状态更新为"${newStatus}"吗？`)) {
      let updated = true;
      selectedIds.forEach(id => {
        if (!updateShipment(id, { status: newStatus })) {
          updated = false;
        }
      });
      
      if (updated) {
        setShipments(prev => 
          prev.map(shipment => 
            selectedIds.includes(shipment.id) 
              ? { ...shipment, status: newStatus } 
              : shipment
          )
        );
        // 成功后清除选择
        setSelectedIds([]);
        setSelectAll(false);
      }
    }
  };
  
  // 批量删除处理
  const handleBulkDelete = () => {
    if (selectedIds.length === 0) {
      alert('请先选择要删除的记录');
      return;
    }
    
    if (confirm(`确定要删除选中的 ${selectedIds.length} 条记录吗？此操作无法撤销！`)) {
      let success = true;
      selectedIds.forEach(id => {
        if (!deleteShipment(id)) {
          success = false;
        }
      });
      
      if (success) {
        setShipments(prev => prev.filter(shipment => !selectedIds.includes(shipment.id)));
        if (selectedShipment && selectedIds.includes(selectedShipment.id)) {
          setSelectedShipment(null);
        }
        // 成功后清除选择
        setSelectedIds([]);
        setSelectAll(false);
      }
    }
  };
  
  // 更新状态处理
  const handleUpdateStatus = (id, newStatus) => {
    if (updateShipment(id, { status: newStatus })) {
      setShipments(prev => 
        prev.map(shipment => 
          shipment.id === id 
            ? { ...shipment, status: newStatus } 
            : shipment
        )
      );
    }
  };
  
  // 删除处理
  const handleDelete = (id) => {
    if (confirm('确定要删除这条发货记录吗？')) {
      if (deleteShipment(id)) {
        setShipments(prev => prev.filter(shipment => shipment.id !== id));
        if (selectedShipment?.id === id) {
          setSelectedShipment(null);
        }
      }
    }
  };
  
  // 修改导出功能以支持选中导出
  const handleExportShipments = async () => {
    // 根据选中状态决定导出哪些商品
    let itemsToExport = [];
    let exportTitle = '';
    
    if (selectedIds.length > 0) {
      // 导出选中的商品
      itemsToExport = shipments.filter(item => selectedIds.includes(item.id));
      exportTitle = `选中商品(${selectedIds.length}个)`;
    } else {
      // 没有选中项时，保持原来的逻辑：导出待发货状态的商品
      itemsToExport = shipments.filter(item => item.status === '待发货');
      exportTitle = '待发货商品';
      
      if (itemsToExport.length === 0) {
      alert('没有待发货的商品');
        return;
      }
    }
    
    if (itemsToExport.length === 0) {
      alert('没有选中任何商品');
      return;
    }
    
    setExportLoading(true);
    
    try {
      // 动态加载JSZip库
      const loadJSZip = () => {
        return new Promise((resolve, reject) => {
          // 检查是否已经加载了JSZip
          if (window.JSZip) {
            resolve(window.JSZip);
            return;
          }
          
          // 加载JSZip
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
          script.integrity = 'sha512-XMVd28F1oH/O71fzwBnV7HucLxVwtxf26XV8P4wPk26EDxuGZ91N8bsOttmnomcCD3CS5ZMRL50H0GgOHvegtg==';
          script.crossOrigin = 'anonymous';
          
          script.onload = () => resolve(window.JSZip);
          script.onerror = () => reject(new Error('Failed to load JSZip'));
          
          document.head.appendChild(script);
        });
      };
      
      // 动态加载FileSaver库
      const loadFileSaver = () => {
        return new Promise((resolve, reject) => {
          // 检查是否已经加载了FileSaver
          if (window.saveAs) {
            resolve(window.saveAs);
            return;
          }
          
          // 加载FileSaver
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js';
          script.integrity = 'sha512-Qlv6VSKh1gDKGoJbnyA5RMXYcvnpIqhO++MhIM2fStMcGT9i2T//tSwYFlcyoRRDcDZ+TYHpH8azBBCyhpSeqw==';
          script.crossOrigin = 'anonymous';
          
          script.onload = () => resolve(window.saveAs);
          script.onerror = () => reject(new Error('Failed to load FileSaver'));
          
          document.head.appendChild(script);
        });
      };
      
      // 加载所需的库
      const JSZip = await loadJSZip();
      const saveAs = await loadFileSaver();
      
      // 创建新的ZIP实例
      const zip = new JSZip();
      
      // 获取当前日期字符串
      const today = new Date();
      const dateStr = `${today.getFullYear()}${(today.getMonth()+1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
      
      // 清理文件名中的非法字符
      const sanitizeName = (name) => name.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_').trim();
      
      // 处理每个商品
      for (const [index, shipment] of itemsToExport.entries()) {
        // 构建文件名: 序号_材质_规格
        const fileNumber = (index + 1).toString().padStart(2, '0');
        const materialText = sanitizeName(shipment.material || '未知材质');
        const sizeText = sanitizeName(shipment.size || '标准');
        
        const imageFileName = `${fileNumber}_${materialText}_${sizeText}`;
        // 提取地址的第一部分作为文本文件名
        const addressShort = (shipment.address || '未知地址').split(/[,，]/)[0].trim();
        const addressSanitized = sanitizeName(addressShort);
        const textFileName = `${fileNumber}_${addressSanitized}`;
        
        try {
          // 获取图片内容
          const imgResponse = await fetch(shipment.imageUrl);
          if (imgResponse.ok) {
            const imgBlob = await imgResponse.blob();
            // 确定图片扩展名
            const imgExtension = imgResponse.headers.get('content-type')?.includes('png') ? 'png' : 'jpg';
            zip.file(`${imageFileName}.${imgExtension}`, imgBlob, {binary: true});
          }
          
          // 创建文本文件
          const txtContent = `收货地址:\r\n${shipment.address || '未填写地址'}\r\n\r\n` +
                           `商品信息:\r\n` +
                           `材质: ${shipment.material || '未指定'}\r\n` +
                           `规格: ${shipment.size || '标准'}\r\n` +
                           `数量: ${shipment.quantity || 1}\r\n\r\n` +
                           `备注:\r\n${shipment.notes || '无备注'}\r\n`;
          
          zip.file(`${textFileName}.txt`, txtContent);
        } catch (error) {
          console.error(`处理商品 ${shipment.id} 时出错:`, error);
          // 继续处理下一个商品
        }
      }
      
      // 生成ZIP文件
      const content = await zip.generateAsync({type: 'blob'});
      
      // 保存文件
      saveAs(content, `${dateStr}_${exportTitle}.zip`);
      
      // 显示成功提示
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
      
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试: ' + error.message);
    } finally {
      setExportLoading(false);
    }
  };
  
  // 处理添加新标签到系统
  const handleAddNewTag = () => {
    if (!newTagInput.trim()) return;
    
    // 检查标签是否已存在
    if (!availableTags.includes(newTagInput.trim())) {
      setAvailableTags(prev => [...prev, newTagInput.trim()]);
    }
    
    setNewTagInput('');
    setShowTagInput(false);
  };
  
  // 处理给单个shipment添加标签
  const handleAddTagToShipment = (shipmentId, tag) => {
    const shipment = shipments.find(s => s.id === shipmentId);
    if (!shipment) return;
    
    // 确保tags是数组
    const currentTags = shipment.tags || [];
    
    // 检查标签是否已存在
    if (currentTags.includes(tag)) return;
    
    // 更新标签
    const updatedTags = [...currentTags, tag];
    
    if (updateShipment(shipmentId, { tags: updatedTags })) {
      setShipments(prev => 
        prev.map(s => 
          s.id === shipmentId 
            ? { ...s, tags: updatedTags } 
            : s
        )
      );
    }
  };
  
  // 处理从shipment移除标签
  const handleRemoveTagFromShipment = (shipmentId, tag) => {
    const shipment = shipments.find(s => s.id === shipmentId);
    if (!shipment || !shipment.tags) return;
    
    // 移除标签
    const updatedTags = shipment.tags.filter(t => t !== tag);
    
    if (updateShipment(shipmentId, { tags: updatedTags })) {
      setShipments(prev => 
        prev.map(s => 
          s.id === shipmentId 
            ? { ...s, tags: updatedTags } 
            : s
        )
      );
      
      // 如果正在按此标签过滤，且此记录没有其他标签，则可能需要更新显示
      if (filterTag === tag && updatedTags.length === 0) {
        // 可以选择重置筛选或保留当前筛选
      }
    }
  };
  
  // 批量添加标签
  const handleBulkAddTag = () => {
    if (!bulkTagInput.trim() || selectedIds.length === 0) return;
    
    // 检查标签是否已在系统中，如果不在则添加
    if (!availableTags.includes(bulkTagInput.trim())) {
      setAvailableTags(prev => [...prev, bulkTagInput.trim()]);
    }
    
    const tagToAdd = bulkTagInput.trim();
    
    // 更新每个选中的shipment
    let allSuccess = true;
    selectedIds.forEach(id => {
      const shipment = shipments.find(s => s.id === id);
      if (!shipment) return;
      
      const currentTags = shipment.tags || [];
      if (currentTags.includes(tagToAdd)) return; // 跳过已有此标签的记录
      
      const updatedTags = [...currentTags, tagToAdd];
      if (!updateShipment(id, { tags: updatedTags })) {
        allSuccess = false;
      }
    });
    
    if (allSuccess) {
      // 更新本地状态
      setShipments(prev => 
        prev.map(shipment => {
          if (selectedIds.includes(shipment.id)) {
            const currentTags = shipment.tags || [];
            if (!currentTags.includes(tagToAdd)) {
              return { ...shipment, tags: [...currentTags, tagToAdd] };
            }
          }
          return shipment;
        })
      );
      
      // 重置输入和显示
      setBulkTagInput('');
      setShowBulkTagInput(false);
    }
  };
  
  // 批量移除标签
  const handleBulkRemoveTag = (tag) => {
    if (!tag || selectedIds.length === 0) return;
    
    if (!confirm(`确定要从选中的 ${selectedIds.length} 条记录中移除标签"${tag}"吗？`)) {
      return;
    }
    
    let allSuccess = true;
    selectedIds.forEach(id => {
      const shipment = shipments.find(s => s.id === id);
      if (!shipment || !shipment.tags || !shipment.tags.includes(tag)) return;
      
      const updatedTags = shipment.tags.filter(t => t !== tag);
      if (!updateShipment(id, { tags: updatedTags })) {
        allSuccess = false;
      }
    });
    
    if (allSuccess) {
      // 更新本地状态
      setShipments(prev => 
        prev.map(shipment => {
          if (selectedIds.includes(shipment.id) && shipment.tags && shipment.tags.includes(tag)) {
            return { 
              ...shipment, 
              tags: shipment.tags.filter(t => t !== tag) 
            };
          }
          return shipment;
        })
      );
    }
  };
  
  // 获取标签的颜色类
  const getTagColorClass = (tag) => {
    // 基于标签内容生成一致的颜色
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
      'bg-red-100 text-red-800',
    ];
    
    // 使用简单的哈希函数来确定颜色索引
    const hashCode = tag.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    
    return colors[hashCode % colors.length];
  };
  
  // 添加从系统中删除标签的处理函数
  const handleDeleteTag = (tagToDelete) => {
    if (!confirm(`确定要删除标签"${tagToDelete}"吗？这将从所有记录中移除该标签。`)) {
      return;
    }
    
    // 从所有记录中移除此标签
    const updatedShipments = shipments.map(shipment => {
      if (shipment.tags && shipment.tags.includes(tagToDelete)) {
        // 从记录中移除标签
        const updatedTags = shipment.tags.filter(tag => tag !== tagToDelete);
        // 更新数据库中的记录
        updateShipment(shipment.id, { tags: updatedTags });
        // 返回更新后的对象
        return { ...shipment, tags: updatedTags };
      }
      return shipment;
    });
    
    // 更新状态
    setShipments(updatedShipments);
    
    // 从可用标签列表中移除
    setAvailableTags(prev => prev.filter(tag => tag !== tagToDelete));
    
    // 如果当前正在按被删除的标签筛选，则重置筛选
    if (filterTag === tagToDelete) {
      setFilterTag('');
    }
  };
  
  // 处理图片上传到BOS
  const uploadImageToBOS = async (file) => {
    if (!file) return null;
    
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      setUploading(true);
      // 使用新的专用API而不是百度图像搜索API
      const response = await fetch('/api/shipment/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`上传失败: ${errorData.message || '未知错误'}`);
      }
      
      const data = await response.json();
      
      // 检查返回的数据
      if (!data.success) {
        throw new Error('上传失败: ' + (data.message || '未知错误'));
      }
      
      return { url: data.url, cont_sign: data.cont_sign };
    } catch (error) {
      console.error('上传图片时出错:', error);
      alert(`上传图片失败: ${error.message}`);
      return null;
    } finally {
      setUploading(false);
    }
  };
  
  // 处理图片文件选择
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // 验证文件类型
    if (!file.type.match('image.*')) {
      alert('请选择图片文件');
      return;
    }
    
    // 移除大小限制检查
    
    setUploadedImage(file);
    
    // 创建预览
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };
  
  // 处理表单输入变化
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewShipment(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 处理新增发货信息提交
  const handleAddShipment = async (e) => {
    e.preventDefault();
    
    if (!newShipment.address.trim()) {
      alert('请输入收货地址');
      return;
    }
    
    if (!uploadedImage) {
      alert('请上传商品图片');
      return;
    }
    
    try {
      // 上传图片到BOS
      const imageData = await uploadImageToBOS(uploadedImage);
      if (!imageData) return;
      
      // 创建新的发货记录
      const newRecord = {
        ...newShipment,
        id: Date.now().toString(),
        dateAdded: new Date().toISOString(),
        imageUrl: imageData.url,
        cont_sign: imageData.cont_sign,
        tags: []
      };
      
      // 使用现有的本地存储函数保存
      const currentShipments = getShipments();
      const updatedShipments = [newRecord, ...currentShipments];
      
      // 打印调试信息
      console.log('添加前的记录数:', currentShipments.length);
      console.log('添加后的记录数:', updatedShipments.length);
      
      localStorage.setItem('shipments', JSON.stringify(updatedShipments));
      
      // 更新状态并重置过滤器
      setShipments(updatedShipments);
      setFilterStatus('all');
      setFilterTag('');
      setCurrentPage(1);
      
      // 重置表单
      setNewShipment({
        address: '',
        material: '',
        size: '',
        quantity: 1,
        notes: '',
        status: '待发货'
      });
      setUploadedImage(null);
      setImagePreview('');
      
      // 调试确认数据已保存
      setTimeout(() => {
        const saved = localStorage.getItem('shipments');
        console.log('保存的数据条数:', saved ? JSON.parse(saved).length : 0);
      }, 300);

      // 关闭表单
      setShowAddForm(false);

      // 触发存储事件，以便其他标签页更新
      window.dispatchEvent(new Event('storage'));

    } catch (error) {
      console.error('添加发货记录时出错:', error);
      alert(`添加失败: ${error.message}`);
    }
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* 导出成功提示 */}
      {exportSuccess && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-3 flex items-center">
          <svg className="w-5 h-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-green-700">导出成功! 文件已保存到您的下载文件夹。</p>
        </div>
      )}
      
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-800">发货管理</h1>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center px-3 py-1.5 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            添加发货
          </button>
          
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
              setSelectedIds([]);
              setSelectAll(false);
            }}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部状态</option>
            <option value="待发货">待发货</option>
            <option value="已发货">已发货</option>
            <option value="已完成">已完成</option>
            <option value="已取消">已取消</option>
          </select>
          
          {/* 标签筛选下拉菜单 */}
          <select
            value={filterTag}
            onChange={(e) => {
              setFilterTag(e.target.value);
              setCurrentPage(1);
              setSelectedIds([]);
              setSelectAll(false);
            }}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部标签</option>
            {availableTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
          
          {/* 添加标签管理按钮 */}
          <button
            onClick={() => setShowTagManager(true)}
            className="flex items-center px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            标签管理
          </button>
          
          <button
            onClick={handleExportShipments}
            disabled={exportLoading}
            className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {exportLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                导出中...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {selectedIds.length > 0 ? `导出选中(${selectedIds.length})` : '导出待发货'}
              </>
            )}
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow flex-1 flex flex-col">
        <div className="p-3 border-b">
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => {
                setFilterStatus('all');
                setCurrentPage(1);
                setSelectedIds([]);
                setSelectAll(false);
              }}
              className={`px-3 py-1 text-sm rounded-full ${
                filterStatus === 'all' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              全部
            </button>
            <button 
              onClick={() => {
                setFilterStatus('待发货');
                setCurrentPage(1);
                setSelectedIds([]);
                setSelectAll(false);
              }}
              className={`px-3 py-1 text-sm rounded-full ${
                filterStatus === '待发货' 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              待发货
            </button>
            <button 
              onClick={() => {
                setFilterStatus('已发货');
                setCurrentPage(1);
                setSelectedIds([]);
                setSelectAll(false);
              }}
              className={`px-3 py-1 text-sm rounded-full ${
                filterStatus === '已发货' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              已发货
            </button>
            <button 
              onClick={() => {
                setFilterStatus('已完成');
                setCurrentPage(1);
                setSelectedIds([]);
                setSelectAll(false);
              }}
              className={`px-3 py-1 text-sm rounded-full ${
                filterStatus === '已完成' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              已完成
            </button>
            <button 
              onClick={() => {
                setFilterStatus('已取消');
                setCurrentPage(1);
                setSelectedIds([]);
                setSelectAll(false);
              }}
              className={`px-3 py-1 text-sm rounded-full ${
                filterStatus === '已取消' 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              已取消
            </button>
          </div>
          
          {/* 标签筛选按钮组 */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500">标签:</span>
            <button
              onClick={() => setFilterTag('')}
              className={`px-2 py-0.5 text-xs rounded-full ${
                filterTag === '' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              全部
            </button>
            
            {availableTags.map(tag => (
              <button
                key={tag}
                onClick={() => {
                  setFilterTag(tag);
                  setCurrentPage(1);
                  setSelectedIds([]);
                  setSelectAll(false);
                }}
                className={`px-2 py-0.5 text-xs rounded-full ${
                  filterTag === tag
                    ? getTagColorClass(tag)
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
            
            {/* 添加新标签 */}
            {showTagInput ? (
              <div className="flex items-center">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  placeholder="输入标签名"
                  className="border border-gray-300 rounded-l-md px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleAddNewTag();
                  }}
                  autoFocus
                />
                <button
                  onClick={handleAddNewTag}
                  className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-r-md hover:bg-blue-600"
                >
                  添加
                </button>
                <button
                  onClick={() => {
                    setShowTagInput(false);
                    setNewTagInput('');
                  }}
                  className="ml-1 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowTagInput(true)}
                className="flex items-center px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                添加标签
              </button>
            )}
        </div>
        
          {/* 批量操作按钮 */}
          {selectedIds.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center space-x-2 border-t pt-2">
              <span className="text-xs text-gray-600">已选择 {selectedIds.length} 项</span>
              <div className="border-l pl-2 flex flex-wrap space-x-2">
                <button
                  onClick={() => handleBulkUpdateStatus('待发货')}
                  className="px-2 py-0.5 text-xs rounded bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                >
                  设为待发货
                </button>
                <button
                  onClick={() => handleBulkUpdateStatus('已发货')}
                  className="px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-800 hover:bg-blue-200"
                >
                  设为已发货
                </button>
                <button
                  onClick={() => handleBulkUpdateStatus('已完成')}
                  className="px-2 py-0.5 text-xs rounded bg-green-100 text-green-800 hover:bg-green-200"
                >
                  设为已完成
                </button>
                <button
                  onClick={() => handleBulkUpdateStatus('已取消')}
                  className="px-2 py-0.5 text-xs rounded bg-red-100 text-red-800 hover:bg-red-200"
                >
                  设为已取消
                </button>
                
                {/* 批量标签操作 */}
                <div className="relative">
                  {showBulkTagInput ? (
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={bulkTagInput}
                        onChange={(e) => setBulkTagInput(e.target.value)}
                        placeholder="输入标签"
                        className="border border-gray-300 rounded-l-md px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') handleBulkAddTag();
                        }}
                      />
                      <button
                        onClick={handleBulkAddTag}
                        className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-r-md hover:bg-blue-600"
                      >
                        添加
                      </button>
                      <button
                        onClick={() => {
                          setShowBulkTagInput(false);
                          setBulkTagInput('');
                        }}
                        className="ml-1 text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowBulkTagInput(true)}
                      className="px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-800 hover:bg-blue-200"
                    >
                      批量添加标签
                    </button>
                  )}
                </div>
                
                <button
                  onClick={handleBulkDelete}
                  className="px-2 py-0.5 text-xs rounded bg-red-100 text-red-800 hover:bg-red-200"
                >
                  批量删除
                </button>
              </div>
            </div>
          )}
          
          {/* 添加顶部分页控件 */}
          {tagFilteredShipments.length > 0 && (
            <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3">
              <div className="flex-1 flex justify-between items-center">
                <div className="text-xs text-gray-700">
                  显示 <span className="font-medium">{startIndex + 1}</span> 至 <span className="font-medium">{endIndex}</span> 条，共 <span className="font-medium">{totalItems}</span> 条
                </div>
                <div className="flex items-center">
                  <select 
                    value={perPage}
                    onChange={(e) => {
                      const newPerPage = Number(e.target.value);
                      setPerPage(newPerPage);
                      setCurrentPage(1);
                    }}
                    className="mr-3 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={10}>10条/页</option>
                    <option value={20}>20条/页</option>
                    <option value={50}>50条/页</option>
                    <option value={100}>100条/页</option>
                  </select>
                  <nav className="inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-1 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">首页</span>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-1 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">上一页</span>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    {/* 页码按钮 */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      // 如果总页数小于等于5，则显示所有页码
                      // 如果总页数大于5，则显示当前页附近的页码
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else {
                        // 确保显示的页码围绕当前页
                        let start = Math.max(1, currentPage - 2);
                        let end = Math.min(totalPages, start + 4);
                        // 调整起始页，确保显示5个页码
                        if (end - start < 4) {
                          start = Math.max(1, end - 4);
                        }
                        pageNum = start + i;
                        // 确保不超过总页数
                        if (pageNum > totalPages) return null;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-2 py-1 border ${
                            currentPage === pageNum 
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' 
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          } text-sm font-medium`}
                        >
                          {pageNum}
                        </button>
                      );
                    }).filter(Boolean)}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="relative inline-flex items-center px-2 py-1 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">下一页</span>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="relative inline-flex items-center px-2 py-1 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">末页</span>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="overflow-hidden flex-1">
          {loading ? (
            <div className="p-8 flex justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            </div>
          ) : tagFilteredShipments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" 
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h10a2 2 0 012 2v14a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-2">暂无发货记录</p>
            </div>
          ) : (
            <div className="overflow-auto flex-1">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-500">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={handleSelectAll}
                          className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      图片
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      收货信息
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      规格/数量
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      标签
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      添加时间
                    </th>
                    <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentShipments.map((shipment) => (
                    <tr key={shipment.id} className="hover:bg-gray-50 cursor-pointer">
                      {/* 复选框和图片保持独立，不参与行点击事件 */}
                      <td 
                        className="px-2 py-2 whitespace-nowrap" 
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(shipment.id)}
                            onChange={() => handleSelectItem(shipment.id)}
                            className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>
                      </td>
                      <td 
                        className="px-3 py-2 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex-shrink-0 h-12 w-12 relative">
                          <Image
                            src={shipment.imageUrl}
                            alt="商品图片"
                            fill
                            className="object-contain"
                            sizes="48px"
                          />
                        </div>
                      </td>
                      {/* 其余单元格点击整体触发详情展示 */}
                      <td 
                        className="px-3 py-2"
                        onClick={() => setSelectedShipment(shipment)}
                      >
                        <div className="text-xs text-gray-900 max-w-xs truncate" title={shipment.address}>
                          {shipment.address || '未填写地址'}
                        </div>
                      </td>
                      <td 
                        className="px-3 py-2"
                        onClick={() => setSelectedShipment(shipment)}
                      >
                        <div className="text-xs text-gray-900">{shipment.size || '未填写'}</div>
                        <div className="text-xs text-gray-500">x{shipment.quantity}</div>
                      </td>
                      <td 
                        className="px-3 py-2 whitespace-nowrap"
                        onClick={() => setSelectedShipment(shipment)}
                      >
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          shipment.status === '待发货' ? 'bg-yellow-100 text-yellow-800' :
                          shipment.status === '已发货' ? 'bg-blue-100 text-blue-800' :
                          shipment.status === '已完成' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {shipment.status}
                        </span>
                      </td>
                      <td 
                        className="px-3 py-2"
                        onClick={() => setSelectedShipment(shipment)}
                      >
                        <div className="flex flex-wrap gap-1">
                          {shipment.tags?.map(tag => (
                            <div 
                              key={`${shipment.id}-${tag}`} 
                              className="group relative"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full ${getTagColorClass(tag)}`}>
                                {tag}
                                <button
                                  onClick={() => handleRemoveTagFromShipment(shipment.id, tag)}
                                  className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </span>
                            </div>
                          ))}
                          
                          {/* 添加标签下拉菜单 */}
                          <div 
                            className="relative inline-block text-left"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => document.getElementById(`tag-menu-${shipment.id}`).classList.toggle('hidden')}
                              className="px-1 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                            >
                              +
                            </button>
                            <div id={`tag-menu-${shipment.id}`} className="hidden absolute z-20 mt-1 w-32 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                              <div className="py-1">
                                {availableTags
                                  .filter(tag => !shipment.tags?.includes(tag))
                                  .map(tag => (
                                    <button
                                      key={`add-${shipment.id}-${tag}`}
                                      onClick={() => {
                                        handleAddTagToShipment(shipment.id, tag);
                                        document.getElementById(`tag-menu-${shipment.id}`).classList.add('hidden');
                                      }}
                                      className="block w-full text-left px-4 py-1 text-xs text-gray-700 hover:bg-gray-100"
                                    >
                                      {tag}
                                    </button>
                                  ))
                                }
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td 
                        className="px-3 py-2 whitespace-nowrap text-xs text-gray-500"
                        onClick={() => setSelectedShipment(shipment)}
                      >
                        {new Date(shipment.dateAdded).toLocaleString('zh-CN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td 
                        className="px-3 py-2 whitespace-nowrap text-right text-xs font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setSelectedShipment(shipment)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          详情
                        </button>
                        <button 
                          onClick={() => handleDelete(shipment.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {selectedShipment && (
        <ShipmentDetail 
          shipment={selectedShipment} 
          onClose={() => setSelectedShipment(null)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
      
      {/* 标签管理模态窗口 */}
      {showTagManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">标签管理</h3>
              <button
                onClick={() => setShowTagManager(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className="text-sm text-gray-500 mb-4">
              管理系统中的标签。删除标签将会从所有记录中移除该标签。
            </p>
            
            {/* 添加新标签输入框 */}
            <div className="flex items-center mb-6">
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                placeholder="输入新标签"
                className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleAddNewTag();
                }}
              />
              <button
                onClick={handleAddNewTag}
                className="bg-blue-500 text-white text-sm px-3 py-2 rounded-r-md hover:bg-blue-600"
              >
                添加
              </button>
            </div>
            
            {/* 标签列表 */}
            <div className="max-h-60 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      标签名称
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">操作</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {availableTags.length === 0 ? (
                    <tr>
                      <td colSpan="2" className="px-6 py-4 text-center text-sm text-gray-500">
                        暂无标签
                      </td>
                    </tr>
                  ) : (
                    availableTags.map(tag => (
                      <tr key={tag} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${getTagColorClass(tag)}`}>
                            {tag}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDeleteTag(tag)}
                            className="text-red-600 hover:text-red-900"
                          >
                            删除
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowTagManager(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 手动添加发货信息模态窗口 */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">添加发货信息</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleAddShipment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">收货地址</label>
                  <textarea
                    name="address"
                    value={newShipment.address}
                    onChange={handleInputChange}
                    required
                    rows="3"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请输入详细收货地址"
                  ></textarea>
                </div>
                
                <div className="col-span-1 flex flex-col">
                  <label className="block text-sm font-medium text-gray-700 mb-1">商品图片</label>
                  <div className="flex-1 border border-dashed border-gray-300 rounded-md p-4 flex flex-col items-center justify-center bg-gray-50 relative">
                    {imagePreview ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={imagePreview}
                          alt="预览图"
                          fill
                          className="object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setUploadedImage(null);
                            setImagePreview('');
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <>
                        <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2h-5.586a1 1 0 00-.707.293l-1.586 1.586a2 2 0 000 2.828l1.586 1.586A2 2 0 0018 14h.01" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-500">点击上传或拖放图片</p>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">材质</label>
                  <input
                    type="text"
                    name="material"
                    value={newShipment.material}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="例如: 硅胶、亚克力等"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">规格</label>
                  <input
                    type="text"
                    name="size"
                    value={newShipment.size}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="例如: 全包、镜头款等"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">数量</label>
                  <input
                    type="number"
                    name="quantity"
                    value={newShipment.quantity}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                  <select
                    name="status"
                    value={newShipment.status}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="待发货">待发货</option>
                    <option value="已发货">已发货</option>
                    <option value="已完成">已完成</option>
                    <option value="已取消">已取消</option>
                  </select>
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                  <textarea
                    name="notes"
                    value={newShipment.notes}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="可选：添加备注信息"
                  ></textarea>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      保存中...
                    </>
                  ) : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 