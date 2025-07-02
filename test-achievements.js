// 测试成就系统的简单脚本
// 在浏览器控制台中运行

async function testAchievementSystem() {
  const userId = '97605399-d055-4c40-b23c-d0856081e325';
  
  console.log('开始测试成就系统...');
  
  try {
    // 导入成就服务（假设在全局作用域中可用）
    const { achievementService } = window;
    
    if (!achievementService) {
      console.error('achievementService 不可用');
      return;
    }
    
    // 检查所有成就
    console.log('检查所有成就...');
    const newAchievements = await achievementService.checkAllAchievements(userId);
    
    if (newAchievements.length > 0) {
      console.log(`解锁了 ${newAchievements.length} 个新成就:`);
      newAchievements.forEach(achievement => {
        console.log(`- ${achievement.title}: ${achievement.description} (+${achievement.experience_reward} EXP)`);
      });
    } else {
      console.log('没有新成就可以解锁');
    }
    
    // 获取用户已解锁的成就
    console.log('\n获取用户已解锁的成就...');
    const userAchievements = await achievementService.getUserAchievements(userId);
    console.log(`用户已解锁 ${userAchievements.length} 个成就:`);
    userAchievements.forEach(ua => {
      if (ua.achievement) {
        console.log(`- ${ua.achievement.title}: ${ua.achievement.description}`);
      }
    });
    
    // 获取所有成就及其进度
    console.log('\n获取所有成就进度...');
    const allAchievements = await achievementService.getAllAchievements();
    
    for (const achievement of allAchievements) {
      const progress = await achievementService.getAchievementProgress(userId, achievement.id);
      console.log(`${achievement.title}: ${progress.progress}/${progress.maxProgress} (${progress.isUnlocked ? '已解锁' : '未解锁'})`);
    }
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

// 运行测试
testAchievementSystem();
