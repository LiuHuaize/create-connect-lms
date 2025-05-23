import TestVideoUpload from '@/components/course/TestVideoUpload';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function TestVideoUploadPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // 验证用户是否已登录
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login?redirect=/test-video-upload');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">请先登录以使用视频上传功能</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">视频上传测试页面</h1>
          <p className="text-gray-600">
            此页面用于测试和调试视频上传功能。如果遇到问题，请查看浏览器控制台的详细日志。
          </p>
        </div>
        <TestVideoUpload />
      </div>
    </div>
  );
} 