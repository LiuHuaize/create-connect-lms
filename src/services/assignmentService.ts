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
        lessons:lesson_id(id, title, module_id)
      `)
      .eq('lesson_id', lessonId)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('获取作业提交列表失败:', error);
    throw error;
  }
}

// 获取特定课程的所有学生提交
export async function getSubmissionsByCourseId(courseId: string) {
  try {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .select(`
        *,
        lessons:lesson_id(id, title, module_id, 
          modules:module_id(id, title, course_id)
        )
      `)
      .eq('lessons.modules.course_id', courseId)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
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
        lessons:lesson_id(id, title, module_id)
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
        teacher_grading: grading,
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
    const { count, error } = await supabase
      .from('assignment_submissions')
      .select('id', { count: 'exact' })
      .is('teacher_grading', null)
      .eq('lessons.modules.course_id', courseId);

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
        ai_grading: grading,
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