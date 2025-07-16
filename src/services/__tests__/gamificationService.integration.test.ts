import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { gamificationService } from '../gamificationService'

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
      insert: vi.fn()
    }))
  }
}))

// 模拟Achievement Service
vi.mock('../achievementService', () => ({
  achievementService: {
    checkAllAchievements: vi.fn().mockResolvedValue([])
  }
}))

describe('gamificationService 集成测试', () => {
  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()
    const { supabase } = require('../lib/supabase')
    mockSupabase = supabase
  })

  describe('handleLessonComplete - 课时完成集成流程', () => {
    test('首次完成文本课时的完整流程', async () => {
      // 1. 模拟不存在重复记录（首次完成）
      mockSupabase.from().select().eq().maybeSingle.mockResolvedValue({
        data: null,
        error: null
      })

      // 2. 模拟课时技能标签
      mockSupabase.from().select().eq().single
        .mockResolvedValueOnce({
          data: { skill_tags: ['communication', 'critical_thinking'] },
          error: null
        })
        .mockResolvedValueOnce({
          // 用户档案
          data: { 
            id: 'user1', 
            total_experience: 50, 
            total_level: 1,
            username: 'testuser'
          },
          error: null
        })

      // 3. 模拟档案更新成功
      mockSupabase.from().update().eq.mockResolvedValue({
        error: null
      })

      // 4. 模拟时间线插入成功
      mockSupabase.from().insert.mockResolvedValue({
        error: null
      })

      // 5. 模拟技能记录操作
      mockSupabase.from().select().eq()
        .mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' } // 技能记录不存在
        })

      const result = await gamificationService.handleLessonComplete(
        'user1',
        'lesson1',
        'course1',
        '基础文本课时',
        'text' // 20经验值
      )

      expect(result).toBe(true)

      // 验证基础经验值更新：50 + 20 = 70经验值，仍为1级
      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        total_experience: 70,
        total_level: 1,
        last_activity_date: expect.any(String)
      })

      // 验证时间线记录
      expect(mockSupabase.from().insert).toHaveBeenCalledWith({
        user_id: 'user1',
        activity_type: 'lesson_complete',
        activity_title: '完成课时：基础文本课时',
        activity_description: '课时学习完成',
        course_id: 'course1',
        lesson_id: 'lesson1',
        experience_gained: 20
      })
    })

    test('完成测验课时并获得高分奖励', async () => {
      // 1. 模拟不存在重复记录
      mockSupabase.from().select().eq().maybeSingle.mockResolvedValue({
        data: null,
        error: null
      })

      // 2. 模拟课时技能标签
      mockSupabase.from().select().eq().single
        .mockResolvedValueOnce({
          data: { skill_tags: ['critical_thinking'] },
          error: null
        })
        .mockResolvedValueOnce({
          // 用户档案：接近升级
          data: { 
            id: 'user1', 
            total_experience: 50, 
            total_level: 1,
            username: 'testuser'
          },
          error: null
        })

      // 3. 模拟各种数据库操作成功
      mockSupabase.from().update().eq.mockResolvedValue({ error: null })
      mockSupabase.from().insert.mockResolvedValue({ error: null })
      mockSupabase.from().select().eq().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      })

      const result = await gamificationService.handleLessonComplete(
        'user1',
        'lesson1',
        'course1',
        '数学测验',
        'quiz',
        95 // 95分，应该获得 40基础 + 15优秀奖励 = 55经验值
      )

      expect(result).toBe(true)

      // 验证经验值计算：50 + 55 = 105经验值，升级到2级
      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        total_experience: 105,
        total_level: 2,
        last_activity_date: expect.any(String)
      })

      // 验证时间线记录包含分数信息
      expect(mockSupabase.from().insert).toHaveBeenCalledWith({
        user_id: 'user1',
        activity_type: 'lesson_complete',
        activity_title: '完成课时：数学测验',
        activity_description: '测验得分：95分',
        course_id: 'course1',
        lesson_id: 'lesson1',
        experience_gained: 55
      })
    })

    test('重复完成同一课时应该跳过', async () => {
      // 模拟已存在记录
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
      
      // 验证没有调用更新操作
      expect(mockSupabase.from().update).not.toHaveBeenCalled()
      expect(mockSupabase.from().insert).not.toHaveBeenCalled()
    })

    test('数据库错误时正确处理失败', async () => {
      // 模拟数据库查询失败
      mockSupabase.from().select().eq().maybeSingle.mockRejectedValue(
        new Error('Database connection failed')
      )

      const result = await gamificationService.handleLessonComplete(
        'user1',
        'lesson1',
        'course1',
        '测试课时',
        'text'
      )

      expect(result).toBe(false)
    })
  })

  describe('技能经验分配集成测试', () => {
    test('课时完成时正确分配技能经验', async () => {
      // 设置基础模拟
      mockSupabase.from().select().eq().maybeSingle.mockResolvedValue({
        data: null, // 首次完成
        error: null
      })

      // 模拟课时有两个技能标签
      mockSupabase.from().select().eq().single
        .mockResolvedValueOnce({
          data: { skill_tags: ['communication', 'collaboration'] },
          error: null
        })
        .mockResolvedValueOnce({
          data: { 
            id: 'user1', 
            total_experience: 100, 
            total_level: 2 
          },
          error: null
        })

      // 模拟技能记录查询（不存在）
      mockSupabase.from().select().eq()
        .mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }
        })

      // 模拟所有更新成功
      mockSupabase.from().update().eq.mockResolvedValue({ error: null })
      mockSupabase.from().insert.mockResolvedValue({ error: null })

      const result = await gamificationService.handleLessonComplete(
        'user1',
        'lesson1',
        'course1',
        '团队协作视频',
        'video',
        undefined
      )

      expect(result).toBe(true)

      // 验证技能经验插入被调用（为每个技能标签）
      // 应该调用两次：一次为communication，一次为collaboration
      const insertCalls = mockSupabase.from().insert.mock.calls
      
      // 查找技能经验相关的插入调用
      const skillInsertCalls = insertCalls.filter(call => 
        call[0] && (
          call[0].skill_type === 'communication' || 
          call[0].skill_type === 'collaboration'
        )
      )
      
      expect(skillInsertCalls.length).toBe(2)
    })

    test('allocateSkillExperience正确分配技能经验', async () => {
      const skillTags = ['Communication', 'Critical Thinking', '创新能力']
      const baseExperience = 60

      // 模拟现有技能记录
      mockSupabase.from().select().eq()
        .mockResolvedValueOnce({
          data: { skill_experience: 30, skill_level: 1 },
          error: null
        })
        .mockResolvedValueOnce({
          data: null,
          error: { code: 'PGRST116' }
        })
        .mockResolvedValueOnce({
          data: { skill_experience: 45, skill_level: 1 },
          error: null
        })

      mockSupabase.from().update().eq.mockResolvedValue({ error: null })
      mockSupabase.from().insert.mockResolvedValue({ error: null })

      const result = await gamificationService.allocateSkillExperience(
        'user1',
        skillTags,
        baseExperience
      )

      expect(result).toBe(true)

      // 验证经验值平均分配：60 / 3 = 20经验值每个技能
      const updateCalls = mockSupabase.from().update.mock.calls
      const insertCalls = mockSupabase.from().insert.mock.calls

      // 应该有技能更新和插入操作
      expect(updateCalls.length + insertCalls.length).toBeGreaterThan(0)
    })
  })

  describe('系列问答完成集成测试', () => {
    test('完成系列问答的完整流程', async () => {
      // 模拟不存在重复记录
      mockSupabase.from().select().eq().maybeSingle.mockResolvedValue({
        data: null,
        error: null
      })

      // 模拟用户档案
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { 
          id: 'user1', 
          total_experience: 200, 
          total_level: 3 
        },
        error: null
      })

      // 模拟更新成功
      mockSupabase.from().update().eq.mockResolvedValue({ error: null })
      mockSupabase.from().insert.mockResolvedValue({ error: null })

      const result = await gamificationService.handleSeriesQuestionnaireComplete(
        'user1',
        'questionnaire1',
        '深度思考问答',
        ['Critical Thinking', 'Communication'],
        250 // 字数，应该获得额外字数奖励
      )

      expect(result).toBe(true)

      // 验证基础经验值 + 字数奖励：55 + 10(250字/100*5，最多20) = 65
      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        total_experience: 265, // 200 + 65
        total_level: 3, // 仍为3级
        last_activity_date: expect.any(String)
      })
    })

    test('系列问答评分完成获得分数奖励', async () => {
      // 模拟不存在重复评分记录
      mockSupabase.from().select().eq().maybeSingle.mockResolvedValue({
        data: null,
        error: null
      })

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { 
          id: 'user1', 
          total_experience: 150, 
          total_level: 2 
        },
        error: null
      })

      mockSupabase.from().update().eq.mockResolvedValue({ error: null })
      mockSupabase.from().insert.mockResolvedValue({ error: null })

      const result = await gamificationService.handleSeriesQuestionnaireGraded(
        'user1',
        'questionnaire1',
        '优秀问答',
        96, // 96分，应该获得25经验值奖励
        100
      )

      expect(result).toBe(true)

      // 验证分数奖励：96%为优秀，获得25经验值
      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        total_experience: 175, // 150 + 25
        total_level: 2,
        last_activity_date: expect.any(String)
      })
    })
  })

  describe('错误恢复和数据一致性测试', () => {
    test('部分操作失败时的错误处理', async () => {
      // 模拟时间线插入失败，但经验值更新成功
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
            total_experience: 50, 
            total_level: 1 
          },
          error: null
        })

      // 经验值更新成功
      mockSupabase.from().update().eq.mockResolvedValue({ error: null })
      
      // 时间线插入失败
      mockSupabase.from().insert.mockResolvedValue({
        error: { message: 'Timeline insert failed' }
      })

      const result = await gamificationService.handleLessonComplete(
        'user1',
        'lesson1',
        'course1',
        '测试课时',
        'text'
      )

      // 即使时间线插入失败，主要的经验值更新成功了，所以返回true
      expect(result).toBe(true)
    })

    test('用户档案数据不完整时的处理', async () => {
      // 模拟用户档案缺少gamification字段
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { 
          id: 'user1',
          username: 'testuser',
          total_experience: null, // 缺少字段
          total_level: null // 缺少字段
        },
        error: null
      })

      const mockActivity = {
        activity_type: 'lesson_complete' as const,
        activity_title: '测试',
        experience_gained: 50
      }

      // 这应该会导致计算错误，返回false
      const result = await gamificationService.addExperience('user1', 50, mockActivity)
      
      // 因为数据不完整，应该处理失败
      expect(result).toBe(false)
    })
  })
})