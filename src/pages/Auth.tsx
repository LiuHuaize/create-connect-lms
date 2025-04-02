
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import SignInForm from '@/components/auth/SignInForm';
import SignUpForm from '@/components/auth/SignUpForm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

const Auth = () => {
  const [isSignIn, setIsSignIn] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  
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

  // If user is already logged in, redirect to dashboard
  if (!loading && user) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        {authError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{authError}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-600">正在加载验证系统...</p>
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
      </div>
    </div>
  );
};

export default Auth;
