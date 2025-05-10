import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { CourseModule } from '@/types/course';

/**
 * 创建新模块的请求接口
 */
interface CreateModuleRequest {
  title: string;
  course_id: string;
  order_index?: number;
}

/**
 * 创建模块的响应接口
 */
interface CreateModuleResponse {
  success: boolean;
  message?: string;
  error?: string;
  module?: CourseModule;
}

/**
 * 使用Edge Function创建模块
 * 
 * 这个函数调用Supabase Edge Function来创建模块，
 * 而不是在前端执行创建操作，以减少内存使用
 */
export const createModuleViaEdgeFunction = async (data: CreateModuleRequest): Promise<CreateModuleResponse> => {
  try {
    console.log('开始调用Edge Function创建模块:', data);
    
    // 获取当前用户
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      console.error('创建模块失败: 用户未登录');
      return {
        success: false,
        error: '用户未登录'
      };
    }
    
    console.log('已获取用户信息:', userData.user.id);

    // 准备请求数据
    const requestData = {
      ...data,
      idempotencyKey: uuidv4(), // 生成唯一的幂等性密钥
      requesterId: userData.user.id
    };
    
    console.log('准备发送到Edge Function的数据:', requestData);

    // 调用Edge Function
    console.log('正在调用Edge Function: module-creator');
    const { data: responseData, error } = await supabase.functions.invoke('module-creator', {
      body: JSON.stringify(requestData)
    });
    
    if (error) {
      console.error('调用模块创建函数失败:', error);
      return {
        success: false,
        error: `调用服务失败: ${error.message}`
      };
    }
    
    console.log('Edge Function调用成功，返回数据:', responseData);

    return responseData as CreateModuleResponse;
  } catch (error: any) {
    console.error('创建模块时出错:', error);
    return {
      success: false,
      error: `创建模块失败: ${error.message}`
    };
  }
};

/**
 * 模块服务，提供与模块相关的方法
 */
const moduleService = {
  createModule: createModuleViaEdgeFunction
};

export default moduleService; 