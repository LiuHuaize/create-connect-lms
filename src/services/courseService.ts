import { supabase } from "@/integrations/supabase/client";
import { Course, CourseModule, CourseStatus } from "@/types/course";
import { Lesson, LessonContent, LessonType } from "@/types/course";
import { Json } from "@/integrations/supabase/types";

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
        lessons: module.lessons ? module.lessons.map(convertDbLessonToLesson) : []
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

  // 标记课时为已完成并更新进度
  async markLessonComplete(lessonId: string, courseId: string, enrollmentId: string): Promise<void> {
    try {
      // 获取课程总课时数
      const { data: courseData, error: courseError } = await supabase
        .from('course_modules')
        .select(`
          id,
          lessons(id)
        `)
        .eq('course_id', courseId);
        
      if (courseError) {
        console.error('获取课程模块失败:', courseError);
        throw courseError;
      }

      // 计算总课时数
      const totalLessons = courseData.reduce((sum, module) => 
        sum + (module.lessons ? module.lessons.length : 0), 0);
      
      if (totalLessons === 0) return; // 如果没有课时，直接返回

      // 获取当前注册信息
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .select('progress')
        .eq('id', enrollmentId)
        .single();
        
      if (enrollmentError) {
        console.error('获取注册信息失败:', enrollmentError);
        throw enrollmentError;
      }
      
      // 计算新的进度
      const progressIncrement = totalLessons > 0 ? Math.round(1 / totalLessons * 100) : 0;
      const currentProgress = enrollmentData ? enrollmentData.progress || 0 : 0;
      const newProgress = Math.min(currentProgress + progressIncrement, 100);
      
      // 更新注册进度
      const { error: updateError } = await supabase
        .from('course_enrollments')
        .update({
          progress: newProgress,
          last_accessed_at: new Date().toISOString()
        })
        .eq('id', enrollmentId);
        
      if (updateError) {
        console.error('更新进度失败:', updateError);
        throw updateError;
      }
    } catch (error) {
      console.error('标记课时完成失败:', error);
      throw error;
    }
  }
};
