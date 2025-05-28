import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 从环境变量读取配置
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // 需要service role key

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 请设置环境变量: VITE_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 配置
const BUCKET_NAME = 'course_media';
const BATCH_SIZE = 5; // 每批处理的lesson数量
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB限制

/**
 * 从base64字符串中提取图片数据和MIME类型
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
 * 上传base64图片到Supabase Storage
 */
async function uploadBase64ToStorage(base64String, fileName) {
  try {
    const imageData = parseBase64Image(base64String);
    if (!imageData) {
      console.log('❌ 无法解析base64图片格式');
      return null;
    }

    // 检查图片大小
    const buffer = Buffer.from(imageData.data, 'base64');
    if (buffer.length > MAX_IMAGE_SIZE) {
      console.log(`❌ 图片太大 (${(buffer.length / 1024 / 1024).toFixed(2)}MB): ${fileName}`);
      return null;
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}_${fileName}.${imageData.extension}`;
    const filePath = `lessons/${uniqueFileName}`;

    console.log(`📤 上传图片: ${filePath} (${(buffer.length / 1024).toFixed(2)}KB)`);

    // 上传到Supabase Storage
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

    // 获取公共URL
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
 * 递归查找并替换JSON中的base64图片
 */
async function replaceBase64InObject(obj, lessonId, imageCounter = { count: 0 }) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    const newArray = [];
    for (let i = 0; i < obj.length; i++) {
      newArray[i] = await replaceBase64InObject(obj[i], lessonId, imageCounter);
    }
    return newArray;
  }

  const newObj = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && value.startsWith('data:image/')) {
      // 找到base64图片
      imageCounter.count++;
      const fileName = `lesson_${lessonId}_image_${imageCounter.count}`;
      console.log(`🔍 发现base64图片 #${imageCounter.count} 在lesson ${lessonId}`);
      
      const publicUrl = await uploadBase64ToStorage(value, fileName);
      if (publicUrl) {
        newObj[key] = publicUrl;
        console.log(`✅ 替换成功: ${key} -> ${publicUrl}`);
      } else {
        console.log(`❌ 保留原始base64数据: ${key}`);
        newObj[key] = value; // 保留原始数据
      }
    } else if (typeof value === 'object') {
      newObj[key] = await replaceBase64InObject(value, lessonId, imageCounter);
    } else {
      newObj[key] = value;
    }
  }
  return newObj;
}

/**
 * 处理单个lesson
 */
async function processLesson(lesson) {
  console.log(`\n🔄 处理lesson: ${lesson.title} (ID: ${lesson.id})`);
  console.log(`📊 原始内容大小: ${(lesson.content_size / 1024 / 1024).toFixed(2)}MB`);

  try {
    const content = JSON.parse(lesson.content);
    const imageCounter = { count: 0 };
    
    // 替换base64图片
    const updatedContent = await replaceBase64InObject(content, lesson.id, imageCounter);
    
    if (imageCounter.count === 0) {
      console.log('ℹ️  没有发现base64图片');
      return false;
    }

    // 更新数据库
    const { error } = await supabase
      .from('lessons')
      .update({ 
        content: updatedContent,
        updated_at: new Date().toISOString()
      })
      .eq('id', lesson.id);

    if (error) {
      console.error(`❌ 更新数据库失败: ${error.message}`);
      return false;
    }

    // 计算新的大小
    const newSize = JSON.stringify(updatedContent).length;
    const sizeDiff = lesson.content_size - newSize;
    
    console.log(`✅ 处理完成!`);
    console.log(`📊 新内容大小: ${(newSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`📉 减少了: ${(sizeDiff / 1024 / 1024).toFixed(2)}MB`);
    console.log(`🖼️  转换了 ${imageCounter.count} 张图片`);
    
    return true;

  } catch (error) {
    console.error(`❌ 处理lesson失败: ${error.message}`);
    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始base64图片转换任务...\n');

  try {
    // 获取包含大量base64数据的lessons
    const { data: lessons, error } = await supabase
      .from('lessons')
      .select('id, title, content, module_id')
      .gte('content', '{}') // 确保content不为空
      .order('id');

    if (error) {
      throw error;
    }

    // 过滤出包含base64图片的lessons
    const lessonsWithBase64 = [];
    for (const lesson of lessons) {
      try {
        const contentStr = JSON.stringify(lesson.content);
        const contentSize = Buffer.byteLength(contentStr, 'utf8');
        
        if (contentStr.includes('data:image/') && contentSize > 100000) { // 大于100KB
          lessonsWithBase64.push({
            ...lesson,
            content: contentStr,
            content_size: contentSize
          });
        }
      } catch (e) {
        console.log(`⚠️  跳过无效JSON的lesson: ${lesson.id}`);
      }
    }

    console.log(`📋 找到 ${lessonsWithBase64.length} 个包含base64图片的lessons`);
    
    if (lessonsWithBase64.length === 0) {
      console.log('✅ 没有需要处理的数据');
      return;
    }

    // 显示处理计划
    const totalSize = lessonsWithBase64.reduce((sum, lesson) => sum + lesson.content_size, 0);
    console.log(`📊 总数据大小: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`⏱️  预计处理时间: ${Math.ceil(lessonsWithBase64.length / BATCH_SIZE)} 批次\n`);

    // 分批处理
    let processedCount = 0;
    let successCount = 0;
    let totalSizeSaved = 0;

    for (let i = 0; i < lessonsWithBase64.length; i += BATCH_SIZE) {
      const batch = lessonsWithBase64.slice(i, i + BATCH_SIZE);
      console.log(`\n📦 处理批次 ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(lessonsWithBase64.length / BATCH_SIZE)}`);
      
      for (const lesson of batch) {
        const originalSize = lesson.content_size;
        const success = await processLesson(lesson);
        
        processedCount++;
        if (success) {
          successCount++;
          // 重新计算大小来估算节省的空间
          try {
            const { data: updatedLesson } = await supabase
              .from('lessons')
              .select('content')
              .eq('id', lesson.id)
              .single();
            
            if (updatedLesson) {
              const newSize = Buffer.byteLength(JSON.stringify(updatedLesson.content), 'utf8');
              totalSizeSaved += (originalSize - newSize);
            }
          } catch (e) {
            // 忽略大小计算错误
          }
        }
        
        // 添加延迟避免过载
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log(`\n📊 批次完成 - 成功: ${successCount}/${processedCount}`);
    }

    // 最终统计
    console.log('\n🎉 转换任务完成!');
    console.log(`✅ 成功处理: ${successCount}/${processedCount} lessons`);
    console.log(`💾 预计节省空间: ${(totalSizeSaved / 1024 / 1024).toFixed(2)}MB`);
    
    // 建议下一步
    console.log('\n📋 建议下一步操作:');
    console.log('1. 检查转换后的课程是否正常显示');
    console.log('2. 运行 VACUUM FULL 清理数据库空间');
    console.log('3. 监控数据库性能改善情况');

  } catch (error) {
    console.error('❌ 任务执行失败:', error.message);
    process.exit(1);
  }
}

// 运行主函数
main().catch(console.error); 