/**
 * 第一阶段gamification系统验证脚本
 * 这个脚本提供了验证第一阶段核心修复的实用工具
 */

import { supabase } from '../lib/supabase'
import { gamificationService, calculateLevel, calculateLessonExperience } from '../services/gamificationService'

export interface ValidationResult {
  test: string
  passed: boolean
  message: string
  data?: any
}

export class Phase1Validator {
  private results: ValidationResult[] = []

  /**
   * 运行所有第一阶段验证测试
   */
  async runAllValidations(userId: string): Promise<ValidationResult[]> {
    this.results = []
    
    console.log('🚀 开始第一阶段gamification系统验证...')
    
    await this.validateCoreCalculations()
    await this.validateUserProfileIntegrity(userId)
    await this.validateExperienceUpdate(userId)
    await this.validateLessonCompletion(userId)
    await this.validateTimelineRecording(userId)
    await this.validateSkillInitialization(userId)
    
    const passedCount = this.results.filter(r => r.passed).length
    const totalCount = this.results.length
    
    console.log(`✅ 验证完成: ${passedCount}/${totalCount} 通过`)
    
    return this.results
  }

  /**
   * 验证核心计算函数
   */
  async validateCoreCalculations(): Promise<void> {
    console.log('📊 验证核心计算函数...')
    
    try {
      // 测试经验值计算
      const textExp = calculateLessonExperience('text')
      this.addResult('经验值计算-文本', textExp === 20, `文本课时经验值: ${textExp}`)
      
      const quizExpPerfect = calculateLessonExperience('quiz', 100)
      this.addResult('经验值计算-测验满分', quizExpPerfect === 60, `测验满分经验值: ${quizExpPerfect}`)
      
      // 测试等级计算
      const level1 = calculateLevel(0)
      const level2 = calculateLevel(100)
      const level3 = calculateLevel(200)
      
      this.addResult('等级计算-边界值', 
        level1 === 1 && level2 === 2 && level3 === 3, 
        `等级计算: 0exp=${level1}, 100exp=${level2}, 200exp=${level3}`)
      
    } catch (error) {
      this.addResult('核心计算函数', false, `计算函数错误: ${error}`)
    }
  }

  /**
   * 验证用户档案数据完整性
   */
  async validateUserProfileIntegrity(userId: string): Promise<void> {
    console.log('👤 验证用户档案数据完整性...')
    
    try {
      const profile = await gamificationService.getUserProfile(userId)
      
      if (!profile) {
        this.addResult('用户档案获取', false, '无法获取用户档案')
        return
      }
      
      const hasRequiredFields = profile.total_experience !== undefined && 
                               profile.total_level !== undefined &&
                               profile.username !== undefined
      
      this.addResult('用户档案完整性', hasRequiredFields, 
        `档案字段: exp=${profile.total_experience}, level=${profile.total_level}`)
      
      // 验证等级和经验值的一致性
      const calculatedLevel = calculateLevel(profile.total_experience)
      const levelConsistent = calculatedLevel === profile.total_level
      
      this.addResult('等级经验值一致性', levelConsistent,
        `存储等级=${profile.total_level}, 计算等级=${calculatedLevel}`)
      
    } catch (error) {
      this.addResult('用户档案验证', false, `档案验证错误: ${error}`)
    }
  }

  /**
   * 验证经验值更新机制
   */
  async validateExperienceUpdate(userId: string): Promise<void> {
    console.log('⚡ 验证经验值更新机制...')
    
    try {
      const beforeProfile = await gamificationService.getUserProfile(userId)
      if (!beforeProfile) {
        this.addResult('经验值更新-前置条件', false, '无法获取初始用户档案')
        return
      }
      
      const initialExp = beforeProfile.total_experience
      const testActivity = {
        activity_type: 'lesson_complete' as const,
        activity_title: '验证测试课时',
        experience_gained: 25
      }
      
      // 尝试添加25经验值
      const updateResult = await gamificationService.addExperience(userId, 25, testActivity)
      
      if (!updateResult) {
        this.addResult('经验值更新-添加', false, '经验值添加失败')
        return
      }
      
      // 等待一秒确保数据库更新
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const afterProfile = await gamificationService.getUserProfile(userId)
      if (!afterProfile) {
        this.addResult('经验值更新-后验证', false, '无法获取更新后用户档案')
        return
      }
      
      const expIncreased = afterProfile.total_experience > initialExp
      const correctIncrease = afterProfile.total_experience === initialExp + 25
      
      this.addResult('经验值增加', expIncreased, 
        `经验值: ${initialExp} -> ${afterProfile.total_experience}`)
      
      this.addResult('经验值增量正确', correctIncrease,
        `预期: ${initialExp + 25}, 实际: ${afterProfile.total_experience}`)
      
    } catch (error) {
      this.addResult('经验值更新验证', false, `更新验证错误: ${error}`)
    }
  }

