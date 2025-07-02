import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import SkillRadarChart from '@/components/gamification/SkillRadarChart';
import SimpleSkillRadarChart from '@/components/gamification/SimpleSkillRadarChart';

const TestRadarOptimization: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            雷达图优化测试
          </h1>
          <p className="text-gray-600">
            测试优化后的雷达图效果：使用线条显示，隐藏数字标签，减少视觉拥挤
          </p>
        </div>

        <div className="space-y-8">
          {/* 标准雷达图 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">
                标准雷达图 (优化后)
              </CardTitle>
              <p className="text-sm text-gray-600">
                • 移除了密集的数据点
                • 隐藏了径向轴的数字标签
                • 简化了网格线显示
                • 使用纯线条连接各技能点
              </p>
            </CardHeader>
            <CardContent>
              <SkillRadarChart size="large" showDetails={true} />
            </CardContent>
          </Card>

          {/* 简化雷达图 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">
                简化雷达图 (优化后)
              </CardTitle>
              <p className="text-sm text-gray-600">
                • 更清爽的线条设计
                • 无径向网格线
                • 更大的标签字体
                • 简洁的视觉效果
              </p>
            </CardHeader>
            <CardContent>
              <SimpleSkillRadarChart />
            </CardContent>
          </Card>

          {/* 对比说明 */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-blue-800">
                优化说明
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-green-700 mb-3">✅ 优化后的改进</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• 移除了密集的数据点，避免视觉拥挤</li>
                    <li>• 隐藏了径向轴数字标签，减少文字重叠</li>
                    <li>• 使用纯线条连接，更清晰的形状展示</li>
                    <li>• 简化网格线，降低背景噪音</li>
                    <li>• 保留了悬停提示功能</li>
                    <li>• 保持了渐变色彩效果</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-red-700 mb-3">❌ 解决的问题</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• 数据点过于密集</li>
                    <li>• 数字标签挤在一起</li>
                    <li>• 视觉元素过多造成混乱</li>
                    <li>• 网格线过于突出</li>
                    <li>• 整体视觉效果拥挤</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TestRadarOptimization;
