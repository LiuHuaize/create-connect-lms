import { describe, test, expect } from 'vitest'
import { 
  calculateLessonExperience, 
  calculateLevel, 
  calculateExpToNextLevel,
  calculateSkillLevel,
  EXPERIENCE_RULES,
  SKILL_LEVEL_EXPERIENCE
} from '../gamificationService'

describe('第一阶段：gamification核心计算函数测试', () => {
  describe('经验值计算 (calculateLessonExperience)', () => {
    test('各类型课时的基础经验值计算正确', () => {
      expect(calculateLessonExperience('text')).toBe(20)
      expect(calculateLessonExperience('video')).toBe(30)
      expect(calculateLessonExperience('quiz')).toBe(40)
      expect(calculateLessonExperience('assignment')).toBe(50)
      expect(calculateLessonExperience('hotspot')).toBe(35)
      expect(calculateLessonExperience('card_creator')).toBe(45)
      expect(calculateLessonExperience('series_questionnaire')).toBe(55)
    })

    test('测验分数奖励机制正确', () => {
      // 完美分数奖励 (100分)
      expect(calculateLessonExperience('quiz', 100)).toBe(60) // 40 + 20
      
      // 优秀分数奖励 (90-99分)
      expect(calculateLessonExperience('quiz', 95)).toBe(55) // 40 + 15
      expect(calculateLessonExperience('quiz', 90)).toBe(55) // 40 + 15
      
      // 良好分数奖励 (80-89分)
      expect(calculateLessonExperience('quiz', 85)).toBe(50) // 40 + 10
      expect(calculateLessonExperience('quiz', 80)).toBe(50) // 40 + 10
      
      // 及格分数奖励 (60-79分)
      expect(calculateLessonExperience('quiz', 75)).toBe(45) // 40 + 5
      expect(calculateLessonExperience('quiz', 60)).toBe(45) // 40 + 5
      
      // 不及格无奖励 (<60分)
      expect(calculateLessonExperience('quiz', 59)).toBe(40) // 40 + 0
      expect(calculateLessonExperience('quiz', 0)).toBe(40)  // 40 + 0
    })

    test('非测验课时传入分数不影响结果', () => {
      expect(calculateLessonExperience('text', 100)).toBe(20)
      expect(calculateLessonExperience('video', 0)).toBe(30)
      expect(calculateLessonExperience('assignment', 50)).toBe(50)
    })

    test('边界值和异常情况处理', () => {
      // 负分数
      expect(calculateLessonExperience('quiz', -10)).toBe(40)
      
      // 超过100分
      expect(calculateLessonExperience('quiz', 150)).toBe(60) // 仍按100分处理
      
      // 小数分数
      expect(calculateLessonExperience('quiz', 85.5)).toBe(50)
    })
  })

  describe('等级计算 (calculateLevel)', () => {
    test('基本等级计算正确', () => {
      expect(calculateLevel(0)).toBe(1)
      expect(calculateLevel(50)).toBe(1)
      expect(calculateLevel(99)).toBe(1)
      expect(calculateLevel(100)).toBe(2)
      expect(calculateLevel(150)).toBe(2)
      expect(calculateLevel(199)).toBe(2)
      expect(calculateLevel(200)).toBe(3)
      expect(calculateLevel(1000)).toBe(11)
    })

    test('等级计算边界值验证', () => {
      const levelExp = EXPERIENCE_RULES.LEVEL_EXPERIENCE // 100
      
      expect(calculateLevel(levelExp - 1)).toBe(1)        // 99 -> 1级
      expect(calculateLevel(levelExp)).toBe(2)            // 100 -> 2级
      expect(calculateLevel(levelExp * 2 - 1)).toBe(2)    // 199 -> 2级
      expect(calculateLevel(levelExp * 2)).toBe(3)        // 200 -> 3级
      expect(calculateLevel(levelExp * 10)).toBe(11)      // 1000 -> 11级
    })

    test('极值处理', () => {
      expect(calculateLevel(Number.MAX_SAFE_INTEGER - 1000)).toBeGreaterThan(0)
      expect(Number.isInteger(calculateLevel(9999999))).toBe(true)
    })
  })

  describe('距离下一级经验值计算 (calculateExpToNextLevel)', () => {
    test('基本计算正确', () => {
      expect(calculateExpToNextLevel(0)).toBe(100)    // 距离2级还需100
      expect(calculateExpToNextLevel(50)).toBe(50)    // 距离2级还需50
      expect(calculateExpToNextLevel(99)).toBe(1)     // 距离2级还需1
      expect(calculateExpToNextLevel(100)).toBe(100)  // 距离3级还需100
      expect(calculateExpToNextLevel(150)).toBe(50)   // 距离3级还需50
      expect(calculateExpToNextLevel(200)).toBe(100)  // 距离4级还需100
    })

    test('各等级边界值验证', () => {
      const testCases = [
        { exp: 0, expected: 100 },    // 1级开始
        { exp: 99, expected: 1 },     // 即将2级
        { exp: 100, expected: 100 },  // 2级开始
        { exp: 199, expected: 1 },    // 即将3级
        { exp: 999, expected: 1 },    // 即将11级
      ]

      testCases.forEach(({ exp, expected }) => {
        expect(calculateExpToNextLevel(exp)).toBe(expected)
      })
    })
  })

  describe('技能等级计算 (calculateSkillLevel)', () => {
    test('基本技能等级计算', () => {
      expect(calculateSkillLevel(0)).toBe(1)
      expect(calculateSkillLevel(25)).toBe(1)
      expect(calculateSkillLevel(49)).toBe(1)
      expect(calculateSkillLevel(50)).toBe(2)
      expect(calculateSkillLevel(75)).toBe(2)
      expect(calculateSkillLevel(99)).toBe(2)
      expect(calculateSkillLevel(100)).toBe(3)
      expect(calculateSkillLevel(500)).toBe(11)
    })

    test('技能等级边界值验证', () => {
      const skillExp = SKILL_LEVEL_EXPERIENCE // 50
      
      expect(calculateSkillLevel(skillExp - 1)).toBe(1)      // 49 -> 1级
      expect(calculateSkillLevel(skillExp)).toBe(2)          // 50 -> 2级
      expect(calculateSkillLevel(skillExp * 2 - 1)).toBe(2)  // 99 -> 2级
      expect(calculateSkillLevel(skillExp * 2)).toBe(3)      // 100 -> 3级
      expect(calculateSkillLevel(skillExp * 10)).toBe(11)    // 500 -> 11级
    })
  })

  describe('配置常量验证', () => {
    test('经验值规则配置完整性', () => {
      expect(EXPERIENCE_RULES.LESSON_COMPLETE).toBeDefined()
      expect(EXPERIENCE_RULES.QUIZ_SCORE_BONUS).toBeDefined()
      expect(EXPERIENCE_RULES.COURSE_COMPLETE).toBeDefined()
      expect(EXPERIENCE_RULES.DAILY_STREAK).toBeDefined()
      expect(EXPERIENCE_RULES.LEVEL_EXPERIENCE).toBeDefined()
    })

    test('课时类型经验值配置合理性', () => {
      const lessonExp = EXPERIENCE_RULES.LESSON_COMPLETE
      
      // 验证经验值递增合理性（复杂度越高，经验值越多）
      expect(lessonExp.text).toBeLessThan(lessonExp.video)
      expect(lessonExp.video).toBeLessThan(lessonExp.quiz)
      expect(lessonExp.quiz).toBeLessThan(lessonExp.assignment)
      expect(lessonExp.assignment).toBeLessThan(lessonExp.series_questionnaire)
      
      // 验证所有经验值都是正数
      Object.values(lessonExp).forEach(exp => {
        expect(exp).toBeGreaterThan(0)
      })
    })

    test('分数奖励配置合理性', () => {
      const scoreBonus = EXPERIENCE_RULES.QUIZ_SCORE_BONUS
      
      // 验证奖励递减合理性
      expect(scoreBonus.perfect).toBeGreaterThan(scoreBonus.excellent)
      expect(scoreBonus.excellent).toBeGreaterThan(scoreBonus.good)
      expect(scoreBonus.good).toBeGreaterThan(scoreBonus.pass)
      
      // 验证奖励值合理性
      expect(scoreBonus.pass).toBeGreaterThan(0)
      expect(scoreBonus.perfect).toBeLessThan(100) // 奖励不应过大
    })
  })

  describe('一致性验证', () => {
    test('等级和经验值计算的一致性', () => {
      const testExperiences = [0, 50, 100, 150, 200, 500, 1000]
      
      testExperiences.forEach(exp => {
        const level = calculateLevel(exp)
        const expToNext = calculateExpToNextLevel(exp)
        
        // 验证下一级所需经验值 + 当前经验值 = 下一级的起始经验值
        const nextLevelStartExp = level * EXPERIENCE_RULES.LEVEL_EXPERIENCE
        expect(exp + expToNext).toBe(nextLevelStartExp)
      })
    })

    test('技能等级计算的一致性', () => {
      const testSkillExps = [0, 25, 50, 100, 250, 500]
      
      testSkillExps.forEach(exp => {
        const level = calculateSkillLevel(exp)
        const expectedLevel = Math.floor(exp / SKILL_LEVEL_EXPERIENCE) + 1
        expect(level).toBe(expectedLevel)
      })
    })
  })

  describe('性能和稳定性测试', () => {
    test('大量计算的性能表现', () => {
      const iterations = 10000
      const startTime = performance.now()
      
      for (let i = 0; i < iterations; i++) {
        calculateLevel(i * 10)
        calculateLessonExperience('quiz', i % 100)
        calculateSkillLevel(i * 5)
        calculateExpToNextLevel(i * 15)
      }
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      // 10000次计算应该在100ms内完成
      expect(duration).toBeLessThan(100)
    })

    test('并发计算的一致性', async () => {
      const promises = Array.from({ length: 100 }, (_, i) => 
        Promise.resolve().then(() => ({
          level: calculateLevel(i * 100),
          exp: calculateLessonExperience('quiz', i),
          skill: calculateSkillLevel(i * 50)
        }))
      )
      
      const results = await Promise.all(promises)
      
      // 验证结果的一致性
      results.forEach((result, i) => {
        expect(result.level).toBe(calculateLevel(i * 100))
        expect(result.exp).toBe(calculateLessonExperience('quiz', i))
        expect(result.skill).toBe(calculateSkillLevel(i * 50))
      })
    })
  })
})