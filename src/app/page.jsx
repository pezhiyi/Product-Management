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
import { 
  getBosClient, 
  generateBosKey, 
  getPreviewUrl,
  uploadToBos 
} from './utils/bosStorage';
import { compressImage } from './utils/imageProcessor';

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

  useEffect(() => {
    // 监控 uploadedImage 状态变化
    console.log('uploadedImage 状态更新:', {
      hasImage: !!uploadedImage,
      name: uploadedImage?.name,
      size: uploadedImage?.size
    });
  }, [uploadedImage]);

  const handleImageUpload = async (file, autoSearch = false) => {
    if (!file) {
      setError('请选择有效的图片文件');
      return;
    }

    try {
      // 保存文件到状态
      setUploadedImage(file);
      setError(''); // 清除之前的错误
      
      // 如果需要自动搜索
      if (autoSearch) {
        handleSearch(file);
      }
    } catch (error) {
      console.error('处理图片文件失败:', error);
      setError('处理图片文件失败，请重试');
      setUploadedImage(null);
    }
  };

  const handleAddToLibrary = async () => {
    if (!uploadedImage) {
      setError('请先上传图片');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      // 检查BOS客户端
      const bosClient = getBosClient();
      if (!bosClient) {
        throw new Error('BOS客户端初始化失败，请检查配置');
      }

      // 客户端压缩
      const compressedImage = await compressImage(uploadedImage);
      
      // 添加到搜索库
      const searchFormData = new FormData();
      searchFormData.append('image', compressedImage);
      searchFormData.append('mode', 'add');
      searchFormData.append('filename', uploadedImage.name);
      
      const searchResponse = await fetch('/api/baidu/add', {
        method: 'POST',
        body: searchFormData,
      });
      
      if (!searchResponse.ok) {
        const errorData = await searchResponse.json();
        throw new Error(errorData.message || '添加到搜索库失败');
      }
      
      const searchData = await searchResponse.json();
      
      // 如果搜索库添加成功，上传原图到BOS
      if (searchData.cont_sign) {
        const bosKey = generateBosKey(null, searchData.cont_sign);
        
        // 使用统一的上传函数
        const bosResult = await uploadToBos(uploadedImage, bosKey);
        
        if (!bosResult.success) {
          throw new Error(bosResult.message || '上传到BOS失败');
        }
        
        // 添加到本地图库
        addToLibrary({
          cont_sign: searchData.cont_sign,
          bosUrl: bosResult.url,
          bosKey: bosResult.key,
          filesize: uploadedImage.size,
          filename: uploadedImage.name,
        });
        
        setSuccessMessage('图片已成功添加到搜索图库和商品图库');
        
        // 清理状态
        setTimeout(() => {
          setSuccessMessage('');
          setUploadedImage(null);
        }, 3000);
      }
    } catch (error) {
      console.error('添加图库错误:', error);
      setError(error.message || '添加失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (imageFile = null) => {
    const fileToSearch = imageFile || uploadedImage;
    if (!fileToSearch) {
      setError('请先上传图片');
      return;
    }

    setIsLoading(true);
    setError('');
    setSearchResults([]);

    try {
      // 压缩图片用于搜索
      const searchImageBlob = await compressImage(fileToSearch, 2);
      
      const formData = new FormData();
      formData.append('image', searchImageBlob);
      formData.append('mode', 'search');
      
      const response = await fetch('/api/baidu/search', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '搜索失败');
      }

      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error('搜索错误:', error);
      setError(error.message || '搜索失败，请重试');
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