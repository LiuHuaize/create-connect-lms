import { describe, it, expect, vi, beforeEach } from 'vitest';
import { seriesQuestionnaireService } from '../seriesQuestionnaireService';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentUser } from '@/utils/userSession';

// Mock dependencies
vi.mock('@/integrations/supabase/client');
vi.mock('@/utils/userSession');

const mockSupabase = vi.mocked(supabase);
const mockGetCurrentUser = vi.mocked(getCurrentUser);

describe('seriesQuestionnaireService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createSeriesQuestionnaire', () => {
    it('should create a series questionnaire successfully', async () => {
      // Mock user
      mockGetCurrentUser.mockResolvedValue({ id: 'user-1' } as any);

      // Mock lesson check
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'lesson-1',
                course_modules: {
                  courses: {
                    author_id: 'user-1'
                  }
                }
              },
              error: null
            })
          })
        })
      } as any);

      // Mock questionnaire creation
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'questionnaire-1', title: 'Test Questionnaire' },
              error: null
            })
          })
        })
      } as any);

      // Mock questions creation
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ error: null })
      } as any);

      // Mock final fetch
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'questionnaire-1',
                title: 'Test Questionnaire',
                questions: []
              },
              error: null
            })
          })
        })
      } as any);

      const request = {
        title: 'Test Questionnaire',
        lesson_id: 'lesson-1',
        questions: [
          {
            title: 'Question 1',
            question_text: 'What is your name?',
            order_index: 1
          }
        ]
      };

      const result = await seriesQuestionnaireService.createSeriesQuestionnaire(request);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.title).toBe('Test Questionnaire');
    });

    it('should fail when user is not logged in', async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const request = {
        title: 'Test Questionnaire',
        lesson_id: 'lesson-1',
        questions: []
      };

      const result = await seriesQuestionnaireService.createSeriesQuestionnaire(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('用户未登录');
    });

    it('should fail with validation errors', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'user-1' } as any);

      const request = {
        title: '', // Empty title should fail validation
        lesson_id: 'lesson-1',
        questions: []
      };

      const result = await seriesQuestionnaireService.createSeriesQuestionnaire(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('标题不能为空');
    });
  });

  describe('submitSeriesAnswers', () => {
    it('should submit answers successfully', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'student-1' } as any);

      // Mock questionnaire fetch
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'questionnaire-1',
                questions: [
                  { id: 'question-1', required: true, min_words: 0, max_words: 100 }
                ]
              },
              error: null
            })
          })
        })
      } as any);

      // Mock existing submission check
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' } // Not found
              })
            })
          })
        })
      } as any);

      // Mock submission creation
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'submission-1', status: 'submitted' },
              error: null
            })
          })
        })
      } as any);

      const request = {
        questionnaire_id: 'questionnaire-1',
        answers: [
          { question_id: 'question-1', answer_text: 'My answer' }
        ],
        status: 'submitted' as const
      };

      const result = await seriesQuestionnaireService.submitSeriesAnswers(request);

      expect(result.success).toBe(true);
      expect(result.data?.submission).toBeDefined();
    });
  });
});
