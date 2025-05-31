import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ooyklqqgnphynyrziqyh.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9veWtscXFnbnBoeW55cnppcXloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzU3OTI0OCwiZXhwIjoyMDU5MTU1MjQ4fQ.pJyt_oK9CfWaj14sJQt0oRFJ1wOTyeyFWKt95Z7XGz8';

const supabase = createClient(supabaseUrl, serviceRoleKey);

console.log('🔧 开始修复图片URL映射...\n');

/**
 * 获取Storage中所有课时相关的文件
 */
async function getStorageFiles() {
  const { data: files, error } = await supabase.storage
    .from('course_media')
    .list('lessons', {
      limit: 1000,
      sortBy: { column: 'name', order: 'asc' }
    });

  if (error) {
    console.error('❌ 获取Storage文件列表失败:', error);
    return [];
  }

  return files.map(file => ({
    name: file.name,
    fullPath: `lessons/${file.name}`,
    publicUrl: supabase.storage.from('course_media').getPublicUrl(`lessons/${file.name}`).data.publicUrl
  }));
}

/**
 * 从文件名中提取课时ID
 */
function extractLessonIdFromFileName(fileName) {
  const match = fileName.match(/lesson_([a-f0-9-]+)_image_\d+/);
  return match ? match[1] : null;
}

/**
 * 替换课时内容中的错误URL
 */
function replaceImageUrls(textContent, urlMappings) {
  if (!textContent || typeof textContent !== 'string') {
    return { updated: textContent, changed: false };
  }
  
  try {
    const blocks = JSON.parse(textContent);
    if (!Array.isArray(blocks)) {
      return { updated: textContent, changed: false };
    }
    
    let changed = false;
    
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      
      if (block.type === 'image' && block.props?.url) {
        const currentUrl = block.props.url;
        
        // 检查是否是指向错误bucket的URL
        if (currentUrl.includes('course-assets/frame-lessons/')) {
          // 从URL中提取文件名模式
          const urlParts = currentUrl.split('/');
          const fileName = urlParts[urlParts.length - 1];
          
          // 查找对应的正确URL
          const correctUrl = urlMappings[fileName];
          if (correctUrl) {
            block.props.url = correctUrl;
            changed = true;
            console.log(`    📝 替换图片URL: ${block.props.name || '未知'}`);
            console.log(`       从: ${currentUrl.split('/').slice(-2).join('/')}`);
            console.log(`       到: ${correctUrl.split('/').slice(-2).join('/')}`);
          } else {
            console.log(`    ⚠️  未找到对应的Storage文件: ${fileName}`);
          }
        }
      }
    }
    
    return { 
      updated: changed ? JSON.stringify(blocks) : textContent, 
      changed 
    };
  } catch (error) {
    console.error('解析JSON失败:', error);
    return { updated: textContent, changed: false };
  }
}

/**
 * 处理单个课时
 */
async function processLesson(lessonId, lessonTitle, urlMappings) {
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
    
    let totalFixed = 0;
    let modified = false;
    
    // 处理每个子课时
    for (let i = 0; i < content.lessons.length; i++) {
      const subLesson = content.lessons[i];
      if (subLesson.content && subLesson.content.text) {
        const result = replaceImageUrls(subLesson.content.text, urlMappings);
        
        if (result.changed) {
          content.lessons[i].content.text = result.updated;
          totalFixed++;
          modified = true;
        }
      }
    }
    
    if (!modified) {
      console.log('✅ 没有需要修复的URL');
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
    
    console.log(`✅ 成功修复 ${totalFixed} 个子课时的图片URL`);
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
    // 获取Storage中的所有文件
    console.log('📁 获取Storage文件列表...');
    const storageFiles = await getStorageFiles();
    console.log(`📄 找到 ${storageFiles.length} 个Storage文件`);
    
    // 创建文件名到URL的映射
    const urlMappings = {};
    const lessonFileGroups = {};
    
    storageFiles.forEach(file => {
      const lessonId = extractLessonIdFromFileName(file.name);
      if (lessonId) {
        // 从Storage文件名推断原始文件名格式
        const match = file.name.match(/(\d+)_lesson_([a-f0-9-]+)_image_(\d+)\.(\w+)$/);
        if (match) {
          const [, timestamp, id, imageNum, ext] = match;
          const originalFileName = `1748488${timestamp.slice(-6)}_lesson_${id}_image_${imageNum}.${ext}`;
          urlMappings[originalFileName] = file.publicUrl;
          
          if (!lessonFileGroups[lessonId]) {
            lessonFileGroups[lessonId] = [];
          }
          lessonFileGroups[lessonId].push(file);
        }
      }
    });
    
    console.log(`🔗 创建了 ${Object.keys(urlMappings).length} 个URL映射`);
    console.log(`📚 涉及 ${Object.keys(lessonFileGroups).length} 个课时`);
    
    // 获取所有frame类型的课时
    const { data: frameLessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id, title')
      .eq('type', 'frame');
      
    if (lessonsError) {
      console.error('❌ 获取课时列表失败:', lessonsError);
      return;
    }
    
    console.log(`\n🎯 找到 ${frameLessons.length} 个frame课时，开始处理...`);
    
    let successCount = 0;
    let totalCount = frameLessons.length;
    
    for (const lesson of frameLessons) {
      const success = await processLesson(lesson.id, lesson.title, urlMappings);
      if (success) {
        successCount++;
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log(`🎉 修复完成！`);
    console.log(`✅ 成功: ${successCount}/${totalCount} 个课时`);
    console.log(`❌ 失败: ${totalCount - successCount}/${totalCount} 个课时`);
    
  } catch (error) {
    console.error('❌ 主程序执行失败:', error);
  }
}

// 运行主函数
main().catch(console.error); 