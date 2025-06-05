import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from '@/utils/userSession';
import { Course, CourseModule, CourseStatus } from "@/types/course";
import { Lesson, LessonContent, LessonType } from "@/types/course";
import { Json } from "@/integrations/supabase/types";
import { v4 as uuidv4 } from 'uuid';

// 全局课程完成状态缓存
export const lessonCompletionCache: Record<string, Record<string, boolean>> = {};

// 注意：本系统已移除软删除功能。所有删除操作都是硬删除（永久性删除），不保留在回收站。
// 因此涉及 deleted_at 字段的查询和逻辑已被移除。数据库迁移已完成，所有旧的软删除记录已转换为硬删除。
// 如需恢复软删除功能，请联系开发者或系统管理员。

// 提取 lesson 数据库记录转换为应用模型的函数
export function convertDbLessonToLesson(dbLesson: any): Lesson {
  try {
    // 如果 content 是字符串，尝试解析为对象
    let parsedContent = dbLesson.content;
    if (typeof dbLesson.content === 'string' && dbLesson.content) {
      try {
        parsedContent = JSON.parse(dbLesson.content);
      } catch (e) {
        console.error('解析课时内容失败:', e);
      }
    } else if (typeof dbLesson.content === 'object' && dbLesson.content !== null) {
      // 已经是对象，直接使用
      parsedContent = dbLesson.content;
    }
    
    return {
      ...dbLesson,
      content: parsedContent
    };
  } catch (error) {
    console.error('转换课时数据失败:', error);
    return dbLesson;
  }
}

