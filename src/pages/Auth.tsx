
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import SignInForm from '@/components/auth/SignInForm';
import SignUpForm from '@/components/auth/SignUpForm';

const Auth = () => {
  const [isSignIn, setIsSignIn] = useState(true);
  const { user, loading } = useAuth();

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
