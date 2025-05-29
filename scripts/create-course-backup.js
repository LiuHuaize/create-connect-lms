import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ooyklqqgnphynyrziqyh.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9veWtscXFnbnBoeW55cnppcXloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzU3OTI0OCwiZXhwIjoyMDU5MTU1MjQ4fQ.pJyt_oK9CfWaj14sJQt0oRFJ1wOTyeyFWKt95Z7XGz8';

const supabase = createClient(supabaseUrl, serviceRoleKey);

/**
 * 创建课程的完整备份
 */
async function createCourseBackup(courseId, reason = '手动备份') {
  console.log(`🔄 开始为课程 ${courseId} 创建备份...`);
  
  try {
    // 获取课程基本信息
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();
      
    if (courseError) {
      console.error('❌ 获取课程信息失败:', courseError);
      return false;
    }
    
    console.log(`📋 课程标题: ${course.title}`);
    
    // 获取课程模块和课时数据
    const { data: modules, error: modulesError } = await supabase
      .from('course_modules')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index');
      
    if (modulesError) {
      console.error('❌ 获取模块信息失败:', modulesError);
      return false;
    }
    
    console.log(`📄 找到 ${modules.length} 个模块`);
    
    // 为每个模块获取课时数据
    const modulesWithLessons = [];
    let totalLessons = 0;
    let totalImages = 0;
    
    for (const module of modules) {
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('module_id', module.id)
        .order('order_index');
        
      if (lessonsError) {
        console.error(`❌ 获取模块 ${module.title} 的课时失败:`, lessonsError);
        continue;
      }
      
      // 统计课时中的图片数量
      const moduleImageCount = lessons.reduce((count, lesson) => {
        if (lesson.content && typeof lesson.content === 'object') {
          const contentStr = JSON.stringify(lesson.content);
          const imageMatches = contentStr.match(/supabase\.co\/storage/g);
          return count + (imageMatches ? imageMatches.length : 0);
        }
        return count;
      }, 0);
      
      totalLessons += lessons.length;
      totalImages += moduleImageCount;
      
      modulesWithLessons.push({
        module: module,
        lessons: lessons,
        lesson_count: lessons.length,
        image_count: moduleImageCount
      });
      
      console.log(`  📚 模块: ${module.title} (${lessons.length} 课时, ${moduleImageCount} 图片)`);
    }
    
    // 创建备份记录
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupLabel = `manual_backup_${timestamp}`;
    
    const { data: backup, error: backupError } = await supabase
      .from('course_backups')
      .insert({
        user_id: course.author_id,
        course_id: courseId,
        label: backupLabel,
        description: `${reason} - 完整课程数据备份`,
        version: Math.floor(Date.now() / 1000), // 使用时间戳作为版本号
        is_auto_backup: false,
        data: {
          backup_timestamp: new Date().toISOString(),
          backup_reason: reason,
          course_title: course.title,
          total_modules: modules.length,
          total_lessons: totalLessons,
          total_images: totalImages,
          backup_type: 'complete_course_data'
        },
        course_data: course,
        modules_data: modulesWithLessons
      })
      .select()
      .single();
      
    if (backupError) {
      console.error('❌ 创建备份记录失败:', backupError);
      return false;
    }
    
    console.log('\n✅ 备份创建成功!');
    console.log(`📦 备份ID: ${backup.id}`);
    console.log(`🏷️  备份标签: ${backup.label}`);
    console.log(`📊 备份统计:`);
    console.log(`   - 模块数量: ${modules.length}`);
    console.log(`   - 课时数量: ${totalLessons}`);
    console.log(`   - 图片数量: ${totalImages}`);
    console.log(`   - 创建时间: ${backup.created_at}`);
    
    return backup;
    
  } catch (error) {
    console.error('❌ 备份过程出错:', error);
    return false;
  }
}

/**
 * 列出所有备份
 */
async function listBackups(courseId = null) {
  console.log('📋 查看备份列表...\n');
  
  let query = supabase
    .from('course_backups')
    .select('id, label, description, created_at, version, is_auto_backup, data')
    .order('created_at', { ascending: false });
    
  if (courseId) {
    query = query.eq('course_id', courseId);
  }
  
  const { data: backups, error } = await query;
  
  if (error) {
    console.error('❌ 获取备份列表失败:', error);
    return;
  }
  
  if (backups.length === 0) {
    console.log('📭 没有找到备份记录');
    return;
  }
  
  console.log(`找到 ${backups.length} 个备份:\n`);
  
  backups.forEach((backup, index) => {
    console.log(`${index + 1}. ${backup.label}`);
    console.log(`   📝 描述: ${backup.description}`);
    console.log(`   📅 创建时间: ${backup.created_at}`);
    console.log(`   🔖 版本: ${backup.version}`);
    console.log(`   🤖 自动备份: ${backup.is_auto_backup ? '是' : '否'}`);
    if (backup.data && backup.data.total_lessons) {
      console.log(`   📊 包含: ${backup.data.total_modules} 模块, ${backup.data.total_lessons} 课时`);
    }
    console.log('');
  });
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'list') {
    const courseId = args[1];
    await listBackups(courseId);
  } else if (command === 'create') {
    const courseId = args[1] || '1e34037f-4aef-4fe5-9a6b-3e46b5498e9c'; // 默认狗狗课程
    const reason = args[2] || '手动备份';
    await createCourseBackup(courseId, reason);
  } else {
    console.log('📖 使用说明:');
    console.log('');
    console.log('创建备份:');
    console.log('  node scripts/create-course-backup.js create [课程ID] [备份原因]');
    console.log('');
    console.log('查看备份:');
    console.log('  node scripts/create-course-backup.js list [课程ID]');
    console.log('');
    console.log('示例:');
    console.log('  node scripts/create-course-backup.js create 1e34037f-4aef-4fe5-9a6b-3e46b5498e9c "新功能发布前备份"');
    console.log('  node scripts/create-course-backup.js list');
  }
}

main().catch(console.error); 