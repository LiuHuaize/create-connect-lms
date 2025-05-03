import { supabase } from "@/integrations/supabase/client";
import { Course, CourseModule, CourseStatus } from "@/types/course";
import { Lesson, LessonContent, LessonType } from "@/types/course";
import { Json } from "@/integrations/supabase/types";
import { Database } from '@/types/database.types';

// 全局课程完成状态缓存
export const lessonCompletionCache: Record<string, Record<string, boolean>> = {};

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
      .is("deleted_at", null) // 只获取未删除的课程
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('获取用户课程失败:', error);
      throw error;
    }
    
    return data as Course[] || [];
  },

  // 获取课程基本信息（不包括模块和课时）
  async getCourseBasicInfo(courseId: string): Promise<Course> {
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .is("deleted_at", null) // 只获取未删除的课程
      .single();

    if (error) {
      console.error('获取课程基本信息失败:', error);
      throw error;
    }
    
    return data as Course;
  },

  // 获取课程的所有模块（不包括课时）
  async getCourseModules(courseId: string): Promise<CourseModule[]> {
    const { data, error } = await supabase
      .from("course_modules")
      .select("*")
      .eq("course_id", courseId)
      .is("deleted_at", null) // 只获取未删除的模块
      .order("order_index");

    if (error) {
      console.error('获取课程模块失败:', error);
      throw error;
    }
    
    return data as CourseModule[] || [];
  },

  // 获取单个模块的所有课时
  async getModuleLessons(moduleId: string): Promise<Lesson[]> {
    const { data, error } = await supabase
      .from("lessons")
      .select("*")
      .eq("module_id", moduleId)
      .is("deleted_at", null) // 只获取未删除的课时
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

  // 获取单个课程详情（包括模块和课时）- 原始完整加载方法
  async getCourseDetails(courseId: string): Promise<Course & { modules?: CourseModule[] }> {
    try {
      console.time('getCourseDetails'); // 性能计时开始
      
      // 获取课程基本信息
      const courseData = await this.getCourseBasicInfo(courseId);
      
      // 获取课程模块 - 不包含课时，先获取模块结构
      const modulesData = await this.getCourseModules(courseId);

      // 如果没有模块，直接返回课程信息
      if (!modulesData || modulesData.length === 0) {
        console.timeEnd('getCourseDetails');
        return {
          ...courseData,
          modules: []
        };
      }

      // 获取每个模块的课时
      const modulesWithLessons = await Promise.all(
        modulesData.map(async (module) => {
          const lessonsData = await this.getModuleLessons(module.id);
          return {
            ...module,
            lessons: lessonsData
          };
        })
      );

      console.timeEnd('getCourseDetails'); // 性能计时结束
      
      return {
        ...courseData,
        modules: modulesWithLessons as CourseModule[]
      };
    } catch (error) {
      console.error('获取课程详情时出错:', error);
      throw error;
    }
  },

  // 优化版本：批量获取模块的课时
  async getModuleLessonsBatch(moduleIds: string[]): Promise<Record<string, Lesson[]>> {
    if (!moduleIds.length) return {};
    
    const { data, error } = await supabase
      .from("lessons")
      .select("*")
      .in("module_id", moduleIds)
      .is("deleted_at", null) // 只获取未删除的课时
      .order("order_index");
      
    if (error) {
      console.error(`批量获取模块课时失败:`, error);
      throw error;
    }
    
    // 按模块ID组织课时
    const lessonsByModule: Record<string, Lesson[]> = {};
    moduleIds.forEach(id => lessonsByModule[id] = []);
    
    // 转换并分组课时
    if (data && data.length > 0) {
      data.forEach(lesson => {
        const moduleId = lesson.module_id;
        if (moduleId && lessonsByModule[moduleId]) {
          lessonsByModule[moduleId].push(convertDbLessonToLesson(lesson));
        }
      });
      
      // 确保每个模块的课时都按顺序排列
      Object.keys(lessonsByModule).forEach(moduleId => {
        lessonsByModule[moduleId].sort((a, b) => a.order_index - b.order_index);
      });
    }
    
    return lessonsByModule;
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

  // 软删除课程模块
  async deleteModule(moduleId: string): Promise<void> {
    console.log(`开始软删除模块: ${moduleId}`);
    try {
      // 获取当前用户ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('用户未登录');
      }
      
      // 获取模块信息，用于存储到回收站
      const { data: moduleData, error: moduleError } = await supabase
        .from("course_modules")
        .select("title, course_id")
        .eq("id", moduleId)
        .single();
      
      if (moduleError) {
        console.error('获取模块信息失败:', moduleError);
        throw moduleError;
      }
      
      // 先获取该模块下的所有课时
      const { data: lessonsData, error: lessonsError } = await supabase
        .from("lessons")
        .select("id, title")
        .eq("module_id", moduleId)
        .is("deleted_at", null);
      
      if (lessonsError) {
        console.error('获取模块课时失败:', lessonsError);
        throw lessonsError;
      }
      
      // 如果有课时需要软删除
      if (lessonsData && lessonsData.length > 0) {
        console.log(`软删除模块 ${moduleId} 下的 ${lessonsData.length} 个课时`);
        
        const now = new Date().toISOString();
        
        // 对每个课时进行软删除
        for (const lesson of lessonsData) {
          // 更新课时为软删除状态
          const { error: updateError } = await supabase
            .from("lessons")
            .update({
              deleted_at: now,
              deleted_by: user.id
            })
            .eq("id", lesson.id);
            
          if (updateError) {
            console.error(`软删除课时 ${lesson.id} 失败:`, updateError);
            continue;
          }
          
          // 添加到回收站
          const { error: trashError } = await supabase
            .from("trash_items")
            .insert({
              item_id: lesson.id,
              item_type: 'lesson',
              item_name: lesson.title,
              deleted_by: user.id,
              course_id: moduleData.course_id,
              metadata: {
                module_id: moduleId,
                module_title: moduleData.title
              }
            });
            
          if (trashError) {
            console.error(`将课时 ${lesson.id} 添加到回收站失败:`, trashError);
          }
        }
      }
      
      // 软删除模块本身
      const { error: updateModuleError } = await supabase
        .from("course_modules")
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: user.id
        })
        .eq("id", moduleId);
      
      if (updateModuleError) {
        console.error('软删除模块失败:', updateModuleError);
        throw updateModuleError;
      }
      
      // 添加模块到回收站
      const { error: trashError } = await supabase
        .from("trash_items")
        .insert({
          item_id: moduleId,
          item_type: 'module',
          item_name: moduleData.title,
          deleted_by: user.id,
          course_id: moduleData.course_id,
          metadata: {
            lessons_count: lessonsData ? lessonsData.length : 0
          }
        });
        
      if (trashError) {
        console.error(`将模块 ${moduleId} 添加到回收站失败:`, trashError);
      }
      
      console.log(`模块 ${moduleId} 及其课时已成功软删除`);
    } catch (error) {
      console.error('软删除模块过程中出错:', error);
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
        bilibili_url: lesson.type === 'video' ? 
          (lesson.bilibili_url || (lesson.content as any).bilibiliUrl || null) : null,
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

  // 软删除课时
  async deleteLesson(lessonId: string): Promise<void> {
    console.log(`开始软删除课时: ${lessonId}`);
    try {
      // 获取当前用户ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('用户未登录');
      }
      
      // 获取课时信息，用于存储到回收站
      const { data: lessonData, error: lessonError } = await supabase
        .from("lessons")
        .select("title, module_id")
        .eq("id", lessonId)
        .single();
      
      if (lessonError) {
        console.error('获取课时信息失败:', lessonError);
        throw lessonError;
      }
      
      // 获取模块和课程信息
      const { data: moduleData, error: moduleError } = await supabase
        .from("course_modules")
        .select("title, course_id")
        .eq("id", lessonData.module_id)
        .single();
      
      if (moduleError) {
        console.error('获取模块信息失败:', moduleError);
        throw moduleError;
      }
      
      // 软删除课时
      const { error: updateError } = await supabase
        .from("lessons")
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: user.id
        })
        .eq("id", lessonId);
      
      if (updateError) {
        console.error('软删除课时失败:', updateError);
        throw updateError;
      }
      
      // 添加到回收站
      const { error: trashError } = await supabase
        .from("trash_items")
        .insert({
          item_id: lessonId,
          item_type: 'lesson',
          item_name: lessonData.title,
          deleted_by: user.id,
          course_id: moduleData.course_id,
          metadata: {
            module_id: lessonData.module_id,
            module_title: moduleData.title
          }
        });
        
      if (trashError) {
        console.error(`将课时 ${lessonId} 添加到回收站失败:`, trashError);
      }
      
      console.log(`课时 ${lessonId} 已成功软删除`);
    } catch (error) {
      console.error('软删除课时过程中出错:', error);
      throw error;
    }
  },
  
  // 从回收站恢复项目
  async restoreItem(itemId: string): Promise<string> {
    try {
      // 获取当前用户ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('用户未登录');
      }
      
      // 调用数据库函数进行恢复
      const { data, error } = await supabase
        .rpc('restore_deleted_item', {
          p_item_id: itemId
        });
      
      if (error) {
        console.error('恢复项目失败:', error);
        throw error;
      }
      
      return data || '项目已成功恢复';
    } catch (error) {
      console.error('恢复项目过程中出错:', error);
      throw error;
    }
  },
  
  // 获取回收站项目列表
  async getTrashItems(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("trash_items")
        .select("*")
        .eq("deleted_by", userId)
        .order("deleted_at", { ascending: false });
      
      if (error) {
        console.error('获取回收站项目失败:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('获取回收站项目过程中出错:', error);
      throw error;
    }
  },
  
  // 永久删除回收站中的项目（提前删除，不等待过期）
  async permanentlyDeleteItem(itemId: string): Promise<void> {
    try {
      // 获取当前用户ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('用户未登录');
      }
      
      // 获取回收站项目信息
      const { data: trashItem, error: trashError } = await supabase
        .from("trash_items")
        .select("item_id, item_type")
        .eq("item_id", itemId)
        .single();
      
      if (trashError) {
        console.error('获取回收站项目失败:', trashError);
        throw trashError;
      }
      
      // 根据项目类型执行永久删除
      let deleteError;
      
      if (trashItem.item_type === 'course') {
        const { error } = await supabase
          .from("courses")
          .delete()
          .eq("id", trashItem.item_id);
        deleteError = error;
      } else if (trashItem.item_type === 'module') {
        const { error } = await supabase
          .from("course_modules")
          .delete()
          .eq("id", trashItem.item_id);
        deleteError = error;
      } else if (trashItem.item_type === 'lesson') {
        const { error } = await supabase
          .from("lessons")
          .delete()
          .eq("id", trashItem.item_id);
        deleteError = error;
      }
      
      if (deleteError) {
        console.error('永久删除项目失败:', deleteError);
        throw deleteError;
      }
      
      // 从回收站中删除
      const { error: removeError } = await supabase
        .from("trash_items")
        .delete()
        .eq("item_id", itemId);
      
      if (removeError) {
        console.error('从回收站删除项目失败:', removeError);
        throw removeError;
      }
    } catch (error) {
      console.error('永久删除项目过程中出错:', error);
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

  // 优化的批量保存课时功能
  async saveLessonsInBatch(lessons: Lesson[], moduleId: string): Promise<Lesson[]> {
    if (!lessons || lessons.length === 0) {
      return [];
    }
    
    try {
      console.log(`批量保存 ${lessons.length} 个课时到模块 ${moduleId}`);
      
      // 准备批量保存数据，确保每个课时都有正确的模块ID
      const lessonsToSave = lessons.map(lesson => ({
        ...lesson,
        module_id: moduleId,
        content: typeof lesson.content === 'object' ? lesson.content : {},
        updated_at: new Date().toISOString()
      }));
      
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
  }
};
