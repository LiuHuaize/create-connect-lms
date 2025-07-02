import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { 
  gamificationService, 
  UserSkill, 
  SkillType, 
  SKILL_CONFIG,
  SKILL_LEVEL_EXPERIENCE
} from '@/services/gamificationService';
import { supabase } from '@/integrations/supabase/client';
import { Target } from 'lucide-react';

interface SimpleSkillRadarChartProps {
  userId?: string;
  size?: 'small' | 'medium' | 'large';
}

interface RadarDataPoint {
  skill: string;
  level: number;
  experience: number;
  label: string;
  color: string;
  icon: string;
}

export const SimpleSkillRadarChart: React.FC<SimpleSkillRadarChartProps> = ({ 
  userId, 
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

  // 加载技能数据
  useEffect(() => {
    const loadSkills = async () => {
      if (!currentUserId) return;

      try {
        setLoading(true);
        const userSkills = await gamificationService.getUserSkills(currentUserId);
        setSkills(userSkills);
      } catch (error) {
        console.error('加载技能数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSkills();
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
        label: config.label,
        color: config.color,
        icon: config.icon
      };
    });
  }, [skills]);

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
    small: { height: 250 },
    medium: { height: 350 },
    large: { height: 450 }
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
    <div className="w-full">
      {/* 简化的技能雷达图 */}
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
                  margin={{ top: 60, right: 100, bottom: 60, left: 100 }}
                  className="drop-shadow-sm"
                >
                  {/* 简化网格 - 只显示3层，无径向线 */}
                  <PolarGrid
                    gridType="polygon"
                    stroke="#E5E7EB"
                    strokeWidth={1}
                    strokeOpacity={0.25}
                    radialLines={false}
                  />

                  {/* 技能标签 - 更大字体，更好间距 */}
                  <PolarAngleAxis
                    dataKey="label"
                    tick={{
                      fontSize: 16,
                      fill: '#1F2937',
                      fontWeight: 700,
                      textAnchor: 'middle'
                    }}
                    className="text-base font-bold"
                    tickFormatter={(value) => value}
                  />

                  {/* 主要雷达区域 - 简化设计，使用线条 */}
                  <Radar
                    name="技能等级"
                    dataKey="level"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.12}
                    strokeWidth={4}
                    dot={false}
                  />

                  {/* Tooltip */}
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* 技能图例 - 简化版本 */}
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
    </div>
  );
};

export default SimpleSkillRadarChart;
