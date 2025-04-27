import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createSupabaseClient, processWithIdempotency, verifyUserPermission } from '../_shared/db-client.ts'
import type { SaveLessonsRequest, SaveLessonsResponse } from '../_shared/course-types.ts'

serve(async (req: Request) => {
  try {
    // 从请求中获取用户令牌
    const authorization = req.headers.get('Authorization')
    if (!authorization) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '未授权访问' 
        }),
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    }

    // 解析请求体
    const { moduleId, lessons, courseId, idempotencyKey, requesterId } = await req.json() as SaveLessonsRequest

    // 基本验证
    if (!moduleId || !lessons || !courseId || !idempotencyKey || !requesterId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '缺少必要参数' 
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    }

    // 创建Supabase客户端
    const supabase = createSupabaseClient()

    // 验证用户权限
    const hasPermission = await verifyUserPermission({
      supabase,
      requesterId,
      courseId
    })

    if (!hasPermission) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '无权操作此课程' 
        }),
        { 
          status: 403, 
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    }

    // 使用幂等性处理课程内容保存
    const result = await processWithIdempotency({
      supabase,
      idempotencyKey,
      requesterId,
      endpoint: 'save-lessons',
      processor: async () => {
        // 调用数据库事务函数保存课程内容
        const { data, error } = await supabase.rpc('save_lessons_transaction', {
          p_module_id: moduleId,
          p_lessons: lessons,
          p_requester_id: requesterId
        })

        if (error) {
          console.error('保存课程内容失败:', error)
          throw new Error(`保存课程内容失败: ${error.message}`)
        }

        // 返回函数结果
        return data as SaveLessonsResponse
      }
    })

    // 返回结果
    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('处理请求时出错:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `处理请求时出错: ${error.message}` 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )
  }
}) 