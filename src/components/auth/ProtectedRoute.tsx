import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { UserRole } from '@/types/auth';
import { FullScreenLoader } from '@/components/ui/loading-spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, loading, role } = useAuth();
  
  if (loading) {
    return <FullScreenLoader text="正在验证身份..." />;
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