  /**
   * 验证课时完成流程
   */
  async validateLessonCompletion(userId: string): Promise<void> {
    console.log('📚 验证课时完成流程...')
    
    try {
      const beforeProfile = await gamificationService.getUserProfile(userId)
      if (!beforeProfile) {
        this.addResult('课时完成-前置条件', false, '无法获取初始用户档案')
        return
      }
      
      const initialExp = beforeProfile.total_experience
      const testLessonId = `test-lesson-${Date.now()}`
      
      // 模拟完成一个测验课时，80分
      const completionResult = await gamificationService.handleLessonComplete(
        userId,
        testLessonId,
        'test-course',
        '验证测试课时',
        'quiz',
        80 // 80分应该获得 40基础 + 10良好奖励 = 50经验值
      )
      
      this.addResult('课时完成处理', completionResult, 
        completionResult ? '课时完成处理成功' : '课时完成处理失败')
      
      if (completionResult) {
        // 等待数据库更新
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const afterProfile = await gamificationService.getUserProfile(userId)
        if (afterProfile) {
          const expGained = afterProfile.total_experience - initialExp
          const expectedGain = 50 // quiz 80分的预期经验值
          
          this.addResult('课时经验值获得', expGained > 0,
            `获得经验值: ${expGained} (预期: ${expectedGain})`)
          
          // 验证等级更新
          const expectedLevel = calculateLevel(afterProfile.total_experience)
          this.addResult('课时后等级更新', afterProfile.total_level === expectedLevel,
            `等级: ${afterProfile.total_level} (预期: ${expectedLevel})`)
        }
      }
      
    } catch (error) {
      this.addResult('课时完成验证', false, `课时完成验证错误: ${error}`)
    }
  }

  /**
   * 验证时间线记录功能
   */
  async validateTimelineRecording(userId: string): Promise<void> {
    console.log('📝 验证时间线记录功能...')
    
    try {
      // 获取当前时间线数量
      const beforeTimeline = await gamificationService.getUserTimeline(userId, 100)
      const initialCount = beforeTimeline.length
      
      // 添加一个测试活动
      const testActivity = await gamificationService.addTimelineActivity(
        userId,
        'lesson_complete',
        '时间线验证测试',
        '这是一个验证时间线功能的测试活动',
        'test-course',
        'test-lesson',
        30
      )
      
      this.addResult('时间线活动添加', testActivity, 
        testActivity ? '时间线活动添加成功' : '时间线活动添加失败')
      
      if (testActivity) {
        // 等待数据库更新
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const afterTimeline = await gamificationService.getUserTimeline(userId, 100)
        const newCount = afterTimeline.length
        
        this.addResult('时间线记录增加', newCount > initialCount,
          `时间线记录数: ${initialCount} -> ${newCount}`)
        
        // 检查最新记录是否是我们添加的
        if (newCount > 0) {
          const latestActivity = afterTimeline[0] // 应该按时间倒序
          const isOurActivity = latestActivity.activity_title === '时间线验证测试'
          
          this.addResult('时间线记录内容', isOurActivity,
            `最新活动: ${latestActivity.activity_title}`)
        }
      }
      
    } catch (error) {
      this.addResult('时间线记录验证', false, `时间线验证错误: ${error}`)
    }
  }

