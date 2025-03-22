export default function SearchControls({ onAddToLibrary, onSearch, isLoading }) {
  const handleSearchClick = async () => {
    try {
      // 从本地存储获取最近的图片数据
      const imageData = localStorage.getItem('lastUploadedImage');
      const imageName = localStorage.getItem('lastUploadedImageName');
      const imageType = localStorage.getItem('lastUploadedImageType');
      
      if (!imageData) {
        alert('请先上传图片');
        return;
      }

      // 将 base64 转换回 File 对象
      const response = await fetch(imageData);
      const blob = await response.blob();
      const file = new File([blob], imageName || 'image.jpg', { 
        type: imageType || 'image/jpeg',
        lastModified: Date.now()
      });

      // 调用搜索
      onSearch(file);
    } catch (error) {
      console.error('处理图片失败:', error);
      alert('处理图片失败，请重新上传');
    }
  };

  return (
    <div className="flex gap-3">
      <button
        onClick={onAddToLibrary}
        disabled={isLoading}
        className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-50 transition hover:border-gray-300 flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-4 h-4 mr-1.5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
        添加到图库
      </button>
      <button
        onClick={handleSearchClick}
        disabled={isLoading}
        className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            搜索中...
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            以图搜图
          </>
        )}
      </button>
    </div>
  );
} 