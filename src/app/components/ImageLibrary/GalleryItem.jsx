import { useState } from 'react';
import Image from 'next/image';
import { removeFromLibrary } from '../../utils/libraryStorage';
import ImageDetails from './ImageDetails';

export default function GalleryItem({ item, onSelect }) {
  const [showDetails, setShowDetails] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // 格式化日期
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN', { 
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
  
  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return '未知大小';
    
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  // 处理删除
  const handleDelete = (e) => {
    e.stopPropagation();
    
    if (confirm('确定要从图库中删除此图片吗？')) {
      removeFromLibrary(item.id);
      
      // 触发更新事件，通知Gallery组件刷新
      window.dispatchEvent(new Event('storage'));
    }
  };
  
  // 使用文件名或截取cont_sign作为显示名称
  const displayName = item.filename || 
    (item.cont_sign ? `图片_${item.cont_sign.substring(0, 8)}...` : `图片_${item.id.substring(4, 12)}`);
  
  return (
    <>
      <div 
        className="relative border rounded-md overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
        onClick={() => setShowDetails(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative pt-[100%] bg-gray-100">
          {!imageError && item.bosUrl ? (
            <Image
              src={item.bosUrl}
              alt={displayName}
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
              className="object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" 
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          
          {/* 悬停控制区 */}
          {isHovered && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="flex space-x-2">
                <button 
                  className="p-2 bg-white rounded-full text-blue-500 hover:text-blue-700"
                  onClick={(e) => { e.stopPropagation(); onSelect && onSelect(); }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                <button 
                  className="p-2 bg-white rounded-full text-red-500 hover:text-red-700"
                  onClick={handleDelete}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-2">
          <div className="truncate text-sm font-medium text-gray-700" title={displayName}>
            {displayName}
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{formatDate(item.dateAdded)}</span>
            <span>{formatFileSize(item.filesize)}</span>
          </div>
        </div>
      </div>
      
      {showDetails && (
        <ImageDetails 
          item={item} 
          onClose={() => setShowDetails(false)}
          onSelect={onSelect}
        />
      )}
    </>
  );
} 