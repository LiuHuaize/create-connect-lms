import { Session, User } from '@supabase/supabase-js';

/**
 * 定义用户角色类型
 * student - 学生
 * teacher - 教师
 * admin - 管理员
 */
export type UserRole = 'student' | 'teacher' | 'admin';

/**
 * 认证上下文类型定义
 */
export interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: UserRole | null;
  signIn: (username: string, password: string) => Promise<{ error: any }>;
  signUp: (username: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
  refreshUserRole: () => Promise<void>;
}

/**
 * 用户角色缓存数据结构
 */
export interface UserRoleCacheData {
  userId: string;
  role: UserRole | null;
  timestamp: number;
} 