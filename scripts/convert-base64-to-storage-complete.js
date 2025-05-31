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

// 配置
const BUCKET_NAME = 'course_media';
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

console.log('🚀 开始将base64图片转换为Storage URL...\n');

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
 * 处理BlockNote内容中的base64图片
 */
async function processBlockNoteContent(textContent, lessonId, subLessonIndex) {
  if (!textContent || typeof textContent !== 'string') {
    return { updatedContent: textContent, imageCount: 0 };
  }
  
  try {
    const blocks = JSON.parse(textContent);
    if (!Array.isArray(blocks)) {
      return { updatedContent: textContent, imageCount: 0 };
    }
    
    let imageIndex = 0;
    let modified = false;
    
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      
      if (block.type === 'image' && block.props?.url?.startsWith('data:image/')) {
        const imageName = block.props.name || `image_${imageIndex + 1}`;
        const fileName = `lesson_${lessonId}_sub_${subLessonIndex}_image_${imageIndex + 1}`;
        
        console.log(`    📸 处理第${imageIndex + 1}张图片: ${imageName}`);
        
        const storageUrl = await uploadBase64ToStorage(block.props.url, fileName);
        if (storageUrl) {
          block.props.url = storageUrl;
          modified = true;
          console.log(`    ✅ 图片${imageIndex + 1}转换成功`);
        } else {
          console.log(`    ❌ 图片${imageIndex + 1}转换失败`);
        }
        
        imageIndex++;
      }
    }
    
    return {
      updatedContent: modified ? JSON.stringify(blocks) : textContent,
      imageCount: imageIndex
    };
  } catch (error) {
    console.error('解析JSON失败:', error);
    return { updatedContent: textContent, imageCount: 0 };
  }
}

/**
 * 处理单个课时的base64图片
 */
async function processFrameLesson(lesson) {
  console.log(`\n🔄 处理课时: ${lesson.title} (${lesson.id})`);
  
  try {
    const content = lesson.content;
    if (!content || !content.lessons) {
      console.log('❌ 没有找到子课时内容');
      return false;
    }
    
    console.log(`📄 找到 ${content.lessons.length} 个子课时`);
    
    let totalImages = 0;
    let processedImages = 0;
    let modified = false;
    
    // 处理每个子课时
    for (let i = 0; i < content.lessons.length; i++) {
      const subLesson = content.lessons[i];
      if (subLesson.content && subLesson.content.text) {
        console.log(`  📝 处理子课时 ${i + 1}: ${subLesson.title || '未命名'}`);
        
        const result = await processBlockNoteContent(
          subLesson.content.text, 
          lesson.id, 
          i + 1
        );
        
        if (result.imageCount > 0) {
          content.lessons[i].content.text = result.updatedContent;
          totalImages += result.imageCount;
          processedImages += result.imageCount;
          modified = true;
        }
      }
    }
    
    if (!modified) {
      console.log('✅ 没有base64图片需要处理');
      return true;
    }
    
    // 更新数据库
    console.log(`💾 更新数据库...`);
    const { error: updateError } = await supabase
      .from('lessons')
      .update({ content: content })
      .eq('id', lesson.id);
      
    if (updateError) {
      console.error(`❌ 更新课时失败:`, updateError);
      return false;
    }
    
    console.log(`✅ 课时处理完成！转换了 ${processedImages} 张图片`);
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
  try {
    // 获取所有包含base64图片的frame课程
    console.log('🔍 查找包含base64图片的课程...');
    
    const { data: lessons, error: fetchError } = await supabase
      .from('lessons')
      .select('id, title, content')
      .eq('type', 'frame');

    if (fetchError) {
      console.error('获取课程数据失败:', fetchError);
      return;
    }

    // 筛选出包含base64图片的课程
    const base64Lessons = lessons.filter(lesson => {
      if (!lesson.content || typeof lesson.content !== 'object') return false;
      const contentStr = JSON.stringify(lesson.content);
      return contentStr.includes('data:image/');
    });

    console.log(`📚 总共找到 ${lessons.length} 个frame课程`);
    console.log(`🖼️  其中 ${base64Lessons.length} 个包含base64图片`);

    if (base64Lessons.length === 0) {
      console.log('✅ 没有需要转换的base64图片！');
      return;
    }

    let successCount = 0;
    let totalCount = base64Lessons.length;

    for (const lesson of base64Lessons) {
      const success = await processFrameLesson(lesson);
      if (success) {
        successCount++;
      }
      
      // 添加小延迟避免API限制
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n' + '='.repeat(60));
    console.log(`🎉 转换完成！`);
    console.log(`✅ 成功: ${successCount}/${totalCount} 个课程`);
    console.log(`❌ 失败: ${totalCount - successCount}/${totalCount} 个课程`);
    
    // 验证结果
    console.log('\n🔍 验证转换结果...');
    const { data: remainingBase64 } = await supabase
      .from('lessons')
      .select('id, title')
      .eq('type', 'frame');
      
    const stillHasBase64 = remainingBase64.filter(lesson => {
      if (!lesson.content) return false;
      const contentStr = JSON.stringify(lesson.content);
      return contentStr.includes('data:image/');
    });
    
    if (stillHasBase64.length > 0) {
      console.log(`⚠️  仍有 ${stillHasBase64.length} 个课程包含base64图片`);
    } else {
      console.log('✅ 所有base64图片已成功转换为Storage URL！');
    }

  } catch (error) {
    console.error('转换过程中出现错误:', error);
  }
}

// 运行转换
main(); 