'use client';

import React, { useState, useRef } from 'react';
import ImageSearchResults from '../components/ImageSearchResults';

export default function SearchPage() {
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  const fileInputRef = useRef(null);
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // 创建预览URL
    setPreviewUrl(URL.createObjectURL(file));
    setSelectedImage(file);
    setSearchResults(null);
    setError(null);
  };
  
  const handleSearch = async () => {
    if (!selectedImage) {
      setError('请先选择一张图片');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // 创建FormData对象
      const formData = new FormData();
      formData.append('image', selectedImage);
      
      // 发送搜索请求
      const response = await fetch('/api/baidu/search', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || '搜索失败');
      }
      
      // 处理搜索结果
      setSearchResults(data.results);
    } catch (err) {
      console.error('搜索错误:', err);
      setError(err.message || '搜索过程发生错误');
      setSearchResults(null);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelectResult = (item) => {
    // 可以在这里处理选中结果的逻辑
    console.log('选中结果:', item);
  };
  
  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">图片搜索</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-3">上传图片进行搜索</h2>
          
          <div className="flex items-start space-x-6">
            <div className="flex-1">
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50"
                onClick={() => fileInputRef.current?.click()}
              >
                {previewUrl ? (
                  <div className="relative h-60 mb-3">
                    <img 
                      src={previewUrl} 
                      alt="搜索图片预览" 
                      className="mx-auto max-h-60 max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600">点击或拖放图片到此处</p>
                  </div>
                )}
                
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              
              {selectedImage && (
                <div className="mt-2 text-sm text-gray-500">
                  {selectedImage.name} ({(selectedImage.size / 1024).toFixed(2)} KB)
                </div>
              )}
              
              {error && (
                <div className="mt-3 text-sm text-red-500 bg-red-50 p-2 rounded">
                  {error}
                </div>
              )}
            </div>
            
            <div className="w-48">
              <button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                onClick={handleSearch}
                disabled={loading || !selectedImage}
              >
                {loading ? '搜索中...' : '开始搜索'}
              </button>
              
              <div className="mt-3">
                <button
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  onClick={() => {
                    setSelectedImage(null);
                    setPreviewUrl(null);
                    setSearchResults(null);
                    setError(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                >
                  重置
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <ImageSearchResults 
          results={searchResults}
          onSelectImage={handleSelectResult}
          loading={loading}
        />
      </div>
    </div>
  );
} 