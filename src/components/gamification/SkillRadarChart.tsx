import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';
import { 
  gamificationService, 
  UserSkill, 
  SkillType, 
  SKILL_CONFIG,
  SKILL_LEVEL_EXPERIENCE,
  calculateSkillLevel 
} from '@/services/gamificationService';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, Award, Target, Zap } from 'lucide-react';

interface SkillRadarChartProps {
  userId?: string;
  showDetails?: boolean;
  size?: 'small' | 'medium' | 'large';
}

interface RadarDataPoint {
  skill: string;
  level: number;
  experience: number;
  maxLevel: number;
  label: string;
  color: string;
  icon: string;
}

export const SkillRadarChart: React.FC<SkillRadarChartProps> = ({ 
  userId, 
  showDetails = true,
  size = 'medium' 
}) => {
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

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

  // 准备雷达图数据
  const radarData: RadarDataPoint[] = React.useMemo(() => {
    const skillTypes: SkillType[] = [
      'communication',
      'collaboration',
      'critical_thinking',
      'creativity',
      'cultural_intelligence',
      'complex_problem_solving'
    ];

    return skillTypes.map(skillType => {
      const skill = skills.find(s => s.skill_type === skillType);
      const config = SKILL_CONFIG[skillType];
      
      return {
        skill: skillType,
        level: skill?.skill_level || 1,
        experience: skill?.skill_experience || 0,
        maxLevel: 10, // 最大等级
        label: config.label,
        color: config.color,
        icon: config.icon
      };
    });
  }, [skills]);

  // 计算总体技能统计
  const skillStats = React.useMemo(() => {
    const totalLevel = radarData.reduce((sum, item) => sum + item.level, 0);
    const totalExperience = radarData.reduce((sum, item) => sum + item.experience, 0);
    const averageLevel = totalLevel / radarData.length;
    const maxPossibleLevel = radarData.length * 10;
    const progressPercentage = (totalLevel / maxPossibleLevel) * 100;

    return {
      totalLevel,
      totalExperience,
      averageLevel,
      progressPercentage
    };
  }, [radarData]);

  // 自定义Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const expToNextLevel = SKILL_LEVEL_EXPERIENCE - (data.experience % SKILL_LEVEL_EXPERIENCE);

      return (
        <div className="bg-white/95 backdrop-blur-sm p-4 border border-gray-200 rounded-xl shadow-xl">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: data.color }}
            >
              {data.icon}
            </div>
            <span className="font-semibold text-gray-900">{data.label}</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">等级:</span>
              <div className="flex items-center gap-1">
                <span className="font-bold text-lg" style={{ color: data.color }}>
                  {data.level}
                </span>
                <span className="text-gray-400">/10</span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">经验值:</span>
              <span className="font-medium">{data.experience}</span>
            </div>
            {data.level < 10 && (
              <div className="flex justify-between">
                <span className="text-gray-600">距离下一级:</span>
                <span className="font-medium" style={{ color: data.color }}>
                  {expToNextLevel} EXP
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // 尺寸配置
  const sizeConfig = {
    small: { height: 250, showDetails: false },
    medium: { height: 400, showDetails: true },
    large: { height: 500, showDetails: true }
  };

  const config = sizeConfig[size];

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
    <div className="w-full space-y-4">
      {/* 技能雷达图 */}
      <Card className="w-full bg-gradient-to-br from-blue-50 via-white to-purple-50 border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
              <Target className="h-6 w-6 text-white" />
            </div>
            六维技能雷达图
          </CardTitle>
          <p className="text-gray-600 text-sm mt-2">
            展示您在六个核心技能维度的发展水平
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="relative">
            {/* 背景装饰 */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-100/20 to-purple-100/20 rounded-2xl"></div>

            <div style={{ width: '100%', height: config.height, position: 'relative', zIndex: 1 }}>
              <ResponsiveContainer>
                <RadarChart
                  data={radarData}
                  margin={{ top: 40, right: 60, bottom: 40, left: 60 }}
                  className="drop-shadow-sm"
                >
                  {/* 简化网格效果 */}
                  <PolarGrid
                    gridType="polygon"
                    stroke="#E5E7EB"
                    strokeWidth={1}
                    strokeOpacity={0.3}
                    radialLines={false}
                  />

                  {/* 技能标签 */}
                  <PolarAngleAxis
                    dataKey="label"
                    tick={{
                      fontSize: 13,
                      fill: '#374151',
                      fontWeight: 600
                    }}
                    className="text-sm font-semibold"
                  />

                  {/* 等级刻度 - 隐藏数字标签 */}
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 10]}
                    tick={false}
                    tickCount={6}
                    stroke="#D1D5DB"
                    strokeOpacity={0.3}
                  />

                  {/* 主要雷达区域 - 使用线条，不显示数据点 */}
                  <Radar
                    name="技能等级"
                    dataKey="level"
                    stroke="url(#radarGradient)"
                    fill="url(#radarFill)"
                    fillOpacity={0.15}
                    strokeWidth={4}
                    dot={false}
                  />

                  {/* 渐变定义 */}
                  <defs>
                    <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="50%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#EC4899" />
                    </linearGradient>
                    <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.4} />
                      <stop offset="70%" stopColor="#8B5CF6" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#EC4899" stopOpacity={0.1} />
                    </radialGradient>
                  </defs>

                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* 技能图例 */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
              {radarData.map((item) => (
                <div
                  key={item.skill}
                  className="flex items-center gap-3 p-3 bg-white/70 backdrop-blur-sm rounded-lg border border-gray-100 hover:shadow-md transition-all duration-200"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm"
                    style={{ backgroundColor: item.color }}
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {item.label}
                    </div>
                    <div className="text-xs text-gray-500">
                      等级 {item.level} • {item.experience} EXP
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 技能统计概览 */}
      {showDetails && config.showDetails && (
        <Card className="bg-gradient-to-br from-green-50 via-white to-blue-50 border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              技能统计概览
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {/* 统计卡片 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                <div className="relative text-center p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <Award className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                    {skillStats.totalLevel}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">总等级</div>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-600 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                <div className="relative text-center p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-green-100 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                    {skillStats.totalExperience}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">总经验值</div>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-purple-600 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                <div className="relative text-center p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-purple-100 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
                    {skillStats.averageLevel.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">平均等级</div>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-600 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                <div className="relative text-center p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-orange-100 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
                    {skillStats.progressPercentage.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600 font-medium">整体进度</div>
                </div>
              </div>
            </div>

            {/* 整体进度条 */}
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold text-gray-800">整体技能发展进度</span>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {skillStats.progressPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out shadow-sm"
                    style={{ width: `${skillStats.progressPercentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>初学者</span>
                  <span>专家级</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SkillRadarChart;
