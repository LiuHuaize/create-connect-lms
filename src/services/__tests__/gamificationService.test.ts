import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  calculateLessonExperience, 
  calculateLevel, 
  calculateExpToNextLevel,
  calculateSkillLevel,
  EXPERIENCE_RULES,
  SKILL_LEVEL_EXPERIENCE,
  gamificationService
} from '../gamificationService'

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

describe('gamificationService 单元测试', () => {
  describe('核心计算函数', () => {
    describe('calculateLessonExperience', () => {
      test('文本课时基础经验值', () => {
        expect(calculateLessonExperience('text')).toBe(20)
      })

      test('视频课时基础经验值', () => {
        expect(calculateLessonExperience('video')).toBe(30)
      })

      test('测验课时基础经验值', () => {
        expect(calculateLessonExperience('quiz')).toBe(40)
      })

      test('作业课时基础经验值', () => {
        expect(calculateLessonExperience('assignment')).toBe(50)
      })

      test('热点课时基础经验值', () => {
        expect(calculateLessonExperience('hotspot')).toBe(35)
      })

      test('卡片创建课时基础经验值', () => {
        expect(calculateLessonExperience('card_creator')).toBe(45)
      })

      test('系列问答课时基础经验值', () => {
        expect(calculateLessonExperience('series_questionnaire')).toBe(55)
      })

      test('测验课时完美分数奖励', () => {
        expect(calculateLessonExperience('quiz', 100)).toBe(60) // 40基础 + 20完美奖励
      })

      test('测验课时优秀分数奖励', () => {
        expect(calculateLessonExperience('quiz', 95)).toBe(55) // 40基础 + 15优秀奖励
        expect(calculateLessonExperience('quiz', 90)).toBe(55) // 40基础 + 15优秀奖励
      })

      test('测验课时良好分数奖励', () => {
        expect(calculateLessonExperience('quiz', 85)).toBe(50) // 40基础 + 10良好奖励
        expect(calculateLessonExperience('quiz', 80)).toBe(50) // 40基础 + 10良好奖励
      })

      test('测验课时及格分数奖励', () => {
        expect(calculateLessonExperience('quiz', 75)).toBe(45) // 40基础 + 5及格奖励
        expect(calculateLessonExperience('quiz', 60)).toBe(45) // 40基础 + 5及格奖励
      })

      test('测验课时不及格无奖励', () => {
        expect(calculateLessonExperience('quiz', 50)).toBe(40) // 40基础 + 0奖励
        expect(calculateLessonExperience('quiz', 0)).toBe(40)  // 40基础 + 0奖励
      })

      test('非测验课时传入分数不影响结果', () => {
        expect(calculateLessonExperience('text', 100)).toBe(20)
        expect(calculateLessonExperience('video', 0)).toBe(30)
      })
    })

    describe('calculateLevel', () => {
      test('等级计算正确性', () => {
        expect(calculateLevel(0)).toBe(1)
        expect(calculateLevel(50)).toBe(1)
        expect(calculateLevel(99)).toBe(1)
        expect(calculateLevel(100)).toBe(2)
        expect(calculateLevel(150)).toBe(2)
        expect(calculateLevel(199)).toBe(2)
        expect(calculateLevel(200)).toBe(3)
        expect(calculateLevel(1000)).toBe(11)
      })

      test('边界值测试', () => {
        expect(calculateLevel(EXPERIENCE_RULES.LEVEL_EXPERIENCE - 1)).toBe(1)
        expect(calculateLevel(EXPERIENCE_RULES.LEVEL_EXPERIENCE)).toBe(2)
        expect(calculateLevel(EXPERIENCE_RULES.LEVEL_EXPERIENCE * 2 - 1)).toBe(2)
        expect(calculateLevel(EXPERIENCE_RULES.LEVEL_EXPERIENCE * 2)).toBe(3)
      })
    })

    describe('calculateExpToNextLevel', () => {
      test('距离下一级经验值计算', () => {
        expect(calculateExpToNextLevel(0)).toBe(100)   // 距离2级还需100经验
        expect(calculateExpToNextLevel(50)).toBe(50)   // 距离2级还需50经验
        expect(calculateExpToNextLevel(99)).toBe(1)    // 距离2级还需1经验
        expect(calculateExpToNextLevel(100)).toBe(100) // 距离3级还需100经验
        expect(calculateExpToNextLevel(150)).toBe(50)  // 距离3级还需50经验
      })
    })

    describe('calculateSkillLevel', () => {
      test('技能等级计算正确性', () => {
        expect(calculateSkillLevel(0)).toBe(1)
        expect(calculateSkillLevel(25)).toBe(1)
        expect(calculateSkillLevel(49)).toBe(1)
        expect(calculateSkillLevel(50)).toBe(2)
        expect(calculateSkillLevel(75)).toBe(2)
        expect(calculateSkillLevel(99)).toBe(2)
        expect(calculateSkillLevel(100)).toBe(3)
      })

      test('技能等级边界值测试', () => {
        expect(calculateSkillLevel(SKILL_LEVEL_EXPERIENCE - 1)).toBe(1)
        expect(calculateSkillLevel(SKILL_LEVEL_EXPERIENCE)).toBe(2)
        expect(calculateSkillLevel(SKILL_LEVEL_EXPERIENCE * 2 - 1)).toBe(2)
        expect(calculateSkillLevel(SKILL_LEVEL_EXPERIENCE * 2)).toBe(3)
      })
    })
  })

  describe('数据库操作方法', () => {
    let mockSupabase: any

    beforeEach(() => {
      // 重置所有模拟
      vi.clearAllMocks()
      
      // 设置模拟的Supabase实例
      mockSupabase = {
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
    })

    describe('getUserProfile', () => {
      test('成功获取用户档案', async () => {
        const mockProfile = {
          id: 'user1',
          username: 'testuser',
          total_level: 1,
          total_experience: 50,
          title: '新手学习者',
          learning_streak: 0,
          last_activity_date: '2023-01-01'
        }

        mockSupabase.from().select().eq().single.mockResolvedValue({
          data: mockProfile,
          error: null
        })

        const result = await gamificationService.getUserProfile('user1')
        expect(result).toEqual(mockProfile)
        expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
      })

      test('用户不存在时返回null', async () => {
        mockSupabase.from().select().eq().single.mockResolvedValue({
          data: null,
          error: { message: 'User not found' }
        })

        const result = await gamificationService.getUserProfile('nonexistent')
        expect(result).toBeNull()
      })

      test('数据库错误时返回null', async () => {
        mockSupabase.from().select().eq().single.mockRejectedValue(
          new Error('Database connection failed')
        )

        const result = await gamificationService.getUserProfile('user1')
        expect(result).toBeNull()
      })
    })

    describe('addExperience', () => {
      const mockActivity = {
        activity_type: 'lesson_complete' as const,
        activity_title: '完成测试课时',
        experience_gained: 50
      }

      test('成功添加经验值无升级', async () => {
        const mockProfile = {
          id: 'user1',
          total_experience: 50,
          total_level: 1
        }

        mockSupabase.from().select().eq().single.mockResolvedValue({
          data: mockProfile,
          error: null
        })

        mockSupabase.from().update().eq.mockResolvedValue({
          error: null
        })

        mockSupabase.from().insert.mockResolvedValue({
          error: null
        })

        const result = await gamificationService.addExperience('user1', 30, mockActivity)
        
        expect(result).toBe(true)
        expect(mockSupabase.from().update).toHaveBeenCalledWith({
          total_experience: 80,
          total_level: 1,
          last_activity_date: expect.any(String)
        })
      })

      test('成功添加经验值并升级', async () => {
        const mockProfile = {
          id: 'user1',
          total_experience: 80,
          total_level: 1
        }

        mockSupabase.from().select().eq().single.mockResolvedValue({
          data: mockProfile,
          error: null
        })

        mockSupabase.from().update().eq.mockResolvedValue({
          error: null
        })

        mockSupabase.from().insert.mockResolvedValue({
          error: null
        })

        const result = await gamificationService.addExperience('user1', 50, mockActivity)
        
        expect(result).toBe(true)
        // 验证升级：80 + 50 = 130经验，应该是2级
        expect(mockSupabase.from().update).toHaveBeenCalledWith({
          total_experience: 130,
          total_level: 2,
          last_activity_date: expect.any(String)
        })
      })

      test('用户档案不存在时返回false', async () => {
        mockSupabase.from().select().eq().single.mockResolvedValue({
          data: null,
          error: { message: 'User not found' }
        })

        const result = await gamificationService.addExperience('user1', 50, mockActivity)
        expect(result).toBe(false)
      })

      test('更新档案失败时返回false', async () => {
        const mockProfile = {
          id: 'user1',
          total_experience: 50,
          total_level: 1
        }

        mockSupabase.from().select().eq().single.mockResolvedValue({
          data: mockProfile,
          error: null
        })

        mockSupabase.from().update().eq.mockResolvedValue({
          error: { message: 'Update failed' }
        })

        const result = await gamificationService.addExperience('user1', 50, mockActivity)
        expect(result).toBe(false)
      })
    })

    describe('addTimelineActivity', () => {
      test('成功添加时间线活动', async () => {
        mockSupabase.from().insert.mockResolvedValue({
          error: null
        })

        const result = await gamificationService.addTimelineActivity(
          'user1',
          'lesson_complete',
          '完成课时',
          '测试描述',
          'course1',
          'lesson1',
          50
        )

        expect(result).toBe(true)
        expect(mockSupabase.from).toHaveBeenCalledWith('learning_timeline')
        expect(mockSupabase.from().insert).toHaveBeenCalledWith({
          user_id: 'user1',
          activity_type: 'lesson_complete',
          activity_title: '完成课时',
          activity_description: '测试描述',
          course_id: 'course1',
          lesson_id: 'lesson1',
          experience_gained: 50
        })
      })

      test('插入失败时返回false', async () => {
        mockSupabase.from().insert.mockResolvedValue({
          error: { message: 'Insert failed' }
        })

        const result = await gamificationService.addTimelineActivity(
          'user1',
          'lesson_complete',
          '完成课时'
        )

        expect(result).toBe(false)
      })
    })

    describe('getUserTimeline', () => {
      test('成功获取用户时间线', async () => {
        const mockTimeline = [
          {
            id: '1',
            activity_type: 'lesson_complete',
            activity_title: '完成课时',
            experience_gained: 50,
            created_at: '2023-01-01T00:00:00Z'
          }
        ]

        mockSupabase.from().select().eq().order().limit.mockResolvedValue({
          data: mockTimeline,
          error: null
        })

        const result = await gamificationService.getUserTimeline('user1', 10)
        
        expect(result).toEqual(mockTimeline)
        expect(mockSupabase.from).toHaveBeenCalledWith('learning_timeline')
      })

      test('数据库错误时返回空数组', async () => {
        mockSupabase.from().select().eq().order().limit.mockResolvedValue({
          data: null,
          error: { message: 'Query failed' }
        })

        const result = await gamificationService.getUserTimeline('user1')
        expect(result).toEqual([])
      })
    })
  })

  describe('边界条件和错误处理', () => {
    test('经验值为负数时的行为', () => {
      // calculateLessonExperience不应该返回负数
      expect(calculateLessonExperience('text', -100)).toBe(20)
    })

    test('极大经验值的等级计算', () => {
      const largeExp = 1000000
      const expectedLevel = Math.floor(largeExp / EXPERIENCE_RULES.LEVEL_EXPERIENCE) + 1
      expect(calculateLevel(largeExp)).toBe(expectedLevel)
    })

    test('技能经验计算边界值', () => {
      const skillCalc = gamificationService.calculateSkillExperience
      
      // 基础技能经验应该不为负
      expect(skillCalc('text')).toBeGreaterThan(0)
      expect(skillCalc('quiz', 100)).toBeGreaterThan(0)
      expect(skillCalc('series_questionnaire', 0)).toBeGreaterThan(0)
    })
  })
})