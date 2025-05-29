import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ooyklqqgnphynyrziqyh.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('❌ 请设置环境变量: SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// 正确的Storage文件名映射
const correctImageMapping = {
  '1cc98e3f-dad2-43b5-a975-e7ffb8f89896': [
    'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488155082_lesson_1cc98e3f-dad2-43b5-a975-e7ffb8f89896_image_1.png',
    'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488156234_lesson_1cc98e3f-dad2-43b5-a975-e7ffb8f89896_image_2.png',
    'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488161684_lesson_1cc98e3f-dad2-43b5-a975-e7ffb8f89896_image_3.png',
    'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488164527_lesson_1cc98e3f-dad2-43b5-a975-e7ffb8f89896_image_4.png',
    'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488166598_lesson_1cc98e3f-dad2-43b5-a975-e7ffb8f89896_image_5.png',
    'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488169986_lesson_1cc98e3f-dad2-43b5-a975-e7ffb8f89896_image_6.png',
    'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488171684_lesson_1cc98e3f-dad2-43b5-a975-e7ffb8f89896_image_7.png',
    'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488173136_lesson_1cc98e3f-dad2-43b5-a975-e7ffb8f89896_image_8.png'
  ],
  'be1a07c6-0c7b-413b-9aa9-4466b036fbc4': [
    'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488176463_lesson_be1a07c6-0c7b-413b-9aa9-4466b036fbc4_image_1.png',
    'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488177372_lesson_be1a07c6-0c7b-413b-9aa9-4466b036fbc4_image_2.png',
    'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488178976_lesson_be1a07c6-0c7b-413b-9aa9-4466b036fbc4_image_3.png',
    'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488180488_lesson_be1a07c6-0c7b-413b-9aa9-4466b036fbc4_image_4.png',
    'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488182209_lesson_be1a07c6-0c7b-413b-9aa9-4466b036fbc4_image_5.png',
    'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488184018_lesson_be1a07c6-0c7b-413b-9aa9-4466b036fbc4_image_6.png',
    'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488185617_lesson_be1a07c6-0c7b-413b-9aa9-4466b036fbc4_image_7.png',
    'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488187307_lesson_be1a07c6-0c7b-413b-9aa9-4466b036fbc4_image_8.png'
  ],
  'ea1b1302-a70d-48ff-9e6a-23e57dbd489d': [
    'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488190917_lesson_ea1b1302-a70d-48ff-9e6a-23e57dbd489d_image_1.png',
    'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488191383_lesson_ea1b1302-a70d-48ff-9e6a-23e57dbd489d_image_2.png',
    'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488192408_lesson_ea1b1302-a70d-48ff-9e6a-23e57dbd489d_image_3.png',
    'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488193300_lesson_ea1b1302-a70d-48ff-9e6a-23e57dbd489d_image_4.png',
    'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488193828_lesson_ea1b1302-a70d-48ff-9e6a-23e57dbd489d_image_5.png'
  ]
};

/**
 * 替换BlockNote内容中的图片URL
 */
function replaceImageUrls(textContent, correctUrls) {
  if (!textContent || typeof textContent !== 'string') {
    return textContent;
  }
  
  try {
    const blocks = JSON.parse(textContent);
    if (!Array.isArray(blocks)) {
      return textContent;
    }
    
    let imageIndex = 0;
    let modified = false;
    
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      
      if (block.type === 'image' && block.props?.url) {
        if (imageIndex < correctUrls.length) {
          const oldUrl = block.props.url;
          const newUrl = correctUrls[imageIndex];
          
          if (oldUrl !== newUrl) {
            block.props.url = newUrl;
            modified = true;
            console.log(`    📝 更新图片 ${imageIndex + 1}: ${block.props.name || '未知'}`);
          }
          imageIndex++;
        }
      }
    }
    
    return modified ? JSON.stringify(blocks) : textContent;
  } catch (error) {
    console.error('解析JSON失败:', error);
    return textContent;
  }
}

/**
 * 更新单个frame课时
 */
async function updateFrameLesson(lessonId, correctUrls) {
  console.log(`\n🔄 更新课时: ${lessonId}`);
  console.log(`📷 使用正确的 ${correctUrls.length} 个图片URL`);
  
  try {
    // 获取当前内容
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
    
    // 更新子课时中的图片URL
    let totalUpdated = 0;
    let modified = false;
    
    for (let i = 0; i < content.lessons.length; i++) {
      const subLesson = content.lessons[i];
      if (subLesson.content && subLesson.content.text) {
        const originalText = subLesson.content.text;
        const updatedText = replaceImageUrls(subLesson.content.text, correctUrls.slice(totalUpdated));
        
        if (originalText !== updatedText) {
          content.lessons[i].content.text = updatedText;
          // 计算这个子课时更新了多少张图片
          const updatedInThis = (originalText.match(/storage\/v1\/object\/public/g) || []).length;
          totalUpdated += updatedInThis;
          modified = true;
        }
      }
    }
    
    if (!modified) {
      console.log('✅ 无需更新，URL已经正确');
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
    
    console.log(`✅ 成功更新 ${totalUpdated} 个图片URL`);
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
  console.log('🔄 使用正确的Storage文件名更新图片URL...\n');
  
  let successCount = 0;
  let totalCount = Object.keys(correctImageMapping).length;
  
  for (const [lessonId, correctUrls] of Object.entries(correctImageMapping)) {
    const success = await updateFrameLesson(lessonId, correctUrls);
    if (success) {
      successCount++;
    }
  }
  
  console.log(`\n📊 更新完成:`);
  console.log(`✅ 成功: ${successCount}/${totalCount}`);
  
  if (successCount === totalCount) {
    console.log('🎉 所有图片URL已更新为正确的Storage路径！');
  } else {
    console.log('⚠️ 部分更新失败，请检查错误信息');
  }
}

main().catch(console.error); 