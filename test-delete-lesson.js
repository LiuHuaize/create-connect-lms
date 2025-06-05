// 测试删除课时功能的脚本
// 在浏览器控制台中运行此脚本来测试修复

async function testDeleteLesson() {
  try {
    console.log('开始测试删除课时功能...');
    
    // 首先获取一个课程的课时列表
    const { data: lessons, error: fetchError } = await supabase
      .from('lessons')
      .select('id, title, module_id')
      .limit(1);
    
    if (fetchError) {
      console.error('获取课时列表失败:', fetchError);
      return;
    }
    
    if (!lessons || lessons.length === 0) {
      console.log('没有找到可测试的课时');
      return;
    }
    
    const testLesson = lessons[0];
    console.log('找到测试课时:', testLesson);
    
    // 获取当前用户
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('用户未登录');
      return;
    }
    
    console.log('当前用户ID:', user.id);
    
    // 测试调用delete_lesson函数（使用正确的参数名）
    console.log('测试调用delete_lesson函数...');
    const { data, error } = await supabase.rpc('delete_lesson', {
      p_lesson_id: testLesson.id,
      p_user_id: user.id
    });
    
    if (error) {
      console.error('删除课时失败:', error);
      console.log('错误详情:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
    } else {
      console.log('删除课时成功:', data);
      console.log('注意：这只是测试调用，实际课时可能已被删除！');
    }
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

// 运行测试
console.log('请在浏览器控制台中运行: testDeleteLesson()');
