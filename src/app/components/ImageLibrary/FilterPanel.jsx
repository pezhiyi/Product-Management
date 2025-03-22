import { useState } from 'react';

export default function FilterPanel({ onFilterChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    searchText: ''
  });
  
  // 应用筛选
  const applyFilters = () => {
    onFilterChange(filters);
    setIsOpen(false);
  };
  
  // 重置筛选
  const resetFilters = () => {
    const emptyFilters = {
      dateFrom: '',
      dateTo: '',
      searchText: ''
    };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
    setIsOpen(false);
  };
  
  // 处理筛选项变化
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm flex items-center"
      >
        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        筛选
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg z-10 border border-gray-200">
          <div className="p-4">
            <h4 className="font-medium text-gray-700 mb-3">筛选选项</h4>
            
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">上传日期范围</label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  name="dateFrom"
                  value={filters.dateFrom}
                  onChange={handleFilterChange}
                  className="block w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                />
                <span className="text-gray-500 self-center">至</span>
                <input
                  type="date"
                  name="dateTo"
                  value={filters.dateTo}
                  onChange={handleFilterChange}
                  className="block w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">搜索文件名</label>
              <input
                type="text"
                name="searchText"
                value={filters.searchText}
                onChange={handleFilterChange}
                placeholder="输入关键词..."
                className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={resetFilters}
                className="px-3 py-1 text-sm text-gray-700 hover:text-gray-900"
              >
                重置
              </button>
              <button
                onClick={applyFilters}
                className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600"
              >
                应用筛选
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 