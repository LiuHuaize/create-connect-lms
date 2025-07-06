/**
 * 系列问答服务性能基准测试
 * 用于验证数据库操作优化的效果
 */

import { seriesQuestionnaireService, seriesQuestionnaireCache } from '../../services/seriesQuestionnaireService';

interface BenchmarkResult {
  operation: string;
  iterations: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  cacheHitRate?: number;
}

class SeriesQuestionnaireBenchmark {
  private results: BenchmarkResult[] = [];

  /**
   * 运行基准测试
   */
  async runBenchmarks(): Promise<void> {
    console.log('🚀 开始系列问答服务性能基准测试\n');

    // 清除缓存
    this.clearCache();

    // 测试缓存性能
    await this.benchmarkCachePerformance();

    // 测试查询性能
    await this.benchmarkQueryPerformance();

    // 测试并发性能
    await this.benchmarkConcurrentAccess();

    // 输出结果
    this.printResults();
  }

  /**
   * 测试缓存性能
   */
  private async benchmarkCachePerformance(): Promise<void> {
    console.log('📊 测试缓存性能...');

    const params = {
      lesson_id: 'benchmark-lesson-123',
      page: 1,
      limit: 10
    };

    // 模拟数据库响应
    this.mockDatabaseResponse();

    // 第一次查询（无缓存）
    const firstQueryTimes = await this.measureOperation(
      'getSeriesQuestionnaires (无缓存)',
      5,
      () => seriesQuestionnaireService.getSeriesQuestionnaires(params)
    );

    // 第二次查询（有缓存）
    const cachedQueryTimes = await this.measureOperation(
      'getSeriesQuestionnaires (有缓存)',
      10,
      () => seriesQuestionnaireService.getSeriesQuestionnaires(params)
    );

    // 计算缓存性能提升
    const improvement = ((firstQueryTimes.averageTime - cachedQueryTimes.averageTime) / firstQueryTimes.averageTime * 100);
    console.log(`   缓存性能提升: ${improvement.toFixed(1)}%\n`);
  }

  /**
   * 测试查询性能
   */
  private async benchmarkQueryPerformance(): Promise<void> {
    console.log('📊 测试查询性能...');

    // 测试不同的查询场景
    const scenarios = [
      {
        name: '获取问答列表',
        operation: () => seriesQuestionnaireService.getSeriesQuestionnaires({
          lesson_id: 'test-lesson',
          page: 1,
          limit: 10
        })
      },
      {
        name: '获取提交状态',
        operation: () => seriesQuestionnaireService.getStudentSubmissionStatus('test-questionnaire')
      }
    ];

    for (const scenario of scenarios) {
      await this.measureOperation(scenario.name, 5, scenario.operation);
    }

    console.log();
  }

  /**
   * 测试并发访问性能
   */
  private async benchmarkConcurrentAccess(): Promise<void> {
    console.log('📊 测试并发访问性能...');

    const concurrentRequests = 20;
    const params = {
      lesson_id: 'concurrent-test-lesson',
      page: 1,
      limit: 10
    };

    const start = Date.now();

    // 并发执行多个请求
    const promises = Array.from({ length: concurrentRequests }, () =>
      seriesQuestionnaireService.getSeriesQuestionnaires(params)
    );

    const results = await Promise.all(promises);
    const totalTime = Date.now() - start;

    // 验证所有请求都成功
    const successCount = results.filter(r => r.success).length;
    const successRate = (successCount / concurrentRequests) * 100;

    console.log(`   并发请求数: ${concurrentRequests}`);
    console.log(`   成功率: ${successRate.toFixed(1)}%`);
    console.log(`   总耗时: ${totalTime}ms`);
    console.log(`   平均耗时: ${(totalTime / concurrentRequests).toFixed(1)}ms\n`);

    this.results.push({
      operation: '并发访问',
      iterations: concurrentRequests,
      totalTime,
      averageTime: totalTime / concurrentRequests,
      minTime: 0,
      maxTime: 0
    });
  }

