import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

// Define role type
type UserRole = 'student' | 'teacher' | 'admin';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  role: UserRole | null;
  signIn: (username: string, password: string) => Promise<{ error: any }>;
  signUp: (username: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
  refreshUserRole: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 本地缓存用户角色
const USER_ROLE_CACHE_KEY = 'user-role-cache';

// 保存角色到本地存储
const cacheUserRole = (userId: string, role: UserRole | null) => {
  try {
    const cacheData = {
      userId,
      role,
      timestamp: Date.now()
    };
    localStorage.setItem(USER_ROLE_CACHE_KEY, JSON.stringify(cacheData));
    console.log('用户角色已缓存:', role);
  } catch (error) {
    console.error('缓存用户角色失败:', error);
  }
};

// 从本地存储获取角色
const getCachedUserRole = (userId: string): UserRole | null => {
  try {
    const cachedData = localStorage.getItem(USER_ROLE_CACHE_KEY);
    if (!cachedData) return null;
    
    const { userId: cachedUserId, role, timestamp } = JSON.parse(cachedData);
    
    // 检查是否为当前用户以及缓存是否在24小时内
    const isValid = 
      cachedUserId === userId && 
      Date.now() - timestamp < 24 * 60 * 60 * 1000;
    
    if (isValid) {
      console.log('从缓存读取用户角色:', role);
      return role;
    }
    
    return null;
  } catch (error) {
    console.error('读取缓存用户角色失败:', error);
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);
  const queryClient = useQueryClient();
  
  // Function to fetch user's role
  const fetchUserRole = async (userId: string) => {
    try {
      console.log('正在获取用户角色:', userId);
      
      // 首先尝试从缓存获取角色
      const cachedRole = getCachedUserRole(userId);
      if (cachedRole) {
        setRole(cachedRole);
        return;
      }
      
      // Check for admin role
      const { data: isAdmin, error: adminError } = await supabase
        .rpc('has_role', { user_id: userId, role: 'admin' });

      if (adminError) {
        console.error('检查管理员角色失败:', adminError);
        return;
      }

      if (isAdmin === true) {
        console.log('用户拥有管理员角色');
        setRole('admin');
        cacheUserRole(userId, 'admin');
        return;
      }

      // Check for teacher role
      const { data: isTeacher, error: teacherError } = await supabase
        .rpc('has_role', { user_id: userId, role: 'teacher' });

      if (teacherError) {
        console.error('检查教师角色失败:', teacherError);
        return;
      }

      if (isTeacher === true) {
        console.log('用户拥有教师角色');
        setRole('teacher');
        cacheUserRole(userId, 'teacher');
        return;
      }

      // Default to student
      console.log('用户拥有学生角色');
      setRole('student');
      cacheUserRole(userId, 'student');
    } catch (error) {
      console.error('获取用户角色过程中出错:', error);
    }
  };

  // Function to refresh user role - useful for when roles change
  const refreshUserRole = async () => {
    if (user) {
      console.log('刷新用户角色:', user.id);
      // 清除本地缓存
      localStorage.removeItem(USER_ROLE_CACHE_KEY);
      await fetchUserRole(user.id);
      
      // 重置相关查询的缓存
      queryClient.invalidateQueries({ queryKey: ['enrolledCourses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    }
  };

  useEffect(() => {
    // Set up the auth state listener
    console.log('设置认证状态监听器');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('认证状态变更:', event);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // 处理用户登录
        if (currentSession?.user) {
          console.log('用户已登录，获取角色');
          await fetchUserRole(currentSession.user.id);
          
          // 在登录时预加载数据
          if (event === 'SIGNED_IN') {
            queryClient.invalidateQueries({ queryKey: ['enrolledCourses'] });
            queryClient.invalidateQueries({ queryKey: ['courses'] });
          }
        } else {
          // 用户登出
          setRole(null);
          // 清除本地缓存
          localStorage.removeItem(USER_ROLE_CACHE_KEY);
          // 清除React Query缓存
          if (event === 'SIGNED_OUT') {
            queryClient.clear();
          }
        }
        
        setLoading(false);
      }
    );
    
    // Check for existing session
    console.log('检查现有会话');
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      console.log('现有会话检查结果:', currentSession ? '找到会话' : '没有会话');
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      // If user is logged in, fetch their role
      if (currentSession?.user) {
        console.log('找到用户会话，获取角色');
        await fetchUserRole(currentSession.user.id);
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]); 

  const signIn = async (username: string, password: string) => {
    // For username-password auth, we use the email field but with a standard domain
    const email = `${username}@user.internal`;
    console.log('使用邮箱登录:', email);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      console.log('登录成功');
    } else {
      console.error('登录错误:', error);
    }
    return { error };
  };

  const signUp = async (username: string, password: string) => {
    // For username-password auth, we use the email field but with a standard domain
    const email = `${username}@user.internal`;
    console.log('使用邮箱注册:', email);
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          username: username
        }
      }
    });
    if (!error) {
      console.log('注册成功');
    } else {
      console.error('注册错误:', error);
    }
    return { error };
  };

  const signOut = async () => {
    console.log('正在退出登录');
    // 清理本地缓存和React Query缓存
    localStorage.removeItem(USER_ROLE_CACHE_KEY);
    queryClient.clear();
    await supabase.auth.signOut();
  };

  const value = {
    session,
    user,
    role,
    signIn,
    signUp,
    signOut,
    loading,
    refreshUserRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
