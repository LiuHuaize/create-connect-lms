import { supabase } from '@/integrations/supabase/client';
import { AssignmentSubmission } from '@/types/course';

export interface TeacherGrading {
  score: number;
  feedback: string;
  timestamp: string;
}

export interface AIGrading {
  score: number;
  feedback: string;
  timestamp: string;
}

// 获取特定课时的所有学生提交
export async function getSubmissionsByLessonId(lessonId: string) {
  try {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .select(`
        *,
        lessons!inner (
          id, 
          title, 
          module_id
        )
      `)
      .eq('lesson_id', lessonId)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    
    // 获取学生用户名信息
    if (data && data.length > 0) {
      const studentIds = [...new Set(data.map(submission => submission.student_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', studentIds);
      
      if (profilesError) {
        console.warn('获取用户配置文件失败:', profilesError);
      }
      
      // 合并数据
      const enrichedData = data.map(submission => ({
        ...submission,
        profiles: profiles?.find(profile => profile.id === submission.student_id)
      }));
      
      return enrichedData;
    }
    
    return data;
  } catch (error) {
    console.error('获取作业提交列表失败:', error);
    throw error;
  }
}

// 获取特定课程的所有学生提交
export async function getSubmissionsByCourseId(courseId: string) {
  try {
    // 首先获取该课程下所有课时的ID
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select(`
        id,
        title,
        module_id,
        type,
        course_modules!inner (
          id,
          title,
          course_id
        )
      `)
      .eq('course_modules.course_id', courseId);

    if (lessonsError) throw lessonsError;

    if (!lessons || lessons.length === 0) {
      return []; // 如果没有课时，返回空数组
    }

    const lessonIds = lessons.map(lesson => lesson.id);

    // 然后获取这些课时的所有提交
    const { data, error } = await supabase
      .from('assignment_submissions')
      .select('*')
      .in('lesson_id', lessonIds)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    
    // 获取学生用户名信息
    if (data && data.length > 0) {
      const studentIds = [...new Set(data.map(submission => submission.student_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', studentIds);
      
      if (profilesError) {
        console.warn('获取用户配置文件失败:', profilesError);
      }
      
      // 合并数据，添加课时信息
      const enrichedData = data.map(submission => {
        const lesson = lessons.find(l => l.id === submission.lesson_id);
        return {
          ...submission,
          profiles: profiles?.find(profile => profile.id === submission.student_id),
          lessons: lesson ? {
            id: lesson.id,
            title: lesson.title,
            module_id: lesson.module_id,
            type: lesson.type
          } : null
        };
      });
      
      return enrichedData;
    }
    
    return data;
  } catch (error) {
    console.error('获取作业提交列表失败:', error);
    throw error;
  }
}

// 获取单个提交详情
export async function getSubmissionById(submissionId: string) {
  try {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .select(`
        *,
        lessons!inner (
          id, 
          title, 
          module_id
        )
      `)
      .eq('id', submissionId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('获取作业提交详情失败:', error);
    throw error;
  }
}

// 教师提交评分
export async function submitTeacherGrading(submissionId: string, grading: TeacherGrading) {
  try {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .update({
        teacher_grading: grading as any,
        updated_at: new Date().toISOString()
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('提交教师评分失败:', error);
    throw error;
  }
}

// 获取未评分的作业数量
export async function getUngradeSubmissionsCount(courseId: string) {
  try {
    // 首先获取该课程下所有课时的ID
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select(`
        id,
        course_modules!inner (
          course_id
        )
      `)
      .eq('course_modules.course_id', courseId);

    if (lessonsError) throw lessonsError;

    if (!lessons || lessons.length === 0) {
      return 0;
    }

    const lessonIds = lessons.map(lesson => lesson.id);

    const { count, error } = await supabase
      .from('assignment_submissions')
      .select('id', { count: 'exact' })
      .in('lesson_id', lessonIds)
      .is('teacher_grading', null);

    if (error) throw error;
    return count;
  } catch (error) {
    console.error('获取未评分作业数量失败:', error);
    throw error;
  }
}

// 提交 AI 评分结果
export async function submitAIGrading(submissionId: string, grading: AIGrading) {
  try {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .update({
        ai_grading: grading as any,
        updated_at: new Date().toISOString()
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('提交AI评分失败:', error);
    throw error;
  }
} 