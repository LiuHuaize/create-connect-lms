import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ooyklqqgnphynyrziqyh.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('❌ 请设置环境变量: SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// 根据图片内容名称来映射正确的Storage文件
// 基于实际显示内容重新映射 - 第二次修正
const contentBasedMapping = {
  // 从截图看，梗犬现在显示的是4只狗的合影，这应该是概览图
  // 所以梗犬位置的图片应该作为概览图，概览图应该作为梗犬图
  '犬的类别.png': '1748488155082_lesson_1cc98e3f-dad2-43b5-a975-e7ffb8f89896_image_1.png', // 梗犬位置的4只狗合影作为概览
  '梗犬.png': '1748488166598_lesson_1cc98e3f-dad2-43b5-a975-e7ffb8f89896_image_5.png', // 原概览位置的图作为梗犬
  
  // 保持其他的映射
  '运动犬.png': '1748488156234_lesson_1cc98e3f-dad2-43b5-a975-e7ffb8f89896_image_2.png', 
  '生成猎犬组图片.png': '1748488161684_lesson_1cc98e3f-dad2-43b5-a975-e7ffb8f89896_image_3.png',
  '工作犬.png': '1748488164527_lesson_1cc98e3f-dad2-43b5-a975-e7ffb8f89896_image_4.png',
  '玩赏犬.png': '1748488171684_lesson_1cc98e3f-dad2-43b5-a975-e7ffb8f89896_image_7.png',
  '非运动犬.png': '1748488169986_lesson_1cc98e3f-dad2-43b5-a975-e7ffb8f89896_image_6.png',
  '牧羊犬组.png': '1748488173136_lesson_1cc98e3f-dad2-43b5-a975-e7ffb8f89896_image_8.png'
};

/**
 * 获取正确的Storage URL
 */
function getCorrectStorageUrl(imageName) {
  const fileName = contentBasedMapping[imageName];
  if (fileName) {
    return `https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/${fileName}`;
  }
  return null;
}

/**
 * 修复单个课时的图片顺序
 */
async function fixLessonImageOrder(lessonId) {
  console.log(`\n🔧 修复课时图片顺序: ${lessonId}`);
  
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
    
    // 为每个子课时匹配正确的图片
    for (let i = 0; i < content.lessons.length; i++) {
      const subLesson = content.lessons[i];
      if (subLesson.content && subLesson.content.text) {
        try {
          const blocks = JSON.parse(subLesson.content.text);
          if (Array.isArray(blocks)) {
            let blockModified = false;
            
            for (let j = 0; j < blocks.length; j++) {
              const block = blocks[j];
              if (block.type === 'image' && block.props?.name) {
                const imageName = block.props.name;
                const correctUrl = getCorrectStorageUrl(imageName);
                
                if (correctUrl && block.props.url !== correctUrl) {
                  const oldUrl = block.props.url;
                  blocks[j].props.url = correctUrl;
                  totalFixed++;
                  blockModified = true;
                  console.log(`  ✅ 修复图片: ${imageName}`);
                  console.log(`     从: ${oldUrl.slice(-50)}`);
                  console.log(`     到: ${correctUrl.slice(-50)}`);
                } else if (!correctUrl) {
                  console.log(`  ⚠️  未找到匹配的Storage文件: ${imageName}`);
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
      console.log('✅ 图片顺序已正确，无需修复');
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
    
    console.log(`✅ 成功修复 ${totalFixed} 个图片的顺序`);
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
  console.log('🔧 开始修复图片顺序...\n');
  
  console.log('📋 图片名称到Storage文件的映射:');
  Object.entries(contentBasedMapping).forEach(([name, file]) => {
    console.log(`  ${name} -> ${file}`);
  });
  
  const lessonIds = [
    '1cc98e3f-dad2-43b5-a975-e7ffb8f89896',
    'be1a07c6-0c7b-413b-9aa9-4466b036fbc4'
  ];
  
  let successCount = 0;
  
  for (const lessonId of lessonIds) {
    const success = await fixLessonImageOrder(lessonId);
    if (success) {
      successCount++;
    }
  }
  
  console.log(`\n📊 修复完成:`);
  console.log(`✅ 成功: ${successCount}/${lessonIds.length}`);
  
  if (successCount === lessonIds.length) {
    console.log('🎉 图片顺序已修复！');
  } else {
    console.log('⚠️ 部分修复失败，请检查错误信息');
  }
}

main().catch(console.error); 