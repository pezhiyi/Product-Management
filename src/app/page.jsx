'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import ImageUpload from './components/ImageUpload';
import ResultGrid from './components/ResultGrid';
import SearchControls from './components/SearchControls';
import Gallery from './components/ImageLibrary/Gallery';
import Header from './components/Header';
import { addToLibrary } from './utils/libraryStorage';
import ShipmentList from './components/ShipmentManagement/ShipmentList';

export default function Home() {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('search'); // 'search' or 'library' or 'shipment'

  // 响应式布局检测
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    // 初始检查
    checkIfMobile();
    
    // 添加窗口大小变化监听
    window.addEventListener('resize', checkIfMobile);
    
    // 清理函数
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const handleImageUpload = async (file, autoSearch = false) => {
    if (!file) {
      setError('请选择有效的图片文件');
      return;
    }

    try {
      // 直接使用原始文件，不再存储到状态
      if (autoSearch) {
        // 如果是自动搜索（粘贴），直接搜索
        handleSearch(file);
      }
    } catch (error) {
      console.error('处理图片文件失败:', error);
      setError('处理图片文件失败，请重试');
    }
  };

  const handleAddToLibrary = async () => {
    if (!uploadedImage) {
      setError('请先上传图片');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // 第一步：准备图片处理
      const imageSize = uploadedImage.size / (1024 * 1024); // 转换为MB
      let searchImageBlob = uploadedImage;
      
      // 如果图片大于3MB，为搜索图库压缩图片
      if (imageSize > 3) {
        searchImageBlob = await compressImage(uploadedImage, 3);
        console.log('图片已压缩用于搜索图库，原始大小:', imageSize.toFixed(2), 'MB, 压缩后:', 
          (searchImageBlob.size / (1024 * 1024)).toFixed(2), 'MB');
      }
      
      // 第二步：准备表单数据
      const formData = new FormData();
      formData.append('image', searchImageBlob); // 可能是压缩后的或原始图片
      formData.append('originalImage', uploadedImage); // 总是使用原始图片
      formData.append('mode', 'add');
      formData.append('filename', uploadedImage.name);
      formData.append('filesize', uploadedImage.size);
      
      // 第三步：发送到统一的处理API
      const response = await fetch('/api/baidu/add', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '添加到图库失败');
      }
      
      setSuccessMessage('图片已成功添加到搜索图库和商品图库');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // 添加到本地图库
      if (data.cont_sign) {
        addToLibrary({
          cont_sign: data.cont_sign,
          bosUrl: data.imageUrl || data.bosUrl,
          filesize: uploadedImage.size,
          filename: uploadedImage.name,
        });
      }
      
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 图片压缩函数
  const compressImage = (file, maxSizeMB) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        // 使用全局 window.Image 而不是导入的 Next.js Image 组件
        const img = new window.Image();
        img.src = event.target.result;
        
        img.onload = () => {
          let quality = 0.7; // 初始压缩质量
          let canvas = document.createElement('canvas');
          let ctx = canvas.getContext('2d');
          
          // 保持宽高比例
          let width = img.width;
          let height = img.height;
          
          // 设置画布尺寸
          canvas.width = width;
          canvas.height = height;
          
          // 绘制图片
          ctx.drawImage(img, 0, 0, width, height);
          
          // 使用递归压缩直到小于maxSizeMB
          const compressLoop = (q) => {
            canvas.toBlob((blob) => {
              // 检查大小
              if (blob.size / (1024 * 1024) <= maxSizeMB || q <= 0.1) {
                resolve(blob);
              } else {
                // 继续压缩
                q -= 0.1;
                compressLoop(q);
              }
            }, file.type, q);
          };
          
          compressLoop(quality);
        };
        
        img.onerror = () => {
          reject(new Error('图片加载失败'));
        };
      };
      
      reader.onerror = () => {
        reject(new Error('文件读取失败'));
      };
    });
  };

  const handleSearch = async (file) => {
    setIsLoading(true);
    setError('');
    
    try {
      if (!file) {
        throw new Error('请先上传图片文件');
      }

      // 创建 FormData
      const formData = new FormData();
      formData.append('image', file);
      formData.append('mode', 'search');
      
      const response = await fetch('/api/baidu/search', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '搜索失败');
      }
      
      setSearchResults(data.results || []);
      
      if (!data.results?.length) {
        setError('未找到相似图片，请尝试其他图片或先添加图片到库中');
      }
    } catch (error) {
      console.error('搜索失败:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSelectFromLibrary = (item) => {
    // 这里使用fetch获取图片内容，然后转换为File对象
    if (item && item.bosUrl) {
      setIsLoading(true);
      
      fetch(item.bosUrl)
        .then(response => response.blob())
        .then(blob => {
          // 创建File对象
          const file = new File([blob], item.filename || 'image.jpg', { type: blob.type });
          handleImageUpload(file);
          
          // 切换到搜索标签
          setActiveTab('search');
        })
        .catch(err => {
          console.error('从图库选择图片失败:', err);
          setError('加载图片失败');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  };

  return (
    <main className="h-screen flex flex-col bg-gray-50">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="flex-grow p-4 sm:p-6 overflow-hidden">
        {activeTab === 'search' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
            <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-4 flex flex-col h-[calc(100vh-160px)] lg:h-auto">
              <h2 className="text-base font-medium text-gray-700 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                图片上传
              </h2>
              
              <div className="flex-grow mb-3">
                <ImageUpload 
                  onImageUpload={handleImageUpload} 
                  onSearch={handleSearch}
                  hasImage={!!uploadedImage} 
                  uploadedImage={uploadedImage}
                />
              </div>
              
              <div>
                <SearchControls 
                  onAddToLibrary={handleAddToLibrary} 
                  onSearch={handleSearch} 
                  isLoading={isLoading} 
                />
                
                {error && (
                  <div className="mt-2 p-2 bg-red-50 text-red-600 text-sm rounded-md">
                    {error}
                  </div>
                )}
                
                {successMessage && (
                  <div className="mt-2 p-2 bg-green-50 text-green-600 text-sm rounded-md">
                    {successMessage}
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-white border border-gray-100 rounded-lg shadow-sm lg:col-span-2 p-4 flex flex-col h-[calc(100vh-160px)] lg:h-[calc(100vh-160px)] overflow-hidden">
              <h2 className="text-base font-medium text-gray-700 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                搜索结果
              </h2>
              <div className="flex-grow overflow-auto pr-1">
                <ResultGrid results={searchResults} isLoading={isLoading} isMobile={isMobile} />
              </div>
            </div>
          </div>
        ) : activeTab === 'library' ? (
          <div className="bg-white border border-gray-100 rounded-lg shadow-sm w-full h-full p-4 overflow-auto">
            <Gallery onSelectImage={handleSelectFromLibrary} />
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-lg shadow-sm w-full h-full p-4 overflow-auto">
            <ShipmentList />
          </div>
        )}
      </div>
      
      <footer className="py-2 text-center text-gray-500 text-xs border-t border-gray-200">
        <p>YnnAI独立开发 © {new Date().getFullYear()}</p>
      </footer>
    </main>
  );
} 