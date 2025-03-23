"use client";
import { useState } from 'react';

export default function DiagnosticUploader() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files?.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleSearch = async () => {
    if (!file) {
      setError('请选择一个图片文件');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // 创建FormData对象
      const formData = new FormData();
      formData.append('image', file);
      formData.append('mode', 'search');

      // 记录开始时间
      const startTime = Date.now();
      
      console.log('开始发送智能搜索请求...');
      
      // 发送请求到搜索API
      const response = await fetch('/api/baidu/search', {
        method: 'POST',
        body: formData,
      });
      
      console.log('收到搜索响应，状态码:', response.status);
      
      const responseText = await response.text();
      
      try {
        // 尝试解析为JSON
        const data = JSON.parse(responseText);
        console.log('解析的JSON响应:', data);
        
        if (data.success === false) {
          throw new Error(data.message || '服务器返回错误');
        }
        
        // 显示结果
        setResult({
          success: true,
          message: data.message || '搜索成功',
          results: data.results?.length || 0,
          time: `${(Date.now() - startTime) / 1000}秒`,
          rawData: data
        });
      } catch (parseError) {
        console.error('解析响应失败:', parseError);
        setError(`解析响应失败: ${parseError.message}, 原始响应: ${responseText.substring(0, 100)}...`);
      }
    } catch (err) {
      console.error('搜索请求出错:', err);
      setError(err.message || '搜索过程中发生错误');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadTest = async () => {
    if (!file) {
      setError('请选择一个图片文件');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // 创建FormData对象
      const formData = new FormData();
      formData.append('file', file);

      // 记录开始时间
      const startTime = Date.now();
      
      console.log('开始发送上传测试请求...');
      
      // 使用我们已知可用的上传测试端点
      const response = await fetch('/api/upload-test', {
        method: 'POST',
        body: formData,
      });
      
      console.log('收到上传测试响应，状态码:', response.status);
      
      const data = await response.json();
      
      setResult({
        success: true,
        message: '上传测试成功',
        url: data.url,
        time: `${(Date.now() - startTime) / 1000}秒`,
        rawData: data
      });
    } catch (err) {
      console.error('上传测试出错:', err);
      setError(err.message || '上传测试过程中发生错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-white">
      <h3 className="text-lg font-medium mb-3">搜索诊断工具</h3>
      <div className="flex items-center gap-3 mb-4">
        <input
          type="file"
          onChange={handleFileChange}
          accept="image/*"
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
          disabled={loading}
        />
      </div>
      
      {file && (
        <div className="mb-4">
          <strong>已选文件:</strong> {file.name} ({(file.size / 1024).toFixed(2)} KB)
        </div>
      )}
      
      <div className="flex gap-3 mb-4">
        <button
          onClick={handleSearch}
          disabled={!file || loading}
          className={`px-4 py-2 rounded-md ${
            !file || loading
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {loading ? '搜索中...' : '测试智能搜索'}
        </button>
        
        <button
          onClick={handleUploadTest}
          disabled={!file || loading}
          className={`px-4 py-2 rounded-md ${
            !file || loading
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {loading ? '上传中...' : '测试上传接口'}
        </button>
      </div>
      
      {error && (
        <div className="mt-3 p-3 bg-red-50 text-red-800 rounded-md">
          <strong>错误:</strong> {error}
        </div>
      )}
      
      {result && (
        <div className="mt-3 p-3 bg-green-50 text-green-800 rounded-md">
          <h4 className="font-medium">结果:</h4>
          <div><strong>状态:</strong> {result.success ? '成功' : '失败'}</div>
          <div><strong>消息:</strong> {result.message}</div>
          {result.url && (
            <div>
              <strong>URL:</strong> <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{result.url}</a>
            </div>
          )}
          {result.results !== undefined && (
            <div><strong>找到结果:</strong> {result.results}</div>
          )}
          <div><strong>耗时:</strong> {result.time}</div>
        </div>
      )}
    </div>
  );
} 