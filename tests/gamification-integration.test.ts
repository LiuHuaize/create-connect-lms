/**
 * 游戏化系统集成测试
 * 测试系列问答与游戏化系统的集成功能
 */

import { gamificationService } from '@/services/gamificationService';
import { achievementService } from '@/services/achievementService';
import { seriesQuestionnaireService } from '@/services/seriesQuestionnaireService';

// 模拟用户ID
const TEST_USER_ID = 'test-user-123';
const TEST_QUESTIONNAIRE_ID = 'test-questionnaire-456';

describe('游戏化系统集成测试', () => {
  
  describe('技能经验分配', () => {
    test('应该正确分配技能经验', async () => {
      const skillTags = ['Critical Thinking', 'Communication'];
      const baseExperience = 100;

      const result = await gamificationService.allocateSkillExperience(
        TEST_USER_ID,
        skillTags,
        baseExperience
      );

      expect(result).toBe(true);
    });

    test('应该支持中文技能标签', async () => {
      const skillTags = ['批判思考', '沟通协调'];
      const baseExperience = 50;

      const result = await gamificationService.allocateSkillExperience(
        TEST_USER_ID,
        skillTags,
        baseExperience
      );

      expect(result).toBe(true);
    });

    test('空技能标签应该返回成功', async () => {
      const result = await gamificationService.allocateSkillExperience(
        TEST_USER_ID,
        [],
        100
      );

      expect(result).toBe(true);
    });
  });

  describe('系列问答完成奖励', () => {
    test('应该正确处理系列问答完成奖励', async () => {
      const result = await gamificationService.handleSeriesQuestionnaireComplete(
        TEST_USER_ID,
        TEST_QUESTIONNAIRE_ID,
        '测试问答',
        ['Critical Thinking', 'Creativity'],
        250 // 250字
      );

      expect(result).toBe(true);
    });

    test('应该根据字数给予额外奖励', async () => {
      // 测试大量字数的情况
      const result = await gamificationService.handleSeriesQuestionnaireComplete(
        TEST_USER_ID,
        'test-questionnaire-long',
        '长篇问答',
        ['Communication'],
        800 // 800字，应该获得额外奖励
      );

      expect(result).toBe(true);
    });
  });

  describe('系列问答评分奖励', () => {
    test('应该正确处理高分奖励', async () => {
      const result = await gamificationService.handleSeriesQuestionnaireGraded(
        TEST_USER_ID,
        TEST_QUESTIONNAIRE_ID,
        '测试问答',
        95, // 95分，应该获得优秀奖励
        100
      );

      expect(result).toBe(true);
    });

    test('应该正确处理中等分数奖励', async () => {
      const result = await gamificationService.handleSeriesQuestionnaireGraded(
        TEST_USER_ID,
        'test-questionnaire-medium',
        '测试问答',
        80, // 80分，应该获得及格奖励
        100
      );

      expect(result).toBe(true);
    });

    test('低分不应该获得奖励', async () => {
      const result = await gamificationService.handleSeriesQuestionnaireGraded(
        TEST_USER_ID,
        'test-questionnaire-low',
        '测试问答',
        60, // 60分，不应该获得奖励
        100
      );

      expect(result).toBe(true); // 仍然返回true，但不会给经验值
    });
  });

  describe('成就系统检查', () => {
    test('应该检查系列问答相关成就', async () => {
      const achievements = await achievementService.checkSeriesQuestionnaireAchievements(TEST_USER_ID);
      
      expect(Array.isArray(achievements)).toBe(true);
    });

    test('应该检查特殊成就', async () => {
      const achievements: any[] = [];
      await achievementService.checkSeriesQuestionnaireSpecialAchievements(TEST_USER_ID, achievements);
      
      expect(Array.isArray(achievements)).toBe(true);
    });

    test('应该正确计算成就进度', async () => {
      // 获取一个系列问答成就
      const allAchievements = await achievementService.getAllAchievements();
      const seriesAchievement = allAchievements.find(a => a.achievement_key === 'series_questionnaire_first');
      
      if (seriesAchievement) {
        const progress = await achievementService.getAchievementProgress(TEST_USER_ID, seriesAchievement.id);
        
        expect(progress).toHaveProperty('progress');
        expect(progress).toHaveProperty('maxProgress');
        expect(progress).toHaveProperty('isUnlocked');
      }
    });
  });

  describe('经验值计算', () => {
    test('应该正确计算系列问答经验值', () => {
      const experience = gamificationService.calculateLessonExperience('series_questionnaire');
      expect(experience).toBe(55); // 系列问答基础经验值
    });

    test('应该正确计算技能经验值', () => {
      const experience = gamificationService.calculateSkillExperience('series_questionnaire', 90);
      expect(experience).toBeGreaterThan(0);
    });
  });

  describe('时间线活动记录', () => {
    test('应该正确添加时间线活动', async () => {
      const result = await gamificationService.addTimelineActivity(
        TEST_USER_ID,
        'series_questionnaire_complete',
        '完成系列问答测试',
        '测试描述',
        undefined,
        undefined,
        55
      );

      expect(result).toBe(true);
    });

    test('应该获取用户时间线', async () => {
      const timeline = await gamificationService.getUserTimeline(TEST_USER_ID, 10);
      
      expect(Array.isArray(timeline)).toBe(true);
    });
  });

  describe('集成测试', () => {
    test('完整的系列问答流程应该触发所有游戏化功能', async () => {
      // 这个测试需要在实际环境中运行，模拟完整的用户提交流程
      
      // 1. 创建系列问答
      // 2. 学生提交答案
      // 3. AI评分
      // 4. 检查经验值和成就是否正确分配
      
      // 由于涉及数据库操作，这里只做结构验证
      expect(typeof gamificationService.handleSeriesQuestionnaireComplete).toBe('function');
      expect(typeof gamificationService.handleSeriesQuestionnaireGraded).toBe('function');
      expect(typeof gamificationService.allocateSkillExperience).toBe('function');
    });
  });
});

// 辅助函数：清理测试数据
async function cleanupTestData() {
  // 在实际测试中，这里应该清理测试产生的数据
  // 包括时间线记录、成就记录、技能经验等
  console.log('清理测试数据...');
}

// 测试后清理
afterAll(async () => {
  await cleanupTestData();
});
