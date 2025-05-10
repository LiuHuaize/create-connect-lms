import { supabase } from "@/integrations/supabase/client";
import { Course, CourseModule, CourseStatus } from "@/types/course";
import { Lesson, LessonContent, LessonType } from "@/types/course";
import { Json } from "@/integrations/supabase/types";
import { Database } from '@/types/database.types';
import { v4 as uuidv4 } from 'uuid';

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
      console.log(`开始获取课程详情 (优化版本): ${courseId}`);
      
      // 获取课程基本信息
      const courseData = await this.getCourseBasicInfo(courseId);
      
      // 获取课程模块 - 不包含课时，先获取模块结构
      const modulesData = await this.getCourseModules(courseId);

      // 如果没有模块，直接返回课程信息
      if (!modulesData || modulesData.length === 0) {
        console.timeEnd('getCourseDetails');
        console.log(`课程 ${courseId} 没有模块，直接返回`);
        return {
          ...courseData,
          modules: []
        };
      }

      // 性能优化：批量获取所有模块的课时，而不是逐个获取
      // 1. 收集所有模块ID
      const moduleIds = modulesData.map(module => module.id!).filter(Boolean);
      console.log(`批量获取 ${moduleIds.length} 个模块的课时数据`);
      
      // 2. 批量获取所有课时
      const allLessonsByModuleId = await this.getModuleLessonsBatch(moduleIds);
      
      // 3. 将课时数据分配给相应的模块
      const modulesWithLessons = modulesData.map(module => {
        return {
          ...module,
          lessons: module.id ? allLessonsByModuleId[module.id] || [] : []
        };
      });

      console.timeEnd('getCourseDetails'); // 性能计时结束
      console.log(`课程详情获取完成，包含 ${modulesWithLessons.length} 个模块`);
      
      return {
        ...courseData,
        modules: modulesWithLessons as CourseModule[]
      };
    } catch (error) {
      console.error('获取课程详情时出错:', error);
      console.timeEnd('getCourseDetails'); // 确保在发生异常时也能结束计时器
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

  // 保存模块内课时顺序
  async saveModuleLessonsOrder(moduleId: string, courseId: string, lessons: Lesson[]): Promise<void> {
    try {
      // 检查当前用户ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('用户未登录');
      }
      
      console.log(`开始保存模块 ${moduleId} 的课时顺序`, lessons);
      
      // 准备课时数据，确保order_index正确
      const lessonsToSave = lessons.map((lesson, index) => ({
        ...lesson,
        module_id: moduleId,
        order_index: index,
        content: typeof lesson.content === 'object' ? JSON.stringify(lesson.content) : lesson.content
      }));
      
      // 准备请求数据
      const requestData = {
        moduleId,
        courseId,
        lessons: lessonsToSave,
        idempotencyKey: uuidv4(),
        requesterId: user.id
      };
      
      console.log('发送保存课时顺序请求:', {
        moduleId,
        courseId,
        lessonsCount: lessonsToSave.length,
        requesterId: user.id
      });
      
      // 调用Edge Function
      const { data, error } = await supabase.functions.invoke('save-lessons', {
        body: requestData
      });
      
      if (error) {
        console.error('保存课时顺序失败:', error);
        throw error;
      }
      
      console.log('课时顺序保存成功:', data);
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
        .eq("module_id", sourceModuleId)
        .is("deleted_at", null);
      
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
      
      // 1. 获取课程的所有模块
      const { data: modules, error: modulesError } = await supabase
        .from("course_modules")
        .select("id")
        .eq("course_id", courseId);
        
      if (modulesError) {
        console.error('获取课程模块失败:', modulesError);
        throw modulesError;
      }
      
      // 2. 如果有模块，则删除每个模块下的课时和资源
      if (modules && modules.length > 0) {
        const moduleIds = modules.map(m => m.id);
        
        // 删除所有课时
        const { error: lessonsError } = await supabase
          .from("lessons")
          .delete()
          .in("module_id", moduleIds);
          
        if (lessonsError) {
          console.error('删除课时失败:', lessonsError);
          throw lessonsError;
        }
        
        // 删除所有资源
        try {
          const { error: resourcesError } = await supabase
            .from("course_resources")
            .delete()
            .in("module_id", moduleIds);
            
          if (resourcesError) {
            console.error('删除资源失败:', resourcesError);
            // 继续执行，不中断流程
          }
        } catch (e) {
          console.error('删除资源过程中出错:', e);
          // 继续执行，不中断流程
        }
        
        // 删除所有模块
        const { error: modulesDeleteError } = await supabase
          .from("course_modules")
          .delete()
          .in("id", moduleIds);
          
        if (modulesDeleteError) {
          console.error('删除模块失败:', modulesDeleteError);
          throw modulesDeleteError;
        }
      }
      
      // 3. 删除课程完成记录
      try {
        const { error: completionsError } = await supabase
          .from("lesson_completions")
          .delete()
          .eq("course_id", courseId);
          
        if (completionsError) {
          console.error('删除课程完成记录失败:', completionsError);
          // 继续执行，不中断流程
        }
      } catch (e) {
        console.error('删除课程完成记录过程中出错:', e);
        // 继续执行，不中断流程
      }
      
      // 4. 最后删除课程本身
      const { error: courseError } = await supabase
        .from("courses")
        .delete()
        .eq("id", courseId);
        
      if (courseError) {
        console.error('删除课程失败:', courseError);
        throw courseError;
      }
      
      console.log(`课程 ${courseId} 及其关联内容已被永久删除`);
    } catch (error) {
      console.error('永久删除课程过程中出错:', error);
      throw error;
    }
  },
};