  /**
   * 测量操作性能
   */
  private async measureOperation(
    operationName: string,
    iterations: number,
    operation: () => Promise<any>
  ): Promise<BenchmarkResult> {
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      try {
        await operation();
      } catch (error) {
        console.warn(`   操作失败: ${error}`);
      }
      const time = Date.now() - start;
      times.push(time);
    }

    const totalTime = times.reduce((sum, time) => sum + time, 0);
    const averageTime = totalTime / iterations;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    const result: BenchmarkResult = {
      operation: operationName,
      iterations,
      totalTime,
      averageTime,
      minTime,
      maxTime
    };

    this.results.push(result);

    console.log(`   ${operationName}:`);
    console.log(`     迭代次数: ${iterations}`);
    console.log(`     平均耗时: ${averageTime.toFixed(1)}ms`);
    console.log(`     最小耗时: ${minTime}ms`);
    console.log(`     最大耗时: ${maxTime}ms`);

    return result;
  }

  /**
   * 模拟数据库响应
   */
  private mockDatabaseResponse(): void {
    // 这里可以添加模拟数据库响应的逻辑
    // 在实际测试中，可以使用真实的数据库连接
  }

  /**
   * 清除缓存
   */
  private clearCache(): void {
    Object.keys(seriesQuestionnaireCache).forEach(key => {
      delete seriesQuestionnaireCache[key];
    });
  }

  /**
   * 输出测试结果
   */
  private printResults(): void {
    console.log('📋 基准测试结果汇总:');
    console.log('=' .repeat(80));
    console.log('操作名称'.padEnd(30) + '迭代次数'.padEnd(10) + '平均耗时'.padEnd(15) + '总耗时'.padEnd(15));
    console.log('-'.repeat(80));

    this.results.forEach(result => {
      console.log(
        result.operation.padEnd(30) +
        result.iterations.toString().padEnd(10) +
        `${result.averageTime.toFixed(1)}ms`.padEnd(15) +
        `${result.totalTime}ms`.padEnd(15)
      );
    });

    console.log('=' .repeat(80));

    // 性能建议
    this.printPerformanceRecommendations();
  }

  /**
   * 输出性能建议
   */
  private printPerformanceRecommendations(): void {
    console.log('\n💡 性能优化建议:');

    const cacheResults = this.results.filter(r => r.operation.includes('缓存'));
    if (cacheResults.length >= 2) {
      const noCacheTime = cacheResults.find(r => r.operation.includes('无缓存'))?.averageTime || 0;
      const cachedTime = cacheResults.find(r => r.operation.includes('有缓存'))?.averageTime || 0;
      
      if (noCacheTime > 0 && cachedTime > 0) {
        const improvement = ((noCacheTime - cachedTime) / noCacheTime * 100);
        if (improvement > 50) {
          console.log('✅ 缓存机制工作良好，性能提升显著');
        } else if (improvement > 20) {
          console.log('⚠️  缓存机制有效，但还有优化空间');
        } else {
          console.log('❌ 缓存机制效果不明显，需要检查实现');
        }
      }
    }

    const avgTime = this.results.reduce((sum, r) => sum + r.averageTime, 0) / this.results.length;
    if (avgTime < 50) {
      console.log('✅ 整体响应时间良好');
    } else if (avgTime < 200) {
      console.log('⚠️  响应时间可接受，建议进一步优化');
    } else {
      console.log('❌ 响应时间较慢，需要优化数据库查询和缓存策略');
    }

    console.log('\n🎯 优化建议:');
    console.log('1. 确保数据库索引正确创建');
    console.log('2. 使用适当的缓存策略');
    console.log('3. 优化查询字段，避免不必要的数据传输');
    console.log('4. 考虑使用连接池优化数据库连接');
    console.log('5. 监控并发访问性能，必要时使用队列机制');
  }
}

// 导出基准测试类
export { SeriesQuestionnaireBenchmark };

// 如果直接运行此文件，执行基准测试
if (require.main === module) {
  const benchmark = new SeriesQuestionnaireBenchmark();
  benchmark.runBenchmarks().catch(console.error);
}
