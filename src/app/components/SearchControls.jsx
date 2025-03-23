"use client";
import { useState, useRef } from 'react';

export default function SearchControls({ onSearchResults }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleSearchClick = async () => {
    if (!selectedFile) {
      setError('请先选择图片');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);  // 确保使用'image'作为参数名
      formData.append('mode', 'search');       // 添加mode参数

      console.log('开始发送智能搜索请求...');
      
      const response = await fetch('/api/baidu/search', {
        method: 'POST',
        body: formData
      });

      console.log('收到搜索响应，状态码:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`搜索失败 (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || '搜索返回失败状态');
      }

      // 处理成功结果
      if (onSearchResults) {
        onSearchResults(data.results || []);
      }
    } catch (err) {
      console.error('搜索出错:', err);
      setError(err.message || '搜索过程中发生错误');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-grow">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
            id="image-search-input"
          />
          <label
            htmlFor="image-search-input"
            className="flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-md cursor-pointer hover:bg-blue-100 transition"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            {selectedFile ? selectedFile.name : '选择图片'}
          </label>
        </div>
        
        <button
          onClick={handleSearchClick}
          disabled={isLoading || !selectedFile}
          className={`px-4 py-2 rounded-md flex items-center ${
            isLoading || !selectedFile
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          {isLoading ? '搜索中...' : '开始搜索'}
        </button>
      </div>
      
      {error && (
        <div className="mt-3 p-2 text-sm text-red-700 bg-red-50 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
} 