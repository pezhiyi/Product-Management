import React from 'react';
import Image from 'next/image';
import { formatFileSize, formatDate } from '../utils/format';

/**
 * @component ImageSearchResults
 * @description 图片搜索结果展示组件，采用三列网格布局
 * @tag #image-search #search-results #grid
 */
export default function ImageSearchResults({ results, onSelectImage, loading }) {
  if (loading) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="ml-3 text-gray-600">正在搜索相似图片...</p>
        </div>
      </div>
    );
  }
  
  if (!results || results.length === 0) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h10a2 2 0 012 2v14a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">未找到相似图片</h3>
          <p className="mt-1 text-sm text-gray-500">尝试上传其他图片或者调整搜索参数</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="mt-4">
      <h2 className="text-lg font-medium mb-3">搜索结果 ({results.length})</h2>
      
      <div className="grid grid-cols-3 gap-4">
        {results.map((item, index) => (
          <div 
            key={item.cont_sign || index}
            className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-shadow duration-200"
            onClick={() => onSelectImage && onSelectImage(item)}
          >
            <div className="relative aspect-square bg-gray-100">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.filename || `搜索结果 ${index + 1}`}
                  fill
                  className="object-contain"
                  sizes="33vw"
                  onError={(e) => {
                    e.target.src = '/placeholder-image.png';
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                  <span className="text-gray-400">无图片</span>
                </div>
              )}
              
              <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                {(item.score * 100).toFixed(0)}% 相似
              </div>
            </div>
            
            <div className="p-3">
              <h3 className="text-sm font-medium text-gray-800 truncate">
                {item.filename || `未命名图片 (${index + 1})`}
              </h3>
              
              <div className="mt-1 text-xs text-gray-500 space-y-1">
                {item.filesize && (
                  <p>大小: {formatFileSize(item.filesize)}</p>
                )}
                {item.uploadTime && (
                  <p>上传: {formatDate(item.uploadTime)}</p>
                )}
                <p className="truncate">ID: {item.cont_sign}</p>
              </div>
              
              <button 
                className="mt-2 w-full py-1 px-2 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(item.imageUrl, '_blank');
                }}
              >
                查看原图
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 