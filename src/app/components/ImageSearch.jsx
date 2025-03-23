'use client';

import { useState } from 'react';
import SearchControls from './SearchControls';

export default function ImageSearch({ onSearch }) {
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearchResults = (results) => {
    setSearchResults(results);
    if (onSearch) {
      onSearch(results);
    }
  };

  return (
    <div className="mb-4">
      <SearchControls onSearchResults={handleSearchResults} />
      
      {/* 可以在这里添加搜索结果预览 */}
      {searchResults.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-medium mb-2">搜索结果 ({searchResults.length})</h3>
          {/* 这里可以展示搜索结果的缩略图等 */}
        </div>
      )}
    </div>
  );
} 