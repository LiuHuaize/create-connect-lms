import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createSupabaseClient, processWithIdempotency, verifyUserPermission } from '../_shared/db-client.ts'
import type { DeleteCourseRequest } from '../_shared/course-types.ts'

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
    const { courseId, permanent, idempotencyKey, requesterId } = await req.json() as DeleteCourseRequest

    // 基本验证
    if (!courseId || !idempotencyKey || !requesterId) {
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

    // 使用幂等性处理课程删除
    const result = await processWithIdempotency({
      supabase,
      idempotencyKey,
      requesterId,
      endpoint: 'delete-course',
      processor: async () => {
        // 调用数据库函数删除课程
        const { data, error } = await supabase.rpc('delete_course_transaction', {
          p_course_id: courseId,
          p_permanent: permanent === true,
          p_requester_id: requesterId
        })

        if (error) {
          console.error('删除课程失败:', error)
          throw new Error(`删除课程失败: ${error.message}`)
        }

        return { 
          success: true, 
          courseId: data.course_id,
          deletedAt: data.deleted_at,
          permanent: data.permanent
        }
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