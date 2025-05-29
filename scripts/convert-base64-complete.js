import { createClient } from '@supabase/supabase-js';

// 从环境变量读取配置
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // 需要service role key

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ 请设置环境变量: VITE_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// 需要更新的课时和对应的图片映射
const imageMapping = {
  '1cc98e3f-dad2-43b5-a975-e7ffb8f89896': [
    'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488155082_lesson_1cc98e3f-dad2-43b5-a975-e7ffb8f89896_image_1.png',
    'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488155175_lesson_1cc98e3f-dad2-43b5-a975-e7ffb8f89896_image_2.png',
    'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488155268_lesson_1cc98e3f-dad2-43b5-a975-e7ffb8f89896_image_3.png',
    'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488155360_lesson_1cc98e3f-dad2-43b5-a975-e7ffb8f89896_image_4.png',
    'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488155453_lesson_1cc98e3f-dad2-43b5-a975-e7ffb8f89896_image_5.png',
    'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488155545_lesson_1cc98e3f-dad2-43b5-a975-e7ffb8f89896_image_6.png',
    'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488155637_lesson_1cc98e3f-dad2-43b5-a975-e7ffb8f89896_image_7.png',
    'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488155729_lesson_1cc98e3f-dad2-43b5-a975-e7ffb8f89896_image_8.png'
  ],
  'be1a07c6-0c7b-413b-9aa9-4466b036fbc4': [
    'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488155823_lesson_be1a07c6-0c7b-413b-9aa9-4466b036fbc4_image_1.png',
    'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488155915_lesson_be1a07c6-0c7b-413b-9aa9-4466b036fbc4_image_2.png',
    'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488156008_lesson_be1a07c6-0c7b-413b-9aa9-4466b036fbc4_image_3.png',
    'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488156100_lesson_be1a07c6-0c7b-413b-9aa9-4466b036fbc4_image_4.png',
    'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488156192_lesson_be1a07c6-0c7b-413b-9aa9-4466b036fbc4_image_5.png',
    'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488156283_lesson_be1a07c6-0c7b-413b-9aa9-4466b036fbc4_image_6.png',
    'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488156375_lesson_be1a07c6-0c7b-413b-9aa9-4466b036fbc4_image_7.png',
    'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488156467_lesson_be1a07c6-0c7b-413b-9aa9-4466b036fbc4_image_8.png'
  ],
  'ea1b1302-a70d-48ff-9e6a-23e57dbd489d': [
    'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488156559_lesson_ea1b1302-a70d-48ff-9e6a-23e57dbd489d_image_1.png',
    'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488156651_lesson_ea1b1302-a70d-48ff-9e6a-23e57dbd489d_image_2.png',
    'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488156743_lesson_ea1b1302-a70d-48ff-9e6a-23e57dbd489d_image_3.png',
    'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488156835_lesson_ea1b1302-a70d-48ff-9e6a-23e57dbd489d_image_4.png',
    'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488156927_lesson_ea1b1302-a70d-48ff-9e6a-23e57dbd489d_image_5.png'
  ]
};

/**
 * 替换BlockNote内容中的base64图片为Storage URL
 */
function replaceBase64InBlockNote(textContent, imageUrls) {
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
      
      if (block.type === 'image' && block.props?.url?.startsWith('data:image/')) {
        if (imageIndex < imageUrls.length) {
          block.props.url = imageUrls[imageIndex];
          imageIndex++;
          modified = true;
          console.log(`    📝 替换第${imageIndex}张图片的URL`);
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
async function updateFrameLesson(lessonId, imageUrls) {
  console.log(`\n🔄 更新课时: ${lessonId}`);
  console.log(`📷 需要替换 ${imageUrls.length} 张图片`);
  
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
      console.log('内容结构:', JSON.stringify(content, null, 2).slice(0, 500));
      return false;
    }
    
    // 更新子课时中的图片URL
    let totalReplaced = 0;
    for (let i = 0; i < content.lessons.length; i++) {
      const subLesson = content.lessons[i];
      if (subLesson.content && subLesson.content.text) {
        const originalText = subLesson.content.text;
        const updatedText = replaceBase64InBlockNote(subLesson.content.text, imageUrls.slice(totalReplaced));
        
        if (originalText !== updatedText) {
          content.lessons[i].content.text = updatedText;
          // 计算这个子课时替换了多少张图片
          const replacedInThis = (originalText.match(/data:image\//g) || []).length;
          totalReplaced += replacedInThis;
        }
      }
    }
    
    if (totalReplaced === 0) {
      console.log('❌ 没有找到需要替换的base64图片');
      return false;
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
    
    console.log(`✅ 成功替换 ${totalReplaced} 张图片`);
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
  console.log('🚀 开始更新Frame课时中的图片URL...\n');
  
  let successCount = 0;
  let totalCount = Object.keys(imageMapping).length;
  
  for (const [lessonId, imageUrls] of Object.entries(imageMapping)) {
    const success = await updateFrameLesson(lessonId, imageUrls);
    if (success) {
      successCount++;
    }
  }
  
  console.log(`\n📊 更新完成:`);
  console.log(`✅ 成功: ${successCount}/${totalCount}`);
  
  if (successCount === totalCount) {
    console.log('🎉 所有课时已成功更新！');
  } else {
    console.log('⚠️ 部分课时更新失败，请检查错误信息');
  }
}

main().catch(console.error); 