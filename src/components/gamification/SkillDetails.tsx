import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  gamificationService, 
  UserSkill, 
  SkillType, 
  SKILL_CONFIG,
  SKILL_LEVEL_EXPERIENCE,
  calculateSkillLevel 
} from '@/services/gamificationService';
import { supabase } from '@/integrations/supabase/client';
import { 
  TrendingUp, 
  Award, 
  Target, 
  Zap, 
  ChevronRight,
  Star,
  Clock,
  BookOpen
} from 'lucide-react';

interface SkillDetailsProps {
  userId?: string;
}

interface SkillDetailItem {
  skill: UserSkill;
  config: typeof SKILL_CONFIG[SkillType];
  progressToNext: number;
  expToNextLevel: number;
}

export const SkillDetails: React.FC<SkillDetailsProps> = ({ userId }) => {
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<SkillType | null>(null);

  // 获取当前用户ID
  useEffect(() => {
    const getCurrentUser = async () => {
      if (userId) {
        setCurrentUserId(userId);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };

    getCurrentUser();
  }, [userId]);

  // 加载用户技能数据
  useEffect(() => {
    if (!currentUserId) return;

    const loadUserSkills = async () => {
      try {
        setLoading(true);
        const userSkills = await gamificationService.getUserSkills(currentUserId);
        setSkills(userSkills);
      } catch (error) {
        console.error('加载用户技能失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserSkills();
  }, [currentUserId]);

  // 准备技能详情数据
  const skillDetails: SkillDetailItem[] = React.useMemo(() => {
    const skillTypes: SkillType[] = [
      'communication',
      'collaboration',
      'critical_thinking',
      'creativity',
      'cultural_intelligence',
      'complex_problem_solving'
    ];

    return skillTypes.map(skillType => {
      const skill = skills.find(s => s.skill_type === skillType) || {
        id: '',
        user_id: currentUserId || '',
        skill_type: skillType,
        skill_level: 1,
        skill_experience: 0,
        last_updated: new Date().toISOString()
      };
      
      const config = SKILL_CONFIG[skillType];
      const currentLevelExp = (skill.skill_level - 1) * SKILL_LEVEL_EXPERIENCE;
      const expInCurrentLevel = skill.skill_experience - currentLevelExp;
      const progressToNext = (expInCurrentLevel / SKILL_LEVEL_EXPERIENCE) * 100;
      const expToNextLevel = SKILL_LEVEL_EXPERIENCE - expInCurrentLevel;
      
      return {
        skill,
        config,
        progressToNext: Math.min(progressToNext, 100),
        expToNextLevel: skill.skill_level >= 10 ? 0 : expToNextLevel
      };
    });
  }, [skills, currentUserId]);

  // 获取技能等级描述
  const getSkillLevelDescription = (level: number): string => {
    if (level <= 2) return '初学者';
    if (level <= 4) return '入门';
    if (level <= 6) return '熟练';
    if (level <= 8) return '精通';
    if (level <= 9) return '专家';
    return '大师';
  };

  // 获取技能等级颜色
  const getSkillLevelColor = (level: number): string => {
    if (level <= 2) return 'bg-gray-100 text-gray-700';
    if (level <= 4) return 'bg-blue-100 text-blue-700';
    if (level <= 6) return 'bg-green-100 text-green-700';
    if (level <= 8) return 'bg-purple-100 text-purple-700';
    if (level <= 9) return 'bg-orange-100 text-orange-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-gradient-to-br from-indigo-50 via-white to-cyan-50 border-0 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-2xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          技能详情
        </CardTitle>
        <p className="text-gray-600 text-sm mt-2">
          点击查看每个技能的详细信息和发展历程
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {skillDetails.map((item) => (
            <div
              key={item.skill.skill_type}
              className="group relative bg-white/70 backdrop-blur-sm border border-gray-100 rounded-xl p-5 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer overflow-hidden"
              onClick={() => setSelectedSkill(
                selectedSkill === item.skill.skill_type ? null : item.skill.skill_type
              )}
            >
              {/* 背景装饰 */}
              <div
                className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
                style={{ backgroundColor: item.config.color }}
              ></div>
              {/* 技能基本信息 */}
              <div className="relative flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg group-hover:scale-110 transition-transform duration-300"
                      style={{ backgroundColor: item.config.color }}
                    >
                      {item.config.icon}
                    </div>
                    {/* 等级角标 */}
                    <div
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md"
                      style={{ backgroundColor: item.config.color }}
                    >
                      {item.skill.skill_level}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{item.config.label}</h3>
                    <div className="flex items-center gap-2">
                      <Badge
                        className="px-3 py-1 text-xs font-semibold"
                        style={{
                          backgroundColor: `${item.config.color}20`,
                          color: item.config.color,
                          border: `1px solid ${item.config.color}40`
                        }}
                      >
                        等级 {item.skill.skill_level}
                      </Badge>
                      <Badge variant="outline" className="px-3 py-1 text-xs">
                        {getSkillLevelDescription(item.skill.skill_level)}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold" style={{ color: item.config.color }}>
                    {item.skill.skill_experience}
                  </div>
                  <div className="text-sm text-gray-500 font-medium">EXP</div>
                  {item.skill.skill_level < 10 && (
                    <div className="text-xs text-gray-400 mt-1">
                      还需 {item.expToNextLevel} EXP 升级
                    </div>
                  )}
                  <ChevronRight
                    className={`h-5 w-5 text-gray-400 transition-all duration-300 mt-2 ${
                      selectedSkill === item.skill.skill_type ? 'rotate-90 text-gray-600' : 'group-hover:text-gray-600'
                    }`}
                  />
                </div>
              </div>

              {/* 进度条 */}
              {item.skill.skill_level < 10 && (
                <div className="mb-4">
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="font-medium text-gray-700">当前等级进度</span>
                    <span className="font-bold" style={{ color: item.config.color }}>
                      {item.progressToNext.toFixed(1)}%
                    </span>
                  </div>
                  <div className="relative">
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out shadow-sm"
                        style={{
                          width: `${item.progressToNext}%`,
                          background: `linear-gradient(90deg, ${item.config.color}80, ${item.config.color})`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              {/* 展开的详细信息 */}
              {selectedSkill === item.skill.skill_type && (
                <div className="mt-6 pt-6 border-t border-gray-200 space-y-6 animate-in slide-in-from-top-2 duration-300">
                  {/* 统计信息网格 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-gray-100 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${item.config.color}20` }}
                        >
                          <Star className="h-4 w-4" style={{ color: item.config.color }} />
                        </div>
                        <span className="text-sm font-medium text-gray-700">当前等级</span>
                      </div>
                      <div className="text-2xl font-bold" style={{ color: item.config.color }}>
                        {item.skill.skill_level}<span className="text-lg text-gray-400">/10</span>
                      </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-gray-100 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${item.config.color}20` }}
                        >
                          <Zap className="h-4 w-4" style={{ color: item.config.color }} />
                        </div>
                        <span className="text-sm font-medium text-gray-700">总经验值</span>
                      </div>
                      <div className="text-2xl font-bold" style={{ color: item.config.color }}>
                        {item.skill.skill_experience}
                      </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-gray-100 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${item.config.color}20` }}
                        >
                          <Target className="h-4 w-4" style={{ color: item.config.color }} />
                        </div>
                        <span className="text-sm font-medium text-gray-700">下级所需</span>
                      </div>
                      <div className="text-2xl font-bold" style={{ color: item.config.color }}>
                        {item.skill.skill_level >= 10 ? '满级' : `${item.expToNextLevel}`}
                      </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-gray-100 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${item.config.color}20` }}
                        >
                          <Clock className="h-4 w-4" style={{ color: item.config.color }} />
                        </div>
                        <span className="text-sm font-medium text-gray-700">最后更新</span>
                      </div>
                      <div className="text-sm font-medium text-gray-600">
                        {new Date(item.skill.last_updated).toLocaleDateString('zh-CN')}
                      </div>
                    </div>
                  </div>

                  {/* 技能描述 */}
                  <div
                    className="p-5 rounded-xl border-l-4 shadow-sm"
                    style={{
                      backgroundColor: `${item.config.color}08`,
                      borderLeftColor: item.config.color
                    }}
                  >
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                        style={{ backgroundColor: item.config.color }}
                      >
                        {item.config.icon}
                      </div>
                      技能说明
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {getSkillDescription(item.skill.skill_type)}
                    </p>
                  </div>

                  {/* 等级里程碑 */}
                  <div className="bg-white/60 backdrop-blur-sm p-5 rounded-xl border border-gray-100">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Award className="h-5 w-5" style={{ color: item.config.color }} />
                      等级里程碑
                    </h4>
                    <div className="grid grid-cols-5 gap-3">
                      {[2, 4, 6, 8, 10].map(level => (
                        <div
                          key={level}
                          className={`text-center p-3 rounded-lg transition-all duration-300 ${
                            item.skill.skill_level >= level
                              ? 'shadow-md transform scale-105'
                              : 'opacity-60'
                          }`}
                          style={{
                            backgroundColor: item.skill.skill_level >= level
                              ? `${item.config.color}20`
                              : '#F9FAFB',
                            border: `2px solid ${item.skill.skill_level >= level
                              ? item.config.color
                              : '#E5E7EB'}`
                          }}
                        >
                          <div
                            className="text-lg font-bold mb-1"
                            style={{
                              color: item.skill.skill_level >= level
                                ? item.config.color
                                : '#9CA3AF'
                            }}
                          >
                            {level}
                          </div>
                          <div className="text-xs font-medium text-gray-600">
                            {getSkillLevelDescription(level)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// 获取技能描述
const getSkillDescription = (skillType: SkillType): string => {
  const descriptions = {
    communication: '有效传达想法、倾听他人观点、进行清晰表达的能力。包括口头表达、书面沟通、演讲技巧等。',
    collaboration: '与他人协作完成任务、建立团队关系、共同解决问题的能力。包括团队合作、冲突解决、协调配合等。',
    critical_thinking: '分析问题、评估信息、做出理性判断的能力。包括逻辑推理、问题分析、批判性评估等。',
    creativity: '产生新想法、创新解决方案、艺术创作的能力。包括创意思维、设计能力、创新实践等。',
    cultural_intelligence: '理解和适应不同文化背景的能力。包括跨文化沟通、文化敏感性、全球化思维等。',
    complex_problem_solving: '分析和解决复杂、多维度问题的能力。包括系统性思维、策略规划、综合决策等。'
  };

  return descriptions[skillType] || '暂无描述';
};

export default SkillDetails;
