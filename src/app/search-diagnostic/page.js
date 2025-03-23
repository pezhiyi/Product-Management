import ClientDiagnostic from '../components/ClientDiagnostic';

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