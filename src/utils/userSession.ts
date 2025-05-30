import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

// 用户会话缓存
let cachedUser: User | null = null;
let sessionChecked = false;

/**
 * 获取当前用户信息（优化版本）
 * 优先使用本地会话，避免频繁的网络请求
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    // 如果已经检查过会话且有缓存用户，直接返回
    if (sessionChecked && cachedUser) {
      return cachedUser;
    }

    // 首先尝试从本地会话获取用户信息（不需要网络请求）
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('获取会话失败:', sessionError);
      return null;
    }

    if (session?.user) {
      // 缓存用户信息
      cachedUser = session.user;
      sessionChecked = true;
      return session.user;
    }

    // 如果本地会话没有用户信息，才使用网络请求（很少发生）
    console.log('本地会话无用户信息，尝试网络验证...');
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('网络验证用户失败:', userError);
      return null;
    }

    // 缓存用户信息
    cachedUser = userData.user;
    sessionChecked = true;
    return userData.user;
  } catch (error) {
    console.error('获取用户信息时发生错误:', error);
    return null;
  }
};

/**
 * 清除用户缓存（登出时调用）
 */
export const clearUserCache = () => {
  cachedUser = null;
  sessionChecked = false;
};

/**
 * 强制刷新用户信息（当需要最新状态时调用）
 */
export const refreshUserInfo = async (): Promise<User | null> => {
  clearUserCache();
  return await getCurrentUser();
};

/**
 * 检查用户是否已登录（快速检查，不发送网络请求）
 */
export const isUserLoggedIn = (): boolean => {
  // 快速检查本地会话
  try {
    const session = supabase.auth.getSession();
    return session !== null;
  } catch {
    return false;
  }
}; 