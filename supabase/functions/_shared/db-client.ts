import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { IdempotencyRecord } from './course-types.ts';

// 创建Supabase客户端
export const createSupabaseClient = () => {
  // 从环境变量获取Supabase URL和服务角色密钥
  const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing environment variables SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  // 创建具有服务角色权限的客户端（绕过RLS限制）
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
};

// 检查幂等性并处理请求
export const processWithIdempotency = async <T extends object>(
  endpoint: string,
  idempotencyKey: string,
  requesterId: string,
  processor: () => Promise<T>
): Promise<T> => {
  const supabase = createSupabaseClient();
  
  // 检查是否已经处理过这个请求
  const { data: existingRecord, error: fetchError } = await supabase
    .from('idempotency_records')
    .select('*')
    .eq('key', idempotencyKey)
    .eq('requester_id', requesterId)
    .eq('endpoint', endpoint)
    .maybeSingle();
  
  if (fetchError) {
    console.error('Error checking idempotency:', fetchError);
    // 发生错误时，继续处理请求
  } else if (existingRecord) {
    // 请求已处理过，返回之前的响应
    console.log(`Returning cached response for idempotency key: ${idempotencyKey}`);
    return existingRecord.response as T;
  }
  
  // 处理请求
  const response = await processor();
  
  // 保存处理结果
  const record: IdempotencyRecord = {
    key: idempotencyKey,
    requester_id: requesterId,
    endpoint,
    response
  };
  
  const { error: insertError } = await supabase
    .from('idempotency_records')
    .insert(record);
  
  if (insertError) {
    console.error('Error saving idempotency record:', insertError);
    // 即使记录保存失败，仍然返回处理结果
  }
  
  return response;
};

// 验证用户权限
export const verifyUserPermission = async (
  userId: string,
  resourceId: string,
  resourceType: 'course' | 'module' | 'lesson'
): Promise<boolean> => {
  const supabase = createSupabaseClient();
  
  try {
    if (resourceType === 'course') {
      // 验证用户是否是课程作者
      const { data, error } = await supabase
        .from('courses')
        .select('author_id')
        .eq('id', resourceId)
        .maybeSingle();
      
      if (error) throw error;
      return data?.author_id === userId;
    } 
    else if (resourceType === 'module') {
      // 验证用户是否是模块所属课程的作者
      const { data, error } = await supabase
        .from('course_modules')
        .select('courses(author_id)')
        .eq('id', resourceId)
        .maybeSingle();
      
      if (error) throw error;
      return data?.courses?.author_id === userId;
    }
    else if (resourceType === 'lesson') {
      // 验证用户是否是课时所属课程的作者
      const { data, error } = await supabase
        .from('lessons')
        .select('course_modules(courses(author_id))')
        .eq('id', resourceId)
        .maybeSingle();
      
      if (error) throw error;
      return data?.course_modules?.courses?.author_id === userId;
    }
    
    return false;
  } catch (error) {
    console.error(`Error verifying permission for ${resourceType} ${resourceId}:`, error);
    return false;
  }
}; 