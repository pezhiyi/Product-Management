"use client";
import { useState, useRef } from 'react';

export default function TestUploadPage() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const uploadFile = async () => {
    if (!file) {
      setError('请先选择文件');
      return;
    }

    setUploading(true);
    setError(null);
    
    try {
      // 创建FormData对象
      const formData = new FormData();
      formData.append('file', file);
      
      // 记录开始时间
      const startTime = Date.now();
      
      // 发送到我们的上传API
      const response = await fetch('/api/upload-test', {
        method: 'POST',
        body: formData,
      });
      
      // 记录完成时间
      const endTime = Date.now();
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`上传失败: ${response.status} ${text}`);
      }
      
      const data = await response.json();
      setResult({
        ...data,
        uploadTime: `${(endTime - startTime) / 1000}秒`,
        timestamp: new Date().toISOString()
      });
      
      // 清空文件选择
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setFile(null);
      
    } catch (err) {
      console.error('上传出错:', err);
      setError(err.message || '上传过程中发生错误');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <main style={{ minHeight: '100vh', padding: '20px 0' }}>
        <h1 style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '20px' }}>BOS 上传测试</h1>
        
        <div style={{ border: '1px solid #eaeaea', borderRadius: '10px', padding: '20px', maxWidth: '800px', margin: '20px auto', backgroundColor: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <h2>选择文件并上传</h2>
          
          <div style={{ margin: '20px 0' }}>
            <input 
              type="file" 
              onChange={handleFileChange} 
              ref={fileInputRef}
              disabled={uploading}
            />
            
            <button 
              onClick={uploadFile} 
              disabled={!file || uploading}
              style={{ 
                marginLeft: '10px',
                padding: '8px 16px',
                background: !file || uploading ? '#ccc' : '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: !file || uploading ? 'not-allowed' : 'pointer'
              }}
            >
              {uploading ? '上传中...' : '上传到BOS'}
            </button>
          </div>
          
          {file && (
            <div style={{ margin: '10px 0' }}>
              <strong>已选文件:</strong> {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </div>
          )}
          
          {error && (
            <div style={{ margin: '20px 0', padding: '10px', background: '#ffebee', color: '#c62828', borderRadius: '4px' }}>
              <strong>错误:</strong> {error}
            </div>
          )}
          
          {result && (
            <div style={{ margin: '20px 0', padding: '10px', background: '#e8f5e9', borderRadius: '4px' }}>
              <h3>上传成功!</h3>
              <div><strong>URL:</strong> <a href={result.url} target="_blank" rel="noopener noreferrer">{result.url}</a></div>
              <div><strong>Key:</strong> {result.key}</div>
              <div><strong>Content Type:</strong> {result.contentType}</div>
              <div><strong>上传耗时:</strong> {result.uploadTime}</div>
              <div><strong>时间戳:</strong> {result.timestamp}</div>
              {result.imagePreview && (
                <div style={{ marginTop: '15px' }}>
                  <strong>预览:</strong><br />
                  <img 
                    src={result.url} 
                    alt="Uploaded" 
                    style={{ maxWidth: '100%', maxHeight: '300px', marginTop: '10px' }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 