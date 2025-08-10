import { supabase } from '../lib/supabase';

// 数据完整性检查服务
export const dataIntegrityService = {
  // 检查技能经验值与日志的一致性
  async checkSkillExperienceConsistency(): Promise<{
    isConsistent: boolean;
    inconsistentRecords: Array<{
      user_id: string;
      skill_type: string;
      skill_experience: number;
      log_experience: number;
      difference: number;
    }>;
  }> {
    try {
      const { data, error } = await supabase.rpc('check_skill_experience_consistency');
      
      if (error) {
        console.error('检查技能经验值一致性失败:', error);
        return { isConsistent: false, inconsistentRecords: [] };
      }

      const inconsistentRecords = data || [];
      return {
        isConsistent: inconsistentRecords.length === 0,
        inconsistentRecords
      };
    } catch (error) {
      console.error('检查技能经验值一致性异常:', error);
      return { isConsistent: false, inconsistentRecords: [] };
    }
  },

  // 检查成就解锁的有效性
  async validateAchievements(): Promise<{
    isValid: boolean;
    invalidAchievements: Array<{
      user_id: string;
      achievement_key: string;
      reason: string;
    }>;
  }> {
    try {
      const { data, error } = await supabase.rpc('validate_user_achievements');
      
      if (error) {
        console.error('验证成就解锁失败:', error);
        return { isValid: false, invalidAchievements: [] };
      }

      const invalidAchievements = data?.filter((item: any) => item.action === 'INVALID') || [];
      return {
        isValid: invalidAchievements.length === 0,
        invalidAchievements: invalidAchievements.map((item: any) => ({
          user_id: item.user_id,
          achievement_key: item.achievement_key,
          reason: item.reason
        }))
      };
    } catch (error) {
      console.error('验证成就解锁异常:', error);
      return { isValid: false, invalidAchievements: [] };
    }
  },

  // 修复技能经验值不一致问题
  async fixSkillExperienceInconsistency(): Promise<{
    success: boolean;
    fixedSkillsCount: number;
    fixedUsersCount: number;
    message: string;
  }> {
    try {
      // 先修复缺失的日志记录
      const { data: fixResult1 } = await supabase.rpc('fix_skill_experience_inconsistency');
      
      // 再修复经验值差异
      const { data: fixResult2 } = await supabase.rpc('fix_skill_experience_discrepancy');

      const fixedSkillsCount = (fixResult1?.[0]?.fixed_skills_count || 0) + (fixResult2?.length || 0);
      const fixedUsersCount = fixResult1?.[0]?.fixed_users_count || 0;

      return {
        success: true,
        fixedSkillsCount,
        fixedUsersCount,
        message: `修复完成：${fixedUsersCount} 个用户的 ${fixedSkillsCount} 个技能记录已同步`
      };
    } catch (error) {
      console.error('修复技能经验值不一致异常:', error);
      return {
        success: false,
        fixedSkillsCount: 0,
        fixedUsersCount: 0,
        message: '修复失败：' + (error as Error).message
      };
    }
  },

  // 清理无效的成就解锁记录
  async cleanInvalidAchievements(): Promise<{
    success: boolean;
    removedCount: number;
    message: string;
  }> {
    try {
      const { data } = await supabase.rpc('validate_and_clean_achievements');
      
      const removedCount = data?.filter((item: any) => item.action === 'REMOVED').length || 0;

      return {
        success: true,
        removedCount,
        message: `清理完成：移除了 ${removedCount} 个无效的成就解锁记录`
      };
    } catch (error) {
      console.error('清理无效成就记录异常:', error);
      return {
        success: false,
        removedCount: 0,
        message: '清理失败：' + (error as Error).message
      };
    }
  },

  // 更新用户的highest_skill_level字段
  async updateUserHighestSkillLevels(): Promise<{
    success: boolean;
    updatedCount: number;
    message: string;
  }> {
    try {
      const { data, error } = await supabase.rpc('update_user_highest_skill_levels');
      
      if (error) {
        throw error;
      }

      const updatedCount = data?.length || 0;

      return {
        success: true,
        updatedCount,
        message: `更新完成：${updatedCount} 个用户的最高技能等级已更新`
      };
    } catch (error) {
      console.error('更新用户最高技能等级异常:', error);
      return {
        success: false,
        updatedCount: 0,
        message: '更新失败：' + (error as Error).message
      };
    }
  },

  // 执行完整的数据完整性检查和修复
  async performFullIntegrityCheck(): Promise<{
    success: boolean;
    report: string;
    summary: {
      skillConsistencyFixed: boolean;
      achievementsValidated: boolean;
      highestSkillLevelsUpdated: boolean;
    };
  }> {
    let report = '数据完整性检查和修复报告\n';
    report += '='.repeat(50) + '\n\n';

    const summary = {
      skillConsistencyFixed: false,
      achievementsValidated: false,
      highestSkillLevelsUpdated: false
    };

    try {
      // 1. 检查技能经验值一致性
      report += '1. 检查技能经验值一致性\n';
      const consistencyCheck = await this.checkSkillExperienceConsistency();
      if (!consistencyCheck.isConsistent) {
        report += `   发现 ${consistencyCheck.inconsistentRecords.length} 个不一致记录\n`;
        
        // 修复技能经验值不一致
        const fixResult = await this.fixSkillExperienceInconsistency();
        report += `   修复结果：${fixResult.message}\n`;
        summary.skillConsistencyFixed = fixResult.success;
      } else {
        report += '   ✓ 技能经验值数据一致\n';
        summary.skillConsistencyFixed = true;
      }

      // 2. 验证成就解锁
      report += '\n2. 验证成就解锁有效性\n';
      const achievementValidation = await this.validateAchievements();
      if (!achievementValidation.isValid) {
        report += `   发现 ${achievementValidation.invalidAchievements.length} 个无效成就解锁\n`;
        
        // 清理无效成就
        const cleanResult = await this.cleanInvalidAchievements();
        report += `   清理结果：${cleanResult.message}\n`;
        summary.achievementsValidated = cleanResult.success;
      } else {
        report += '   ✓ 所有成就解锁都有效\n';
        summary.achievementsValidated = true;
      }

      // 3. 更新最高技能等级
      report += '\n3. 更新用户最高技能等级\n';
      const skillLevelUpdate = await this.updateUserHighestSkillLevels();
      report += `   更新结果：${skillLevelUpdate.message}\n`;
      summary.highestSkillLevelsUpdated = skillLevelUpdate.success;

      report += '\n' + '='.repeat(50) + '\n';
      report += '检查和修复完成！\n';

      return {
        success: summary.skillConsistencyFixed && summary.achievementsValidated && summary.highestSkillLevelsUpdated,
        report,
        summary
      };
    } catch (error) {
      report += `\n❌ 检查过程中发生错误：${(error as Error).message}\n`;
      return {
        success: false,
        report,
        summary
      };
    }
  }
};