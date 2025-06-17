#!/usr/bin/env node

/**
 * 性能测试脚本
 * 用于测试数据库优化前后的性能差异
 */

const { performance } = require('perf_hooks');

// 模拟 Supabase 客户端（需要根据实际情况调整）
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ooyklqqgnphynyrziqyh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9veWtscXFnbnBoeW55cnppcXloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1NzkyNDgsImV4cCI6MjA1OTE1NTI0OH0.d4Awen-9PnzlZTP51TpjjBkhrI3Dog4YELcbGlQs8jE';

const supabase = createClient(supabaseUrl, supabaseKey);

// 测试配置
const TEST_CONFIG = {
  iterations: 5,           // 每个测试运行次数
  courseId: null,          // 需要设置一个真实的课程ID
  userId: null,            // 需要设置一个真实的用户ID
  timeout: 30000           // 30秒超时
};

/**
 * 性能测试工具函数
 */
class PerformanceTester {
  constructor() {
    this.results = [];
  }

  async timeFunction(name, fn, iterations = 1) {
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      try {
        await fn();
        const end = performance.now();
        times.push(end - start);
      } catch (error) {
        console.error(`测试 ${name} 第 ${i + 1} 次失败:`, error.message);
        times.push(null);
      }
    }
    
    const validTimes = times.filter(t => t !== null);
    const avgTime = validTimes.length > 0 ? validTimes.reduce((a, b) => a + b, 0) / validTimes.length : 0;
    const minTime = validTimes.length > 0 ? Math.min(...validTimes) : 0;
    const maxTime = validTimes.length > 0 ? Math.max(...validTimes) : 0;
    
    const result = {
      name,
      iterations: validTimes.length,
      avgTime: Math.round(avgTime),
      minTime: Math.round(minTime),
      maxTime: Math.round(maxTime),
      successRate: (validTimes.length / iterations * 100).toFixed(1)
    };
    
    this.results.push(result);
    return result;
  }

  printResults() {
    console.log('\n📊 性能测试结果');
    console.log('='.repeat(80));
    console.log('测试名称'.padEnd(30) + '平均时间'.padEnd(12) + '最小时间'.padEnd(12) + '最大时间'.padEnd(12) + '成功率');
    console.log('-'.repeat(80));
    
    this.results.forEach(result => {
      console.log(
        result.name.padEnd(30) +
        `${result.avgTime}ms`.padEnd(12) +
        `${result.minTime}ms`.padEnd(12) +
        `${result.maxTime}ms`.padEnd(12) +
        `${result.successRate}%`
      );
    });
    console.log('='.repeat(80));
  }
}

/**
 * 数据库查询测试函数
 */