  /**
   * 验证技能系统初始化
   */
  async validateSkillInitialization(userId: string): Promise<void> {
    console.log('🎯 验证技能系统初始化...')
    
    try {
      const userSkills = await gamificationService.getUserSkills(userId)
      
      const hasSkills = userSkills.length > 0
      this.addResult('技能记录存在', hasSkills,
        `用户技能数量: ${userSkills.length}`)
      
      if (hasSkills) {
        // 验证是否有所有6种技能
        const skillTypes = userSkills.map(s => s.skill_type)
        const expectedSkills = [
          'communication',
          'collaboration', 
          'critical_thinking',
          'creativity',
          'cultural_intelligence',
          'complex_problem_solving'
        ]
        
        const hasAllSkills = expectedSkills.every(skill => skillTypes.includes(skill))
        this.addResult('技能类型完整', hasAllSkills,
          `技能类型: ${skillTypes.join(', ')}`)
        
        // 验证技能等级和经验值是否合理
        const validSkills = userSkills.every(skill => 
          skill.skill_level >= 1 && 
          skill.skill_experience >= 0 &&
          skill.user_id === userId
        )
        
        this.addResult('技能数据有效性', validSkills,
          validSkills ? '所有技能数据有效' : '存在无效技能数据')
      }
      
    } catch (error) {
      this.addResult('技能系统验证', false, `技能系统验证错误: ${error}`)
    }
  }

  /**
   * 添加验证结果
   */
  private addResult(test: string, passed: boolean, message: string, data?: any): void {
    this.results.push({ test, passed, message, data })
    const status = passed ? '✅' : '❌'
    console.log(`  ${status} ${test}: ${message}`)
  }

  /**
   * 获取验证结果摘要
   */
  getResultSummary(): { passed: number; failed: number; total: number; failedTests: string[] } {
    const passed = this.results.filter(r => r.passed).length
    const failed = this.results.filter(r => !r.passed).length
    const failedTests = this.results.filter(r => !r.passed).map(r => r.test)
    
    return {
      passed,
      failed,
      total: this.results.length,
      failedTests
    }
  }

  /**
   * 生成详细报告
   */
  generateReport(): string {
    const summary = this.getResultSummary()
    
    let report = `\n📋 第一阶段Gamification系统验证报告\n`
    report += `${'='.repeat(50)}\n\n`
    report += `总测试数: ${summary.total}\n`
    report += `通过: ${summary.passed}\n`
    report += `失败: ${summary.failed}\n`
    report += `成功率: ${((summary.passed / summary.total) * 100).toFixed(1)}%\n\n`
    
    if (summary.failed > 0) {
      report += `❌ 失败的测试:\n`
      summary.failedTests.forEach(test => {
        const result = this.results.find(r => r.test === test)
        report += `  - ${test}: ${result?.message}\n`
      })
      report += `\n`
    }
    
    report += `📝 详细结果:\n`
    this.results.forEach(result => {
      const status = result.passed ? '✅' : '❌'
      report += `  ${status} ${result.test}: ${result.message}\n`
    })
    
    return report
  }
}

/**
 * 快速验证函数，用于在开发环境中快速检查系统状态
 */
export async function quickValidation(userId: string): Promise<boolean> {
  const validator = new Phase1Validator()
  await validator.runAllValidations(userId)
  
  const summary = validator.getResultSummary()
  console.log(validator.generateReport())
  
  return summary.failed === 0
}

/**
 * 数据库健康检查
 */
export async function databaseHealthCheck(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = []
  
  try {
    // 检查profiles表
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    results.push({
      test: 'profiles表连接',
      passed: !profilesError,
      message: profilesError ? profilesError.message : '连接正常'
    })
    
    // 检查learning_timeline表
    const { data: timelineData, error: timelineError } = await supabase
      .from('learning_timeline')
      .select('count')
      .limit(1)
    
    results.push({
      test: 'learning_timeline表连接',
      passed: !timelineError,
      message: timelineError ? timelineError.message : '连接正常'
    })
    
    // 检查user_skills表
    const { data: skillsData, error: skillsError } = await supabase
      .from('user_skills')
      .select('count')
      .limit(1)
    
    results.push({
      test: 'user_skills表连接',
      passed: !skillsError,
      message: skillsError ? skillsError.message : '连接正常'
    })
    
  } catch (error) {
    results.push({
      test: '数据库健康检查',
      passed: false,
      message: `检查失败: ${error}`
    })
  }
  
  return results
}