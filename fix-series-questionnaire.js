/**
 * 修复系列问答数据丢失问题的可执行脚本
 * 使用方法：node fix-series-questionnaire.js
 */

import { createClient } from '@supabase/supabase-js';

// Supabase配置
const supabaseUrl = 'https://ooyklqqgnphynyrziqyh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9veWtscXFnbnBoeW55cnppcXloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1NzkyNDgsImV4cCI6MjA1OTE1NTI0OH0.d4Awen-9PnzlZTP51TpjjBkhrI3Dog4YELcbGlQs8jE';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * 检查是否为复制的课程
 */
function isCopiedCourse(courseTitle, createdAt) {
  return courseTitle.includes('副本') || courseTitle.includes('(副本)') || courseTitle.includes('copy');
}

/**
 * 根据课程标题查找原始课程
 */
async function findOriginalCourse(copiedCourseTitle) {
  // 移除标题中的副本标识
  const originalTitle = copiedCourseTitle
    .replace(/\s*\(副本\)\s*$/, '')
    .replace(/\s*副本\s*$/, '')
    .replace(/\s*\(copy\)\s*$/i, '')
    .replace(/\s*copy\s*$/i, '')
    .trim();

  const { data: courses, error } = await supabase
    .from('courses')
    .select('id, title, created_at')
    .ilike('title', originalTitle)
    .order('created_at', { ascending: true });

  if (error || !courses || courses.length === 0) {
    return null;
  }

  return courses[0].id;
}

/**
 * 获取原始课程中对应的系列问答课时
 */
async function findOriginalSeriesQuestionnaire(originalCourseId, lessonTitle, moduleOrder) {
  const { data: lessons, error } = await supabase
    .from('lessons')
    .select(`
      id,
      title,
      content,
      type,
      course_modules!inner(
        course_id,
        order_index
      )
    `)
    .eq('course_modules.course_id', originalCourseId)
    .eq('type', 'series_questionnaire')
    .eq('title', lessonTitle)
    .eq('course_modules.order_index', moduleOrder);

  if (error || !lessons || lessons.length === 0) {
    return null;
  }

  return lessons[0];
}

/**
 * 修复单个系列问答课时
 */
async function fixSeriesQuestionnaireLesson(lessonId, questionsData) {
  try {
    // 获取当前课时的content
    const { data: currentLesson, error: fetchError } = await supabase
      .from('lessons')
      .select('content')
      .eq('id', lessonId)
      .single();

    if (fetchError || !currentLesson) {
      console.error(`获取课时 ${lessonId} 失败:`, fetchError);
      return false;
    }

    // 更新content，保留其他字段，只更新questions数组
    const updatedContent = {
      ...currentLesson.content,
      questions: questionsData
    };

    const { error: updateError } = await supabase
      .from('lessons')
      .update({ 
        content: updatedContent,
        updated_at: new Date().toISOString()
      })
      .eq('id', lessonId);

    if (updateError) {
      console.error(`更新课时 ${lessonId} 失败:`, updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`修复课时 ${lessonId} 时出错:`, error);
    return false;
  }
}

/**
 * 主修复函数
 */
async function fixSeriesQuestionnaireData() {
  const result = {
    totalChecked: 0,
    problemsFound: 0,
    fixed: 0,
    errors: []
  };

  try {
    console.log('🔍 开始检查系列问答数据...');

    // 1. 查找所有系列问答类型的课时
    console.log('正在查询系列问答课时...');
    const { data: lessons, error } = await supabase
      .from('lessons')
      .select(`
        id,
        title,
        type,
        content,
        order_index,
        course_modules!inner(
          title,
          order_index,
          courses!inner(
            id,
            title,
            created_at
          )
        )
      `)
      .eq('type', 'series_questionnaire');

    if (error) {
      console.error('❌ 查询课时失败:', error);
      result.errors.push(`查询课时失败: ${error.message}`);
      return result;
    }

    if (!lessons || lessons.length === 0) {
      console.log('✅ 没有找到系列问答课时');
      return result;
    }

    console.log(`📊 找到 ${lessons.length} 个系列问答课时`);

    // 2. 检查每个课时
    for (const lesson of lessons) {
      result.totalChecked++;
      
      const courseInfo = lesson.course_modules.courses;
      const moduleInfo = lesson.course_modules;
      
      console.log(`\n🔎 检查课时: ${lesson.title} (课程: ${courseInfo.title})`);

      // 检查是否为问题课时（questions数组为空或不存在）
      const questions = lesson.content?.questions || [];
      const isProblematic = questions.length === 0;

      if (!isProblematic) {
        console.log(`✅ 课时正常，包含 ${questions.length} 个问题`);
        continue;
      }

      // 检查是否为复制的课程
      if (!isCopiedCourse(courseInfo.title, courseInfo.created_at)) {
        console.log(`⚠️  课时 "${lesson.title}" 问题数据为空，但不是复制的课程，跳过`);
        continue;
      }

      result.problemsFound++;
      console.log(`🚨 发现问题课时: "${lesson.title}" (questions数组为空)`);

      // 3. 查找原始课程
      const originalCourseId = await findOriginalCourse(courseInfo.title);
      if (!originalCourseId) {
        const errorMsg = `未找到课程 "${courseInfo.title}" 的原始版本`;
        console.log(`❌ ${errorMsg}`);
        result.errors.push(errorMsg);
        continue;
      }

      console.log(`🎯 找到原始课程 ID: ${originalCourseId}`);

      // 4. 查找原始课程中对应的系列问答课时
      const originalLesson = await findOriginalSeriesQuestionnaire(
        originalCourseId,
        lesson.title,
        moduleInfo.order_index
      );

      if (!originalLesson) {
        const errorMsg = `未找到原始课程中对应的课时 "${lesson.title}"`;
        console.log(`❌ ${errorMsg}`);
        result.errors.push(errorMsg);
        continue;
      }

      const originalQuestions = originalLesson.content?.questions || [];
      if (originalQuestions.length === 0) {
        const errorMsg = `原始课时 "${lesson.title}" 的questions数组也为空`;
        console.log(`⚠️  ${errorMsg}`);
        result.errors.push(errorMsg);
        continue;
      }

      console.log(`📝 原始课时包含 ${originalQuestions.length} 个问题，开始修复...`);

      // 5. 修复问题课时
      const fixed = await fixSeriesQuestionnaireLesson(lesson.id, originalQuestions);
      if (fixed) {
        result.fixed++;
        console.log(`✅ 成功修复课时 "${lesson.title}"，恢复了 ${originalQuestions.length} 个问题`);
      } else {
        const errorMsg = `修复课时 "${lesson.title}" 失败`;
        console.log(`❌ ${errorMsg}`);
        result.errors.push(errorMsg);
      }
    }

    console.log('\n📊 修复完成统计:');
    console.log(`- 总共检查: ${result.totalChecked} 个课时`);
    console.log(`- 发现问题: ${result.problemsFound} 个课时`);
    console.log(`- 成功修复: ${result.fixed} 个课时`);
    console.log(`- 错误数量: ${result.errors.length} 个`);

    if (result.errors.length > 0) {
      console.log('\n❌ 错误详情:');
      result.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

  } catch (error) {
    const errorMsg = `修复过程中发生异常: ${error}`;
    console.error(errorMsg);
    result.errors.push(errorMsg);
  }

  return result;
}

// 执行修复脚本
fixSeriesQuestionnaireData()
  .then(result => {
    console.log('\n🎉 修复脚本执行完成!');
    process.exit(result.errors.length > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('❌ 修复脚本执行失败:', error);
    process.exit(1);
  });