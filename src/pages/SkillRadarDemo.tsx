import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SkillRadarChart from '@/components/gamification/SkillRadarChart';
import SkillDetails from '@/components/gamification/SkillDetails';
import { 
  Sparkles, 
  Rocket, 
  Target,
  TrendingUp,
  Award,
  Star
} from 'lucide-react';

const SkillRadarDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 页面头部 */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <Target className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  技能雷达图演示
                </h1>
                <p className="text-gray-600 text-sm">
                  全新设计的六维技能可视化系统
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-gradient-to-r from-green-500 to-blue-500 text-white border-0">
                <Sparkles className="h-3 w-3 mr-1" />
                已优化
              </Badge>
              <Badge variant="outline" className="border-purple-200 text-purple-700">
                <Rocket className="h-3 w-3 mr-1" />
                新版本
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 space-y-8">
        {/* 功能介绍 */}
        <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-xl">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">六维技能雷达</h3>
                <p className="text-blue-100 text-sm">
                  可视化展示沟通、协作、思维、创新、计算和领导六大核心技能
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">实时进度追踪</h3>
                <p className="text-blue-100 text-sm">
                  动态更新技能等级和经验值，实时反映学习成果
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">详细技能分析</h3>
                <p className="text-blue-100 text-sm">
                  深入了解每个技能的发展历程和提升建议
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 设计改进说明 */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <Star className="h-6 w-6 text-yellow-500" />
              设计改进亮点
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">视觉优化</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    渐变色彩设计，提升视觉层次感
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    毛玻璃效果和阴影，增强现代感
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    动画过渡效果，提升交互体验
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    响应式布局，适配各种屏幕尺寸
                  </li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">功能增强</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    丰富的Tooltip信息展示
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                    技能图例和详细统计
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                    可展开的技能详情面板
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                    等级里程碑可视化
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 技能雷达图展示 */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="space-y-6">
            <SkillRadarChart size="large" showDetails={true} />
          </div>
          
          <div className="space-y-6">
            <SkillDetails />
          </div>
        </div>

        {/* 使用说明 */}
        <Card className="bg-gradient-to-br from-green-50 via-white to-blue-50 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <Rocket className="h-6 w-6 text-blue-500" />
              如何使用
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4">
                <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h4 className="font-semibold mb-2">查看雷达图</h4>
                <p className="text-sm text-gray-600">
                  在雷达图上查看六个技能维度的等级分布
                </p>
              </div>
              
              <div className="text-center p-4">
                <div className="w-12 h-12 mx-auto mb-3 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-bold">2</span>
                </div>
                <h4 className="font-semibold mb-2">悬停查看详情</h4>
                <p className="text-sm text-gray-600">
                  将鼠标悬停在雷达图上查看具体数值
                </p>
              </div>
              
              <div className="text-center p-4">
                <div className="w-12 h-12 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">3</span>
                </div>
                <h4 className="font-semibold mb-2">展开技能详情</h4>
                <p className="text-sm text-gray-600">
                  点击技能卡片查看详细信息和发展历程
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 页脚 */}
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">
            技能雷达图 - 让学习成长可视化 ✨
          </p>
        </div>
      </div>
    </div>
  );
};

export default SkillRadarDemo;
