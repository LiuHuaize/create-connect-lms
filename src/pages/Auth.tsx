import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import SignInForm from '@/components/auth/SignInForm';
import SignUpForm from '@/components/auth/SignUpForm';
import AuthLayout from '@/components/layout/AuthLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

const Auth = () => {
  const [isSignIn, setIsSignIn] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [hasAttemptedAuth, setHasAttemptedAuth] = useState(false);
  
  // Access the auth context with error handling
  let user = null;
  let loading = true;
  
  try {
    // Try to access the auth context
    const auth = useAuth();
    user = auth.user;
    loading = auth.loading;

    // Reset error if auth context is working
    if (authError) setAuthError(null);
  } catch (error) {
    console.error('Auth context error:', error);
    
    // Set a user-friendly error message
    if (!authError) {
      setAuthError('Authentication system is currently unavailable. Please try again later.');
    }
  }

  // 用于处理长时间加载问题的useEffect
  useEffect(() => {
    let timeoutId: number;
    
    if (loading) {
      // 如果加载时间过长（超过5秒），更新状态以显示重试按钮
      timeoutId = window.setTimeout(() => {
        setHasAttemptedAuth(true);
      }, 5000);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loading]);

  // 重新加载页面的函数
  const handleRetry = () => {
    window.location.reload();
  };

  // If user is already logged in, redirect to dashboard
  if (!loading && user) {
    return <Navigate to="/dashboard" />;
  }

  // Auth content to be rendered inside the layout
  const authContent = (
    <>
      {authError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{authError}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="p-6 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-600">正在加载验证系统...</p>
          
          {hasAttemptedAuth && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500 mb-2">加载时间过长？</p>
              <button 
                onClick={handleRetry}
                className="text-blue-500 hover:text-blue-700 text-sm font-medium"
              >
                点击重试
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {isSignIn ? (
            <SignInForm onToggle={() => setIsSignIn(false)} />
          ) : (
            <SignUpForm onToggle={() => setIsSignIn(true)} />
          )}
        </>
      )}
    </>
  );

  // Use AuthLayout for the page
  return <AuthLayout>{authContent}</AuthLayout>;
};

export default Auth;
