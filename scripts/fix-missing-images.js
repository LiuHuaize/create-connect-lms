import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ooyklqqgnphynyrziqyh.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9veWtscXFnbnBoeW55cnppcXloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzU3OTI0OCwiZXhwIjoyMDU5MTU1MjQ4fQ.pJyt_oK9CfWaj14sJQt0oRFJ1wOTyeyFWKt95Z7XGz8';

const supabase = createClient(supabaseUrl, serviceRoleKey);

// 配置
const BUCKET_NAME = 'course_media';
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

console.log('🔧 开始修复缺失的课时图片...\n');

/**
 * 解析base64图片
 */
function parseBase64Image(base64String) {
  const matches = base64String.match(/^data:image\/([a-zA-Z]*);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return null;
  }
  
  return {
    mimeType: `image/${matches[1]}`,
    extension: matches[1] === 'jpeg' ? 'jpg' : matches[1],
    data: matches[2]
  };
}

/**
 * 上传base64图片到Storage
 */
async function uploadBase64ToStorage(base64String, fileName) {
  try {
    const imageData = parseBase64Image(base64String);
    if (!imageData) {
      console.log('❌ 无法解析base64图片格式');
      return null;
    }

    const buffer = Buffer.from(imageData.data, 'base64');
    if (buffer.length > MAX_IMAGE_SIZE) {
      console.log(`❌ 图片太大 (${(buffer.length / 1024 / 1024).toFixed(2)}MB): ${fileName}`);
      return null;
    }

    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}_${fileName}.${imageData.extension}`;
    const filePath = `lessons/${uniqueFileName}`;

    console.log(`📤 上传图片: ${filePath} (${(buffer.length / 1024).toFixed(2)}KB)`);

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: imageData.mimeType,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error(`❌ 上传失败: ${error.message}`);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    console.log(`✅ 上传成功: ${urlData.publicUrl}`);
    return urlData.publicUrl;

  } catch (error) {
    console.error(`❌ 上传过程出错: ${error.message}`);
    return null;
  }
}

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
 * 处理单个课时的base64图片
 */
async function processFrameLesson(lessonId, lessonTitle) {
  console.log(`\n🔄 处理课时: ${lessonTitle} (${lessonId})`);
  
  try {
    // 获取课时内容
    const { data: lesson, error: fetchError } = await supabase
      .from('lessons')
      .select('id, title, content')
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
    
    console.log(`📄 找到 ${content.lessons.length} 个子课时`);
    
    // 检查是否有base64图片
    let hasBase64 = false;
    let totalImages = 0;
    const base64Images = [];
    
    for (let i = 0; i < content.lessons.length; i++) {
      const subLesson = content.lessons[i];
      if (subLesson.content && subLesson.content.text) {
        const textContent = subLesson.content.text;
        try {
          const blocks = JSON.parse(textContent);
          if (Array.isArray(blocks)) {
            for (const block of blocks) {
              if (block.type === 'image' && block.props?.url?.startsWith('data:image/')) {
                base64Images.push({
                  subLessonIndex: i,
                  imageName: block.props.name || `image_${totalImages + 1}`,
                  base64Data: block.props.url
                });
                totalImages++;
                hasBase64 = true;
              }
            }
          }
        } catch (e) {
          console.log(`  ❌ 解析子课时 ${i + 1} 失败:`, e.message);
        }
      }
    }
    
    if (!hasBase64) {
      console.log('✅ 没有base64图片需要处理');
      return true;
    }
    
    console.log(`🖼️  发现 ${totalImages} 张base64图片，开始上传...`);
    
    // 上传所有base64图片
    const uploadedUrls = [];
    for (let i = 0; i < base64Images.length; i++) {
      const imageInfo = base64Images[i];
      const fileName = `lesson_${lessonId}_image_${i + 1}`;
      console.log(`\n  📤 上传第 ${i + 1}/${base64Images.length} 张图片: ${imageInfo.imageName}`);
      
      const uploadedUrl = await uploadBase64ToStorage(imageInfo.base64Data, fileName);
      if (uploadedUrl) {
        uploadedUrls.push(uploadedUrl);
      } else {
        console.log(`  ❌ 图片 ${i + 1} 上传失败`);
        return false;
      }
    }
    
    if (uploadedUrls.length !== base64Images.length) {
      console.log(`❌ 只成功上传了 ${uploadedUrls.length}/${base64Images.length} 张图片`);
      return false;
    }
    
    console.log(`\n💾 更新数据库 - 替换 ${uploadedUrls.length} 张图片的URL...`);
    
    // 更新子课时内容
    let imageIndex = 0;
    let modified = false;
    
    for (let i = 0; i < content.lessons.length; i++) {
      const subLesson = content.lessons[i];
      if (subLesson.content && subLesson.content.text) {
        const originalText = subLesson.content.text;
        const base64Count = (originalText.match(/data:image/g) || []).length;
        
        if (base64Count > 0) {
          const updatedText = replaceBase64WithStorageUrls(
            subLesson.content.text, 
            uploadedUrls.slice(imageIndex, imageIndex + base64Count)
          );
          
          if (originalText !== updatedText) {
            content.lessons[i].content.text = updatedText;
            imageIndex += base64Count;
            modified = true;
          }
        }
      }
    }
    
    if (!modified) {
      console.log('❌ 数据库更新失败 - 没有内容被修改');
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
    
    console.log(`\n✅ 课时处理完成！成功上传并替换了 ${uploadedUrls.length} 张图片`);
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
  const problemLessons = [
    { id: '1cc98e3f-dad2-43b5-a975-e7ffb8f89896', title: '狗的类别' },
    { id: 'ea1b1302-a70d-48ff-9e6a-23e57dbd489d', title: '制作自己的小蜜蜂' }
  ];
  
  let successCount = 0;
  let totalCount = problemLessons.length;
  
  for (const lesson of problemLessons) {
    const success = await processFrameLesson(lesson.id, lesson.title);
    if (success) {
      successCount++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`🎉 修复完成！`);
  console.log(`✅ 成功: ${successCount}/${totalCount} 个课时`);
  console.log(`❌ 失败: ${totalCount - successCount}/${totalCount} 个课时`);
}

// 运行主函数
main().catch(console.error); 