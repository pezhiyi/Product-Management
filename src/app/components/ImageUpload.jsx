'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { validateImage } from '../utils/imageValidator';
import { uploadToBos, generateBosKey } from '../utils/bosStorage';

export default function ImageUpload({ onImageUpload, onSearch, hasImage }) {
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const dropAreaRef = useRef(null);
  const [error, setError] = useState(null);

  // 支持的文件格式
  const supportedFormats = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif', 'image/bmp'];
  
  // 添加粘贴事件监听器
  useEffect(() => {
    const handlePaste = (e) => {
      console.group('📋 处理粘贴事件');
      const items = e.clipboardData.items;
      console.log('粘贴项数量:', items.length);
      
      for (let i = 0; i < items.length; i++) {
        console.log(`检查第 ${i + 1} 项:`, {
          type: items[i].type,
          kind: items[i].kind
        });
        
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          console.log('📄 找到图片文件:', {
            name: file.name,
            type: file.type,
            size: `${(file.size / 1024 / 1024).toFixed(2)}MB`
          });
          processUploadedFile(file, true);
          break;
        }
      }
      console.groupEnd();
    };
    
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);
  
  // 处理上传的文件
  const processUploadedFile = async (file, autoSearch = false) => {
    if (!file) {
      console.log('❌ 未提供文件');
      return;
    }
    
    console.group('📤 处理上传文件');
    console.log('文件信息:', {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      lastModified: new Date(file.lastModified).toISOString()
    });
    
    try {
      console.log('🔍 开始验证图片...');
      await validateImage(file);
      console.log('✅ 图片验证通过');
      
      // 上传到BOS获取预览URL
      setIsUploading(true);
      console.log('📦 准备上传到BOS...');
      
      // 使用临时key，避免污染正式图库
      const tempKey = `temp/preview_${Date.now()}_${file.name}`;
      console.log('🔑 生成临时Key:', tempKey);
      
      const uploadResult = await uploadToBos(file, tempKey);
      console.log('📨 BOS上传结果:', uploadResult);
      
      if (uploadResult.success) {
        console.log('🖼️ 设置BOS预览URL:', uploadResult.url);
        setPreview(uploadResult.url);
        
        console.log('⏩ 继续上传流程，autoSearch:', autoSearch);
        onImageUpload(file, autoSearch);
        
        // 记录成功状态
        console.log('✅ 文件处理完成');
      } else {
        throw new Error(`预览图片上传失败: ${uploadResult.message}`);
      }
    } catch (error) {
      console.error('❌ 处理文件错误:', error);
      setError(error.message);
      
      // 如果BOS上传失败，回退到本地预览
      console.log('⚠️ 回退到本地预览');
      const localPreviewUrl = URL.createObjectURL(file);
      setPreview(localPreviewUrl);
      
      // 记录回退操作
      console.log('🔄 已切换到本地预览:', {
        error: error.message,
        previewUrl: localPreviewUrl
      });
    } finally {
      setIsUploading(false);
      console.groupEnd();
    }
  };
  
  // 处理文件选择
  const handleFileChange = (e) => {
    console.group('📂 文件选择事件');
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log('选择的文件:', {
        name: file.name,
        type: file.type,
        size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        lastModified: new Date(file.lastModified).toISOString()
      });
      processUploadedFile(file);
    } else {
      console.log('❌ 未选择文件');
    }
    console.groupEnd();
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
    
    console.group('🎯 文件拖放事件');
    const dt = e.dataTransfer;
    if (dt.files && dt.files[0]) {
      const file = dt.files[0];
      console.log('拖放的文件:', {
        name: file.name,
        type: file.type,
        size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        lastModified: new Date(file.lastModified).toISOString()
      });
      processUploadedFile(file);
    } else {
      console.log('❌ 拖放未包含文件');
    }
    console.groupEnd();
  };

  // 初始预览状态同步
  useEffect(() => {
    if (!hasImage) {
      setPreview(null);
    }
  }, [hasImage]);

  return (
    <div className="h-full" ref={dropAreaRef}>
      <div className={`border border-dashed rounded-lg text-center cursor-pointer transition-all h-full flex items-center justify-center ${
        isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
      }`}
        onClick={() => fileInputRef.current.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isUploading ? (
          <div className="flex flex-col items-center justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-sm text-gray-600">正在处理图片...</p>
          </div>
        ) : preview ? (
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
      
      {error && (
        <div className="mt-2 p-2 text-sm text-red-600 bg-red-50 rounded">
          {error}
        </div>
      )}
    </div>
  );
} 