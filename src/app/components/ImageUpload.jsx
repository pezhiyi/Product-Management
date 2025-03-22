'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';

export default function ImageUpload({ onImageUpload, onSearch, hasImage }) {
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const dropAreaRef = useRef(null);

  // 支持的文件格式
  const supportedFormats = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif', 'image/bmp'];
  
  // 添加粘贴事件监听器
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData.items;
      
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          processUploadedFile(file, true); // 传递true表示自动搜索
          break;
        }
      }
    };
    
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);
  
  // 处理上传的文件
  const processUploadedFile = (file, autoSearch = false) => {
    if (!file) return;
    
    // 检查文件类型
    if (!supportedFormats.includes(file.type)) {
      alert('不支持的文件格式，请上传 JPG, PNG, WEBP, GIF 或 BMP 图片');
      return;
    }

    // 创建预览URL
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
    
    // 缓存图片数据到本地存储
    const reader = new FileReader();
    reader.onload = function(e) {
      // 存储图片数据和元信息
      localStorage.setItem('lastUploadedImage', e.target.result);
      localStorage.setItem('lastUploadedImageName', file.name);
      localStorage.setItem('lastUploadedImageType', file.type);
      localStorage.setItem('lastUploadedImageTime', Date.now().toString());
    };
    reader.readAsDataURL(file);
    
    // 调用上传回调
    onImageUpload(file, autoSearch);
    
    // 如果是自动搜索，显示提示
    if (autoSearch) {
      const toastContainer = document.createElement('div');
      toastContainer.className = 'fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg z-50';
      toastContainer.innerHTML = `
        <div class="flex items-center">
          <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          已粘贴图片并自动开始搜索...
        </div>
      `;
      document.body.appendChild(toastContainer);
      setTimeout(() => {
        toastContainer.style.opacity = '0';
        setTimeout(() => toastContainer.remove(), 300);
      }, 3000);
    }
  };
  
  // 处理文件选择
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const dt = e.dataTransfer;
    const file = dt.files[0];
    
    processUploadedFile(file);
  };

  // 初始预览状态同步
  useEffect(() => {
    if (!hasImage) {
      setPreview(null);
    }
  }, [hasImage]);

  return (
    <div className="h-full" ref={dropAreaRef}>
      <div 
        className={`border border-dashed rounded-lg text-center cursor-pointer transition-all h-full flex items-center justify-center ${
          isDragging 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
        }`}
        onClick={() => fileInputRef.current.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {preview ? (
          <div className="relative w-full h-full">
            <Image 
              src={preview} 
              alt="上传预览" 
              fill 
              className="object-contain p-3" 
              unoptimized={preview.startsWith('data:')}
              priority
            />
            <button 
              className="absolute top-2 right-2 bg-white bg-opacity-80 text-gray-600 rounded-full p-1 hover:bg-opacity-100 transition shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                setPreview(null);
                onImageUpload(null);
              }}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="p-6 text-center">
            <svg className="h-10 w-10 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mt-3 text-sm text-gray-600">
              点击或拖拽图片到此处上传
            </p>
            <p className="mt-1 text-xs text-gray-400">
              支持 JPG, PNG, WEBP, GIF, BMP 格式
            </p>
            <p className="mt-3 text-xs text-gray-400 flex items-center justify-center">
              <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              可直接粘贴 (Ctrl+V)
            </p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/jpeg,image/png,image/jpg,image/webp,image/gif,image/bmp"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
} 