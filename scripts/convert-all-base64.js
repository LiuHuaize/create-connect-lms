import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ooyklqqgnphynyrziqyh.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9veWtscXFnbnBoeW55cnppcXloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzU3OTI0OCwiZXhwIjoyMDU5MTU1MjQ4fQ.pJyt_oK9CfWaj14sJQt0oRFJ1wOTyeyFWKt95Z7XGz8';

const supabase = createClient(supabaseUrl, serviceRoleKey);

// 所有课时的正确图片映射
const allImageMappings = {
  // 狗的类别课时
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
  // 另一个狗的类别课时 (可能是重复的)
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
  // 制作自己的小蜜蜂课时
  'ea1b1302-a70d-48ff-9e6a-23e57dbd489d': [
    'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488190917_lesson_ea1b1302-a70d-48ff-9e6a-23e57dbd489d_image_1.png',
    'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488191383_lesson_ea1b1302-a70d-48ff-9e6a-23e57dbd489d_image_2.png',
    'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488192408_lesson_ea1b1302-a70d-48ff-9e6a-23e57dbd489d_image_3.png',
    'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488193300_lesson_ea1b1302-a70d-48ff-9e6a-23e57dbd489d_image_4.png',
    'https://ooyklqqgnphynyrziqyh.supabase.co/storage/v1/object/public/course-assets/frame-lessons/1748488193828_lesson_ea1b1302-a70d-48ff-9e6a-23e57dbd489d_image_5.png'
  ]
};

/**
 * 替换BlockNote内容中的base64图片为Storage URL
 */
function replaceBase64WithStorageUrls(textContent, storageUrls) {
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
        if (imageIndex < storageUrls.length) {
          const oldUrl = block.props.url;
          const newUrl = storageUrls[imageIndex];
          
          block.props.url = newUrl;
          modified = true;
          console.log(`    📝 替换第${imageIndex + 1}张base64图片为Storage URL`);
          console.log(`       新URL: ${newUrl.split('/').pop()}`);
          imageIndex++;
        }
      }
    }
    
    console.log(`    总共替换了 ${imageIndex} 张base64图片`);
    return modified ? JSON.stringify(blocks) : textContent;
  } catch (error) {
    console.error('解析JSON失败:', error);
    return textContent;
  }
}

/**
 * 转换单个frame课时的base64图片
 */
async function convertFrameLessonBase64(lessonId, storageUrls) {
  console.log(`\n🔄 转换课时base64图片: ${lessonId}`);
  console.log(`📷 使用 ${storageUrls.length} 个Storage URL`);
  
  try {
    // 获取当前内容
    const { data: lesson, error: fetchError } = await supabase
      .from('lessons')
      .select('id, title, content')
      .eq('id', lessonId)
      .single();
      
    if (fetchError) {
      console.error(`❌ 获取课时失败:`, fetchError);
      return false;
    }
    
    console.log(`📋 课时标题: ${lesson.title}`);
    
    const content = lesson.content;
    if (!content || !content.lessons) {
      console.log('❌ 没有找到子课时内容');
      return false;
    }
    
    console.log(`📄 找到 ${content.lessons.length} 个子课时`);
    
    // 检查是否已经转换过
    const hasBase64 = JSON.stringify(content).includes('data:image/');
    if (!hasBase64) {
      console.log('✅ 课时已经转换完成，无需重复转换');
      return true;
    }
    
    // 转换子课时中的base64图片
    let totalConverted = 0;
    let modified = false;
    
    for (let i = 0; i < content.lessons.length; i++) {
      const subLesson = content.lessons[i];
      console.log(`\n  📄 处理子课时 ${i + 1}: ${subLesson.title}`);
      
      if (subLesson.content && subLesson.content.text) {
        const originalText = subLesson.content.text;
        const base64Count = (originalText.match(/data:image/g) || []).length;
        
        if (base64Count > 0) {
          console.log(`    🖼️  发现 ${base64Count} 张base64图片`);
          const updatedText = replaceBase64WithStorageUrls(
            subLesson.content.text, 
            storageUrls.slice(totalConverted)
          );
          
          if (originalText !== updatedText) {
            content.lessons[i].content.text = updatedText;
            totalConverted += base64Count;
            modified = true;
          }
        } else {
          console.log(`    ✅ 无base64图片`);
        }
      }
    }
    
    if (!modified) {
      console.log('✅ 没有base64图片需要转换');
      return true;
    }
    
    console.log(`\n💾 更新数据库 - 总共转换了 ${totalConverted} 张图片`);
    
    // 更新数据库
    const { error: updateError } = await supabase
      .from('lessons')
      .update({ content: content })
      .eq('id', lessonId);
      
    if (updateError) {
      console.error(`❌ 更新课时失败:`, updateError);
      return false;
    }
    
    console.log(`✅ 成功转换 ${totalConverted} 张base64图片为Storage URL`);
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
  console.log('🔄 开始转换所有base64图片为Storage URL...\n');
  
  let successCount = 0;
  let totalCount = Object.keys(allImageMappings).length;
  let totalSizeSaved = 0;
  
  for (const [lessonId, storageUrls] of Object.entries(allImageMappings)) {
    // 获取转换前的大小
    const { data: beforeLesson } = await supabase
      .from('lessons')
      .select('content')
      .eq('id', lessonId)
      .single();
      
    const beforeSize = beforeLesson ? Buffer.byteLength(JSON.stringify(beforeLesson.content), 'utf8') : 0;
    
    const success = await convertFrameLessonBase64(lessonId, storageUrls);
    
    if (success) {
      successCount++;
      
      // 获取转换后的大小
      const { data: afterLesson } = await supabase
        .from('lessons')
        .select('content')
        .eq('id', lessonId)
        .single();
        
      const afterSize = afterLesson ? Buffer.byteLength(JSON.stringify(afterLesson.content), 'utf8') : 0;
      const sizeSaved = beforeSize - afterSize;
      totalSizeSaved += sizeSaved;
      
      if (sizeSaved > 0) {
        console.log(`💾 节省空间: ${(sizeSaved / 1024 / 1024).toFixed(2)}MB`);
      }
    }
  }
  
  console.log(`\n📊 转换完成:`);
  console.log(`✅ 成功: ${successCount}/${totalCount}`);
  console.log(`💾 总共节省空间: ${(totalSizeSaved / 1024 / 1024).toFixed(2)}MB`);
  
  if (successCount === totalCount) {
    console.log('🎉 所有base64图片已转换为Storage URL！');
    console.log('\n💡 建议下一步操作:');
    console.log('1. 运行 check-image-mapping.js 验证转换结果');
    console.log('2. 访问前端页面确认图片正常显示');
    console.log('3. 监控数据库性能改善情况');
  } else {
    console.log('⚠️ 部分转换失败，请检查错误信息');
  }
}

main().catch(console.error); 