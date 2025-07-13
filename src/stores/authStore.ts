import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { UserRole } from '@/types/auth';
import { authService } from '@/services/authService';
import { clearUserRoleCache } from '@/utils/authCache';
import { clearUserCache } from '@/utils/userSession';

interface AuthState {
  // 状态
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  loading: boolean;
  isInitialized: boolean;
  isInitializing: boolean;
  
  // 方法
  signIn: (username: string, password: string) => Promise<{ error: any }>;
  signUp: (username: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshUserRole: () => Promise<void>;
  
  // 内部方法
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setRole: (role: UserRole | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  role: null,
  loading: true,
  isInitialized: false,
  isInitializing: false,
  
  setUser: (user) => {
    set({ user });
    // 同步更新userSession缓存
    if (!user) {
      clearUserCache();
    }
  },
  setSession: (session) => set({ session }),
  setRole: (role) => set({ role }),
  setLoading: (loading) => set({ loading }),
  
  signIn: async (username, password) => {
    const result = await authService.signIn(username, password);
    return result;
  },
  
  signUp: async (username, password) => {
    const result = await authService.signUp(username, password);
    return result;
  },
  
  signOut: async () => {
    // 清理登录状态
    set({ user: null, session: null, role: null });
    clearUserCache(); // 清除用户缓存
    await authService.signOut();
  },
  
  refreshUserRole: async () => {
    const { user } = get();
    if (user) {
      // 清除本地缓存，强制重新获取角色
      clearUserRoleCache();
      const fetchedRole = await authService.fetchUserRole(user.id);
      set({ role: fetchedRole });
    }
  },
  
  initialize: async () => {
    const { isInitialized, isInitializing } = get();
    
    // 如果已经初始化或正在初始化，直接返回
    if (isInitialized || isInitializing) {
      return;
    }
    
    set({ isInitializing: true });
    
    try {
      // 检查现有会话
      const { data: { session: currentSession } } = await authService.getSession();
      
      set({ 
        session: currentSession,
        user: currentSession?.user ?? null,
      });
      
      // 如果有用户会话，获取用户角色
      if (currentSession?.user) {
        const userRole = await authService.fetchUserRole(currentSession.user.id);
        set({ role: userRole });
      }
      
      // 用于跟踪上一个用户ID，避免重复角色获取
      let lastUserId: string | null = currentSession?.user?.id ?? null;
      
      // 设置认证状态监听器
      const { data: { subscription } } = authService.onAuthStateChange(
        async (_event: string, newSession: any) => {
          const newUserId = newSession?.user?.id ?? null;
          
          // 只有在用户真正改变时才更新状态
          if (lastUserId !== newUserId) {
            set({ 
              session: newSession,
              user: newSession?.user ?? null
            });
            
            if (newSession?.user && newUserId) {
              // 新用户登录，获取角色
              const userRole = await authService.fetchUserRole(newUserId);
              set({ role: userRole });
            } else {
              // 用户登出
              set({ role: null });
              clearUserRoleCache();
              clearUserCache();
            }
            
            lastUserId = newUserId;
          }
        }
      );
      
      // 初始化完成
      set({ loading: false, isInitialized: true, isInitializing: false });
      
      // 清理函数存储在全局变量中，以便后续清理
      (globalThis as any).__authSubscription = subscription;
      
    } catch (error) {
      console.error('初始化认证状态时出错:', error);
      set({ loading: false, isInitialized: true, isInitializing: false });
    }
  }
})); 