
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
        course_id: module.course_id,
        title: module.title,
        order_index: module.order_index,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select("*")
      .single();

    if (error) throw error;
    return data as unknown as CourseModule;
  },

  // 添加课时
  async addLesson(lesson: Omit<Lesson, "id" | "created_at" | "updated_at">): Promise<Lesson> {
    // 确保提供了必要的属性
    if (!lesson.module_id) {
      throw new Error("Lesson must have a module_id");
    }

    const { data, error } = await supabase
      .from("lessons")
      .insert({
        module_id: lesson.module_id,
        title: lesson.title,
        type: lesson.type,
        content: lesson.content as unknown as Json,
        order_index: lesson.order_index, // This is now valid since we updated the Lesson type
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select("*")
      .single();

    if (error) throw error;
    return convertDbLessonToLesson(data);
  }
};
