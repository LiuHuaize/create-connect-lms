import { supabase } from "@/integrations/supabase/client";
import { Course, CourseModule, CourseStatus } from "@/types/course";
import { Lesson, LessonContent, LessonType } from "@/types/course";
import { Json } from "@/integrations/supabase/types";
import { Database } from '@/types/database.types';

// 全局课程完成状态缓存
export const lessonCompletionCache: Record<string, Record<string, boolean>> = {};

// 辅助函数：将Json转换为LessonContent
const convertJsonToLessonContent = (content: Json): LessonContent => {
  // 由于我们知道Json是从LessonContent序列化而来，可以安全地转换回来
  return content as unknown as LessonContent;
};

// 辅助函数：将数据库中的课时转换为前端所需的Lesson类型
const convertDbLessonToLesson = (dbLesson: any): Lesson => {
  return {
    ...dbLesson,
    content: convertJsonToLessonContent(dbLesson.content)
  } as Lesson;
};

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
      updated_at: new Date().toISOString()
    };
    
    console.log('Saving course data:', dataToSave);
    
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

  // 获取单个课程详情（包括模块和课时）
  async getCourseDetails(courseId: string): Promise<Course & { modules?: CourseModule[] }> {
    // 获取课程基本信息
    const { data: courseData, error: courseError } = await supabase
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .single();

    if (courseError) {
      console.error('获取课程详情失败:', courseError);
      throw courseError;
    }

    // 获取课程模块和课时
    const { data: modulesData, error: modulesError } = await supabase
      .from("course_modules")
      .select(`
        *,
        lessons:lessons(*)
      `)
      .eq("course_id", courseId)
      .order("order_index");

    if (modulesError) {
      console.error('获取课程模块失败:', modulesError);
      throw modulesError;
    }

    // 转换课时内容
    const modulesWithConvertedLessons = (modulesData || []).map((module: any) => {
      return {
        ...module,
        lessons: module.lessons ? module.lessons
          .map(convertDbLessonToLesson)
          // 对课时按照order_index排序
          .sort((a: Lesson, b: Lesson) => a.order_index - b.order_index) 
          : []
      };
    });

    return {
      ...(courseData as Course),
      modules: modulesWithConvertedLessons as CourseModule[]
    };
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
    
    return data as unknown as CourseModule;
  },

  // 删除课程模块
  async deleteModule(moduleId: string): Promise<void> {
    console.log(`开始删除模块: ${moduleId}`);
    try {
      // 先删除该模块下的所有课时
      const { data: lessonsData, error: lessonsError } = await supabase
        .from("lessons")
        .select("id")
        .eq("module_id", moduleId);
      
      if (lessonsError) {
        console.error('获取模块课时失败:', lessonsError);
        throw lessonsError;
      }
      
      if (lessonsData && lessonsData.length > 0) {
        console.log(`删除模块 ${moduleId} 下的 ${lessonsData.length} 个课时`);
        // 有课时需要删除
        const { error: deleteLessonsError } = await supabase
          .from("lessons")
          .delete()
          .eq("module_id", moduleId);
        
        if (deleteLessonsError) {
          console.error('删除模块课时失败:', deleteLessonsError);
          throw deleteLessonsError;
        }
      }
      
      // 然后删除模块本身
      const { error: deleteModuleError } = await supabase
        .from("course_modules")
        .delete()
        .eq("id", moduleId);
      
      if (deleteModuleError) {
        console.error('删除模块失败:', deleteModuleError);
        throw deleteModuleError;
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

    const isUpdate = Boolean(lesson.id);
    
    const { data, error } = await supabase
      .from("lessons")
      .upsert({
        id: lesson.id,
        module_id: lesson.module_id,
        title: lesson.title,
        type: lesson.type,
        content: lesson.content as unknown as Json,
        order_index: lesson.order_index,
        video_file_path: lesson.type === 'video' ? 
          (lesson.video_file_path || (lesson.content as any).videoFilePath || null) : null,
        updated_at: new Date().toISOString(),
        ...(isUpdate ? {} : { created_at: new Date().toISOString() })
      })
      .select("*")
      .single();

    if (error) {
      console.error('保存课时失败:', error);
      throw error;
    }
    
    return convertDbLessonToLesson(data);
  },

  // 删除课时
  async deleteLesson(lessonId: string): Promise<void> {
    console.log(`开始删除课时: ${lessonId}`);
    try {
      const { error } = await supabase
        .from("lessons")
        .delete()
        .eq("id", lessonId);
      
      if (error) {
        console.error('删除课时失败:', error);
        throw error;
      }
      
      console.log(`课时 ${lessonId} 已成功删除`);
    } catch (error) {
      console.error('删除课时过程中出错:', error);
      throw error;
    }
  },

  // 标记课时为已完成并更新进度
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
      }
      
      // 触发器会自动更新课程进度
    } catch (error) {
      console.error('取消标记课时完成失败:', error);
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
  }
};
