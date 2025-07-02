// 测试技能经验分配功能
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ooyklqqgnphynyrziqyh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9veWtscXFnbnBoeW55cnppcXloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NTU5NzQsImV4cCI6MjA1MDUzMTk3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

// 技能经验计算函数
function calculateSkillExperience(lessonType, score) {
  const baseSkillExperience = {
    text: 15,
    video: 20,
    quiz: 25,
    assignment: 30,
    hotspot: 25,
    card_creator: 30,
    drag_sort: 25,
    resource: 10,
    frame: 20
  };

  let experience = baseSkillExperience[lessonType] || 15;

  if (lessonType === 'quiz' && score !== undefined) {
    if (score >= 90) {
      experience += 10;
    } else if (score >= 80) {
      experience += 5;
    }
  }

  return experience;
}

// 添加技能经验函数
async function addSkillExperience(userId, skillType, experience, sourceType, sourceId, reason) {
  try {
    console.log(`为用户 ${userId} 的 ${skillType} 技能添加 ${experience} 经验值`);

    // 获取当前技能数据
    const { data: currentSkill, error: fetchError } = await supabase
      .from('user_skills')
      .select('*')
      .eq('user_id', userId)
      .eq('skill_type', skillType)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('获取技能数据失败:', fetchError);
      return false;
    }

    let newExperience = experience;
    let newLevel = 1;

    if (currentSkill) {
      newExperience = currentSkill.skill_experience + experience;
      newLevel = Math.floor(newExperience / 50) + 1; // 每50经验升1级

      // 更新现有技能记录
      const { error: updateError } = await supabase
        .from('user_skills')
        .update({
          skill_experience: newExperience,
          skill_level: newLevel,
          last_updated: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('skill_type', skillType);

      if (updateError) {
        console.error('更新技能数据失败:', updateError);
        return false;
      }
    } else {
      // 创建新的技能记录
      newLevel = Math.floor(newExperience / 50) + 1;

      const { error: insertError } = await supabase
        .from('user_skills')
        .insert({
          user_id: userId,
          skill_type: skillType,
          skill_experience: newExperience,
          skill_level: newLevel
        });

      if (insertError) {
        console.error('创建技能记录失败:', insertError);
        return false;
      }
    }

    // 记录技能经验日志
    const { error: logError } = await supabase
      .from('skill_experience_logs')
      .insert({
        user_id: userId,
        skill_type: skillType,
        experience_gained: experience,
        source_type: sourceType,
        source_id: sourceId,
        reason: reason
      });

    if (logError) {
      console.error('记录技能经验日志失败:', logError);
    }

    console.log(`成功为用户 ${userId} 的 ${skillType} 技能添加 ${experience} 经验值，新等级：${newLevel}`);
    return true;
  } catch (error) {
    console.error('添加技能经验值失败:', error);
    return false;
  }
}

// 处理课时技能经验分配
async function handleSkillExperienceFromLesson(userId, lessonId, lessonTitle, lessonType, score) {
  try {
    // 获取课时的技能标记
    const { data: lessonData, error: lessonError } = await supabase
      .from('lessons')
      .select('skill_tags')
      .eq('id', lessonId)
      .single();

    if (lessonError) {
      console.error('获取课时技能标记失败:', lessonError);
      return false;
    }

    const skillTags = lessonData?.skill_tags || [];
    
    if (skillTags.length === 0) {
      console.log(`课时 ${lessonId} 没有技能标记，跳过技能经验分配`);
      return true;
    }

    console.log(`课时 ${lessonTitle} 的技能标记：`, skillTags);

    // 计算技能经验值
    const skillExperience = calculateSkillExperience(lessonType, score);
    console.log(`计算得出的技能经验值：${skillExperience}`);
    
    // 为每个技能标记分配经验
    const skillPromises = skillTags.map(async (skillType) => {
      return await addSkillExperience(
        userId,
        skillType,
        skillExperience,
        'lesson',
        lessonId,
        `完成课时：${lessonTitle}`
      );
    });

    const results = await Promise.all(skillPromises);
    const allSuccess = results.every(result => result);

    if (allSuccess) {
      console.log(`✅ 成功为课时 ${lessonTitle} 分配技能经验，涉及技能：${skillTags.join(', ')}`);
    } else {
      console.error(`❌ 课时 ${lessonTitle} 部分技能经验分配失败`);
    }

    return allSuccess;
  } catch (error) {
    console.error('处理课时技能经验失败:', error);
    return false;
  }
}

// 测试函数
async function testSkillExperience() {
  const userId = '97605399-d055-4c40-b23c-d0856081e325';
  
  // 测试数据
  const testLessons = [
    {
      id: '079fc8b3-8c50-4aaf-a957-ce179272359d',
      title: '动手实践',
      type: 'text'
    },
    {
      id: '0e3ec289-7d2b-4687-82b6-baf4e67421a0',
      title: '任务挑战',
      type: 'quiz',
      score: 95
    }
  ];

  console.log('🚀 开始测试技能经验分配功能...\n');

  // 获取测试前的技能数据
  const { data: beforeSkills } = await supabase
    .from('user_skills')
    .select('*')
    .eq('user_id', userId)
    .order('skill_type');

  console.log('📊 测试前的技能数据：');
  beforeSkills?.forEach(skill => {
    console.log(`  ${skill.skill_type}: Level ${skill.skill_level}, Experience ${skill.skill_experience}`);
  });
  console.log('');

  // 测试每个课时
  for (const lesson of testLessons) {
    console.log(`🎯 测试课时：${lesson.title} (${lesson.type})`);
    const success = await handleSkillExperienceFromLesson(
      userId,
      lesson.id,
      lesson.title,
      lesson.type,
      lesson.score
    );
    console.log(`结果：${success ? '✅ 成功' : '❌ 失败'}\n`);
  }

  // 获取测试后的技能数据
  const { data: afterSkills } = await supabase
    .from('user_skills')
    .select('*')
    .eq('user_id', userId)
    .order('skill_type');

  console.log('📊 测试后的技能数据：');
  afterSkills?.forEach(skill => {
    const before = beforeSkills?.find(b => b.skill_type === skill.skill_type);
    const expGained = skill.skill_experience - (before?.skill_experience || 0);
    console.log(`  ${skill.skill_type}: Level ${skill.skill_level}, Experience ${skill.skill_experience} (+${expGained})`);
  });

  console.log('\n🎉 测试完成！');
}

// 运行测试
testSkillExperience().catch(console.error);
