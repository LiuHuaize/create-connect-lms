
import { supabase } from "@/integrations/supabase/client";
import { Course, CourseModule, CourseStatus } from "@/types/course";
import { Lesson } from "@/types/course";

export const courseService = {
  // 创建或更新课程
  async saveCourse(course: Course): Promise<Course> {
    const { data, error } = await supabase
      .from("courses")
      .upsert({
        ...course,
        updated_at: new Date().toISOString()
      })
      .select("*")
      .single();

    if (error) throw error;
    return data as Course;
  },

  // 获取用户创建的所有课程
  async getUserCourses(userId: string): Promise<Course[]> {
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("author_id", userId);

    if (error) throw error;
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

    if (courseError) throw courseError;

    // 获取课程模块和课时
    const { data: modulesData, error: modulesError } = await supabase
      .from("course_modules")
      .select(`
        *,
        lessons:lessons(*)
      `)
      .eq("course_id", courseId)
      .order("order_index");

    if (modulesError) throw modulesError;

    return {
      ...(courseData as Course),
      modules: modulesData as CourseModule[] || []
    };
  },

  // 更新课程状态（发布/草稿/存档）
  async updateCourseStatus(courseId: string, status: CourseStatus): Promise<Course> {
    const { data, error } = await supabase
      .from("courses")
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq("id", courseId)
      .select("*")
      .single();

    if (error) throw error;
    return data as Course;
  },

  // 添加课程模块
  async addCourseModule(module: Omit<CourseModule, "id" | "created_at" | "updated_at">): Promise<CourseModule> {
    const { data, error } = await supabase
      .from("course_modules")
      .insert({
        ...module,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select("*")
      .single();

    if (error) throw error;
    return data as CourseModule;
  },

  // 添加课时
  async addLesson(lesson: Omit<Lesson, "id" | "created_at" | "updated_at">): Promise<Lesson> {
    const { data, error } = await supabase
      .from("lessons")
      .insert({
        ...lesson,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select("*")
      .single();

    if (error) throw error;
    return data as Lesson;
  }
};
