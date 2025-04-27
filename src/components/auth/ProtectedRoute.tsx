import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, loading, role } = useAuth();
  
  if (loading) {
    // Consider using a shared loading component here
    return <div className="flex h-screen items-center justify-center">加载中...</div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  // If allowedRoles are specified, check if the user's role is included
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Redirect to a relevant page, perhaps dashboard or an unauthorized page
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

export default ProtectedRoute; 