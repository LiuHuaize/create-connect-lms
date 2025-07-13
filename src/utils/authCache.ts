import { UserRole, UserRoleCacheData } from '@/types/auth';

/**
 * 用户角色缓存的键名
 */
export const USER_ROLE_CACHE_KEY = 'user-role-cache';

/**
 * 用户角色缓存的过期时间（毫秒）
 * 默认2小时
 */
export const ROLE_CACHE_EXPIRY = 2 * 60 * 60 * 1000;

/**
 * 保存用户角色到本地存储
 * 
 * @param userId 用户ID
 * @param role 用户角色
 */
export const cacheUserRole = (userId: string, role: UserRole | null): void => {
  try {
    const cacheData: UserRoleCacheData = {
      userId,
      role,
      timestamp: Date.now()
    };
    
    // 使用sessionStorage代替localStorage，这样仅限于当前会话
    sessionStorage.setItem(USER_ROLE_CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.error('缓存用户角色失败:', error);
  }
};

/**
 * 从本地存储获取用户角色
 * 
 * @param userId 用户ID
 * @returns 用户角色，如果不存在或已过期则返回null
 */
export const getCachedUserRole = (userId: string): UserRole | null => {
  try {
    // 尝试从sessionStorage获取
    const cachedData = sessionStorage.getItem(USER_ROLE_CACHE_KEY);
    if (!cachedData) return null;
    
    const cacheData: UserRoleCacheData = JSON.parse(cachedData);
    
    // 检查是否为当前用户以及缓存是否在有效期内
    const isValid = 
      cacheData.userId === userId && 
      Date.now() - cacheData.timestamp < ROLE_CACHE_EXPIRY;
    
    if (isValid) {
      return cacheData.role;
    }
    
    // 如果无效则清除
    clearUserRoleCache();
    return null;
  } catch (error) {
    console.error('读取缓存用户角色失败:', error);
    return null;
  }
};

/**
 * 清除用户角色缓存
 */
export const clearUserRoleCache = (): void => {
  try {
    sessionStorage.removeItem(USER_ROLE_CACHE_KEY);
  } catch (error) {
    console.error('清除缓存用户角色失败:', error);
  }
}; 