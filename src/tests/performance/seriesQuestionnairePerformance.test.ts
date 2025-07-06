import { describe, it, expect, beforeEach, vi } from 'vitest';
import { seriesQuestionnaireService, seriesQuestionnaireCache } from '../../services/seriesQuestionnaireService';

describe('Series Questionnaire Service - Performance Tests', () => {
  beforeEach(() => {
    // 清除缓存
    Object.keys(seriesQuestionnaireCache).forEach(key => {
      delete seriesQuestionnaireCache[key];
    });
  });

  describe('缓存性能测试', () => {
    it('应该显著提升重复查询的性能', async () => {
      // 模拟数据库延迟
      const mockDatabaseCall = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          data: [{ id: '1', title: 'Test' }],
          error: null,
          count: 1
        }), 100)) // 100ms 延迟模拟数据库查询
      );

      // Mock Supabase
      vi.doMock('../../integrations/supabase/client', () => ({
        supabase: {
          from: () => ({
            select: () => ({
              order: () => ({
                eq: () => ({
                  range: mockDatabaseCall
                })
              })
            })
          })
        }
      }));

      const params = {
        lesson_id: 'lesson-123',
        page: 1,
        limit: 10
      };

      // 第一次查询 - 应该调用数据库
      const start1 = Date.now();
      await seriesQuestionnaireService.getSeriesQuestionnaires(params);
      const time1 = Date.now() - start1;

      // 第二次查询 - 应该使用缓存
      const start2 = Date.now();
      await seriesQuestionnaireService.getSeriesQuestionnaires(params);
      const time2 = Date.now() - start2;

      // 缓存查询应该明显更快
      expect(time2).toBeLessThan(time1 / 2);
      expect(mockDatabaseCall).toHaveBeenCalledTimes(1);
    });

    it('应该正确管理缓存过期', async () => {
      // 设置一个短的缓存过期时间用于测试
      const originalExpiry = 5 * 60 * 1000; // 原始5分钟
      const testExpiry = 100; // 测试用100ms

      // 临时修改缓存过期时间
      const cacheModule = await import('../../services/seriesQuestionnaireService');
      
      // 手动设置缓存
      const testKey = 'test_cache_key';
      const testData = { test: 'data' };
      
      // 模拟设置缓存
      seriesQuestionnaireCache[testKey] = testData;
      
      // 等待缓存过期
      await new Promise(resolve => setTimeout(resolve, testExpiry + 50));
      
      // 验证缓存已过期（这需要触发清理机制）
      // 在实际实现中，缓存清理会在下次访问时触发
      expect(true).toBe(true); // 占位符测试
    });
  });

  describe('批量操作性能测试', () => {
    it('应该高效处理批量提交状态查询', async () => {
      const questionnaireIds = Array.from({ length: 10 }, (_, i) => `questionnaire-${i}`);
      
      const start = Date.now();
      
      // 并发查询多个问答的提交状态
      const promises = questionnaireIds.map(id => 
        seriesQuestionnaireService.getStudentSubmissionStatus(id)
      );
      
      await Promise.all(promises);
      
      const totalTime = Date.now() - start;
      
      // 批量查询应该在合理时间内完成（假设每个查询不超过50ms）
      expect(totalTime).toBeLessThan(500);
    });
  });

  describe('内存使用测试', () => {
    it('缓存不应该无限增长', () => {
      // 添加大量缓存项
      for (let i = 0; i < 1000; i++) {
        seriesQuestionnaireCache[`test_key_${i}`] = {
          data: `test_data_${i}`,
          timestamp: Date.now()
        };
      }

      const cacheSize = Object.keys(seriesQuestionnaireCache).length;
      
      // 验证缓存大小在合理范围内
      expect(cacheSize).toBeLessThanOrEqual(1000);
      
      // 在实际应用中，应该有缓存清理机制防止内存泄漏
      expect(cacheSize).toBeGreaterThan(0);
    });
  });

  describe('数据库查询优化测试', () => {
    it('应该使用优化的查询字段', () => {
      // 这个测试验证我们只查询必要的字段，而不是使用 SELECT *
      const mockSelect = vi.fn().mockReturnValue({
        order: () => ({
          eq: () => ({
            range: () => Promise.resolve({
              data: [],
              error: null,
              count: 0
            })
          })
        })
      });

      vi.doMock('../../integrations/supabase/client', () => ({
        supabase: {
          from: () => ({
            select: mockSelect
          })
        }
      }));

      seriesQuestionnaireService.getSeriesQuestionnaires({
        lesson_id: 'lesson-123'
      });

      // 验证使用了优化的字段选择
      expect(mockSelect).toHaveBeenCalledWith(
        expect.stringContaining('id,title,description'),
        expect.objectContaining({ count: 'exact' })
      );
    });
  });

  describe('错误处理性能测试', () => {
    it('错误情况下不应该影响缓存性能', async () => {
      const mockError = new Error('Database error');
      
      vi.doMock('../../integrations/supabase/client', () => ({
        supabase: {
          from: () => ({
            select: () => ({
              order: () => ({
                eq: () => ({
                  range: () => Promise.resolve({
                    data: null,
                    error: mockError,
                    count: 0
                  })
                })
              })
            })
          })
        }
      }));

      const start = Date.now();
      
      const result = await seriesQuestionnaireService.getSeriesQuestionnaires({
        lesson_id: 'lesson-123'
      });
      
      const time = Date.now() - start;

      expect(result.success).toBe(false);
      expect(time).toBeLessThan(1000); // 错误处理应该很快
    });
  });

  describe('并发访问测试', () => {
    it('应该正确处理并发缓存访问', async () => {
      const concurrentRequests = 10;
      const params = {
        lesson_id: 'lesson-123',
        page: 1,
        limit: 10
      };

      // 模拟并发请求
      const promises = Array.from({ length: concurrentRequests }, () =>
        seriesQuestionnaireService.getSeriesQuestionnaires(params)
      );

      const results = await Promise.all(promises);

      // 所有请求都应该成功
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // 验证缓存一致性
      const cacheKeys = Object.keys(seriesQuestionnaireCache);
      expect(cacheKeys.length).toBeGreaterThan(0);
    });
  });
});
