import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LearningTimeline } from '@/components/gamification/LearningTimeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, TrendingUp, Award } from 'lucide-react';

export const TimelinePage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">请先登录</h2>
            <p className="text-gray-500">登录后即可查看您的学习时间线</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        {/* 页面标题 */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-ghibli-skyBlue rounded-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-ghibli-deepTeal">学习时间线</h1>
              <p className="text-gray-600">追踪您的学习历程和成长轨迹</p>
            </div>
          </div>
        </div>

        {/* 统计概览 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-sm font-medium text-gray-600">
                <TrendingUp className="h-4 w-4" />
                <span>学习活动</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-ghibli-deepTeal">持续记录中</div>
              <p className="text-xs text-gray-500 mt-1">每次学习都会被记录</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-sm font-medium text-gray-600">
                <Award className="h-4 w-4" />
                <span>经验获得</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-ghibli-deepTeal">自动计算</div>
              <p className="text-xs text-gray-500 mt-1">根据学习内容自动分配</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-sm font-medium text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>时间追踪</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-ghibli-deepTeal">精确记录</div>
              <p className="text-xs text-gray-500 mt-1">精确到分钟的学习记录</p>
            </CardContent>
          </Card>
        </div>

        {/* 学习时间线 */}
        <LearningTimeline 
          userId={user.id} 
          limit={50} 
          showFilters={true} 
          compact={false} 
        />
      </div>
    </div>
  );
};

export default TimelinePage;
