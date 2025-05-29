import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ooyklqqgnphynyrziqyh.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('❌ 请设置环境变量: SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// 根据我们之前分析的映射关系来修复第一个课时
const correctMapping = {
  '犬的类别.png': 'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488155082_lesson_1cc98e3f-dad2-43b5-a975-e7ffb8f89896_image_1.png',
  '运动犬.png': 'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488156234_lesson_1cc98e3f-dad2-43b5-a975-e7ffb8f89896_image_2.png',
  '生成猎犬组图片.png': 'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488161684_lesson_1cc98e3f-dad2-43b5-a975-e7ffb8f89896_image_3.png'
};

/**
 * 修复第一个课时的图片URL
 */
async function fixFirstLessonImages() {
  console.log('🔧 修复第一个课时的图片URL...\n');
  
  const lessonId = '1cc98e3f-dad2-43b5-a975-e7ffb8f89896';
  
  try {
    const { data: lesson, error: fetchError } = await supabase
      .from('lessons')
      .select('content')
      .eq('id', lessonId)
      .single();
      
    if (fetchError) {
      console.error(`❌ 获取课时失败:`, fetchError);
      return false;
    }
    
    const content = lesson.content;
    if (!content || !content.lessons) {
      console.log('❌ 没有找到子课时内容');
      return false;
    }
    
    let totalFixed = 0;
    let modified = false;
    
    // 修复指向rich-editor的图片
    for (let i = 0; i < content.lessons.length; i++) {
      const subLesson = content.lessons[i];
      if (subLesson.content && subLesson.content.text) {
        try {
          const blocks = JSON.parse(subLesson.content.text);
          if (Array.isArray(blocks)) {
            let blockModified = false;
            
            for (let j = 0; j < blocks.length; j++) {
              const block = blocks[j];
              if (block.type === 'image' && block.props?.name && block.props?.url) {
                const imageName = block.props.name;
                const currentUrl = block.props.url;
                const correctUrl = correctMapping[imageName];
                
                // 如果当前指向rich-editor且我们有正确的映射
                if (currentUrl.includes('rich-editor') && correctUrl) {
                  blocks[j].props.url = correctUrl;
                  totalFixed++;
                  blockModified = true;
                  console.log(`  ✅ 修复图片: ${imageName}`);
                  console.log(`     从: rich-editor/...`);
                  console.log(`     到: frame-lessons/...`);
                }
              }
            }
            
            if (blockModified) {
              content.lessons[i].content.text = JSON.stringify(blocks);
              modified = true;
            }
          }
        } catch (e) {
          console.log(`  ❌ 解析子课时 ${i + 1} 失败:`, e.message);
        }
      }
    }
    
    if (!modified) {
      console.log('✅ 图片URL已正确，无需修复');
      return true;
    }
    
    // 更新数据库
    const { error: updateError } = await supabase
      .from('lessons')
      .update({ content: content })
      .eq('id', lessonId);
      
    if (updateError) {
      console.error(`❌ 更新课时失败:`, updateError);
      return false;
    }
    
    console.log(`✅ 成功修复 ${totalFixed} 个图片的URL`);
    return true;
  } catch (error) {
    console.error(`❌ 处理课时失败:`, error);
    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🔧 开始修复第一个课时的图片URL...\n');
  
  console.log('📋 修复映射:');
  Object.entries(correctMapping).forEach(([name, url]) => {
    console.log(`  ${name} -> ${url.split('/').pop()}`);
  });
  console.log('');
  
  const success = await fixFirstLessonImages();
  
  if (success) {
    console.log('🎉 第一个课时图片URL修复完成！');
    console.log('\n现在应该再次检查两个课时的映射关系，确保图片内容正确对应。');
  } else {
    console.log('⚠️ 修复失败，请检查错误信息');
  }
}

main().catch(console.error); 