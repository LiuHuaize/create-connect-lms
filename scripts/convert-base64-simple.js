import { createClient } from '@supabase/supabase-js';

// 直接配置 - 使用获取到的密钥
const supabaseUrl = 'https://ooyklqqgnphynyrziqyh.supabase.co';
// 先尝试使用anon key，如果权限不够会提示需要service role key
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9veWtscXFnbnBoeW55cnppcXloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1NzkyNDgsImV4cCI6MjA1OTE1NTI0OH0.d4Awen-9PnzlZTP51TpjjBkhrI3Dog4YELcbGlQs8jE';

console.log('🚀 开始Base64图片转换...');
console.log('🔑 使用Supabase密钥进行认证...');

const supabase = createClient(supabaseUrl, supabaseKey);

// 配置
const BUCKET_NAME = 'course_media';
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * 测试权限
 */
async function testPermissions() {
  try {
    console.log('🔍 测试数据库读取权限...');
    const { data, error } = await supabase
      .from('lessons')
      .select('id, title')
      .limit(1);
    
    if (error) {
      console.error('❌ 数据库权限测试失败:', error.message);
      return false;
    }
    
    console.log('✅ 数据库读取权限正常');
    
    console.log('🔍 测试Storage权限...');
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
    
    if (storageError) {
      console.error('❌ Storage权限测试失败:', storageError.message);
      return false;
    }
    
    console.log('✅ Storage权限正常');
    console.log(`📦 可用存储桶: ${buckets.map(b => b.name).join(', ')}`);
    
    return true;
  } catch (error) {
    console.error('❌ 权限测试出错:', error.message);
    return false;
  }
}

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
      if (error.message.includes('permission') || error.message.includes('unauthorized')) {
        console.log('💡 提示: 可能需要service role key而不是anon key');
      }
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
 * 处理单个lesson - 只处理最大的那个
 */
async function processLargestLesson() {
  console.log('\n🔄 开始处理最大的lesson...');
  
  try {
    // 获取最大的lesson
    const { data: lesson, error } = await supabase
      .from('lessons')
      .select('id, title, content')
      .eq('id', 'be1a07c6-0c7b-413b-9aa9-4466b036fbc4')
      .single();

    if (error) {
      console.error('❌ 获取lesson失败:', error.message);
      if (error.message.includes('permission')) {
        console.log('💡 提示: 需要service role key才能读取lessons表');
        console.log('📝 请在Supabase项目设置 > API 中找到service_role key');
      }
      throw error;
    }

    console.log(`📋 处理lesson: ${lesson.title}`);
    
    // 直接操作JSON对象而不是字符串
    let content = lesson.content;
    const originalSize = Buffer.byteLength(JSON.stringify(content), 'utf8');
    console.log(`📊 原始大小: ${(originalSize / 1024 / 1024).toFixed(2)}MB`);

    // 递归查找和替换base64图片
    let imageCount = 0;
    let successCount = 0;
    
    async function replaceBase64InObject(obj, depth = 0) {
      if (depth < 3) console.log(`  ⚡ 递归深度 ${depth}，处理类型: ${typeof obj}`);
      
      if (typeof obj === 'string') {
        // 如果是字符串，检查是否包含base64图片
        if (obj.startsWith('data:image/')) {
          imageCount++;
          console.log(`🔍 发现base64图片 #${imageCount} (深度: ${depth})`);
          
          if (imageCount <= 8) { // 处理所有8个图片
            const fileName = `lesson_${lesson.id}_image_${imageCount}`;
            console.log(`\n🔄 处理图片 ${imageCount}/8`);
            
            const publicUrl = await uploadBase64ToStorage(obj, fileName);
            if (publicUrl) {
              successCount++;
              console.log(`✅ 替换成功 ${imageCount}/8`);
              return publicUrl;
            } else {
              console.log(`❌ 保留原始base64 ${imageCount}/8`);
              return obj;
            }
          } else {
            return obj; // 保留原始值
          }
        }
        
        // 检查是否是JSON字符串
        if ((obj.includes('{') || obj.includes('[')) && obj.includes('data:image/')) {
          try {
            if (depth < 3) console.log(`  🔍 尝试解析嵌套JSON字符串 (深度: ${depth})`);
            const parsed = JSON.parse(obj);
            const processed = await replaceBase64InObject(parsed, depth + 1);
            return JSON.stringify(processed);
          } catch (e) {
            // 不是有效的JSON，保持原样
            if (depth < 3) console.log(`  ⚠️ 不是有效JSON，保持原样`);
          }
        }
        
        return obj;
      }

      if (typeof obj !== 'object' || obj === null) {
        return obj;
      }

      if (Array.isArray(obj)) {
        const newArray = [];
        for (let i = 0; i < obj.length; i++) {
          newArray[i] = await replaceBase64InObject(obj[i], depth + 1);
        }
        return newArray;
      }

      const newObj = {};
      for (const [key, value] of Object.entries(obj)) {
        newObj[key] = await replaceBase64InObject(value, depth + 1);
      }
      return newObj;
    }

    // 执行替换
    const updatedContent = await replaceBase64InObject(content);
    
    console.log(`\n📊 总共发现 ${imageCount} 个base64图片`);

    if (successCount === 0) {
      console.log('❌ 没有成功转换任何图片');
      return;
    }

    // 更新数据库
    console.log('\n💾 更新数据库...');
    
    const { error: updateError } = await supabase
      .from('lessons')
      .update({ 
        content: updatedContent,
        updated_at: new Date().toISOString()
      })
      .eq('id', lesson.id);

    if (updateError) {
      console.error(`❌ 更新数据库失败: ${updateError.message}`);
      if (updateError.message.includes('permission')) {
        console.log('💡 提示: 需要service role key才能更新lessons表');
      }
      return;
    }

    const newSize = Buffer.byteLength(JSON.stringify(updatedContent), 'utf8');
    const sizeDiff = originalSize - newSize;
    
    console.log('\n🎉 转换完成!');
    console.log(`✅ 成功转换: ${successCount}/${Math.min(imageCount, 8)} 张图片`);
    console.log(`📊 新大小: ${(newSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`📉 减少了: ${(sizeDiff / 1024 / 1024).toFixed(2)}MB`);
    console.log(`💾 节省空间: ${((sizeDiff / originalSize) * 100).toFixed(1)}%`);

  } catch (error) {
    console.error('❌ 处理失败:', error.message);
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('\n🧪 开始权限测试...');
  
  const hasPermissions = await testPermissions();
  if (!hasPermissions) {
    console.log('\n❌ 权限不足，无法继续执行转换');
    console.log('💡 解决方案:');
    console.log('1. 获取service role key (推荐)');
    console.log('2. 或者调整RLS策略允许anon用户操作');
    return;
  }
  
  console.log('\n✅ 权限检查通过，开始转换...');
  await processLargestLesson();
}

// 运行转换
main().catch(console.error); 