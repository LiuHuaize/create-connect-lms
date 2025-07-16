import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { seriesQuestionnaireService, seriesQuestionnaireCache } from '../services/seriesQuestionnaireService';
import { supabase } from '../integrations/supabase/client';
import { getCurrentUser } from '../utils/userSession';

// Mock dependencies
vi.mock('../integrations/supabase/client');
vi.mock('../utils/userSession');
vi.mock('../services/aiService');
vi.mock('../services/gamificationService');

const mockSupabase = vi.mocked(supabase);
const mockGetCurrentUser = vi.mocked(getCurrentUser);

describe('SeriesQuestionnaireService - Database Operation Optimization', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com'
  };

  const mockQuestionnaire = {
    id: 'questionnaire-123',
    title: '测试系列问答',
    description: '这是一个测试问答',
    lesson_id: 'lesson-123',
    ai_grading_prompt: '请评分',
    ai_grading_criteria: '评分标准',
    max_score: 100,
    skill_tags: ['Communication', 'Critical Thinking']
  };

  const mockQuestions = [
    {
      id: 'question-1',
      title: '问题1',
      question_text: '请回答问题1',
      order_index: 1,
      required: true,
      min_words: 10,
      max_words: 100
    },
    {
      id: 'question-2',
      title: '问题2',
      question_text: '请回答问题2',
      order_index: 2,
      required: true,
      min_words: 20,
      max_words: 200
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // 清除缓存
    Object.keys(seriesQuestionnaireCache).forEach(key => {
      delete seriesQuestionnaireCache[key];
    });
    
    mockGetCurrentUser.mockResolvedValue(mockUser);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('缓存功能测试', () => {
    it('应该缓存问答列表查询结果', async () => {
      const mockData = [mockQuestionnaire];
      const mockCount = 1;

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockData,
                error: null,
                count: mockCount
              })
            })
          })
        })
      } as any);

      // 第一次调用
      const result1 = await seriesQuestionnaireService.getSeriesQuestionnaires({
        lesson_id: 'lesson-123',
        page: 1,
        limit: 10
      });

      // 第二次调用应该使用缓存
      const result2 = await seriesQuestionnaireService.getSeriesQuestionnaires({
        lesson_id: 'lesson-123',
        page: 1,
        limit: 10
      });

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledTimes(1); // 只调用一次数据库
    });

    it('应该缓存学生提交状态', async () => {
      const mockSubmission = {
        id: 'submission-123',
        status: 'submitted',
        answers: [],
        total_words: 50
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockSubmission,
                error: null
              })
            })
          })
        })
      } as any);

      // 第一次调用
      const result1 = await seriesQuestionnaireService.getStudentSubmissionStatus('questionnaire-123');

      // 第二次调用应该使用缓存
      const result2 = await seriesQuestionnaireService.getStudentSubmissionStatus('questionnaire-123');

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledTimes(1); // 只调用一次数据库
    });
  });

  describe('事务处理测试', () => {
    it('创建系列问答时应该正确处理事务回滚', async () => {
      // Mock 课时验证成功
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'lesson-123',
                course_modules: {
                  courses: {
                    author_id: 'user-123'
                  }
                }
              },
              error: null
            })
          })
        })
      } as any);

      // Mock 问答创建成功
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockQuestionnaire,
              error: null
            })
          })
        })
      } as any);

      // Mock 问题创建失败
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: null,
            error: new Error('问题创建失败')
          })
        })
      } as any);

      // Mock 回滚删除
      mockSupabase.from.mockReturnValueOnce({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null
          })
        })
      } as any);

      const request = {
        title: '测试问答',
        description: '测试描述',
        lesson_id: 'lesson-123',
        questions: mockQuestions
      };

      const result = await seriesQuestionnaireService.createSeriesQuestionnaire(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('问题创建失败');
    });
  });

  describe('性能优化测试', () => {
    it('提交答案时应该使用缓存的问答信息', async () => {
      // 预设缓存
      const cacheKey = `questionnaire_${mockQuestionnaire.id}`;
      seriesQuestionnaireCache[cacheKey] = {
        ...mockQuestionnaire,
        questions: mockQuestions
      };

      // Mock 提交检查
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' } // 没有现有提交
              })
            })
          })
        })
      } as any);

      // Mock 创建提交
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'submission-123' },
              error: null
            })
          })
        })
      } as any);

      const request = {
        questionnaire_id: mockQuestionnaire.id,
        answers: [
          {
            question_id: 'question-1',
            answer_text: '这是一个测试答案，包含足够的字数来满足最小要求。'
          }
        ],
        status: 'submitted' as const
      };

      const result = await seriesQuestionnaireService.submitSeriesAnswers(request);

      expect(result.success).toBe(true);
      // 验证没有额外的数据库查询获取问答信息
      expect(mockSupabase.from).toHaveBeenCalledTimes(2); // 只有提交检查和创建提交
    });
  });

  describe('权限检查测试', () => {
    it('应该验证用户权限', async () => {
      // Mock 无权限的课时
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'lesson-123',
                course_modules: {
                  courses: {
                    author_id: 'other-user' // 不同的用户ID
                  }
                }
              },
              error: null
            })
          })
        })
      } as any);

      const request = {
        title: '测试问答',
        description: '测试描述',
        lesson_id: 'lesson-123',
        questions: []
      };

      const result = await seriesQuestionnaireService.createSeriesQuestionnaire(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('无权在此课时创建系列问答');
    });
  });
});
