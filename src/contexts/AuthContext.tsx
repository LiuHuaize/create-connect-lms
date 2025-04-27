import React, { createContext, useContext, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { AuthContextType, UserRole } from '@/types/auth';
import { useAuthStore } from '@/stores/authStore';

// 创建一个空的默认Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * 认证提供者组件 - 使用Zustand存储认证状态
 * 这个组件保持与原有AuthProvider相同的接口，但内部实现使用Zustand
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  
  // 从Zustand获取状态和方法
  const { 
    user, 
    session, 
    role, 
    loading, 
    signIn, 
    signUp, 
    signOut, 
    refreshUserRole,
    initialize
  } = useAuthStore();
  
  // 组件挂载时初始化认证状态
  useEffect(() => {
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // 监听认证状态变化，处理缓存失效
  useEffect(() => {
    // 处理用户登录
    if (user) {
      console.log('用户已登录，刷新查询缓存');
      queryClient.invalidateQueries({ queryKey: ['enrolledCourses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    } else {
      // 用户登出，清除缓存
      console.log('用户已登出，清除查询缓存');
      queryClient.clear();
    }
  }, [user, queryClient]);
  
  // 包装signOut方法，确保清理React Query缓存
  const handleSignOut = async () => {
    queryClient.clear();
    await signOut();
  };
  
  // 提供给上下文的值，与原来的AuthContext保持相同的接口
  const contextValue: AuthContextType = {
    session,
    user,
    role,
    signIn,
    signUp,
    signOut: handleSignOut,
    loading,
    refreshUserRole
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

/**
 * 认证钩子 - 用于在组件中访问认证上下文
 * 
 * @returns 认证上下文
 * @throws 如果在AuthProvider外部使用会抛出错误
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
