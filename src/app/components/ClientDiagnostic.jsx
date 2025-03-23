"use client";
import dynamic from 'next/dynamic';

// 动态导入诊断组件，避免在服务器端渲染期间加载
const DiagnosticUploader = dynamic(() => import('./DiagnosticUploader'), {
  ssr: false,
  loading: () => <div className="p-4 border rounded-lg bg-white">正在加载诊断工具...</div>
});

export default function ClientDiagnostic() {
  return <DiagnosticUploader />;
} 