async function testOriginalCourseQuery(courseId) {
  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      course_modules (
        *,
        lessons (*)
      )
    `)
    .eq('id', courseId)
    .single();
    
  if (error) throw error;
  return data;
}

async function testOptimizedCourseQuery(courseId) {
  // 测试分层加载
  const coursePromise = supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single();
    
  const modulesPromise = supabase
    .from('course_modules')
    .select('id, title, description, order_index, course_id')
    .eq('course_id', courseId)
    .order('order_index');
    
  const [courseResult, modulesResult] = await Promise.all([coursePromise, modulesPromise]);
  
  if (courseResult.error) throw courseResult.error;
  if (modulesResult.error) throw modulesResult.error;
  
  return {
    ...courseResult.data,
    modules: modulesResult.data
  };
}

async function testDatabaseFunction(courseId) {
  const { data, error } = await supabase.rpc('get_course_basic_optimized', {
    p_course_id: courseId
  });
  
  if (error) throw error;
  return data;
}

async function testEnrollmentQuery(courseId, userId) {
  const { data, error } = await supabase
    .from('course_enrollments')
    .select(`
      *,
      courses:course_id(*)
    `)
    .eq('course_id', courseId)
    .eq('user_id', userId)
    .single();
    
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
  return data;
}

async function testOptimizedEnrollmentQuery(courseId, userId) {
  const { data, error } = await supabase.rpc('get_user_enrollment', {
    p_course_id: courseId,
    p_user_id: userId
  });
  
  if (error) throw error;
  return data;
}

/**
 * 主测试函数
 */
async function runPerformanceTests() {
  console.log('🚀 开始性能测试...\n');
  
  // 检查测试配置
  if (!TEST_CONFIG.courseId) {
    console.error('❌ 请设置 TEST_CONFIG.courseId');
    process.exit(1);
  }
  
  const tester = new PerformanceTester();
  
  console.log('📋 测试配置:');
  console.log(`- 课程ID: ${TEST_CONFIG.courseId}`);
  console.log(`- 用户ID: ${TEST_CONFIG.userId || '未设置'}`);
  console.log(`- 迭代次数: ${TEST_CONFIG.iterations}`);
  console.log(`- 超时时间: ${TEST_CONFIG.timeout}ms\n`);
  
  // 测试1: 原始课程查询 vs 优化后查询
  console.log('🔍 测试课程数据查询性能...');
  
  await tester.timeFunction(
    '原始课程查询（深度嵌套）',
    () => testOriginalCourseQuery(TEST_CONFIG.courseId),
    TEST_CONFIG.iterations
  );
  
  await tester.timeFunction(
    '优化课程查询（分层加载）',
    () => testOptimizedCourseQuery(TEST_CONFIG.courseId),
    TEST_CONFIG.iterations
  );
  
  // 测试2: 数据库函数性能
  console.log('🔧 测试数据库函数性能...');
  
  await tester.timeFunction(
    '数据库函数查询',
    () => testDatabaseFunction(TEST_CONFIG.courseId),
    TEST_CONFIG.iterations
  );
  
  // 测试3: 注册信息查询（如果有用户ID）
  if (TEST_CONFIG.userId) {
    console.log('👤 测试用户注册查询性能...');
    
    await tester.timeFunction(
      '原始注册查询',
      () => testEnrollmentQuery(TEST_CONFIG.courseId, TEST_CONFIG.userId),
      TEST_CONFIG.iterations
    );
    
    await tester.timeFunction(
      '优化注册查询',
      () => testOptimizedEnrollmentQuery(TEST_CONFIG.courseId, TEST_CONFIG.userId),
      TEST_CONFIG.iterations
    );
  }
  
  // 测试4: 并发查询测试
  console.log('⚡ 测试并发查询性能...');
  
  await tester.timeFunction(
    '并发课程查询（5个）',
    async () => {
      const promises = Array(5).fill().map(() => 
        testOptimizedCourseQuery(TEST_CONFIG.courseId)
      );
      await Promise.all(promises);
    },
    3
  );
  
  // 输出结果
  tester.printResults();
  
  // 生成建议
  console.log('\n💡 优化建议:');
  const results = tester.results;
  
  if (results.length >= 2) {
    const original = results.find(r => r.name.includes('原始'));
    const optimized = results.find(r => r.name.includes('优化'));
    
    if (original && optimized) {
      const improvement = ((original.avgTime - optimized.avgTime) / original.avgTime * 100).toFixed(1);
      console.log(`- 优化后查询速度提升: ${improvement}%`);
      
      if (improvement > 50) {
        console.log('✅ 优化效果显著！');
      } else if (improvement > 20) {
        console.log('⚠️  优化有效果，但还有提升空间');
      } else {
        console.log('❌ 优化效果不明显，需要进一步调整');
      }
    }
  }
  
  console.log('\n🎯 下一步行动:');
  console.log('1. 如果性能提升不明显，检查数据库索引是否正确创建');
  console.log('2. 考虑添加更多缓存层');
  console.log('3. 监控生产环境的实际性能表现');
}

/**
 * 设置测试参数并运行
 */
async function main() {
  // 从命令行参数获取配置
  const args = process.argv.slice(2);
  
  if (args.length >= 1) {
    TEST_CONFIG.courseId = args[0];
  }
  
  if (args.length >= 2) {
    TEST_CONFIG.userId = args[1];
  }
  
  if (!TEST_CONFIG.courseId) {
    console.log('使用方法: node test-performance.js <courseId> [userId]');
    console.log('示例: node test-performance.js 123e4567-e89b-12d3-a456-426614174000');
    process.exit(1);
  }
  
  try {
    await runPerformanceTests();
  } catch (error) {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  main();
}

module.exports = { PerformanceTester, runPerformanceTests };