export const courseService = {
  // 创建或更新课程
  async saveCourse(course: Course): Promise<Course> {
    // 1. 提取需要发送到数据库的数据
    const courseData = course;
    
    // 2. 确保我们不将可能存在的模块数据尝试保存到courses表
    // 移除任何可能在course对象上但不在数据库表中的字段
    const dataToSave = {
      id: courseData.id,
      title: courseData.title,
      description: courseData.description,
      short_description: courseData.short_description,
      author_id: courseData.author_id,
      cover_image: courseData.cover_image,
      status: courseData.status,
      price: courseData.price,
      tags: courseData.tags,
      category: courseData.category,
      grade_range_min: courseData.grade_range_min,
      grade_range_max: courseData.grade_range_max,
      primary_subject: courseData.primary_subject,
      secondary_subject: courseData.secondary_subject,
      preparation_materials: courseData.preparation_materials,
      duration_minutes: courseData.duration_minutes,
      difficulty: courseData.difficulty,
      updated_at: new Date().toISOString()
    };
    
    console.log('Saving course data:', dataToSave);
    console.log('Course difficulty:', courseData.difficulty);
    
    const { data, error } = await supabase
      .from("courses")
      .upsert(dataToSave)
      .select("*")
      .single();

    if (error) {
      console.error('Error saving course:', error);
      throw error;
    }
    return data as Course;
  },

  // 获取用户创建的所有课程
  async getUserCourses(userId: string): Promise<Course[]> {
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("author_id", userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('获取用户课程失败:', error);
      throw error;
    }
    
    return data as Course[] || [];
  },

  // 获取课程基本信息（不包括模块和课时）
  async getCourseBasicInfo(courseId: string): Promise<Course> {
    console.log(`获取课程基本信息: ${courseId}`);
    const timerId = `getCourseBasicInfo_${courseId}_${Date.now()}`;
    console.time(timerId);
    
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .single();

    if (error) {
      console.error('获取课程基本信息失败:', error);
      console.timeEnd(timerId);
      throw error;
    }
    
    console.timeEnd(timerId);
    console.log(`课程基本信息获取完成: ${data.title}`);
    
    return data as Course;
  },

  // 获取课程的所有模块（不包括课时）
  async getCourseModules(courseId: string): Promise<CourseModule[]> {
    const { data, error } = await supabase
      .from("course_modules")
      .select("*")
      .eq("course_id", courseId)
      .order("order_index");

    if (error) {
      console.error('获取课程模块失败:', error);
      throw error;
    }
    
    return data as CourseModule[] || [];
  },

  // 获取课程最核心信息（用于学习页面快速加载）
  async getCourseEssentialInfo(courseId: string): Promise<Pick<Course, 'id' | 'title' | 'description' | 'cover_image' | 'status' | 'author_id'>> {
    console.log(`获取课程核心信息（最小化）: ${courseId}`);
    const timerId = `getCourseEssentialInfo_${courseId}_${Date.now()}`;
    console.time(timerId);
    
    const { data, error } = await supabase
      .from("courses")
      .select("id, title, description, cover_image, status, author_id")
      .eq("id", courseId)
      .single();

    if (error) {
      console.error('获取课程核心信息失败:', error);
      console.timeEnd(timerId);
      throw error;
    }
    
    console.timeEnd(timerId);
    console.log(`课程核心信息获取完成: ${data.title}`);
    
    return data as Pick<Course, 'id' | 'title' | 'description' | 'cover_image' | 'status' | 'author_id'>;
  },

  // 获取单个模块的所有课时
  async getModuleLessons(moduleId: string): Promise<Lesson[]> {
    const { data, error } = await supabase
      .from("lessons")
      .select("*")
      .eq("module_id", moduleId)
      .order("order_index");
      
    if (error) {
      console.error(`获取模块 ${moduleId} 的课时失败:`, error);
      throw error;
    }
    
    // 转换课时内容格式
    const convertedLessons = data 
      ? data.map(convertDbLessonToLesson).sort((a, b) => a.order_index - b.order_index)
      : [];
      
    return convertedLessons;
  },

  // 获取单个课程详情（包括模块和课时）- 修复数据丢失问题
  async getCourseDetails(courseId: string): Promise<Course & { modules?: CourseModule[] }> {
    try {
      const timerId = `getCourseDetails_${courseId}_${Date.now()}`;
      console.time(timerId); // 性能计时开始
      console.log(`开始获取课程详情 (修复版本): ${courseId}`);
      
      // 获取课程基本信息
      const stageTimer1 = `getCourseBasicInfo-stage_${courseId}_${Date.now()}`;
      console.time(stageTimer1);
      const courseData = await this.getCourseBasicInfo(courseId);
      console.timeEnd(stageTimer1);
      
      // 获取课程模块 - 不包含课时，先获取模块结构
      const stageTimer2 = `getCourseModules-stage_${courseId}_${Date.now()}`;
      console.time(stageTimer2);
      const modulesData = await this.getCourseModules(courseId);
      console.timeEnd(stageTimer2);

      // 如果没有模块，直接返回课程信息
      if (!modulesData || modulesData.length === 0) {
        console.timeEnd(timerId);
        console.log(`课程 ${courseId} 没有模块，直接返回`);
        return {
          ...courseData,
          modules: []
        };
      }

      // 修复：获取完整的课时数据，包括content
      const stageTimer3 = `getModuleLessonsComplete-stage_${courseId}_${Date.now()}`;
      console.time(stageTimer3);
      const allLessonsByModuleId = await this.getModuleLessonsComplete(modulesData.map(m => m.id!).filter(Boolean));
      console.timeEnd(stageTimer3);
      
      // 将课时数据分配给相应的模块
      const modulesWithLessons = modulesData.map(module => {
        return {
          ...module,
          lessons: module.id ? allLessonsByModuleId[module.id] || [] : []
        };
      });

      console.timeEnd(timerId); // 性能计时结束
      console.log(`课程详情获取完成，包含 ${modulesWithLessons.length} 个模块`);
      
      return {
        ...courseData,
        modules: modulesWithLessons as CourseModule[]
      };
    } catch (error) {
      console.error('获取课程详情时出错:', error);
      throw error;
    }
  },

  // 新增：获取完整的模块课时数据（包括content）
  async getModuleLessonsComplete(moduleIds: string[]): Promise<Record<string, Lesson[]>> {
    if (!moduleIds.length) return {};
    
    console.log(`获取 ${moduleIds.length} 个模块的完整课时数据（包括content）`);
    const timerId = `getModuleLessonsComplete_${moduleIds.join(',')}_${Date.now()}`;
    console.time(timerId);
    
    try {
      // 获取完整的课时数据，包括content字段
      const { data, error } = await supabase
        .from("lessons")
        .select("*") // 获取所有字段，包括content
        .in("module_id", moduleIds)
        .order("module_id, order_index");
        
      if (error) {
        console.error(`获取完整模块课时失败:`, error);
        console.timeEnd(timerId);
        throw error;
      }
      
      // 按模块ID组织课时
      const lessonsByModule: Record<string, Lesson[]> = {};
      moduleIds.forEach(id => lessonsByModule[id] = []);
      
      // 转换并分组课时，保留完整的content数据
      if (data && data.length > 0) {
        data.forEach(lesson => {
          const moduleId = lesson.module_id;
          if (moduleId && lessonsByModule[moduleId]) {
            lessonsByModule[moduleId].push(convertDbLessonToLesson(lesson));
          }
        });
      }
      
      console.timeEnd(timerId);
      console.log(`完整课时数据获取完成，共 ${data?.length || 0} 个课时`);
      
      return lessonsByModule;
    } catch (error) {
      console.error('获取完整课时数据时出错:', error);
      throw error;
    }
  },

  // 保留原有的批量获取方法，用于性能优化场景（不包括content）
  async getModuleLessonsBatch(moduleIds: string[]): Promise<Record<string, Lesson[]>> {
    if (!moduleIds.length) return {};
    
    console.log(`批量获取 ${moduleIds.length} 个模块的课时（不包括content，性能优化版）`);
    const timerId = `getModuleLessonsBatch_${moduleIds.join(',')}_${Date.now()}`;
    console.time(timerId);
    
    // 优化：只选择必要的字段，利用新建的索引
    // 不获取content字段，减少数据传输量
    const { data, error } = await supabase
      .from("lessons")
      .select("id, title, type, order_index, module_id, video_file_path, bilibili_url")
      .in("module_id", moduleIds)
      .order("module_id, order_index");
      
    if (error) {
      console.error(`批量获取模块课时失败:`, error);
      console.timeEnd(timerId);
      throw error;
    }
    
    // 按模块ID组织课时
    const lessonsByModule: Record<string, Lesson[]> = {};
    moduleIds.forEach(id => lessonsByModule[id] = []);
    
    // 转换并分组课时，content字段设为undefined（表示未加载）
    if (data && data.length > 0) {
      data.forEach(lesson => {
        const moduleId = lesson.module_id;
        if (moduleId && lessonsByModule[moduleId]) {
          lessonsByModule[moduleId].push({
            ...convertDbLessonToLesson(lesson),
            content: undefined // 明确标记为未加载，而不是空对象
          });
        }
      });
    }
    
    console.timeEnd(timerId);
    console.log(`课时批量获取完成，共 ${data?.length || 0} 个课时`);
    
    return lessonsByModule;
  },

  // 按需获取单个课时的完整内容
  async getLessonContent(lessonId: string): Promise<any> {
    console.log(`按需加载课时内容: ${lessonId}`);
    const timerId = `getLessonContent_${lessonId}_${Date.now()}`;
    console.time(timerId);
    
    try {
      const { data, error } = await supabase
        .from("lessons")
        .select("content")
        .eq("id", lessonId)
        .single();
        
      if (error) {
        console.error(`获取课时内容失败:`, error);
        console.timeEnd(timerId);
        throw error;
      }
      
      console.timeEnd(timerId);
      return data?.content || {};
    } catch (error) {
      console.error('获取课时内容时出错:', error);
      throw error;
    }
  },

  // 更新课程状态（发布/草稿/存档）
  async updateCourseStatus(courseId: string, status: CourseStatus): Promise<Course> {
    console.log(`开始更新课程状态: courseId=${courseId}, status=${status}`);
    
    if (!courseId) {
      console.error('更新课程状态失败: 缺少课程ID');
      throw new Error('更新课程状态需要有效的课程ID');
    }
    
    try {
      const { data, error } = await supabase
        .from("courses")
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq("id", courseId)
        .select("*")
        .single();

      if (error) {
        console.error('数据库更新课程状态失败:', error);
        throw error;
      }
      
      console.log('课程状态更新成功:', data);
      return data as Course;
    } catch (error) {
      console.error('更新课程状态失败:', error);
      throw error;
    }
  },

  // 添加或更新课程模块
  async addCourseModule(module: Omit<CourseModule, "created_at" | "updated_at">): Promise<CourseModule> {
    const isUpdate = Boolean(module.id);
    
    if (!module.title || module.title.trim() === '') {
      console.error('模块标题为空，设置为默认值');
      module.title = `未命名模块 ${Date.now()}`;
    }
    
    console.log(`正在保存模块到数据库: ${isUpdate ? '更新' : '新建'} - ID: ${module.id}, 标题: ${module.title}`);
    
    try {
      const { data, error } = await supabase
        .from("course_modules")
        .upsert({
          id: module.id,
          course_id: module.course_id,
          title: module.title,
          order_index: module.order_index,
          updated_at: new Date().toISOString(),
          ...(isUpdate ? {} : { created_at: new Date().toISOString() })
        })
        .select("*")
        .single();

      if (error) {
        console.error('保存课程模块失败:', error);
        throw error;
      }
      
      console.log(`模块保存成功，从数据库返回: ID: ${data.id}, 标题: ${data.title}`);
      return data as unknown as CourseModule;
    } catch (error) {
      console.error(`保存模块 "${module.title}" 时发生错误:`, error);
      throw error;
    }
  },

  // 硬删除课程模块
  async deleteModule(moduleId: string): Promise<void> {
    console.log(`开始删除模块: ${moduleId}`);
    try {
      // 获取当前用户ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('用户未登录');
      }
      
      // 获取模块信息，用于记录日志
      const { data: moduleData, error: moduleError } = await supabase
        .from("course_modules")
        .select("title, course_id")
        .eq("id", moduleId)
        .single();
      
      if (moduleError) {
        console.error('获取模块信息失败:', moduleError);
        throw moduleError;
      }
      
      // 调用RPC函数进行硬删除
      const { data, error } = await supabase.rpc('delete_module', {
        p_module_id: moduleId,
        p_user_id: user.id
      });
      
      if (error) {
        console.error('删除模块失败:', error);
        throw error;
      }
      
      if (!data) {
        throw new Error('删除失败：可能没有权限或模块不存在');
      }
      
      console.log(`模块 ${moduleId} 及其课时已成功删除`);
    } catch (error) {
      console.error('删除模块过程中出错:', error);
      throw error;
    }
  },

  // 添加或更新课时
  async addLesson(lesson: Omit<Lesson, "created_at" | "updated_at">): Promise<Lesson> {
    // 确保提供了必要的属性
    if (!lesson.module_id) {
      throw new Error("Lesson must have a module_id");
    }

    if (!lesson.title || lesson.title.trim() === '') {
      console.error('课时标题为空，设置为默认值');
      lesson.title = `未命名课时 ${Date.now()}`;
    } else {
      // 确保标题被正确处理
      lesson.title = lesson.title.trim();
    }
    
    const isUpdate = Boolean(lesson.id);
    console.log(`正在保存课时到数据库: ${isUpdate ? '更新' : '新建'} - ID: ${lesson.id}, 标题: "${lesson.title}"`);
    
    try {
      // 确保课时内容是有效的JSON对象
      let contentToSave = lesson.content;
      if (typeof contentToSave === 'string') {
        try {
          contentToSave = JSON.parse(contentToSave);
        } catch (e) {
          console.warn('课时内容不是有效的JSON，保持原值');
        }
      }
      
      // 热点数据安全保护 - 对热点类型课时进行特殊处理
      if (isUpdate && lesson.type === 'hotspot' && lesson.id) {
        try {
          console.log('检测到热点类型课时更新，正在进行数据保护检查...');
          // 获取数据库中现有的课时数据
          const { data: existingLesson, error: fetchError } = await supabase
            .from("lessons")
            .select("content")
            .eq("id", lesson.id)
            .single();
          
          if (fetchError) {
            console.error('获取现有热点课时数据失败:', fetchError);
          } else if (existingLesson && existingLesson.content) {
            console.log('获取到现有热点课时数据:', existingLesson);
            const existingContent = existingLesson.content as any;
            const newContentObj = typeof contentToSave === 'string' 
              ? JSON.parse(contentToSave) 
              : contentToSave;
              
            // 检查背景图片是否丢失
            if (!newContentObj?.backgroundImage && existingContent?.backgroundImage) {
              console.warn('检测到热点背景图片丢失，从数据库恢复:', existingContent.backgroundImage);
              if (typeof newContentObj === 'object') {
                newContentObj.backgroundImage = existingContent.backgroundImage;
              }
            }
            
            // 检查热点数据是否丢失
            if ((!newContentObj?.hotspots || newContentObj.hotspots.length === 0) && 
                existingContent?.hotspots && existingContent.hotspots.length > 0) {
              console.warn(`检测到热点数据丢失，从数据库恢复 ${existingContent.hotspots.length} 个热点`);
              if (typeof newContentObj === 'object') {
                newContentObj.hotspots = [...existingContent.hotspots];
              }
            }
            
            // 更新要保存的内容
            contentToSave = newContentObj;
          }
        } catch (error) {
          console.error('热点数据保护检查失败:', error);
          // 继续正常保存流程，不中断
        }
      }

      const lessonToSave = {
        id: lesson.id,
        module_id: lesson.module_id,
        title: lesson.title,
        type: lesson.type,
        content: contentToSave as unknown as Json,
        order_index: lesson.order_index,
        video_file_path: lesson.type === 'video' ? 
          (lesson.video_file_path || (lesson.content as any).videoFilePath || null) : null,
        bilibili_url: lesson.type === 'video' ? 
          (lesson.bilibili_url || (lesson.content as any).bilibiliUrl || null) : null,
        updated_at: new Date().toISOString(),
        ...(isUpdate ? {} : { created_at: new Date().toISOString() })
      };
      
      console.log('准备发送到数据库的课时数据:', JSON.stringify({
        id: lessonToSave.id,
        title: lessonToSave.title,
        module_id: lessonToSave.module_id,
        type: lessonToSave.type,
        // 省略大型内容字段
      }));
      
      const { data, error } = await supabase
        .from("lessons")
        .upsert(lessonToSave)
        .select("*")
        .single();

      if (error) {
        console.error('保存课时失败:', error);
        throw error;
      }
      
      console.log(`课时保存成功，从数据库返回: ID: ${data.id}, 标题: "${data.title}"`);
      return convertDbLessonToLesson(data);
    } catch (error) {
      console.error(`保存课时 "${lesson.title}" 时发生错误:`, error);
      throw error;
    }
  },

  // 硬删除课时
  async deleteLesson(lessonId: string): Promise<void> {
    console.log(`开始删除课时: ${lessonId}`);
    try {
      // 获取当前用户ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('用户未登录');
      }
      
      // 调用RPC函数进行硬删除
      const { data, error } = await supabase.rpc('delete_lesson', {
        p_lesson_id: lessonId,
        p_user_id: user.id
      });
      
      if (error) {
        console.error('删除课时失败:', error);
        throw error;
      }
      
      if (!data) {
        throw new Error('删除失败：可能没有权限或课时不存在');
      }
      
      console.log(`课时 ${lessonId} 已成功删除`);
    } catch (error) {
      console.error('删除课时过程中出错:', error);
      throw error;
    }
  },

  // 更新课时标题
  async updateLessonTitle(lessonId: string, title: string, moduleId: string): Promise<{ success: boolean; message?: string; error?: string; lesson?: Lesson }> {
    try {
      console.log(`开始更新课时标题: lessonId=${lessonId}, title="${title}", moduleId=${moduleId}`);

      // 获取当前用户
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('更新课时标题失败: 用户未登录');
        return {
          success: false,
          error: '用户未登录'
        };
      }

      console.log('已获取用户信息:', user.id);

      // 验证用户是否有权限操作此课时（通过模块和课程的关联）
      console.log('验证用户权限...');
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select(`
          id,
          title,
          module_id,
          course_modules!inner (
            id,
            course_id,
            courses!inner (
              id,
              author_id
            )
          )
        `)
        .eq('id', lessonId)
        .eq('module_id', moduleId)
        .single();

      if (lessonError) {
        console.error('查询课时信息失败:', lessonError);
        return {
          success: false,
          error: '课时不存在或无权访问'
        };
      }

      // 检查用户权限
      const courseAuthorId = (lessonData as any).course_modules?.courses?.author_id;
      if (courseAuthorId !== user.id) {
        console.error('用户无权限操作此课时');
        return {
          success: false,
          error: '无权限操作此课时'
        };
      }

      // 更新课时标题
      console.log(`更新课时 ${lessonId} 的标题为: "${title}"`);
      const { data: lesson, error } = await supabase
        .from('lessons')
        .update({
          title: title,
          updated_at: new Date().toISOString()
        })
        .eq('id', lessonId)
        .eq('module_id', moduleId) // 额外的安全检查
        .select('*')
        .single();

      if (error) {
        console.error('更新课时标题失败:', error);
        return {
          success: false,
          error: `更新课时标题失败: ${error.message}`
        };
      }

      console.log('课时标题更新成功:', lesson);

      return {
        success: true,
        message: '课时标题更新成功',
        lesson: convertDbLessonToLesson(lesson)
      };
    } catch (error: any) {
      console.error('更新课时标题时出错:', error);
      return {
        success: false,
        error: `更新课时标题失败: ${error.message}`
      };
    }
  },

  // 将课时标记为完成
  async markLessonComplete(lessonId: string, courseId: string, enrollmentId: string, score?: number, data?: any): Promise<void> {
    try {
      // 检查当前用户ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('用户未登录');
      }
      
      console.log(`标记课时 ${lessonId} 为已完成...`);
      
      // 检查是否已存在完成记录
      const { data: existingCompletion, error: fetchError } = await supabase
        .from('lesson_completions')
        .select('id')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .maybeSingle();
        
      if (fetchError) {
        console.error('检查课时完成记录失败:', fetchError);
        throw fetchError;
      }
      
      // 如果已存在，则更新记录
      if (existingCompletion) {
        const { error: updateError } = await supabase
          .from('lesson_completions')
          .update({
            completed_at: new Date().toISOString(),
            score: score || null,
            data: data || null
          })
          .eq('id', existingCompletion.id);
          
        if (updateError) {
          console.error('更新课时完成记录失败:', updateError);
          throw updateError;
        }
        
        console.log('已更新现有的课时完成记录');
      } else {
        // 如果不存在，则创建新记录
        const { error: insertError } = await supabase
          .from('lesson_completions')
          .insert({
            user_id: user.id,
            lesson_id: lessonId,
            course_id: courseId,
            enrollment_id: enrollmentId,
            completed_at: new Date().toISOString(),
            score: score || null,
            data: data || null
          });
          
        if (insertError) {
          console.error('创建课时完成记录失败:', insertError);
          throw insertError;
        }
        
        console.log('已创建新的课时完成记录');
      }
      
      // 更新缓存状态
      if (!lessonCompletionCache[courseId]) {
        lessonCompletionCache[courseId] = {};
      }
      lessonCompletionCache[courseId][lessonId] = true;
      
      console.log('已更新课时完成状态缓存');
      
      // 触发器会自动更新课程进度，所以这里不需要手动更新
    } catch (error) {
      console.error('标记课时完成失败:', error);
      throw error;
    }
  },
  
  // 取消课时完成标记
  async unmarkLessonComplete(lessonId: string): Promise<void> {
    try {
      // 检查当前用户ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('用户未登录');
      }
      
      // 获取课程ID (需要先查询)
      const { data: completion, error: fetchError } = await supabase
        .from('lesson_completions')
        .select('course_id')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .maybeSingle();
        
      if (fetchError) {
        console.error('获取课时完成记录失败:', fetchError);
        throw fetchError;
      }
      
      const courseId = completion?.course_id;
      
      // 删除课时完成记录
      const { error } = await supabase
        .from('lesson_completions')
        .delete()
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId);
        
      if (error) {
        console.error('删除课时完成记录失败:', error);
        throw error;
      }
      
      // 更新缓存状态
      if (courseId && lessonCompletionCache[courseId]) {
        delete lessonCompletionCache[courseId][lessonId];
        console.log(`已清除课程 ${courseId} 的完成状态缓存`);
      }
      
      // 触发器会自动更新课程进度
    } catch (error) {
      console.error('取消标记课时完成过程中出错:', error);
      throw error;
    }
  },
  
  // 获取用户课时完成状态
  async getLessonCompletionStatus(courseId: string, forceRefresh = false): Promise<Record<string, boolean>> {
    try {
      // 如果不强制刷新且缓存中有值，则使用缓存
      if (!forceRefresh && lessonCompletionCache[courseId]) {
        console.log('使用缓存的课时完成状态:', lessonCompletionCache[courseId]);
        return lessonCompletionCache[courseId];
      }
      
      // 检查当前用户ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('获取课时完成状态: 用户未登录');
        return {};
      }
      
      console.log(`正在从服务器获取课程 ${courseId} 的完成状态...`);
      
      // 获取用户在该课程中已完成的课时
      const { data, error } = await supabase
        .from('lesson_completions')
        .select('lesson_id')
        .eq('user_id', user.id)
        .eq('course_id', courseId);
        
      if (error) {
        console.error('获取课时完成状态失败:', error);
        throw error;
      }
      
      // 将结果转换为Map格式
      const completionStatus: Record<string, boolean> = {};
      if (data && data.length > 0) {
        data.forEach(item => {
          if (item.lesson_id) {
            completionStatus[item.lesson_id] = true;
          }
        });
        console.log(`找到 ${data.length} 个已完成的课时:`, completionStatus);
      } else {
        console.log('未找到已完成的课时');
      }
      
      // 更新缓存
      lessonCompletionCache[courseId] = completionStatus;
      
      return completionStatus;
    } catch (error) {
      console.error('获取课时完成状态失败:', error);
      return {};
    }
  },

  // 清理无效的课时完成记录
  async cleanInvalidLessonCompletions(courseId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('用户未登录');
      }
      
      console.log(`开始清理课程 ${courseId} 的无效完成记录...`);
      
      // 使用数据库函数清理无效记录
      const { data, error } = await supabase.rpc('clean_invalid_lesson_completions', {
        course_id_param: courseId
      });
      
      if (error) {
        console.error('清理无效完成记录失败:', error);
        throw error;
      }
      
      const deletedCount = data?.[0]?.deleted_count || 0;
      
      if (deletedCount > 0) {
        console.log(`已成功清理 ${deletedCount} 个无效的完成记录`);
        
        // 清除缓存，强制重新加载
        delete lessonCompletionCache[courseId];
      } else {
        console.log('未发现无效的完成记录');
      }
      
    } catch (error) {
      console.error('清理无效完成记录失败:', error);
      throw error;
    }
  },

  // 保存模块课时顺序 - 使用直接数据库操作替代Edge Function
  async saveModuleLessonsOrder(moduleId: string, courseId: string, lessons: Lesson[]): Promise<void> {
    try {
      // 检查当前用户ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('用户未登录');
      }
      
      console.log(`开始保存模块 ${moduleId} 的课时顺序`, lessons);
      
      // 准备课时数据，确保order_index正确
      const lessonsToUpdate = lessons.map((lesson, index) => ({
        id: lesson.id,
        order_index: index,
        updated_at: new Date().toISOString()
      }));

      // 批量更新课时的order_index
      for (const lessonUpdate of lessonsToUpdate) {
        const { error } = await supabase
          .from('lessons')
          .update({ 
            order_index: lessonUpdate.order_index,
            updated_at: lessonUpdate.updated_at
          })
          .eq('id', lessonUpdate.id)
          .eq('module_id', moduleId); // 额外的安全检查

        if (error) {
          console.error(`更新课时 ${lessonUpdate.id} 顺序失败:`, error);
          throw error;
        }
      }
      
      console.log(`课时顺序保存成功，更新了 ${lessonsToUpdate.length} 个课时`);
    } catch (error) {
      console.error('保存课时顺序出错:', error);
      throw error;
    }
  },

  // 优化的批量保存课时功能
  async saveLessonsInBatch(lessons: Lesson[], moduleId: string): Promise<Lesson[]> {
    if (!lessons || lessons.length === 0) {
      return [];
    }
    
    try {
      console.log(`批量保存 ${lessons.length} 个课时到模块 ${moduleId}`);
      
      // 准备批量保存数据，确保每个课时都有正确的模块ID
      const lessonsToSave = lessons.map(lesson => {
        // 确保ID字段被完全移除，而不是设为undefined，这样数据库会自动生成新ID
        const { id, ...lessonWithoutId } = lesson;
        return {
          ...lessonWithoutId,
          module_id: moduleId,
          // 修复：确保内容是JSON字符串，而不是直接传对象
          content: typeof lesson.content === 'object' ? JSON.stringify(lesson.content) : (lesson.content || '{}'),
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        };
      });
      
      // 批量保存课时
      const { data, error } = await supabase
        .from("lessons")
        .upsert(lessonsToSave)
        .select("*");
        
      if (error) {
        console.error('批量保存课时失败:', error);
        throw error;
      }
      
      // 转换返回的课时数据
      const savedLessons = data ? data.map(convertDbLessonToLesson) : [];
      console.log(`成功批量保存了 ${savedLessons.length} 个课时`);
      
      return savedLessons;
    } catch (error) {
      console.error('批量保存课时出错:', error);
      throw error;
    }
  },

  // 复制课程功能
  async duplicateCourse(courseId: string): Promise<Course> {
    try {
      console.log(`开始复制课程: ${courseId}`);
      
      // 1. 获取原课程详情（包括模块和课时）
      const sourceCourse = await this.getCourseDetails(courseId);
      console.log(`获取到原课程，包含 ${sourceCourse.modules?.length || 0} 个模块`);
      
      // 2. 创建新课程基本信息（删除ID而不是设置为undefined）
      const { id: _, ...courseWithoutId } = sourceCourse;
      const newCourse: Course = {
        ...courseWithoutId,
        title: `${sourceCourse.title} (副本)`,
        status: 'draft',  // 新课程默认为草稿状态
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
      
      // 3. 保存新课程基本信息并获取新ID
      const createdCourse = await this.saveCourse(newCourse);
      console.log(`创建新课程成功，ID: ${createdCourse.id}`);
      
      // 4. 复制课程模块和课时
      if (sourceCourse.modules && sourceCourse.modules.length > 0) {
        // 创建模块ID映射表，用于关联新旧ID
        const moduleIdMap: Record<string, string> = {};
        
        // 使用Promise.all并行复制所有模块
        await Promise.all(sourceCourse.modules.map(async (sourceModule) => {
          console.log(`准备复制模块: ${sourceModule.title}，包含 ${sourceModule.lessons?.length || 0} 个课时`);
          
          // 创建新模块对象（删除ID而不是设置为undefined）
          const { id: __, lessons: ___, ...moduleWithoutId } = sourceModule;
          const newModule: CourseModule = {
            ...moduleWithoutId,
            course_id: createdCourse.id,  // 关联到新课程
            updated_at: new Date().toISOString(),
            created_at: new Date().toISOString()
          };
          
          // 保存新模块
          const createdModule = await this.addCourseModule(newModule);
          console.log(`创建新模块成功，ID: ${createdModule.id}, 标题: ${createdModule.title}`);
          
          // 记录新旧模块ID的映射关系
          if (sourceModule.id) {
            moduleIdMap[sourceModule.id] = createdModule.id!;
          }
          
          // 复制模块下的所有课时
          if (sourceModule.lessons && sourceModule.lessons.length > 0) {
            console.log(`开始复制模块 ${createdModule.title} 的 ${sourceModule.lessons.length} 个课时`);
            
            // 创建批量保存的课时数组，确保移除原始ID
            const newLessons: Lesson[] = sourceModule.lessons.map(sourceLesson => {
              // 使用解构赋值明确移除原始ID
              const { id: ___, ...lessonWithoutId } = sourceLesson;
              return {
                ...lessonWithoutId,
                module_id: createdModule.id,  // 关联到新模块
                updated_at: new Date().toISOString(),
                created_at: new Date().toISOString()
              };
            });
            
            // 批量保存课时
            const savedLessons = await this.saveLessonsInBatch(newLessons, createdModule.id!);
            console.log(`模块 ${createdModule.title} 下复制了 ${savedLessons.length} 个课时`);
          }
          
          // 复制模块的资源文件
          if (sourceModule.id) {
            await this.duplicateModuleResources(sourceModule.id, createdModule.id!);
          }
        }));
      }
      
      console.log(`课程复制完成，新课程ID: ${createdCourse.id}`);
      
      // 返回新创建的课程信息
      return createdCourse;
    } catch (error) {
      console.error('复制课程失败:', error);
      throw error;
    }
  },
  
  // 复制模块资源文件
  async duplicateModuleResources(sourceModuleId: string, targetModuleId: string): Promise<void> {
    try {
      console.log(`开始复制模块资源文件，源模块: ${sourceModuleId}, 目标模块: ${targetModuleId}`);
      
      // 1. 获取源模块的所有资源文件
      const { data: sourceResources, error } = await supabase
        .from("course_resources")
        .select("*")
        .eq("module_id", sourceModuleId);
      
      if (error) {
        console.error('获取模块资源文件失败:', error);
        throw error;
      }
      
      if (!sourceResources || sourceResources.length === 0) {
        console.log(`模块 ${sourceModuleId} 没有资源文件需要复制`);
        return;
      }
      
      console.log(`找到 ${sourceResources.length} 个资源文件需要复制`);
      
      // 2. 复制每个资源文件
      for (const resource of sourceResources) {
        // 从源资源对象中删除ID和时间戳，准备创建新记录
        const { id, created_at, updated_at, ...resourceWithoutId } = resource;
        
        // 3. 如果文件存储在Supabase Storage中，复制实际文件
        // 注意：这里假设文件路径是相对于某个存储桶的路径
        if (resource.file_path) {
          // 文件已经存在于存储中，我们只需要复用同样的路径
          // 如果需要复制文件本身（创建副本），这里需要添加Storage复制逻辑
          console.log(`资源文件路径: ${resource.file_path} (假设文件已存在，仅创建引用)`);
          
          // 如果需要真正复制文件，可以使用以下代码（取决于具体的存储结构）
          // const bucket = 'course-resources';
          // const newFilePath = `${targetModuleId}/${resource.file_name}`;
          // await supabase.storage.from(bucket).copy(resource.file_path, newFilePath);
          // resourceWithoutId.file_path = newFilePath;
        }
        
        // 4. 创建新的资源记录
        const newResource = {
          ...resourceWithoutId,
          module_id: targetModuleId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // 5. 保存新资源记录到数据库
        const { data, error: insertError } = await supabase
          .from("course_resources")
          .insert(newResource)
          .select("*")
          .single();
        
        if (insertError) {
          console.error(`复制资源文件记录失败:`, insertError);
          continue; // 继续尝试复制其他资源
        }
        
        console.log(`成功复制资源文件: ${data.title}, ID: ${data.id}`);
      }
      
      console.log(`模块资源文件复制完成`);
    } catch (error) {
      console.error('复制模块资源文件失败:', error);
      // 不抛出异常，确保课程复制过程能继续
      // 将错误记录下来，但不中断流程
    }
  },

  // 永久删除课程（不经过回收站）
  async permanentlyDeleteCourse(courseId: string): Promise<void> {
    try {
      // 检查当前用户ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('用户未登录');
      }
      
      console.log(`开始永久删除课程: ${courseId}`);
      
      // 调用RPC函数进行硬删除
      const { data, error } = await supabase.rpc('delete_course', {
        p_course_id: courseId,
        p_user_id: user.id
      });
      
      if (error) {
        console.error('删除课程失败:', error);
        throw error;
      }
      
      if (!data) {
        throw new Error('删除失败：可能没有权限或课程不存在');
      }
      
      console.log(`课程 ${courseId} 及其关联内容已被永久删除`);
    } catch (error) {
      console.error('永久删除课程过程中出错:', error);
      throw error;
    }
  },

  // 测试方法：比较常规加载和优化加载的性能
  async compareCourseLoading(courseId: string): Promise<{
    traditional: { time: number; dataSize: number };
    optimized: { time: number; dataSize: number };
    improvement: { time: string; dataSize: string };
  }> {
    console.log(`开始性能比较测试: ${courseId}`);
    
    // 测试传统方法
    const traditionalStart = performance.now();
    const traditionalResult = await this.getCourseDetails(courseId);
    const traditionalEnd = performance.now();
    const traditionalTime = traditionalEnd - traditionalStart;
    const traditionalSize = JSON.stringify(traditionalResult).length;
    
    // 短暂延迟，确保浏览器有时间回收内存
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 测试优化方法
    const optimizedStart = performance.now();
    const optimizedResult = await this.getCourseOptimized(courseId);
    const optimizedEnd = performance.now();
    const optimizedTime = optimizedEnd - optimizedStart;
    const optimizedSize = JSON.stringify(optimizedResult).length;
    
    // 计算改进百分比
    const timeImprovement = ((traditionalTime - optimizedTime) / traditionalTime * 100).toFixed(2);
    const sizeImprovement = ((traditionalSize - optimizedSize) / traditionalSize * 100).toFixed(2);
    
    const result = {
      traditional: {
        time: traditionalTime,
        dataSize: traditionalSize
      },
      optimized: {
        time: optimizedTime,
        dataSize: optimizedSize
      },
      improvement: {
        time: `${timeImprovement}%`,
        dataSize: `${sizeImprovement}%`
      }
    };
    
    console.table({
      '传统方法': { 
        '加载时间(ms)': traditionalTime.toFixed(2), 
        '数据大小(bytes)': traditionalSize 
      },
      '优化方法': { 
        '加载时间(ms)': optimizedTime.toFixed(2), 
        '数据大小(bytes)': optimizedSize 
      },
      '性能提升': { 
        '加载时间': `${timeImprovement}%`, 
        '数据大小': `${sizeImprovement}%` 
      }
    });
    
    return result;
  },

  // 新增 - 使用Edge Function优化课程数据加载
  async getCourseOptimized(
    courseId: string, 
    mode: 'learning' | 'editing' | 'preview' = 'learning', 
    moduleId?: string, 
    lessonId?: string
  ): Promise<Course & { modules?: CourseModule[] }> {
    console.time('getCourseOptimized'); // 性能计时开始
    console.log(`开始获取优化课程数据: ${courseId}, mode: ${mode}`);
    
    try {
      // 暂时不使用Edge Function，而是实现相同的逻辑来测试
      // 1. 获取课程基本信息
      const courseData = await this.getCourseBasicInfo(courseId);
      
      // 2. 获取所有模块的基本信息（不包含课时）
      const modulesData = await this.getCourseModules(courseId);
      
      if (!modulesData || modulesData.length === 0) {
        console.timeEnd('getCourseOptimized');
        console.log(`课程 ${courseId} 没有模块，直接返回`);
        return {
          ...courseData,
          modules: []
        };
      }
      
      // 确定当前关注的模块ID
      let focusedModuleId = moduleId;
      
      // 如果没有指定模块ID但指定了课时ID，找到对应的模块
      if (!focusedModuleId && lessonId) {
        const { data: lessonData } = await supabase
          .from('lessons')
          .select('module_id')
          .eq('id', lessonId)
          .single();
        
        if (lessonData?.module_id) {
          focusedModuleId = lessonData.module_id;
        }
      }
      
      // 如果仍然没有焦点模块ID，尝试找到"知识学习"模块或第一个模块
      if (!focusedModuleId && modulesData.length > 0) {
        const knowledgeModule = modulesData.find(m => m.title.includes('知识学习'));
        focusedModuleId = knowledgeModule?.id || modulesData[0].id;
      }
      
      // 智能决定需要加载详细数据的模块
      const detailedModuleIds: string[] = [];
      
      if (mode === 'editing') {
        // 编辑模式下，加载所有模块的详细数据
        detailedModuleIds.push(...modulesData.map(m => m.id!).filter(Boolean));
      } else {
        // 学习模式下，只加载关注模块及相邻模块
        if (focusedModuleId) {
          const focusedIndex = modulesData.findIndex(m => m.id === focusedModuleId);
          if (focusedIndex !== -1) {
            // 添加前一个、当前和后一个模块
            for (let i = Math.max(0, focusedIndex - 1); i <= Math.min(modulesData.length - 1, focusedIndex + 1); i++) {
              detailedModuleIds.push(modulesData[i].id!);
            }
          } else {
            // 找不到指定模块，使用第一个模块
            if (modulesData.length > 0) {
              detailedModuleIds.push(modulesData[0].id!);
              if (modulesData.length > 1) detailedModuleIds.push(modulesData[1].id!);
            }
          }
        }
      }
      
      console.log(`将加载 ${detailedModuleIds.length} 个模块的详细数据，模块IDs: ${detailedModuleIds.join(', ')}`);
      
      // 批量获取所需模块的课时
      const lessonsByModuleId = await this.getModuleLessonsBatch(detailedModuleIds);
      
      // 为每个模块添加课时
      const modulesWithLessons = modulesData.map(module => {
        if (detailedModuleIds.includes(module.id!)) {
          // 这是需要详细信息的模块，添加课时
          return {
            ...module,
            lessons: module.id ? lessonsByModuleId[module.id] || [] : []
          };
        } else {
          // 这是非焦点模块，仅返回基本信息，并标记课时需要按需加载
          return {
            ...module,
            lessons: []
          };
        }
      });
      
      // 构建响应数据
      const responseData = {
        ...courseData,
        modules: modulesWithLessons
      };
      
      console.timeEnd('getCourseOptimized'); // 性能计时结束
      console.log(`优化课程数据获取完成，包含 ${responseData.modules.length} 个模块`);
      
      return responseData;
    } catch (error) {
      console.error('获取优化课程数据时出错:', error);
      console.timeEnd('getCourseOptimized'); // 确保在发生异常时也能结束计时器
      
      // 失败时回退到原始方法
      console.log('回退到原始课程加载方法...');
      return this.getCourseDetails(courseId);
    }
  },

  // 性能测试：比较优化前后的查询效果
  async testQueryOptimization(courseId: string): Promise<{
    traditional: { time: number; dataSize: number };
    optimized: { time: number; dataSize: number };
    improvement: { timeImprovement: string; dataSizeReduction: string };
  }> {
    console.log('开始测试查询优化效果...');
    
    // 测试传统查询（select *）
    console.time('traditional-query');
    const traditionalStart = Date.now();
    const { data: traditionalData } = await supabase
      .from("lessons")
      .select("*")
      .eq("module_id", "test");
    const traditionalEnd = Date.now();
    console.timeEnd('traditional-query');
    
    // 测试优化查询（只选择必要字段）
    console.time('optimized-query');
    const optimizedStart = Date.now();
    const { data: optimizedData } = await supabase
      .from("lessons")
      .select("id, title, type, order_index, module_id, content, video_file_path, bilibili_url")
      .eq("module_id", "test");
    const optimizedEnd = Date.now();
    console.timeEnd('optimized-query');
    
    // 计算数据大小（粗略估算）
    const traditionalSize = JSON.stringify(traditionalData || []).length;
    const optimizedSize = JSON.stringify(optimizedData || []).length;
    
    const traditionalTime = traditionalEnd - traditionalStart;
    const optimizedTime = optimizedEnd - optimizedStart;
    
    const timeImprovement = traditionalTime > 0 
      ? `${((1 - optimizedTime / traditionalTime) * 100).toFixed(1)}%` 
      : '无显著差异';
    const dataSizeReduction = traditionalSize > 0 
      ? `${((1 - optimizedSize / traditionalSize) * 100).toFixed(1)}%` 
      : '无显著差异';
    
    const result = {
      traditional: { time: traditionalTime, dataSize: traditionalSize },
      optimized: { time: optimizedTime, dataSize: optimizedSize },
      improvement: { timeImprovement, dataSizeReduction }
    };
    
    console.log('查询优化测试结果:', result);
    return result;
  },

  // 专门的测验结果保存方法，避免影响其他课时数据
  async saveQuizResult(lessonId: string, courseId: string, enrollmentId: string, quizData: {
    userAnswers: Record<string, string | string[]>;  // 修改：支持数组答案
    correctAnswers: Record<string, string | string[]>;  // 修改：支持数组答案
    score: number;
    totalQuestions: number;
    submittedAt: string;
  }): Promise<void> {
    try {
      // 检查当前用户ID（使用优化的方法，避免网络请求超时）
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('用户未登录');
      }
      
      console.log(`保存测验结果: 课时 ${lessonId}, 分数 ${quizData.score}/${quizData.totalQuestions}`);
      
      // 检查是否已存在完成记录
      const { data: existingCompletion, error: fetchError } = await supabase
        .from('lesson_completions')
        .select('id')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .maybeSingle();
        
      if (fetchError) {
        console.error('检查课时完成记录失败:', fetchError);
        throw fetchError;
      }
      
      // 如果已存在，则更新记录
      if (existingCompletion) {
        const { error: updateError } = await supabase
          .from('lesson_completions')
          .update({
            completed_at: new Date().toISOString(),
            score: quizData.score,
            data: quizData
          })
          .eq('id', existingCompletion.id);
          
        if (updateError) {
          console.error('更新测验完成记录失败:', updateError);
          throw updateError;
        }
        
        console.log('已更新现有的测验完成记录');
      } else {
        // 如果不存在，则创建新记录
        const { error: insertError } = await supabase
          .from('lesson_completions')
          .insert({
            user_id: user.id,
            lesson_id: lessonId,
            course_id: courseId,
            enrollment_id: enrollmentId,
            completed_at: new Date().toISOString(),
            score: quizData.score,
            data: quizData
          });
          
        if (insertError) {
          console.error('创建测验完成记录失败:', insertError);
          throw insertError;
        }
        
        console.log('已创建新的测验完成记录');
      }
      
      // 更新本地缓存状态（不刷新整个课程数据）
      if (!lessonCompletionCache[courseId]) {
        lessonCompletionCache[courseId] = {};
      }
      lessonCompletionCache[courseId][lessonId] = true;
      
      console.log('测验结果保存成功，已更新本地缓存');
      
    } catch (error) {
      console.error('保存测验结果失败:', error);
      throw error;
    }
  },
};
