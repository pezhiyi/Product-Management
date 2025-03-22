import { useState } from 'react';

export default function SortControls({ sortField, ascending, onSortChange }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const sortOptions = [
    { id: 'dateAdded', label: '添加日期' },
    { id: 'filename', label: '文件名' },
    { id: 'filesize', label: '文件大小' }
  ];
  
  // 选择排序选项
  const selectSortOption = (field) => {
    // 如果选择当前字段，切换升序/降序
    const newAscending = field === sortField ? !ascending : false;
    onSortChange(field, newAscending);
    setIsOpen(false);
  };
  
  // 获取当前排序名称
  const getCurrentSortLabel = () => {
    const option = sortOptions.find(opt => opt.id === sortField);
    return option ? option.label : '添加日期';
  };
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm flex items-center"
      >
        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
        </svg>
        排序: {getCurrentSortLabel()} {ascending ? '↑' : '↓'}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
          <div className="py-1">
            {sortOptions.map(option => (
              <button
                key={option.id}
                onClick={() => selectSortOption(option.id)}
                className={`block w-full text-left px-4 py-2 text-sm ${
                  option.id === sortField 
                    ? 'bg-gray-100 text-gray-900 font-medium' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {option.label} 
                {option.id === sortField && (
                  <span className="float-right">
                    {ascending ? '↑' : '↓'}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 