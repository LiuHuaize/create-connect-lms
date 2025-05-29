import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ooyklqqgnphynyrziqyh.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('❌ 请设置环境变量: SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

/**
 * 修复单个课时中的URL
 */
async function fixLessonUrls(lessonId) {
  console.log(`\n🔧 修复课时: ${lessonId}`);
  
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
    
    // 修复子课时中的URL
    for (let i = 0; i < content.lessons.length; i++) {
      const subLesson = content.lessons[i];
      if (subLesson.content && subLesson.content.text) {
        try {
          const blocks = JSON.parse(subLesson.content.text);
          if (Array.isArray(blocks)) {
            let blockModified = false;
            
            for (let j = 0; j < blocks.length; j++) {
              const block = blocks[j];
              if (block.type === 'image' && block.props?.url) {
                const originalUrl = block.props.url;
                // 移除URL末尾的反斜杠和多余字符
                const cleanUrl = originalUrl.replace(/\\+$/, '').replace(/[^a-zA-Z0-9:\/\.\-_]/g, '');
                
                if (cleanUrl !== originalUrl) {
                  blocks[j].props.url = cleanUrl;
                  totalFixed++;
                  blockModified = true;
                  console.log(`  ✅ 修复图片URL: ${block.props.name || '未知'}`);
                  console.log(`     原URL: ${originalUrl.slice(-50)}`);
                  console.log(`     新URL: ${cleanUrl.slice(-50)}`);
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
      console.log('✅ 无需修复，URL格式正确');
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
    
    console.log(`✅ 成功修复 ${totalFixed} 个URL`);
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
  console.log('🔧 开始修复Frame课时中的图片URL...\n');
  
  const lessonIds = [
    '1cc98e3f-dad2-43b5-a975-e7ffb8f89896',
    'be1a07c6-0c7b-413b-9aa9-4466b036fbc4',
    'ea1b1302-a70d-48ff-9e6a-23e57dbd489d'
  ];
  
  let successCount = 0;
  
  for (const lessonId of lessonIds) {
    const success = await fixLessonUrls(lessonId);
    if (success) {
      successCount++;
    }
  }
  
  console.log(`\n📊 修复完成:`);
  console.log(`✅ 成功: ${successCount}/${lessonIds.length}`);
  
  if (successCount === lessonIds.length) {
    console.log('🎉 所有URL已修复！');
  } else {
    console.log('⚠️ 部分URL修复失败，请检查错误信息');
  }
}

main().catch(console.error); 