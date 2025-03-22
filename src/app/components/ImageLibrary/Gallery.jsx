import { useState, useEffect } from 'react';
import { getLibrary, filterLibrary, sortLibrary } from '../../utils/libraryStorage';
import GalleryItem from './GalleryItem';
import FilterPanel from './FilterPanel';
import SortControls from './SortControls';

export default function Gallery({ onSelectImage }) {
  const [library, setLibrary] = useState([]);
  const [filteredLibrary, setFilteredLibrary] = useState([]);
  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ field: 'dateAdded', ascending: false });
  const [isLoading, setIsLoading] = useState(true);
  
  // 初始加载图库
  useEffect(() => {
    const loadLibrary = () => {
      const data = getLibrary();
      setLibrary(data);
      applyFiltersAndSort(data, filters, sortConfig);
      setIsLoading(false);
    };
    
    loadLibrary();
    
    // 添加存储变更监听器，以便多标签页同步
    const handleStorageChange = (e) => {
      if (e.key === 'image_library') {
        loadLibrary();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  // 应用筛选和排序
  const applyFiltersAndSort = (data, filterOptions, sortOptions) => {
    let result = filterLibrary(filterOptions);
    result = sortLibrary(result, sortOptions.field, sortOptions.ascending);
    setFilteredLibrary(result);
  };
  
  // 处理筛选变更
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    applyFiltersAndSort(library, newFilters, sortConfig);
  };
  
  // 处理排序变更
  const handleSortChange = (field, ascending) => {
    const newSortConfig = { field, ascending };
    setSortConfig(newSortConfig);
    applyFiltersAndSort(library, filters, newSortConfig);
  };
  
  return (
    <div className="w-full flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-medium text-gray-700">我的图库 ({filteredLibrary.length})</h3>
        <div className="flex space-x-2">
          <FilterPanel onFilterChange={handleFilterChange} />
          <SortControls 
            sortField={sortConfig.field} 
            ascending={sortConfig.ascending} 
            onSortChange={handleSortChange} 
          />
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredLibrary.length === 0 ? (
        <div className="flex-grow flex flex-col items-center justify-center text-gray-500">
          <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p>图库为空，请上传图片</p>
        </div>
      ) : (
        <div className="flex-grow overflow-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredLibrary.map(item => (
              <GalleryItem 
                key={item.id} 
                item={item} 
                onSelect={() => onSelectImage && onSelectImage(item)} 
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 