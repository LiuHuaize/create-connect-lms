import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixImageUrls() {
  console.log('开始修复图片URL...');
  
  try {
    // 1. 获取所有包含错误URL的frame类型课程
    const { data: lessons, error: fetchError } = await supabase
      .from('lessons')
      .select('id, title, content')
      .eq('type', 'frame')
      .like('content', '%course-assets/frame-lessons%');

    if (fetchError) {
      console.error('获取课程数据失败:', fetchError);
      return;
    }

    console.log(`找到 ${lessons.length} 个需要修复的课程`);

    let successCount = 0;
    let errorCount = 0;

    for (const lesson of lessons) {
      try {
        console.log(`\n处理课程: ${lesson.title} (${lesson.id})`);
        
        // 将content转换为字符串进行处理
        let contentStr = typeof lesson.content === 'string' 
          ? lesson.content 
          : JSON.stringify(lesson.content);

        // 统计需要替换的URL数量
        const urlMatches = contentStr.match(/https:\/\/ooyklqqgnphynyrziqyh\.supabase\.co\/storage\/v1\/object\/public\/course-assets\/frame-lessons\/[^"'\s]+/g);
        const urlCount = urlMatches ? urlMatches.length : 0;
        
        if (urlCount === 0) {
          console.log('  没有找到需要修复的URL');
          continue;
        }

        console.log(`  找到 ${urlCount} 个需要修复的URL`);

        // 替换所有错误的URL路径
        const fixedContentStr = contentStr.replace(
          /https:\/\/ooyklqqgnphynyrziqyh\.supabase\.co\/storage\/v1\/object\/public\/course-assets\/frame-lessons\//g,
          'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course_media/lessons/'
        );

        // 尝试解析为JSON，如果原来是JSON格式的话
        let fixedContent;
        try {
          fixedContent = JSON.parse(fixedContentStr);
        } catch {
          fixedContent = fixedContentStr;
        }

        // 更新数据库
        const { error: updateError } = await supabase
          .from('lessons')
          .update({ content: fixedContent })
          .eq('id', lesson.id);

        if (updateError) {
          console.error(`  更新失败:`, updateError);
          errorCount++;
        } else {
          console.log(`  ✅ 成功修复 ${urlCount} 个URL`);
          successCount++;
        }

      } catch (error) {
        console.error(`  处理课程 ${lesson.id} 时出错:`, error);
        errorCount++;
      }
    }

    console.log('\n=== 修复完成 ===');
    console.log(`成功修复: ${successCount} 个课程`);
    console.log(`失败: ${errorCount} 个课程`);

    // 验证修复结果
    console.log('\n验证修复结果...');
    const { data: remainingIssues } = await supabase
      .from('lessons')
      .select('id, title')
      .eq('type', 'frame')
      .like('content', '%course-assets/frame-lessons%');

    if (remainingIssues && remainingIssues.length > 0) {
      console.log(`⚠️  仍有 ${remainingIssues.length} 个课程存在问题`);
      remainingIssues.forEach(lesson => {
        console.log(`  - ${lesson.title} (${lesson.id})`);
      });
    } else {
      console.log('✅ 所有URL已成功修复！');
    }

  } catch (error) {
    console.error('修复过程中出现错误:', error);
  }
}

// 运行修复
fixImageUrls(); 