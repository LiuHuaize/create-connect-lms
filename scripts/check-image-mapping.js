import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ooyklqqgnphynyrziqyh.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9veWtscXFnbnBoeW55cnppcXloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1NzkyNDgsImV4cCI6MjA1OTE1NTI0OH0.d4Awen-9PnzlZTP51TpjjBkhrI3Dog4YELcbGlQs8jE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 检查Frame课时中的图片映射
 */
async function checkImageMapping(lessonId) {
  try {
    const { data: lesson, error } = await supabase
      .from('lessons')
      .select('id, title, content')
      .eq('id', lessonId)
      .single();
      
    if (error) {
      console.error('获取课时失败:', error);
      return;
    }
    
    console.log(`\n📋 课时: ${lesson.title} (${lesson.id})`);
    console.log('='.repeat(50));
    
    if (!lesson.content || !lesson.content.lessons) {
      console.log('❌ 没有找到子课时内容');
      return;
    }
    
    lesson.content.lessons.forEach((subLesson, index) => {
      console.log(`\n📄 子课时 ${index + 1}: ${subLesson.title}`);
      
      if (subLesson.content && subLesson.content.text) {
        try {
          const blocks = JSON.parse(subLesson.content.text);
          if (Array.isArray(blocks)) {
            const imageBlocks = blocks.filter(block => block.type === 'image');
            
            if (imageBlocks.length > 0) {
              console.log(`  🖼️  包含 ${imageBlocks.length} 张图片:`);
              imageBlocks.forEach((imgBlock, imgIndex) => {
                const name = imgBlock.props?.name || '未知';
                const url = imgBlock.props?.url || '无URL';
                const isStorageUrl = url.includes('supabase.co/storage');
                const status = isStorageUrl ? '✅' : '❌';
                
                console.log(`    ${status} 图片 ${imgIndex + 1}: ${name}`);
                console.log(`       URL: ${url.slice(0, 100)}${url.length > 100 ? '...' : ''}`);
              });
            } else {
              console.log('  📝 纯文本内容，无图片');
            }
          }
        } catch (e) {
          console.log('  ❌ 解析内容失败:', e.message);
        }
      } else {
        console.log('  📝 无文本内容');
      }
    });
    
  } catch (error) {
    console.error('处理失败:', error);
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🔍 检查Frame课时中的图片映射...\n');
  
  const lessonIds = [
    '1cc98e3f-dad2-43b5-a975-e7ffb8f89896',
    'be1a07c6-0c7b-413b-9aa9-4466b036fbc4',
    'ea1b1302-a70d-48ff-9e6a-23e57dbd489d'
  ];
  
  for (const lessonId of lessonIds) {
    await checkImageMapping(lessonId);
  }
  
  console.log('\n✅ 检查完成！');
}

main().catch(console.error); 