import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';

// 导入新的类型定义
import { AuthContextType, UserRole } from '@/types/auth';

// 导入认证服务和缓存工具
import { authService } from '@/services/authService';
import { clearUserRoleCache } from '@/utils/authCache';

// 创建认证上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * 认证提供者组件
 * 提供认证状态和相关方法给应用的其他组件
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);
  const queryClient = useQueryClient();
  
  // 更新用户角色
  const updateUserRole = async (userId: string) => {
    const fetchedRole = await authService.fetchUserRole(userId);
    setRole(fetchedRole);
  };

  // 刷新用户角色
  const refreshUserRole = async () => {
    if (user) {
      console.log('刷新用户角色:', user.id);
      // 清除本地缓存，强制重新获取角色
      clearUserRoleCache();
      await updateUserRole(user.id);
      
      // 重置相关查询的缓存
      queryClient.invalidateQueries({ queryKey: ['enrolledCourses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    }
  };

  useEffect(() => {
    // 设置认证状态监听器
    console.log('设置认证状态监听器');
    const { data: { subscription } } = authService.onAuthStateChange(
      (event, currentSession) => {
        console.log('认证状态变更:', event);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // 使用setTimeout避免在回调函数中直接使用异步操作，防止死锁
        setTimeout(() => {
          // 处理用户登录
          if (currentSession?.user) {
            console.log('用户已登录，获取角色');
            const userId = currentSession.user.id;
            
            // 异步获取用户角色
            updateUserRole(userId);
            
            // 在登录时预加载数据
            if (event === 'SIGNED_IN') {
              queryClient.invalidateQueries({ queryKey: ['enrolledCourses'] });
              queryClient.invalidateQueries({ queryKey: ['courses'] });
            }
          } else {
            // 用户登出
            setRole(null);
            // 清除本地缓存
            clearUserRoleCache();
            // 清除React Query缓存
            if (event === 'SIGNED_OUT') {
              queryClient.clear();
            }
          }
          
          setLoading(false);
        }, 0);
      }
    );
    
    // 检查现有会话
    console.log('检查现有会话');
    
    // 添加延迟来解决Supabase会话加载问题
    setTimeout(() => {
      authService.getSession().then(({ data: { session: currentSession } }) => {
        console.log('现有会话检查结果:', currentSession ? '找到会话' : '没有会话');
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // 使用setTimeout避免可能的死锁问题
        setTimeout(() => {
          // If user is logged in, fetch their role
          if (currentSession?.user) {
            console.log('找到用户会话，获取角色');
            updateUserRole(currentSession.user.id);
          }
          
          setLoading(false);
        }, 0);
      });
    }, 100); // 添加100毫秒的延迟，让Supabase有时间初始化

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]); 

  // 使用认证服务提供的方法
  const signIn = async (username: string, password: string) => {
    return await authService.signIn(username, password);
  };

  const signUp = async (username: string, password: string) => {
    return await authService.signUp(username, password);
  };

  const signOut = async () => {
    // 清理React Query缓存
    queryClient.clear();
    await authService.signOut();
  };

  // 提供给上下文的值
  const contextValue: AuthContextType = {
    session,
    user,
    role,
    signIn,
    signUp,
    signOut,
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
