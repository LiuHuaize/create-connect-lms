import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { CourseModule } from '@/types/course';
import { getCurrentUser } from '@/utils/userSession';

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
 * 直接创建模块到数据库（不使用Edge Function）
 * 
 * 这个方法直接使用Supabase客户端操作数据库，避免Edge Function的复杂性
 */
export const createModuleDirectly = async (data: CreateModuleRequest): Promise<CreateModuleResponse> => {
  try {
    console.log('开始直接创建模块到数据库:', data);
    
    // 获取当前用户（使用优化的方法，避免频繁网络请求）
    const user = await getCurrentUser();
    if (!user) {
      console.error('创建模块失败: 用户未登录');
      return {
        success: false,
        error: '用户未登录'
      };
    }
    
    console.log('已获取用户信息:', user.id);

    // 验证用户是否有权限操作此课程
    console.log('验证用户权限...');
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('author_id')
      .eq('id', data.course_id)
      .single();
    
    if (courseError) {
      console.error('查询课程信息失败:', courseError);
      return {
        success: false,
        error: '课程不存在或无权访问'
      };
    }
    
    if (courseData.author_id !== user.id) {
      console.error('用户无权限操作此课程');
      return {
        success: false,
        error: '无权限操作此课程'
      };
    }

    // 准备模块数据
    const moduleData = {
      id: uuidv4(),
      title: data.title,
      course_id: data.course_id,
      order_index: data.order_index || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('准备插入的模块数据:', moduleData);

    // 直接插入数据库
    const { data: module, error } = await supabase
      .from('course_modules')
      .insert(moduleData)
      .select('*')
      .single();
    
    if (error) {
      console.error('插入模块到数据库失败:', error);
      return {
        success: false,
        error: `创建模块失败: ${error.message}`
      };
    }
    
    console.log('模块创建成功:', module);

    return {
      success: true,
      message: '模块创建成功',
      module: module as CourseModule
    };
  } catch (error: any) {
    console.error('创建模块时出错:', error);
    return {
      success: false,
      error: `创建模块失败: ${error.message}`
    };
  }
};

/**
 * 使用Edge Function创建模块
 * 
 * 这个函数调用Supabase Edge Function来创建模块，
 * 而不是在前端执行创建操作，以减少内存使用
 */
export const createModuleViaEdgeFunction = async (data: CreateModuleRequest): Promise<CreateModuleResponse> => {
  try {
    console.log('开始调用Edge Function创建模块:', data);
    
    // 获取当前用户（使用优化的方法，避免频繁网络请求）
    const user = await getCurrentUser();
    if (!user) {
      console.error('创建模块失败: 用户未登录');
      return {
        success: false,
        error: '用户未登录'
      };
    }
    
    console.log('已获取用户信息:', user.id);

    // 准备请求数据
    const requestData = {
      ...data,
      idempotencyKey: uuidv4(), // 生成唯一的幂等性密钥
      requesterId: user.id
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
 * 更新模块标题的请求接口
 */
interface UpdateModuleTitleRequest {
  moduleId: string;
  title: string;
  courseId: string;
}

/**
 * 更新模块标题的响应接口
 */
interface UpdateModuleTitleResponse {
  success: boolean;
  message?: string;
  error?: string;
  module?: CourseModule;
}

/**
 * 直接更新模块标题到数据库
 */
export const updateModuleTitle = async (data: UpdateModuleTitleRequest): Promise<UpdateModuleTitleResponse> => {
  try {
    console.log('开始更新模块标题到数据库:', data);

    // 获取当前用户
    const user = await getCurrentUser();
    if (!user) {
      console.error('更新模块标题失败: 用户未登录');
      return {
        success: false,
        error: '用户未登录'
      };
    }

    console.log('已获取用户信息:', user.id);

    // 验证用户是否有权限操作此课程
    console.log('验证用户权限...');
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('author_id')
      .eq('id', data.courseId)
      .single();

    if (courseError) {
      console.error('查询课程信息失败:', courseError);
      return {
        success: false,
        error: '课程不存在或无权访问'
      };
    }

    if (courseData.author_id !== user.id) {
      console.error('用户无权限操作此课程');
      return {
        success: false,
        error: '无权限操作此课程'
      };
    }

    // 更新模块标题
    console.log(`更新模块 ${data.moduleId} 的标题为: "${data.title}"`);
    const { data: module, error } = await supabase
      .from('course_modules')
      .update({
        title: data.title,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.moduleId)
      .eq('course_id', data.courseId) // 额外的安全检查
      .select('*')
      .single();

    if (error) {
      console.error('更新模块标题失败:', error);
      return {
        success: false,
        error: `更新模块标题失败: ${error.message}`
      };
    }

    console.log('模块标题更新成功:', module);

    return {
      success: true,
      message: '模块标题更新成功',
      module: module as CourseModule
    };
  } catch (error: any) {
    console.error('更新模块标题时出错:', error);
    return {
      success: false,
      error: `更新模块标题失败: ${error.message}`
    };
  }
};

/**
 * 模块服务，提供与模块相关的方法
 */
const moduleService = {
  createModule: createModuleDirectly, // 默认使用直接数据库操作
  createModuleViaEdgeFunction,
  createModuleDirectly,
  updateModuleTitle
};

export default moduleService;