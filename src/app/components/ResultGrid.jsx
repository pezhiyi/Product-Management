/**
 * @component ResultGrid
 * @description 商品图片搜索结果网格组件，显示符合搜索条件的图片列表
 * @tag #image-search #search-results #grid
 */
import { useState } from 'react';
import Image from 'next/image';
import SearchResultItem from './SearchResultItem';
import ImagePreview from './ImagePreview';
import { getImageUrlFromContSign } from '../utils/bosStorage';

export default function ResultGrid({ results, isLoading, isMobile }) {
  const [previewImage, setPreviewImage] = useState(null);
  const [copySuccess, setCopySuccess] = useState(null); // 追踪哪个图片复制成功
  
  // 修改复制图片到剪贴板的逻辑
  const handleCopyImage = async (imageUrl, index, e) => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发图片预览
    
    try {
      // 显示加载状态
      setCopySuccess(`loading-${index}`);
      
      // 下载完整原始图片
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // 主要路径：现代剪贴板API - 保持原始质量
      if (navigator.clipboard && navigator.clipboard.write) {
        try {
          const clipboardItem = new ClipboardItem({
            [blob.type]: blob  // 使用原始Blob，保持完整质量
          });
          
          await navigator.clipboard.write([clipboardItem]);
          setCopySuccess(index);
          setTimeout(() => {
            if (setCopySuccess) setCopySuccess(null);
          }, 3000);
          
          return; // 成功退出
        } catch (clipboardError) {
          console.error('高级剪贴板API失败:', clipboardError);
        }
      }
      
      // 备用路径：Canvas方法 - 添加保证画质的参数
      const blobUrl = URL.createObjectURL(blob);
      const img = document.createElement('img');
      img.src = blobUrl;
      img.style.position = 'fixed';
      img.style.left = '-9999px';
      document.body.appendChild(img);
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      
      // 创建高分辨率Canvas
      const canvas = document.createElement('canvas');
      
      // 保持原始尺寸
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      
      // 处理高DPI显示器
      const ctx = canvas.getContext('2d', { alpha: true, willReadFrequently: true });
      const dpr = window.devicePixelRatio || 1;
      
      // 确保高DPI设备上清晰度
      if (dpr > 1) {
        canvas.width = img.naturalWidth * dpr;
        canvas.height = img.naturalHeight * dpr;
        ctx.scale(dpr, dpr);
      }
      
      // 使用高质量绘制设置
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);
      
      document.body.removeChild(img);
      URL.revokeObjectURL(blobUrl);
      
      // 尝试从canvas直接复制，使用原始图片类型和最高质量
      try {
        canvas.toBlob(async (canvasBlob) => {
          try {
            // 再次尝试剪贴板API
            if (navigator.clipboard && navigator.clipboard.write) {
              await navigator.clipboard.write([
                new ClipboardItem({
                  [canvasBlob.type]: canvasBlob
                })
              ]);
              setCopySuccess(index);
            } else {
              // 最后的尝试：创建可聚焦的div，插入图片，然后选择并复制
              const div = document.createElement('div');
              div.contentEditable = 'true';
              div.style.position = 'fixed';
              div.style.left = '0';
              div.style.top = '0';
              div.style.opacity = '0';
              document.body.appendChild(div);
              
              // 添加图片到div
              const divImg = document.createElement('img');
              divImg.src = URL.createObjectURL(canvasBlob);
              div.appendChild(divImg);
              
              // 选择div内容
              const range = document.createRange();
              range.selectNodeContents(div);
              const selection = window.getSelection();
              selection.removeAllRanges();
              selection.addRange(range);
              
              // 聚焦并复制
              div.focus();
              const success = document.execCommand('copy');
              
              // 清理
              document.body.removeChild(div);
              URL.revokeObjectURL(divImg.src);
              
              if (success) {
                setCopySuccess(index);
              } else {
                throw new Error('复制命令失败');
              }
            }
          } catch (finalError) {
            console.error('所有复制尝试都失败了:', finalError);
            setCopySuccess('error');
          } finally {
            setTimeout(() => {
              if (setCopySuccess) setCopySuccess(null);
            }, 3000);
          }
        }, blob.type, 1.0);  // 使用原始MIME类型和最高质量(1.0)
      } catch (canvasError) {
        console.error('Canvas方法失败:', canvasError);
        setCopySuccess('error');
        setTimeout(() => {
          if (setCopySuccess) setCopySuccess(null);
        }, 3000);
      }
    } catch (error) {
      console.error('复制图片失败:', error);
      setCopySuccess('error');
      setTimeout(() => {
        if (setCopySuccess) setCopySuccess(null);
      }, 3000);
    }
  };
  
  // 格式化相似度百分比
  const formatSimilarity = (score) => {
    const percent = (score * 100).toFixed(0);
    return `${percent}%`;
  };
  
  return (
    <>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-500">正在搜索相似图片...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" 
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>尚未找到相似结果</p>
          <p className="text-sm mt-1">上传图片并点击"以图搜图"按钮</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {results.map((item, index) => {
            // 确保有可访问的图片URL
            const imageUrl = item.bosUrl || 
              (item.cont_sign ? getImageUrlFromContSign(item.cont_sign) : null);
            
            if (!imageUrl) {
              console.warn('搜索结果项缺少图片URL:', item);
            }
            
            return (
              <div 
                key={item.cont_sign || index}
                className="border rounded-md overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
                onClick={() => setPreviewImage({ url: imageUrl, data: item })}
              >
                <div className="relative aspect-square bg-gray-100">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={`搜索结果 ${index + 1}`}
                      fill
                      className="object-contain"
                      sizes="33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" 
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  
                  <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-bl">
                    {formatSimilarity(item.score)}
                  </div>
                  
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <div className="flex gap-3">
                      <button
                        onClick={(e) => handleCopyImage(imageUrl, index, e)}
                        className="p-3 bg-white rounded-full text-gray-600 hover:text-blue-600 shadow-md hover:shadow-lg transform hover:scale-105 transition-all"
                        title="复制图片"
                      >
                        {copySuccess === `loading-${index}` ? (
                          <svg className="w-6 h-6 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        ) : copySuccess === index ? (
                          <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                              d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                        )}
                      </button>
                      
                      <a
                        href={imageUrl}
                        download
                        onClick={(e) => e.stopPropagation()}
                        className="p-3 bg-white rounded-full text-gray-600 hover:text-blue-600 shadow-md hover:shadow-lg transform hover:scale-105 transition-all"
                        title="下载图片"
                      >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </a>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewImage({ url: imageUrl, data: item });
                        }}
                        className="p-3 bg-white rounded-full text-gray-600 hover:text-blue-600 shadow-md hover:shadow-lg transform hover:scale-105 transition-all"
                        title="放大预览"
                      >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="p-2">
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      {`相似度: ${formatSimilarity(item.score)}`}
                    </div>
                    <div className="flex gap-2 sm:hidden">
                      <button
                        onClick={(e) => handleCopyImage(imageUrl, index, e)}
                        className="p-1.5 text-gray-500 hover:text-blue-500"
                      >
                        {copySuccess === index ? (
                          <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 10h8a2 2 0 012 2v8a2 2 0 01-2 2h-8a2 2 0 01-2-2v-8a2 2 0 012-2z" />
                          </svg>
                        )}
                      </button>
                      <a
                        href={imageUrl}
                        download
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 text-gray-500 hover:text-blue-500"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {previewImage && (
        <ImagePreview
          imageUrl={typeof previewImage === 'object' ? previewImage.url : previewImage}
          imageData={typeof previewImage === 'object' ? previewImage.data : {}}
          onClose={() => setPreviewImage(null)}
          alt="搜索结果图片"
        />
      )}
    </>
  );
} 