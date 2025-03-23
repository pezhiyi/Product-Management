'use client';
import Image from 'next/image';
import { useState } from 'react';
import { getDownloadUrl } from '../utils/bosStorage';

export default function ImageDisplay({ imageUrl, bosKey, filename }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      
      // 获取带签名的下载URL
      const downloadUrl = await getDownloadUrl(bosKey);
      
      // 创建临时链接并触发下载
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || bosKey.split('/').pop();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('下载失败:', error);
      alert('下载失败，请重试');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="relative group">
      {/* 预览图片 */}
      <Image 
        src={imageUrl} 
        alt={filename || '图片'}
        width={300}
        height={300}
        className="object-contain"
        unoptimized={true}
      />
      
      {/* 下载按钮 */}
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="absolute bottom-2 right-2 bg-white bg-opacity-90 text-gray-700 rounded-full p-2 
                 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {downloading ? (
          <span>下载中...</span>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        )}
      </button>
    </div>
  );
} 