export default function SearchDiagnosticPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">搜索与上传诊断页面</h1>
      <div className="max-w-3xl mx-auto">
        <ClientDiagnostic />
      </div>
    </div>
  );
}

"use client";
import dynamic from 'next/dynamic';

// 动态导入诊断组件，避免在服务器端渲染期间加载
const DiagnosticUploader = dynamic(() => import('../components/DiagnosticUploader'), {
  ssr: false,
  loading: () => <div className="p-4 border rounded-lg bg-white">正在加载诊断工具...</div>
});

function ClientDiagnostic() {
  return <DiagnosticUploader />;
} 