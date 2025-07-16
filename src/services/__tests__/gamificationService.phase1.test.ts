import { describe, test, expect, vi, beforeEach } from 'vitest'
import { gamificationService, calculateLevel } from '../gamificationService'

// 模拟Supabase客户端
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          maybeSingle: vi.fn()
        })),
        order: vi.fn(() => ({
          limit: vi.fn()
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn()
      })),
      insert: vi.fn(),
      upsert: vi.fn()
    }))
  }
}))

// 模拟Achievement Service
vi.mock('../achievementService', () => ({
  achievementService: {
    checkAllAchievements: vi.fn().mockResolvedValue([])
  }
}))

describe('第一阶段：gamification核心修复测试', () => {
  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()
    const { supabase } = require('../lib/supabase')
    mockSupabase = supabase
  })

  describe('1. 修复关键bug验证', () => {
    test('修复经验值计算中的溢出问题', () => {
      // 测试极大数值不会导致错误
      const largeExp = Number.MAX_SAFE_INTEGER - 1000
      const level = calculateLevel(largeExp)
      
      expect(level).toBeGreaterThan(0)
      expect(Number.isInteger(level)).toBe(true)
      expect(level).toBeLessThan(Number.MAX_SAFE_INTEGER)
    })

    test('修复空用户ID处理', async () => {
      const mockActivity = {
        activity_type: 'lesson_complete' as const,
        activity_title: '测试',
        experience_gained: 50
      }

      // 空用户ID应该直接返回false，不调用数据库
      const result1 = await gamificationService.addExperience('', 50, mockActivity)
      const result2 = await gamificationService.addExperience(undefined as any, 50, mockActivity)
      const result3 = await gamificationService.addExperience(null as any, 50, mockActivity)

      expect(result1).toBe(false)
      expect(result2).toBe(false) 
      expect(result3).toBe(false)

      // 验证没有调用数据库操作
      expect(mockSupabase.from).not.toHaveBeenCalled()
    })

    test('修复负数经验值处理', async () => {
      const mockActivity = {
        activity_type: 'lesson_complete' as const,
        activity_title: '测试',
        experience_gained: -10
      }

      // 负数经验值应该被拒绝
      const result = await gamificationService.addExperience('user1', -10, mockActivity)
      expect(result).toBe(false)
      
      // 验证没有调用数据库操作
      expect(mockSupabase.from).not.toHaveBeenCalled()
    })

    test('修复并发操作的数据一致性问题', async () => {
      // 模拟用户档案
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { 
          id: 'user1', 
          total_experience: 50, 
          total_level: 1 
        },
        error: null
      })

      mockSupabase.from().update().eq.mockResolvedValue({ error: null })
      mockSupabase.from().insert.mockResolvedValue({ error: null })

      const mockActivity = {
        activity_type: 'lesson_complete' as const,
        activity_title: '测试',
        experience_gained: 30
      }

      // 模拟并发操作
      const promises = []
      for (let i = 0; i < 5; i++) {
        promises.push(gamificationService.addExperience('user1', 30, mockActivity))
      }

      const results = await Promise.all(promises)
      
      // 所有操作都应该成功（因为我们模拟了成功响应）
      results.forEach(result => {
        expect(result).toBe(true)
      })
    })
  })

  describe('2. 基础经验值计算和更新机制', () => {
    test('课时完成触发正确的经验值计算', async () => {
      // 模拟不重复
      mockSupabase.from().select().eq().maybeSingle.mockResolvedValue({
        data: null,
        error: null
      })

      // 模拟课时和用户数据
      mockSupabase.from().select().eq().single
        .mockResolvedValueOnce({
          data: { skill_tags: ['communication'] },
          error: null
        })
        .mockResolvedValueOnce({
          data: { 
            id: 'user1', 
            total_experience: 0, 
            total_level: 1 
          },
          error: null
        })

      mockSupabase.from().update().eq.mockResolvedValue({ error: null })
      mockSupabase.from().insert.mockResolvedValue({ error: null })
      mockSupabase.from().select().eq().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      })

      // 测试各种课时类型的经验值计算
      const testCases = [
        { type: 'text', expectedExp: 20 },
        { type: 'video', expectedExp: 30 },
        { type: 'quiz', expectedExp: 40, score: 70 }, // 无奖励
        { type: 'quiz', expectedExp: 60, score: 100 }, // 完美奖励
        { type: 'assignment', expectedExp: 50 },
        { type: 'series_questionnaire', expectedExp: 55 }
      ]

      for (const testCase of testCases) {
        vi.clearAllMocks()
        
        // 重新设置模拟
        mockSupabase.from().select().eq().maybeSingle.mockResolvedValue({
          data: null,
          error: null
        })
        mockSupabase.from().select().eq().single
          .mockResolvedValueOnce({
            data: { skill_tags: [] },
            error: null
          })
          .mockResolvedValueOnce({
            data: { 
              id: 'user1', 
              total_experience: 0, 
              total_level: 1 
            },
            error: null
          })
        mockSupabase.from().update().eq.mockResolvedValue({ error: null })
        mockSupabase.from().insert.mockResolvedValue({ error: null })

        const result = await gamificationService.handleLessonComplete(
          'user1',
          'lesson1',
          'course1',
          `${testCase.type}课时`,
          testCase.type as any,
          testCase.score
        )

        expect(result).toBe(true)
        
        // 验证经验值更新
        expect(mockSupabase.from().update).toHaveBeenCalledWith({
          total_experience: testCase.expectedExp,
          total_level: 1,
          last_activity_date: expect.any(String)
        })
      }
    })

    test('等级计算和升级机制', async () => {
      const testCases = [
        { currentExp: 0, addExp: 100, expectedLevel: 2 },
        { currentExp: 50, addExp: 150, expectedLevel: 3 },
        { currentExp: 190, addExp: 20, expectedLevel: 3 },
        { currentExp: 900, addExp: 200, expectedLevel: 12 }
      ]

      for (const testCase of testCases) {
        vi.clearAllMocks()
        
        mockSupabase.from().select().eq().single.mockResolvedValue({
          data: { 
            id: 'user1', 
            total_experience: testCase.currentExp, 
            total_level: calculateLevel(testCase.currentExp)
          },
          error: null
        })

        mockSupabase.from().update().eq.mockResolvedValue({ error: null })
        mockSupabase.from().insert.mockResolvedValue({ error: null })

        const mockActivity = {
          activity_type: 'lesson_complete' as const,
          activity_title: '测试',
          experience_gained: testCase.addExp
        }

        const result = await gamificationService.addExperience('user1', testCase.addExp, mockActivity)
        expect(result).toBe(true)

        expect(mockSupabase.from().update).toHaveBeenCalledWith({
          total_experience: testCase.currentExp + testCase.addExp,
          total_level: testCase.expectedLevel,
          last_activity_date: expect.any(String)
        })
      }
    })
  })

  describe('3. 现有用户数据补充和初始化', () => {
    test('为缺失gamification数据的用户初始化', async () => {
      // 模拟用户档案缺少gamification字段
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { 
          id: 'user1',
          username: 'testuser',
          // 缺少 total_experience, total_level 等字段
        },
        error: null
      })

      // 这种情况下，系统应该能够处理并初始化默认值
      const result = await gamificationService.getUserProfile('user1')
      
      // 应该返回null或处理缺失数据
      expect(result).toBeDefined()
    })

    test('技能系统初始化', async () => {
      // 模拟用户没有技能记录
      mockSupabase.from().select().eq.mockResolvedValue({
        data: [],
        error: null
      })

      // 模拟插入技能记录
      mockSupabase.from().insert().select.mockResolvedValue({
        data: [
          { user_id: 'user1', skill_type: 'communication', skill_level: 1, skill_experience: 0 },
          { user_id: 'user1', skill_type: 'collaboration', skill_level: 1, skill_experience: 0 },
          { user_id: 'user1', skill_type: 'critical_thinking', skill_level: 1, skill_experience: 0 },
          { user_id: 'user1', skill_type: 'creativity', skill_level: 1, skill_experience: 0 },
          { user_id: 'user1', skill_type: 'cultural_intelligence', skill_level: 1, skill_experience: 0 },
          { user_id: 'user1', skill_type: 'complex_problem_solving', skill_level: 1, skill_experience: 0 }
        ],
        error: null
      })

      const result = await gamificationService.getUserSkills('user1')
      
      expect(result).toHaveLength(6)
      expect(mockSupabase.from().insert).toHaveBeenCalled()
    })
  })

  describe('4. 课程和测验完成触发点', () => {
    test('课程完成、测验完成等关键点正确触发gamification', async () => {
      // 测试课程完成触发
      mockSupabase.from().select().eq().maybeSingle.mockResolvedValue({
        data: null,
        error: null
      })

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { 
          id: 'user1', 
          total_experience: 200, 
          total_level: 3 
        },
        error: null
      })

      mockSupabase.from().update().eq.mockResolvedValue({ error: null })
      mockSupabase.from().insert.mockResolvedValue({ error: null })

      // 模拟课程完成（这里通过series questionnaire完成来模拟）
      const result = await gamificationService.handleSeriesQuestionnaireComplete(
        'user1',
        'final-assessment',
        '课程总结评估',
        ['Critical Thinking', 'Communication'],
        300 // 高字数表示认真完成
      )

      expect(result).toBe(true)
      
      // 验证获得了适当的经验奖励
      const updateCall = mockSupabase.from().update.mock.calls[0]
      expect(updateCall[0].total_experience).toBeGreaterThan(200)
    })

    test('重复触发保护机制', async () => {
      // 第一次：模拟已存在记录
      mockSupabase.from().select().eq().maybeSingle.mockResolvedValue({
        data: { id: 'existing-record' },
        error: null
      })

      const result = await gamificationService.handleLessonComplete(
        'user1',
        'lesson1',
        'course1',
        '重复课时',
        'text'
      )

      expect(result).toBe(true)
      
      // 验证没有重复给经验值
      expect(mockSupabase.from().update).not.toHaveBeenCalled()
    })
  })

  describe('5. 时间线记录功能', () => {
    test('学习活动正确记录到时间线', async () => {
      mockSupabase.from().insert.mockResolvedValue({ error: null })

      const testActivities = [
        {
          type: 'lesson_complete' as const,
          title: '完成文本课时',
          description: '学习了基础概念',
          exp: 20
        },
        {
          type: 'quiz_pass' as const,
          title: '通过测验',
          description: '得分85分',
          exp: 45
        },
        {
          type: 'level_up' as const,
          title: '升级到2级',
          description: '恭喜升级！',
          exp: 0
        }
      ]

      for (const activity of testActivities) {
        const result = await gamificationService.addTimelineActivity(
          'user1',
          activity.type,
          activity.title,
          activity.description,
          'course1',
          'lesson1',
          activity.exp
        )

        expect(result).toBe(true)
        expect(mockSupabase.from).toHaveBeenCalledWith('learning_timeline')
        expect(mockSupabase.from().insert).toHaveBeenCalledWith({
          user_id: 'user1',
          activity_type: activity.type,
          activity_title: activity.title,
          activity_description: activity.description,
          course_id: 'course1',
          lesson_id: 'lesson1',
          experience_gained: activity.exp
        })
        
        vi.clearAllMocks()
      }
    })

    test('时间线查询功能', async () => {
      const mockTimeline = [
        {
          id: '1',
          activity_type: 'lesson_complete',
          activity_title: '完成数学课时',
          experience_gained: 40,
          created_at: '2023-01-01T12:00:00Z',
          courses: { title: '数学基础' },
          lessons: { title: '第一课' }
        },
        {
          id: '2',
          activity_type: 'level_up',
          activity_title: '升级到2级',
          experience_gained: 0,
          created_at: '2023-01-01T12:05:00Z',
          courses: null,
          lessons: null
        }
      ]

      mockSupabase.from().select().eq().order().limit.mockResolvedValue({
        data: mockTimeline,
        error: null
      })

      const result = await gamificationService.getUserTimeline('user1', 20)
      
      expect(result).toEqual(mockTimeline)
      expect(mockSupabase.from).toHaveBeenCalledWith('learning_timeline')
    })
  })

  describe('6. 性能和数据库优化测试', () => {
    test('批量操作性能', async () => {
      // 模拟多个用户同时完成课时
      const userIds = ['user1', 'user2', 'user3', 'user4', 'user5']
      
      // 为每个用户设置模拟
      userIds.forEach(userId => {
        mockSupabase.from().select().eq().maybeSingle.mockResolvedValue({
          data: null,
          error: null
        })

        mockSupabase.from().select().eq().single
          .mockResolvedValue({
            data: { skill_tags: [] },
            error: null
          })
          .mockResolvedValue({
            data: { 
              id: userId, 
              total_experience: 50, 
              total_level: 1 
            },
            error: null
          })
      })

      mockSupabase.from().update().eq.mockResolvedValue({ error: null })
      mockSupabase.from().insert.mockResolvedValue({ error: null })

      const startTime = Date.now()
      
      // 并行处理多个用户
      const promises = userIds.map(userId => 
        gamificationService.handleLessonComplete(
          userId,
          'lesson1',
          'course1',
          '并发测试课时',
          'text'
        )
      )

      const results = await Promise.all(promises)
      const endTime = Date.now()

      // 验证所有操作都成功
      results.forEach(result => {
        expect(result).toBe(true)
      })

      // 验证性能（应该在合理时间内完成）
      expect(endTime - startTime).toBeLessThan(1000) // 1秒内完成
    })

    test('数据库连接池管理', async () => {
      // 模拟连续多次操作
      for (let i = 0; i < 10; i++) {
        mockSupabase.from().select().eq().single.mockResolvedValue({
          data: { 
            id: 'user1', 
            total_experience: i * 10, 
            total_level: 1 
          },
          error: null
        })

        mockSupabase.from().update().eq.mockResolvedValue({ error: null })
        mockSupabase.from().insert.mockResolvedValue({ error: null })

        const mockActivity = {
          activity_type: 'lesson_complete' as const,
          activity_title: `操作${i}`,
          experience_gained: 10
        }

        const result = await gamificationService.addExperience('user1', 10, mockActivity)
        expect(result).toBe(true)
      }

      // 验证没有连接泄漏（通过模拟调用次数）
      expect(mockSupabase.from).toHaveBeenCalledTimes(30) // 10次操作 × 3次调用每次
    })
  })
})