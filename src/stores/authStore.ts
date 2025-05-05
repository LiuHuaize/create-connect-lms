import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { UserRole } from '@/types/auth';
import { authService } from '@/services/authService';
import { clearUserRoleCache } from '@/utils/authCache';

interface AuthState {
  // 状态
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  loading: boolean;
  
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
  
  setUser: (user) => set({ user }),
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
      
      // 设置认证状态监听器
      const { data: { subscription } } = authService.onAuthStateChange(
        async (event, currentSession) => {
          set({ 
            session: currentSession,
            user: currentSession?.user ?? null
          });
          
          // 处理用户登录
          if (currentSession?.user) {
            const userId = currentSession.user.id;
            const userRole = await authService.fetchUserRole(userId);
            set({ role: userRole });
          } else {
            // 用户登出
            set({ role: null });
            // 清除本地缓存
            clearUserRoleCache();
          }
          
          set({ loading: false });
        }
      );
      
      // 初始化完成
      set({ loading: false });
      
      // 清理函数
      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('初始化认证状态时出错:', error);
      set({ loading: false });
    }
  }
})); 