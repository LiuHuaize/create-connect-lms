import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 处理特定课程
const LESSON_ID = 'cb77a0a9-9918-47fc-a053-44e3c31ae101';
const BUCKET_NAME = 'course_media';

console.log('🚀 处理剩余的base64课程...\n');

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

async function main() {
  try {
    // 获取课程数据
    const { data: lesson, error: fetchError } = await supabase
      .from('lessons')
      .select('id, title, content')
      .eq('id', LESSON_ID)
      .single();

    if (fetchError) {
      console.error('获取课程失败:', fetchError);
      return;
    }

    console.log(`处理课程: ${lesson.title}`);

    // 处理可能是字符串化的JSON内容
    let content;
    if (typeof lesson.content === 'string') {
      try {
        content = JSON.parse(lesson.content);
      } catch (e) {
        console.log('❌ 无法解析课程内容JSON');
        return;
      }
    } else {
      content = lesson.content;
    }

    if (!content || !content.lessons) {
      console.log('❌ 没有找到子课时内容');
      console.log('内容结构:', Object.keys(content || {}));
      return;
    }

    console.log(`📄 找到 ${content.lessons.length} 个子课时`);

    let totalImages = 0;
    let modified = false;

    // 处理每个子课时
    for (let i = 0; i < content.lessons.length; i++) {
      const subLesson = content.lessons[i];
      console.log(`处理子课时 ${i + 1}: ${subLesson.title || '未命名'}`);
      
      if (subLesson.content && subLesson.content.text) {
        try {
          const blocks = JSON.parse(subLesson.content.text);
          if (Array.isArray(blocks)) {
            let imageIndex = 0;
            
            for (let j = 0; j < blocks.length; j++) {
              const block = blocks[j];
              
              if (block.type === 'image' && block.props?.url?.startsWith('data:image/')) {
                const imageName = block.props.name || `image_${imageIndex + 1}`;
                const fileName = `lesson_${LESSON_ID}_sub_${i + 1}_image_${imageIndex + 1}`;
                
                console.log(`📸 处理第${imageIndex + 1}张图片: ${imageName}`);
                
                const storageUrl = await uploadBase64ToStorage(block.props.url, fileName);
                if (storageUrl) {
                  blocks[j].props.url = storageUrl;
                  modified = true;
                  totalImages++;
                  console.log(`✅ 成功转换`);
                } else {
                  console.log(`❌ 转换失败`);
                }
                
                imageIndex++;
              }
            }
            
            if (imageIndex > 0) {
              content.lessons[i].content.text = JSON.stringify(blocks);
            }
          }
        } catch (e) {
          console.log(`解析子课时 ${i + 1} 失败:`, e.message);
        }
      }
    }

    if (modified) {
      console.log(`\n💾 更新数据库，总共转换了 ${totalImages} 张图片`);
      
      // 将内容转换回字符串（如果原来是字符串格式）
      const finalContent = typeof lesson.content === 'string' ? JSON.stringify(content) : content;
      
      const { error: updateError } = await supabase
        .from('lessons')
        .update({ content: finalContent })
        .eq('id', LESSON_ID);
        
      if (updateError) {
        console.error('❌ 更新失败:', updateError);
      } else {
        console.log('✅ 更新成功！');
      }
    } else {
      console.log('没有base64图片需要处理');
    }

  } catch (error) {
    console.error('处理失败:', error);
  }
}

main(); 