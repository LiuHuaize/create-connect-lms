import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ooyklqqgnphynyrziqyh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9veWtscXFnbnBoeW55cnppcXloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1NzkyNDgsImV4cCI6MjA1OTE1NTI0OH0.d4Awen-9PnzlZTP51TpjjBkhrI3Dog4YELcbGlQs8jE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAssignmentQuery() {
  try {
    console.log('测试获取作业提交列表...');
    
    // 先尝试简单查询
    const { data, error } = await supabase
      .from('assignment_submissions')
      .select('*')
      .limit(5);

    if (error) {
      console.error('查询出错:', error);
      return;
    }

    console.log('简单查询成功，获取到数据:');
    if (data && data.length > 0) {
      console.log(`找到 ${data.length} 条提交记录`);
      
      for (const submission of data) {
        console.log(`\n提交 ID: ${submission.id}`);
        console.log(`学生 ID: ${submission.student_id}`);
        console.log(`课时 ID: ${submission.lesson_id}`);
        console.log(`提交时间: ${submission.submitted_at}`);
        
        // 获取对应的课时信息
        const { data: lesson, error: lessonError } = await supabase
          .from('lessons')
          .select('id, title, type, module_id')
          .eq('id', submission.lesson_id)
          .single();
          
        if (!lessonError && lesson) {
          console.log(`课时标题: ${lesson.title}`);
          console.log(`课时类型: ${lesson.type}`);
          console.log(`模块 ID: ${lesson.module_id}`);
          
          // 获取模块信息
          const { data: module, error: moduleError } = await supabase
            .from('course_modules')
            .select('id, title, course_id')
            .eq('id', lesson.module_id)
            .single();
            
          if (!moduleError && module) {
            console.log(`模块标题: ${module.title}`);
            console.log(`课程 ID: ${module.course_id}`);
          }
        }
      }
      
      console.log('\n现在测试带连接的查询...');
      
      // 测试带连接的查询
      const { data: joinData, error: joinError } = await supabase
        .from('assignment_submissions')
        .select(`
          *,
          lessons (
            id, 
            title, 
            module_id,
            type
          )
        `)
        .limit(3);

      if (joinError) {
        console.error('连接查询出错:', joinError);
      } else {
        console.log('连接查询成功，获取到数据:');
        console.log(`找到 ${joinData?.length || 0} 条记录`);
        joinData?.forEach((submission, index) => {
          console.log(`\n连接查询 ${index + 1}:`);
          console.log('  ID:', submission.id);
          console.log('  课时标题:', submission.lessons?.title);
          console.log('  课时类型:', submission.lessons?.type);
        });
      }
      
    } else {
      console.log('没有找到任何作业提交数据');
    }
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

testAssignmentQuery(); 