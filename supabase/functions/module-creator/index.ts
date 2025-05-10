import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// 添加性能测量辅助函数
const logMemoryUsage = (label: string) => {
  try {
    const memoryUsage = Deno.memoryUsage();
    console.log(`[内存统计] ${label}:`);
    console.log(`  - RSS (总内存占用): ${formatBytes(memoryUsage.rss)}`);
    console.log(`  - 堆总大小: ${formatBytes(memoryUsage.heapTotal)}`);
    console.log(`  - 堆已使用: ${formatBytes(memoryUsage.heapUsed)}`);
    console.log(`  - 外部内存: ${formatBytes(memoryUsage.external)}`);
  } catch (error) {
    console.error(`[内存统计] 无法获取内存信息: ${error.message}`);
  }
};

// 格式化字节数
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 性能计时辅助函数
const createTimer = (label: string) => {
  const start = performance.now();
  return {
    end: () => {
      const duration = performance.now() - start;
      console.log(`[计时器] ${label}: ${duration.toFixed(2)}ms`);
      return duration;
    }
  };
};

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
  console.log('[函数] 开始执行 createSupabaseClient');
  const timer = createTimer('createSupabaseClient');
  
  // 从环境变量获取Supabase URL和服务角色密钥
  const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[错误] 缺少环境变量 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY');
    throw new Error('Missing environment variables SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  // 创建具有服务角色权限的客户端（绕过RLS限制）
  const client = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
  
  timer.end();
  console.log('[函数] 完成执行 createSupabaseClient');
  return client;
};

// 检查幂等性并处理请求
const processWithIdempotency = async <T extends object>(
  endpoint: string,
  idempotencyKey: string,
  requesterId: string,
  processor: () => Promise<T>
): Promise<T> => {
  console.log(`[函数] 开始执行 processWithIdempotency (key: ${idempotencyKey})`);
  logMemoryUsage('processWithIdempotency 开始');
  const timer = createTimer(`processWithIdempotency (${endpoint})`);
  
  const supabase = createSupabaseClient();
  
  // 检查是否已经处理过这个请求
  console.log('[幂等性] 检查是否已处理过此请求');
  const checkTimer = createTimer('幂等性检查');
  const { data: existingRecord, error: fetchError } = await supabase
    .from('idempotency_records')
    .select('*')
    .eq('key', idempotencyKey)
    .eq('requester_id', requesterId)
    .eq('endpoint', endpoint)
    .maybeSingle();
  checkTimer.end();
  
  if (fetchError) {
    console.error(`[错误] 检查幂等性时出错: ${fetchError.message}`, fetchError);
    // 发生错误时，继续处理请求
  } else if (existingRecord) {
    // 请求已处理过，返回之前的响应
    console.log(`[幂等性] 发现已缓存的响应 (key: ${idempotencyKey})`);
    console.log(`[幂等性] 缓存响应大小: ${JSON.stringify(existingRecord.response).length} 字节`);
    timer.end();
    logMemoryUsage('processWithIdempotency 结束(缓存命中)');
    return existingRecord.response as T;
  }
  
  // 处理请求
  console.log('[幂等性] 未找到缓存，执行请求处理');
  const processorTimer = createTimer('处理器执行');
  logMemoryUsage('处理器执行前');
  const response = await processor();
  logMemoryUsage('处理器执行后');
  processorTimer.end();
  
  // 保存处理结果
  console.log('[幂等性] 保存处理结果到幂等性记录');
  const responseSize = JSON.stringify(response).length;
  console.log(`[幂等性] 响应大小: ${responseSize} 字节`);
  
  const record: IdempotencyRecord = {
    key: idempotencyKey,
    requester_id: requesterId,
    endpoint,
    response
  };
  
  const saveTimer = createTimer('保存幂等性记录');
  const { error: insertError } = await supabase
    .from('idempotency_records')
    .insert(record);
  saveTimer.end();
  
  if (insertError) {
    console.error(`[错误] 保存幂等性记录失败: ${insertError.message}`, insertError);
    // 即使记录保存失败，仍然返回处理结果
  }
  
  timer.end();
  logMemoryUsage('processWithIdempotency 结束');
  return response;
};

// 验证用户权限
const verifyUserPermission = async (
  userId: string,
  resourceId: string,
  resourceType: 'course' | 'module' | 'lesson'
): Promise<boolean> => {
  console.log(`[函数] 开始执行 verifyUserPermission (${resourceType} ${resourceId})`);
  const timer = createTimer(`verifyUserPermission (${resourceType})`);
  
  const supabase = createSupabaseClient();
  
  try {
    if (resourceType === 'course') {
      // 验证用户是否是课程作者
      console.log('[权限] 验证用户是否是课程作者');
      const { data, error } = await supabase
        .from('courses')
        .select('author_id')
        .eq('id', resourceId)
        .maybeSingle();
      
      if (error) {
        console.error(`[错误] 验证课程权限时出错: ${error.message}`, error);
        throw error;
      }
      const hasPermission = data?.author_id === userId;
      console.log(`[权限] 用户${hasPermission ? '有' : '无'}权限操作此课程`);
      timer.end();
      return hasPermission;
    } 
    else if (resourceType === 'module') {
      // 验证用户是否是模块所属课程的作者
      console.log('[权限] 验证用户是否是模块所属课程的作者');
      const { data, error } = await supabase
        .from('course_modules')
        .select('courses(author_id)')
        .eq('id', resourceId)
        .maybeSingle();
      
      if (error) {
        console.error(`[错误] 验证模块权限时出错: ${error.message}`, error);
        throw error;
      }
      const hasPermission = data?.courses?.author_id === userId;
      console.log(`[权限] 用户${hasPermission ? '有' : '无'}权限操作此模块`);
      timer.end();
      return hasPermission;
    }
    else if (resourceType === 'lesson') {
      // 验证用户是否是课时所属课程的作者
      console.log('[权限] 验证用户是否是课时所属课程的作者');
      const { data, error } = await supabase
        .from('lessons')
        .select('course_modules(courses(author_id))')
        .eq('id', resourceId)
        .maybeSingle();
      
      if (error) {
        console.error(`[错误] 验证课时权限时出错: ${error.message}`, error);
        throw error;
      }
      const hasPermission = data?.course_modules?.courses?.author_id === userId;
      console.log(`[权限] 用户${hasPermission ? '有' : '无'}权限操作此课时`);
      timer.end();
      return hasPermission;
    }
    
    console.log(`[权限] 未知资源类型: ${resourceType}`);
    timer.end();
    return false;
  } catch (error) {
    console.error(`[错误] 验证权限时出错 (${resourceType} ${resourceId}): ${error.message}`, error);
    timer.end();
    return false;
  }
};

