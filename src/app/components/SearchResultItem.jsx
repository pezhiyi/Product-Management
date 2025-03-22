import Image from 'next/image';
import { useState } from 'react';

export default function SearchResultItem({ item, index, isMobile }) {
  const [imageError, setImageError] = useState(false);
  
  // 优先使用BOS URL
  let imageUrl = item.bosUrl;
  
  // 如果没有BOS URL，尝试从brief中提取
  if (!imageUrl) {
    try {
      if (item.brief && typeof item.brief === 'string') {
        const briefData = JSON.parse(item.brief);
        if (briefData.imageUrl) {
          imageUrl = briefData.imageUrl;
        }
      }
    } catch (e) {
      console.error('解析brief数据失败:', e);
    }
  }
  
  // 使用cont_sign构建一个显示名称
  const displayId = item.cont_sign ? 
    `${item.cont_sign.substring(0, 8)}...` : 
    `结果 ${index + 1}`;
  
  return (
    <div className="border rounded-md overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className={`relative w-full ${isMobile ? 'h-36' : 'h-44'} bg-gray-100 flex items-center justify-center`}>
        {!imageUrl || imageError ? (
          // 显示占位符
          <div className="text-center p-4">
            <div className="h-24 w-24 mx-auto mb-2 bg-gray-200 rounded-md flex items-center justify-center">
              <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-xs text-gray-500">ID: {displayId}</p>
            <p className="text-xs text-gray-500">相似度: {Math.round(item.score * 100)}%</p>
          </div>
        ) : (
          <Image
            src={imageUrl}
            alt={`搜索结果 ${index + 1}`}
            fill
            className="object-contain"
            loading="lazy"
            sizes="(max-width: 768px) 100vw, 50vw"
            onError={() => setImageError(true)}
          />
        )}
      </div>
      
      <div className="p-2 sm:p-3">
        <div className="flex items-center mb-2">
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full" 
              style={{ width: `${Math.round(item.score * 100)}%` }}
            ></div>
          </div>
          <span className="ml-2 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">
            {Math.round(item.score * 100)}%
          </span>
        </div>
        
        <div className="flex justify-between mt-2 gap-2">
          <button 
            className="flex-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 py-1 px-2 rounded transition-colors"
            onClick={() => imageUrl && window.open(imageUrl, '_blank')}
            disabled={!imageUrl}
          >
            <span className="flex items-center justify-center">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              查看原图
            </span>
          </button>
        </div>
      </div>
    </div>
  );
} 