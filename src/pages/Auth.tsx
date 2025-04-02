import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import SignInForm from '@/components/auth/SignInForm';
import SignUpForm from '@/components/auth/SignUpForm';

const Auth = () => {
  const [isSignIn, setIsSignIn] = useState(true);
  
  // We'll safely access the auth context with error handling
  let user = null;
  let loading = true;
  
  try {
    // Try to access the auth context
    const auth = useAuth();
    user = auth.user;
    loading = auth.loading;
  } catch (error) {
    // If there's an error accessing the auth context, we'll handle it gracefully
    console.error('Auth context error:', error);
    // We'll keep the default values for user and loading
  }

  // If user is already logged in, redirect to dashboard
  if (!loading && user) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        {isSignIn ? (
          <SignInForm onToggle={() => setIsSignIn(false)} />
        ) : (
          <SignUpForm onToggle={() => setIsSignIn(true)} />
        )}
      </div>
    </div>
  );
};

export default Auth;
