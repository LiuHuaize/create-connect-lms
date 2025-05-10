import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// 课程模块类型定义
interface CourseModule {
  id?: string;
  course_id: string;
  title: string;
  order_index: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  lessons?: any[];
}

// 幂等性记录类型
interface IdempotencyRecord {
  id?: string;
  key: string;
  requester_id: string;
  endpoint: string;
  created_at?: string;
  response?: any;
}

// 模块创建请求接口
interface ModuleCreatorRequest {
  title: string;
  course_id: string;
  order_index?: number;
  idempotencyKey: string;
  requesterId: string;
}

// 模块创建响应接口
interface ModuleCreatorResponse {
  success: boolean;
  message?: string;
  error?: string;
  module?: CourseModule;
}

// 创建Supabase客户端
const createSupabaseClient = () => {
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
const processWithIdempotency = async <T extends object>(
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
const verifyUserPermission = async (
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

// 处理CORS预检请求
const handleCorsRequest = (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
};

// 处理模块创建请求
const handleModuleCreatorRequest = async (req: Request): Promise<Response> => {
  console.log('收到请求:', req.method, req.url);
  
  // 处理CORS预检请求
  const corsResponse = handleCorsRequest(req);
  if (corsResponse) {
    console.log('返回CORS预检响应');
    return corsResponse;
  }

  try {
    // 解析请求体
    const requestText = await req.text();
    console.log('请求体:', requestText);
    
    const requestData: ModuleCreatorRequest = JSON.parse(requestText);
    console.log('解析后的请求数据:', requestData);
    
    const { title, course_id, order_index = 0, idempotencyKey, requesterId } = requestData;

    // 参数验证
    if (!title || !course_id || !idempotencyKey || !requesterId) {
      console.log('缺少必要参数');
      return new Response(
        JSON.stringify({
          success: false,
          error: '缺少必要参数'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('验证用户权限...');
    // 验证用户权限
    const hasPermission = await verifyUserPermission(requesterId, course_id, 'course');
    if (!hasPermission) {
      console.log('用户无权操作此课程');
      return new Response(
        JSON.stringify({
          success: false,
          error: '无权操作此课程'
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('使用幂等性处理创建模块请求');
    // 使用幂等性处理创建模块请求
    const result = await processWithIdempotency<ModuleCreatorResponse>(
      'module-creator',
      idempotencyKey,
      requesterId,
      async () => {
        console.log('创建Supabase客户端');
        const supabase = createSupabaseClient();
        
        // 创建新模块
        const moduleToCreate: Partial<CourseModule> = {
          title,
          course_id,
          order_index
        };

        console.log('插入新模块:', moduleToCreate);
        const { data: module, error } = await supabase
          .from('course_modules')
          .insert(moduleToCreate)
          .select('*')
          .single();

        if (error) {
          console.error('创建模块失败:', error);
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
      }
    );

    console.log('返回结果:', result);
    return new Response(
      JSON.stringify(result),
      {
        status: result.success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('处理模块创建请求时出错:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: `处理请求时出错: ${error.message}`
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

// 服务Edge Function
serve(handleModuleCreatorRequest); 