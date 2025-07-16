import { supabase } from '@/integrations/supabase/client';
import { AssignmentSubmission } from '@/types/course';
import { notificationHelpers } from './notificationService';
import { experienceSystem } from './gamificationService';

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
    
    // 获取学生用户名信息
    if (data) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('id', data.student_id)
        .single();
      
      if (profileError) {
        console.warn('获取用户配置文件失败:', profileError);
      }
      
      // 合并数据
      return {
        ...data,
        profiles: profile
      };
    }
    
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

    // 处理作业评分的gamification奖励
    try {
      if (grading.score >= 70) { // 只有达到70分以上才给予评分奖励
        const { data: lesson } = await supabase
          .from('lessons')
          .select('title, type')
          .eq('id', data.lesson_id)
          .single();

        if (lesson) {
          await experienceSystem.recordActivity(data.student_id, 'assignment_graded', {
            lessonId: data.lesson_id,
            lessonTitle: lesson.title,
            lessonType: lesson.type,
            submissionId,
            score: grading.score,
            gradingType: 'teacher',
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (gamificationError) {
      console.warn('处理作业评分gamification奖励失败:', gamificationError);
      // 不影响主流程
    }

    // 发送教师评分通知给学生
    try {
      // 获取提交详情
      const submission = await getSubmissionById(submissionId);
      if (!submission) return data;

      // 获取课程作者ID
      const { data: lesson } = await supabase
        .from('lessons')
        .select(`
          title,
          course_modules!inner (
            courses!inner (
              title,
              author_id
            )
          )
        `)
        .eq('id', submission.lesson_id)
        .single();

      if (lesson && lesson.course_modules && lesson.course_modules.courses) {
        const course = lesson.course_modules.courses;
        
        // 获取老师信息
        const { data: teacher } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', course.author_id)
          .single();

        if (teacher) {
          await notificationHelpers.notifyAssignmentGrading(
            submission.student_id,
            course.author_id,
            {
              submission_id: submissionId,
              course_id: '', // 暂时留空，可以后续完善
              lesson_id: submission.lesson_id,
              teacher_name: teacher.username || '老师',
              course_title: course.title || '课程',
              assignment_title: lesson.title || '作业',
              final_score: grading.score
            }
          );
        }
      }
    } catch (notificationError) {
      console.warn('发送教师评分通知失败:', notificationError);
      // 不影响主流程
    }

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

    // 发送AI评分通知给学生
    try {
      // 获取提交详情
      const submission = await getSubmissionById(submissionId);
      if (!submission) return data;

      // 获取课程作者ID
      const { data: lesson } = await supabase
        .from('lessons')
        .select(`
          title,
          course_modules!inner (
            courses!inner (
              title,
              author_id
            )
          )
        `)
        .eq('id', submission.lesson_id)
        .single();

      if (lesson && lesson.course_modules && lesson.course_modules.courses) {
        const course = lesson.course_modules.courses;
        
        // 获取老师信息
        const { data: teacher } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', course.author_id)
          .single();

        if (teacher) {
          await notificationHelpers.notifyAssignmentGrading(
            submission.student_id,
            course.author_id,
            {
              submission_id: submissionId,
              course_id: '', // 暂时留空，可以后续完善
              lesson_id: submission.lesson_id,
              teacher_name: teacher.username || 'AI老师',
              course_title: course.title || '课程',
              assignment_title: lesson.title || '作业',
              final_score: grading.score
            }
          );
        }
      }
    } catch (notificationError) {
      console.warn('发送AI评分通知失败:', notificationError);
      // 不影响主流程
    }

    return data;
  } catch (error) {
    console.error('提交AI评分失败:', error);
    throw error;
  }
}

// 提交作业（新增函数）
export async function submitAssignment(lessonId: string, studentId: string, fileSubmissions: any[]) {
  try {
    const now = new Date().toISOString();
    
    // 检查是否已有提交
    const { data: existingSubmission } = await supabase
      .from('assignment_submissions')
      .select('id, status')
      .eq('lesson_id', lessonId)
      .eq('student_id', studentId)
      .single();

    let submissionData;

    if (existingSubmission) {
      // 更新已有提交
      const { data, error } = await supabase
        .from('assignment_submissions')
        .update({
          file_submissions: fileSubmissions,
          status: 'submitted',
          submitted_at: now,
          updated_at: now
        })
        .eq('id', existingSubmission.id)
        .select()
        .single();

      if (error) throw error;
      submissionData = data;
    } else {
      // 创建新提交
      const { data, error } = await supabase
        .from('assignment_submissions')
        .insert({
          lesson_id: lessonId,
          student_id: studentId,
          content: JSON.stringify({}),
          file_submissions: fileSubmissions,
          status: 'submitted',
          submitted_at: now
        })
        .select()
        .single();

      if (error) throw error;
      submissionData = data;
    }

    // 处理gamification奖励
    try {
      const { data: lesson } = await supabase
        .from('lessons')
        .select(`
          title,
          type,
          course_modules!inner (
            courses!inner (
              title,
              author_id
            )
          )
        `)
        .eq('id', lessonId)
        .single();

      if (lesson) {
        // 记录作业提交活动到gamification系统
        await experienceSystem.recordActivity(studentId, 'assignment_submit', {
          lessonId,
          lessonTitle: lesson.title,
          lessonType: lesson.type,
          submissionId: submissionData.id,
          fileCount: fileSubmissions.length,
          timestamp: new Date().toISOString()
        });
      }
    } catch (gamificationError) {
      console.warn('处理作业提交gamification奖励失败:', gamificationError);
      // 不影响主流程
    }

    // 发送作业提交通知给老师
    try {
      // 获取课程信息和作者
      const { data: lesson } = await supabase
        .from('lessons')
        .select(`
          title,
          course_modules!inner (
            courses!inner (
              title,
              author_id
            )
          )
        `)
        .eq('id', lessonId)
        .single();

      if (lesson && lesson.course_modules && lesson.course_modules.courses) {
        const course = lesson.course_modules.courses;
        
        // 获取学生信息
        const { data: student } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', studentId)
          .single();

        if (student) {
          await notificationHelpers.notifyAssignmentSubmission(
            course.author_id,
            {
              submission_id: submissionData.id,
              course_id: '', // 暂时留空，可以后续完善
              lesson_id: lessonId,
              student_name: student.username || '学生',
              course_title: course.title || '课程',
              assignment_title: lesson.title || '作业'
            }
          );
        }
      }
    } catch (notificationError) {
      console.warn('发送作业提交通知失败:', notificationError);
      // 不影响主流程
    }

    return submissionData;
  } catch (error) {
    console.error('提交作业失败:', error);
    throw error;
  }
} 