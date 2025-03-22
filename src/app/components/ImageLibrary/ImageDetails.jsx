import { useEffect } from 'react';
import Image from 'next/image';

export default function ImageDetails({ item, onClose, onSelect }) {
  // 设置ESC键关闭
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);
  
  // 格式化日期
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
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
  
  const displayName = item.filename || 
    (item.cont_sign ? `图片_${item.cont_sign.substring(0, 8)}...` : `图片_${item.id.substring(4, 12)}`);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" onClick={onClose}>
      <div className="relative bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800 truncate" title={displayName}>
            {displayName}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
          <div className="md:w-2/3 p-4 flex items-center justify-center bg-gray-100 overflow-hidden">
            <div className="relative w-full h-full max-h-[60vh]">
              {item.bosUrl ? (
                <Image
                  src={item.bosUrl}
                  alt={displayName}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 66vw"
                  priority
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <svg className="h-24 w-24 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" 
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
          </div>
          
          <div className="md:w-1/3 p-4 overflow-y-auto border-t md:border-t-0 md:border-l">
            <h4 className="font-medium text-gray-700 mb-3">图片信息</h4>
            <div className="space-y-2">
              {item.dateAdded && (
                <div>
                  <span className="block text-sm text-gray-500">添加日期</span>
                  <span className="block text-sm font-medium">{formatDate(item.dateAdded)}</span>
                </div>
              )}
              
              {item.filesize && (
                <div>
                  <span className="block text-sm text-gray-500">文件大小</span>
                  <span className="block text-sm font-medium">{formatFileSize(item.filesize)}</span>
                </div>
              )}
              
              {item.cont_sign && (
                <div>
                  <span className="block text-sm text-gray-500">内容签名</span>
                  <span className="block text-sm font-medium truncate" title={item.cont_sign}>
                    {item.cont_sign}
                  </span>
                </div>
              )}
              
              {item.bosUrl && (
                <div>
                  <span className="block text-sm text-gray-500">图片链接</span>
                  <a 
                    href={item.bosUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-blue-500 hover:text-blue-700 truncate"
                    title={item.bosUrl}
                  >
                    {item.bosUrl.split('/').pop()}
                  </a>
                </div>
              )}
            </div>
            
            <div className="mt-6 space-y-2">
              <button 
                onClick={() => { onSelect && onSelect(); onClose(); }}
                className="w-full px-4 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600"
              >
                使用此图片搜索
              </button>
              
              <a 
                href={item.bosUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-4 py-2 bg-gray-100 text-gray-700 text-sm text-center rounded-md hover:bg-gray-200"
              >
                打开原图
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 