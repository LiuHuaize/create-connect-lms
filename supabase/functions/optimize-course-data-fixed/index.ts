import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createSupabaseClient } from '../_shared/db-client.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { Course } from '../_shared/course-types.ts';

interface OptimizeCourseDataRequest {
  courseId: string;
  moduleId?: string | null;
  lessonId?: string | null;
  mode: 'learning' | 'editing' | 'preview';
}

interface ModuleWithLessons {
  id: string;
  title: string;
  order_index: number;
  course_id: string;
  created_at: string;
  updated_at: string;
  lessons?: any[];
}

// 处理课程数据加载请求
async function handleCourseDataRequest(req: Request): Promise<Response> {
  // 处理 CORS 预检请求
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 解析请求体
    const requestData: OptimizeCourseDataRequest = await req.json();
    const { courseId, moduleId, lessonId, mode = 'learning' } = requestData;

    if (!courseId) {
      return new Response(
        JSON.stringify({ error: '缺少必要参数: courseId' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`优化课程数据请求: courseId=${courseId}, mode=${mode}, moduleId=${moduleId || 'null'}`);
    
    // 创建supabase客户端
    const supabase = createSupabaseClient();
    
    // 1. 获取课程基本信息
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .is('deleted_at', null)
      .single();
    
    if (courseError) {
      console.error('获取课程信息失败:', courseError);
      return new Response(
        JSON.stringify({ error: '获取课程信息失败', details: courseError }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 2. 获取所有模块的基本信息（不包含课时）
    const { data: allModules, error: modulesError } = await supabase
      .from('course_modules')
      .select('*')
      .eq('course_id', courseId)
      .is('deleted_at', null)
      .order('order_index');
    
    if (modulesError) {
      console.error('获取课程模块失败:', modulesError);
      return new Response(
        JSON.stringify({ error: '获取课程模块失败', details: modulesError }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 确定当前关注的模块ID
    let focusedModuleId = moduleId;
    
    // 如果没有指定模块ID但指定了课时ID，找到对应的模块
    if (!focusedModuleId && lessonId) {
      const { data: lessonData } = await supabase
        .from('lessons')
        .select('module_id')
        .eq('id', lessonId)
        .is('deleted_at', null)
        .single();
      
      if (lessonData?.module_id) {
        focusedModuleId = lessonData.module_id;
      }
    }

    // 如果仍然没有焦点模块ID，尝试找到"知识学习"模块或第一个模块
    if (!focusedModuleId && allModules?.length > 0) {
      const knowledgeModule = allModules.find(m => m.title.includes('知识学习'));
      focusedModuleId = knowledgeModule?.id || allModules[0].id;
    }

    // 智能决定需要加载详细数据的模块
    // 在学习模式下：加载当前模块及相邻模块的详细数据
    // 在编辑模式下：加载所有模块的详细数据
    const detailedModuleIds: string[] = [];
    
    if (mode === 'editing') {
      // 编辑模式下，加载所有模块的详细数据
      detailedModuleIds.push(...allModules.map(m => m.id));
    } else {
      // 学习模式下，只加载关注模块及相邻模块
      if (focusedModuleId) {
        const focusedIndex = allModules.findIndex(m => m.id === focusedModuleId);
        if (focusedIndex !== -1) {
          // 添加前一个、当前和后一个模块
          for (let i = Math.max(0, focusedIndex - 1); i <= Math.min(allModules.length - 1, focusedIndex + 1); i++) {
            detailedModuleIds.push(allModules[i].id);
          }
        } else {
          // 找不到指定模块，使用第一个模块
          if (allModules.length > 0) {
            detailedModuleIds.push(allModules[0].id);
            if (allModules.length > 1) detailedModuleIds.push(allModules[1].id);
          }
        }
      }
    }

    console.log(`将加载 ${detailedModuleIds.length} 个模块的详细数据，模块IDs: ${detailedModuleIds.join(', ')}`);

    // 3. 获取需要详细数据的模块的课时信息
    let modulesWithLessons: ModuleWithLessons[] = [];
    
    if (detailedModuleIds.length > 0) {
      // 批量获取所选模块的所有课时
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .in('module_id', detailedModuleIds)
        .is('deleted_at', null)
        .order('order_index');
      
      if (lessonsError) {
        console.error('获取课时数据失败:', lessonsError);
        return new Response(
          JSON.stringify({ error: '获取课时数据失败', details: lessonsError }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // 按模块ID组织课时
      const lessonsByModuleId: Record<string, any[]> = {};
      detailedModuleIds.forEach(id => lessonsByModuleId[id] = []);
      
      if (lessonsData) {
        // 针对大型内容的优化: 如果课时内容超过50KB，且不是当前模块，则简化内容
        lessonsData.forEach(lesson => {
          let simplifiedLesson = {...lesson};
          
          // 检查内容是否需要简化 (仅对非当前模块的大型课时)
          if (lesson.module_id !== focusedModuleId && 
              typeof lesson.content === 'string' && 
              lesson.content.length > 50000) {
            
            // 简化内容，保留元数据但移除大型内容
            try {
              let contentObj = JSON.parse(lesson.content);
              contentObj = {
                ...contentObj,
                // 保留基本结构但简化内容
                content: "内容已简化，将在需要时加载",
                // 保留其他重要元数据...
                contentSimplified: true
              };
              simplifiedLesson.content = JSON.stringify(contentObj);
            } catch (e) {
              // 如果不是有效JSON，直接替换
              simplifiedLesson.content = JSON.stringify({
                contentSimplified: true,
                message: "内容已简化，将在需要时加载"
              });
            }
          }
          
          // 添加到对应模块
          if (lessonsByModuleId[lesson.module_id]) {
            lessonsByModuleId[lesson.module_id].push(simplifiedLesson);
          }
        });
      }

      // 为每个模块添加课时
      modulesWithLessons = allModules.map(module => {
        if (detailedModuleIds.includes(module.id)) {
          // 这是需要详细信息的模块，添加课时
          return {
            ...module,
            lessons: lessonsByModuleId[module.id] || []
          };
        } else {
          // 这是非焦点模块，仅返回基本信息，并标记课时需要按需加载
          return {
            ...module,
            lessons: []
          };
        }
      });
    } else {
      // 如果没有模块需要详细信息，返回所有模块的基本信息
      modulesWithLessons = allModules.map(module => ({...module, lessons: []}));
    }

    // 构建响应数据
    const responseData: Course & { modules?: ModuleWithLessons[] } = {
      ...courseData,
      modules: modulesWithLessons
    };

    return new Response(
      JSON.stringify(responseData),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('处理优化课程数据请求时出错:', error);
    return new Response(
      JSON.stringify({ error: '处理请求失败', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

// 服务Edge Function
serve(handleCourseDataRequest); 