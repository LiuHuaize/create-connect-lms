import TestVideoUpload from '@/components/course/TestVideoUpload';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function TestVideoUploadPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // 验证用户是否已登录
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/test-video-upload');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">加载中...</div>;
  }

  if (!user) {
    return null;
  }

  return <TestVideoUpload />;
} 