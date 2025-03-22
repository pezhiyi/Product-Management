import { useState, useRef } from 'react';

export default function UploadArea({ onFileSelect, isLoading, mode = 'search' }) {
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef(null);
  
  // 文件大小检查函数
  const validateFile = (file) => {
    setFileError('');
    
    if (!file) return false;
    
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      setFileError('请选择有效的图片文件');
      return false;
    }
    
    // 根据模式检查文件大小
    if (mode === 'add') {
      // 添加模式下限制3MB
      const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
      if (file.size > MAX_FILE_SIZE) {
        setFileError('添加到图库的图片不能超过3MB');
        return false;
      }
    } else {
      // 搜索模式下限制较大
      const MAX_SEARCH_FILE_SIZE = 30 * 1024 * 1024; // 30MB
      if (file.size > MAX_SEARCH_FILE_SIZE) {
        setFileError('搜索的图片不能超过30MB');
        return false;
      }
    }
    
    return true;
  };
  
  // 处理文件选择
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (validateFile(file)) {
      onFileSelect(file);
    }
  };
  
  // 处理拖拽
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  };
  
  // 其他事件处理函数...
  
  return (
    <div className="w-full mb-6">
      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
        onClick={() => fileInputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); }}
        onDrop={handleDrop}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          className="hidden" 
          accept="image/*"
          onChange={handleFileChange}
          disabled={isLoading}
        />
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
            <p className="text-gray-500">{mode === 'add' ? '正在添加图片...' : '正在搜索...'}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <svg className="h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <p className="text-gray-500 mb-1">点击或拖拽上传图片</p>
            <p className="text-gray-400 text-xs">
              JPG, PNG 格式 {mode === 'add' ? '(最大 3MB)' : '(最大 30MB)'}
            </p>
          </div>
        )}
      </div>
      
      {fileError && (
        <div className="mt-2 text-sm text-red-500">
          错误: {fileError}
        </div>
      )}
    </div>
  );
} 