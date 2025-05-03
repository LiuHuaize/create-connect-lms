import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/auth';
import { cacheUserRole, getCachedUserRole, clearUserRoleCache } from '@/utils/authCache';
import { pinyin } from 'pinyin-pro';

/**
 * 辅助函数：将中文用户名转换为拼音，用于邮箱地址
 */
function encodeUsernameForEmail(username: string): string {
  // 检查是否包含非ASCII字符（如中文）
  if (/[^\x00-\x7F]/.test(username)) {
    // 将中文转换为不带声调的拼音，并移除空格
    const pinyinResult = pinyin(username, { 
      toneType: 'none', // 不带声调
      nonZh: 'consecutive' // 保留非中文字符
    });
    
    // 移除拼音之间的空格
    return pinyinResult.replace(/\s+/g, '');
  }
  
  // 如果不包含中文字符，则原样返回
  return username;
}

/**
 * 认证服务 - 封装与认证相关的API调用
 */
export const authService = {
  /**
   * 用户登录
   * 
   * @param username 用户名
   * @param password 密码
   * @returns 包含错误信息的对象（如果有）
   */
  async signIn(username: string, password: string) {
    // 编码用户名并创建内部邮箱格式
    const encodedUsername = encodeUsernameForEmail(username);
    const email = `${encodedUsername}@user.internal`;
    console.log('使用邮箱登录:', email);
    
    try {
      // 首先尝试使用编码后的邮箱格式
      let { error } = await supabase.auth.signInWithPassword({ email, password });
      
      // 如果登录失败，可能是旧用户使用了非编码格式，尝试旧格式
      if (error) {
        console.log('编码登录失败，尝试旧格式登录');
        const oldFormatEmail = `${username}@user.internal`;
        const oldFormatResult = await supabase.auth.signInWithPassword({ 
          email: oldFormatEmail, 
          password 
        });
        error = oldFormatResult.error;
      }
      
      if (!error) {
        console.log('登录成功');
      } else {
        console.error('登录错误:', error);
      }
      return { error };
    } catch (error) {
      console.error('登录过程中发生错误:', error);
      return { error };
    }
  },

  /**
   * 用户注册
   * 
   * @param username 用户名
   * @param password 密码
   * @returns 包含错误信息的对象（如果有）
   */
  async signUp(username: string, password: string) {
    // 首先检查用户名是否已存在
    try {
      const { data: existingUsers, error: checkError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .limit(1);
      
      if (checkError) {
        console.error('检查用户名存在性时出错:', checkError);
        return { error: checkError };
      }
      
      if (existingUsers && existingUsers.length > 0) {
        console.error('用户名已存在');
        return { error: { message: '用户名已被使用，请选择其他用户名' } };
      }
      
      // 编码用户名并创建内部邮箱格式
      const encodedUsername = encodeUsernameForEmail(username);
      const email = `${encodedUsername}@user.internal`;
      console.log('使用邮箱注册:', email);
      
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            username: username // 保存原始用户名
          }
        }
      });
      
      if (!error) {
        console.log('注册成功');
      } else {
        console.error('注册错误:', error);
      }
      return { error };
    } catch (error) {
      console.error('注册过程中发生错误:', error);
      return { error };
    }
  },

  /**
   * 用户登出
   */
  async signOut() {
    console.log('正在退出登录');
    clearUserRoleCache();
    await supabase.auth.signOut();
  },

  /**
   * 获取当前会话
   * 
   * @returns 用户会话
   */
  async getSession() {
    return await supabase.auth.getSession();
  },

  /**
   * 获取用户角色
   * 
   * @param userId 用户ID
   * @returns 用户角色
   */
  async fetchUserRole(userId: string): Promise<UserRole | null> {
    try {
      console.log('正在获取用户角色:', userId);
      
      // 首先尝试从缓存获取角色
      const cachedRole = getCachedUserRole(userId);
      if (cachedRole) {
        return cachedRole;
      }
      
      // 检查管理员角色
      const { data: isAdmin, error: adminError } = await supabase
        .rpc('has_role', { user_id: userId, role: 'admin' });

      if (adminError) {
        console.error('检查管理员角色失败:', adminError);
        return null;
      }

      if (isAdmin === true) {
        console.log('用户拥有管理员角色');
        cacheUserRole(userId, 'admin');
        return 'admin';
      }

      // 检查教师角色
      const { data: isTeacher, error: teacherError } = await supabase
        .rpc('has_role', { user_id: userId, role: 'teacher' });

      if (teacherError) {
        console.error('检查教师角色失败:', teacherError);
        return null;
      }

      if (isTeacher === true) {
        console.log('用户拥有教师角色');
        cacheUserRole(userId, 'teacher');
        return 'teacher';
      }

      // 默认为学生角色
      console.log('用户拥有学生角色');
      cacheUserRole(userId, 'student');
      return 'student';
    } catch (error) {
      console.error('获取用户角色过程中出错:', error);
      return null;
    }
  },

  /**
   * 设置认证状态监听器
   * 
   * @param callback 状态变更时的回调函数
   * @returns 订阅对象
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}; 