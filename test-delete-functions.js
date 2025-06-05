// 测试删除功能修复的脚本
// 在浏览器控制台中运行此脚本来验证修复

async function testDeleteFunctions() {
  console.log('🔧 开始测试删除功能修复...\n');
  
  try {
    // 获取当前用户
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ 用户未登录');
      return;
    }
    
    console.log('✅ 用户已登录:', user.id);
    
    // 测试1: 检查delete_lesson函数参数
    console.log('\n📝 测试1: 检查delete_lesson函数参数...');
    try {
      // 创建一个测试课时ID（不会真正删除，因为ID不存在）
      const testLessonId = '00000000-0000-0000-0000-000000000000';
      
      const { data, error } = await supabase.rpc('delete_lesson', {
        p_lesson_id: testLessonId,
        p_user_id: user.id
      });
      
      if (error) {
        if (error.code === 'PGRST202') {
          console.error('❌ 参数名仍然不匹配:', error.message);
        } else {
          console.log('✅ 参数名正确，函数可以调用（返回false是正常的，因为测试ID不存在）');
        }
      } else {
        console.log('✅ delete_lesson函数调用成功，返回:', data);
      }
    } catch (error) {
      console.error('❌ delete_lesson测试失败:', error);
    }
    
    // 测试2: 检查delete_module函数参数
    console.log('\n📝 测试2: 检查delete_module函数参数...');
    try {
      const testModuleId = '00000000-0000-0000-0000-000000000000';
      
      const { data, error } = await supabase.rpc('delete_module', {
        p_module_id: testModuleId,
        p_user_id: user.id
      });
      
      if (error) {
        if (error.code === 'PGRST202') {
          console.error('❌ 参数名仍然不匹配:', error.message);
        } else {
          console.log('✅ 参数名正确，函数可以调用（返回false是正常的，因为测试ID不存在）');
        }
      } else {
        console.log('✅ delete_module函数调用成功，返回:', data);
      }
    } catch (error) {
      console.error('❌ delete_module测试失败:', error);
    }
    
    // 测试3: 检查delete_course函数参数
    console.log('\n📝 测试3: 检查delete_course函数参数...');
    try {
      const testCourseId = '00000000-0000-0000-0000-000000000000';
      
      const { data, error } = await supabase.rpc('delete_course', {
        p_course_id: testCourseId,
        p_user_id: user.id
      });
      
      if (error) {
        if (error.code === 'PGRST202') {
          console.error('❌ 参数名仍然不匹配:', error.message);
        } else {
          console.log('✅ 参数名正确，函数可以调用（返回false是正常的，因为测试ID不存在）');
        }
      } else {
        console.log('✅ delete_course函数调用成功，返回:', data);
      }
    } catch (error) {
      console.error('❌ delete_course测试失败:', error);
    }
    
    // 测试4: 测试courseService中的删除方法
    console.log('\n📝 测试4: 测试courseService删除方法...');
    
    // 检查courseService是否可用
    if (typeof courseService !== 'undefined') {
      console.log('✅ courseService可用');
      
      // 测试删除课时方法（使用不存在的ID，不会真正删除）
      try {
        await courseService.deleteLesson('00000000-0000-0000-0000-000000000000');
        console.log('✅ courseService.deleteLesson方法调用成功');
      } catch (error) {
        if (error.message.includes('删除失败：可能没有权限或课时不存在')) {
          console.log('✅ courseService.deleteLesson方法正常工作（权限检查正常）');
        } else {
          console.error('❌ courseService.deleteLesson方法失败:', error.message);
        }
      }
    } else {
      console.log('⚠️ courseService不可用（可能需要在课程编辑页面测试）');
    }
    
    console.log('\n🎉 删除功能测试完成！');
    console.log('如果看到"参数名正确"的消息，说明修复成功。');
    console.log('现在可以尝试在课程编辑页面删除课时了。');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

// 运行测试
console.log('请在浏览器控制台中运行: testDeleteFunctions()');
