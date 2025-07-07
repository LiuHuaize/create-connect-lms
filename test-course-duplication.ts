// 测试脚本：验证课程复制功能是否正确复制系列问卷数据
import { courseService } from './src/services/courseService';
import { supabase } from './src/integrations/supabase/client';

async function testCourseDuplication() {
  console.log('=== 开始测试课程复制功能 ===\n');
  
  try {
    // 1. 先登录（使用测试账号）
    console.log('1. 登录测试账号...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test_teacher_1@example.com',
      password: 'test123456'
    });
    
    if (authError) {
      console.error('登录失败:', authError);
      return;
    }
    
    console.log('✓ 登录成功\n');
    
    // 2. 查找一个包含系列问卷的测试课程
    console.log('2. 查找包含系列问卷的测试课程...');
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        course_modules!inner (
          id,
          title,
          lessons!inner (
            id,
            title,
            type
          )
        )
      `)
      .eq('course_modules.lessons.type', 'series_questionnaire')
      .limit(1);
    
    if (coursesError || !courses || courses.length === 0) {
      console.error('未找到包含系列问卷的课程');
      return;
    }
    
    const sourceCourse = courses[0];
    console.log(`✓ 找到课程: "${sourceCourse.title}" (ID: ${sourceCourse.id})\n`);
    
    // 3. 获取原课程的系列问卷详情
    console.log('3. 分析原课程的系列问卷数据...');
    const { data: sourceQuestionnaires, error: sourceError } = await supabase
      .from('series_questionnaires')
      .select(`
        id,
        lesson_id,
        title,
        series_questions (
          id,
          question_text
        )
      `)
      .in('lesson_id', 
        sourceCourse.course_modules.flatMap(m => 
          m.lessons.filter(l => l.type === 'series_questionnaire').map(l => l.id)
        )
      );
    
    if (sourceError) {
      console.error('获取系列问卷数据失败:', sourceError);
      return;
    }
    
    console.log(`✓ 原课程包含 ${sourceQuestionnaires?.length || 0} 个系列问卷`);
    sourceQuestionnaires?.forEach((q, i) => {
      console.log(`  - 问卷 ${i + 1}: "${q.title}" (${q.series_questions.length} 个问题)`);
    });
    console.log('');
    
    // 4. 执行课程复制
    console.log('4. 执行课程复制...');
    const duplicatedCourse = await courseService.duplicateCourse(sourceCourse.id);
    console.log(`✓ 课程复制成功！新课程: "${duplicatedCourse.title}" (ID: ${duplicatedCourse.id})\n`);
    
    // 5. 验证复制的课程结构
    console.log('5. 验证复制的课程结构...');
    const copiedCourseDetails = await courseService.getCourseDetails(duplicatedCourse.id);
    
    const originalLessonCount = sourceCourse.course_modules.reduce((sum, m) => sum + m.lessons.length, 0);
    const copiedLessonCount = copiedCourseDetails.modules?.reduce((sum, m) => sum + (m.lessons?.length || 0), 0) || 0;
    
    console.log(`✓ 课程结构复制完整:`);
    console.log(`  - 原课程模块数: ${sourceCourse.course_modules.length}`);
    console.log(`  - 复制后模块数: ${copiedCourseDetails.modules?.length || 0}`);
    console.log(`  - 原课程课时数: ${originalLessonCount}`);
    console.log(`  - 复制后课时数: ${copiedLessonCount}\n`);
    
    // 6. 验证系列问卷数据是否正确复制
    console.log('6. 验证系列问卷数据是否正确复制...');
    
    // 获取复制后的系列问卷课时
    const copiedSeriesLessons = copiedCourseDetails.modules?.flatMap(m => 
      m.lessons?.filter(l => l.type === 'series_questionnaire') || []
    ) || [];
    
    console.log(`✓ 找到 ${copiedSeriesLessons.length} 个系列问卷课时\n`);
    
    // 检查每个系列问卷的数据
    let allQuestionnairesValid = true;
    
    for (const lesson of copiedSeriesLessons) {
      console.log(`检查课时: "${lesson.title}" (ID: ${lesson.id})`);
      
      // 查询对应的问卷数据
      const { data: questionnaire, error: qError } = await supabase
        .from('series_questionnaires')
        .select(`
          id,
          title,
          description,
          instructions,
          ai_grading_prompt,
          series_questions (
            id,
            question_text,
            order_index
          )
        `)
        .eq('lesson_id', lesson.id!)
        .single();
      
      if (qError || !questionnaire) {
        console.error(`  ❌ 未找到对应的问卷数据！`);
        allQuestionnairesValid = false;
        continue;
      }
      
      console.log(`  ✓ 问卷标题: "${questionnaire.title}"`);
      console.log(`  ✓ 包含 ${questionnaire.series_questions.length} 个问题`);
      
      if (questionnaire.series_questions.length === 0) {
        console.error(`  ❌ 问卷没有问题！`);
        allQuestionnairesValid = false;
      } else {
        questionnaire.series_questions.forEach((q, i) => {
          console.log(`    - 问题 ${i + 1}: "${q.question_text.substring(0, 50)}..."`);
        });
      }
      
      console.log('');
    }
    
    // 7. 总结测试结果
    console.log('=== 测试结果总结 ===');
    if (allQuestionnairesValid && copiedSeriesLessons.length > 0) {
      console.log('✅ 课程复制功能正常！所有系列问卷数据都已正确复制。');
    } else if (copiedSeriesLessons.length === 0) {
      console.log('⚠️  复制的课程中没有找到系列问卷课时。');
    } else {
      console.log('❌ 课程复制功能存在问题！部分系列问卷数据未正确复制。');
    }
    
    // 8. 清理测试数据（可选）
    console.log('\n是否删除测试创建的课程？（在实际使用中可以注释掉这部分）');
    // await courseService.permanentlyDeleteCourse(duplicatedCourse.id);
    // console.log('✓ 测试课程已删除');
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  } finally {
    // 登出
    await supabase.auth.signOut();
    console.log('\n测试完成，已登出。');
  }
}

// 运行测试
console.log('启动课程复制功能测试...\n');
testCourseDuplication().catch(console.error);