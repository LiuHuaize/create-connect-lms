#!/usr/bin/env node

/**
 * Gamification系统第一阶段测试验证脚本
 * 
 * 这个脚本可以快速验证gamification系统的核心功能
 * 无需复杂的测试环境设置
 */

import { 
  calculateLessonExperience, 
  calculateLevel, 
  calculateExpToNextLevel,
  calculateSkillLevel,
  EXPERIENCE_RULES 
} from '../src/services/gamificationService.js'

console.log('🚀 Gamification系统第一阶段验证开始...\n')

// 验证核心计算函数
function validateCoreCalculations() {
  console.log('📊 验证核心计算函数...')
  
  const tests = [
    {
      name: '文本课时经验值',
      actual: calculateLessonExperience('text'),
      expected: 20
    },
    {
      name: '测验满分经验值',
      actual: calculateLessonExperience('quiz', 100),
      expected: 60 // 40基础 + 20奖励
    },
    {
      name: '测验85分经验值',
      actual: calculateLessonExperience('quiz', 85),
      expected: 50 // 40基础 + 10奖励
    },
    {
      name: '等级计算(100经验)',
      actual: calculateLevel(100),
      expected: 2
    },
    {
      name: '等级计算(199经验)',
      actual: calculateLevel(199),
      expected: 2
    },
    {
      name: '等级计算(200经验)',
      actual: calculateLevel(200),
      expected: 3
    },
    {
      name: '距下一级经验(50经验)',
      actual: calculateExpToNextLevel(50),
      expected: 50 // 距离2级还需50
    },
    {
      name: '技能等级(100经验)',
      actual: calculateSkillLevel(100),
      expected: 3 // 100/50 + 1 = 3
    }
  ]
  
  let passed = 0
  let total = tests.length
  
  tests.forEach(test => {
    const success = test.actual === test.expected
    const status = success ? '✅' : '❌'
    console.log(`  ${status} ${test.name}: ${test.actual} (期望: ${test.expected})`)
    if (success) passed++
  })
  
  console.log(`\n📊 核心计算测试: ${passed}/${total} 通过\n`)
  return passed === total
}

// 验证配置一致性
function validateConfiguration() {
  console.log('⚙️ 验证配置一致性...')
  
  const tests = [
    {
      name: '等级经验值配置',
      test: () => EXPERIENCE_RULES.LEVEL_EXPERIENCE === 100
    },
    {
      name: '课时经验值递增合理性',
      test: () => {
        const exp = EXPERIENCE_RULES.LESSON_COMPLETE
        return exp.text < exp.video && 
               exp.video < exp.quiz && 
               exp.quiz < exp.assignment &&
               exp.assignment < exp.series_questionnaire
      }
    },
    {
      name: '分数奖励递减合理性',
      test: () => {
        const bonus = EXPERIENCE_RULES.QUIZ_SCORE_BONUS
        return bonus.perfect > bonus.excellent &&
               bonus.excellent > bonus.good &&
               bonus.good > bonus.pass &&
               bonus.pass > 0
      }
    },
    {
      name: '所有经验值为正数',
      test: () => {
        const exp = EXPERIENCE_RULES.LESSON_COMPLETE
        return Object.values(exp).every(val => val > 0)
      }
    }
  ]
  
  let passed = 0
  let total = tests.length
  
  tests.forEach(test => {
    const success = test.test()
    const status = success ? '✅' : '❌'
    console.log(`  ${status} ${test.name}`)
    if (success) passed++
  })
  
  console.log(`\n⚙️ 配置验证测试: ${passed}/${total} 通过\n`)
  return passed === total
}

// 验证边界条件
function validateBoundaryConditions() {
  console.log('🔍 验证边界条件...')
  
  const tests = [
    {
      name: '零经验值等级',
      test: () => calculateLevel(0) === 1
    },
    {
      name: '负分数不影响基础经验',
      test: () => calculateLessonExperience('quiz', -10) === 40
    },
    {
      name: '超高分数按满分处理',
      test: () => calculateLessonExperience('quiz', 150) === 60
    },
    {
      name: '极大经验值不崩溃',
      test: () => {
        const result = calculateLevel(999999)
        return Number.isInteger(result) && result > 0
      }
    },
    {
      name: '非测验课时分数不影响结果',
      test: () => calculateLessonExperience('text', 100) === 20
    }
  ]
  
  let passed = 0
  let total = tests.length
  
  tests.forEach(test => {
    const success = test.test()
    const status = success ? '✅' : '❌'
    console.log(`  ${status} ${test.name}`)
    if (success) passed++
  })
  
  console.log(`\n🔍 边界条件测试: ${passed}/${total} 通过\n`)
  return passed === total
}

// 性能测试
function validatePerformance() {
  console.log('⚡ 验证性能表现...')
  
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
  
  const success = duration < 100 // 应该在100ms内完成
  const status = success ? '✅' : '❌'
  
  console.log(`  ${status} 计算性能: ${duration.toFixed(2)}ms (${iterations}次计算)`)
  console.log(`\n⚡ 性能测试: ${success ? '通过' : '失败'}\n`)
  
  return success
}

// 运行所有验证
async function runValidation() {
  const results = [
    validateCoreCalculations(),
    validateConfiguration(),
    validateBoundaryConditions(),
    validatePerformance()
  ]
  
  const passed = results.filter(r => r).length
  const total = results.length
  
  console.log('📋 验证总结:')
  console.log(`  总测试模块: ${total}`)
  console.log(`  通过模块: ${passed}`)
  console.log(`  失败模块: ${total - passed}`)
  console.log(`  成功率: ${((passed / total) * 100).toFixed(1)}%`)
  
  if (passed === total) {
    console.log('\n🎉 所有验证通过！Gamification系统核心功能正常。')
    console.log('\n下一步建议:')
    console.log('  1. 运行完整单元测试: npm run test:run -- src/services/__tests__/gamificationService.core.test.ts')
    console.log('  2. 修复数据库模拟测试框架')
    console.log('  3. 在开发环境中测试实际用户操作')
  } else {
    console.log('\n⚠️ 部分验证失败，请检查gamificationService.ts实现。')
    process.exit(1)
  }
}

// 如果直接运行脚本
if (process.argv[1].endsWith('test-gamification.js')) {
  runValidation().catch(console.error)
}

export { runValidation }