// 处理CORS预检请求
const handleCorsRequest = (req: Request) => {
  if (req.method === 'OPTIONS') {
    console.log('[CORS] 返回预检响应');
    return new Response('ok', { headers: corsHeaders });
  }
};

// 处理模块创建请求
const handleModuleCreatorRequest = async (req: Request): Promise<Response> => {
  console.log('==========================================');
  console.log(`[请求] 收到请求: ${req.method} ${req.url}`);
  logMemoryUsage('请求开始');
  const requestTimer = createTimer('请求总处理时间');
  
  // 处理CORS预检请求
  const corsResponse = handleCorsRequest(req);
  if (corsResponse) {
    requestTimer.end();
    return corsResponse;
  }

  try {
    // 解析请求体
    const bodyTimer = createTimer('解析请求体');
    const requestText = await req.text();
    console.log(`[请求] 请求体大小: ${requestText.length} 字节`);
    
    let requestData: ModuleCreatorRequest;
    try {
      requestData = JSON.parse(requestText);
      console.log('[请求] 请求数据:',  JSON.stringify(requestData, null, 2));
    } catch (parseError) {
      console.error(`[错误] 解析JSON时出错: ${parseError.message}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: `解析请求体时出错: ${parseError.message}`
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    bodyTimer.end();
    
    const { title, course_id, order_index = 0, idempotencyKey, requesterId } = requestData;

    // 参数验证
    console.log('[验证] 检查请求参数');
    if (!title || !course_id || !idempotencyKey || !requesterId) {
      console.log('[验证] 缺少必要参数');
      const response = new Response(
        JSON.stringify({
          success: false,
          error: '缺少必要参数'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
      requestTimer.end();
      return response;
    }

    console.log('[权限] 开始验证用户权限...');
    // 验证用户权限
    const permissionTimer = createTimer('验证用户权限');
    const hasPermission = await verifyUserPermission(requesterId, course_id, 'course');
    permissionTimer.end();
    
    if (!hasPermission) {
      console.log('[权限] 用户无权操作此课程');
      const response = new Response(
        JSON.stringify({
          success: false,
          error: '无权操作此课程'
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
      requestTimer.end();
      return response;
    }

    console.log('[处理] 使用幂等性处理创建模块请求');
    // 使用幂等性处理创建模块请求
    const result = await processWithIdempotency<ModuleCreatorResponse>(
      'module-creator',
      idempotencyKey,
      requesterId,
      async () => {
        console.log('[处理] 创建Supabase客户端');
        const supabase = createSupabaseClient();
        
        // 创建新模块
        const moduleToCreate: Partial<CourseModule> = {
          title,
          course_id,
          order_index
        };

        console.log('[数据库] 插入新模块:', moduleToCreate);
        logMemoryUsage('插入模块前');
        const dbTimer = createTimer('数据库插入操作');
        const { data: module, error } = await supabase
          .from('course_modules')
          .insert(moduleToCreate)
          .select('*')
          .single();
        dbTimer.end();
        logMemoryUsage('插入模块后');

        if (error) {
          console.error(`[错误] 创建模块失败: ${error.message}`, error);
          return {
            success: false,
            error: `创建模块失败: ${error.message}`
          };
        }

        console.log('[成功] 模块创建成功:', module);
        console.log(`[数据] 模块数据大小: ${JSON.stringify(module).length} 字节`);
        return {
          success: true,
          message: '模块创建成功',
          module: module as CourseModule
        };
      }
    );

    console.log('[响应] 返回结果:', result.success ? '成功' : '失败');
    const response = new Response(
      JSON.stringify(result),
      {
        status: result.success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
    logMemoryUsage('请求结束');
    requestTimer.end();
    console.log('==========================================');
    return response;
  } catch (error) {
    console.error(`[错误] 处理模块创建请求时出错: ${error.message}`, error);
    logMemoryUsage('处理错误时');
    
    const response = new Response(
      JSON.stringify({
        success: false,
        error: `处理请求时出错: ${error.message}`
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
    requestTimer.end();
    console.log('==========================================');
    return response;
  }
};

// 服务Edge Function
console.log('[启动] 模块创建器Edge Function 启动');
logMemoryUsage('服务启动');
serve(handleModuleCreatorRequest); 