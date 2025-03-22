'use client';

import { useState } from 'react';

export default function ImageSearch({ onSearch }) {
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (onSearch) {
      setIsSearching(true);
      try {
        await onSearch();
      } finally {
        setIsSearching(false);
      }
    }
  };

  return (
    <div className="mb-4">
      {/* 此组件目前不需要渲染任何UI，因为搜索功能已由SearchControls处理 */}
    </div>
  );
} 