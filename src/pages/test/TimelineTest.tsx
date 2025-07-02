import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LearningTimeline } from '@/components/gamification/LearningTimeline';
import { gamificationService } from '@/services/gamificationService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Calendar, Plus, TestTube } from 'lucide-react';

export const TimelineTest: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activityTitle, setActivityTitle] = useState('');
  const [activityDescription, setActivityDescription] = useState('');
  const [experienceGained, setExperienceGained] = useState(20);

  // 添加测试时间线活动
  const addTestActivity = async () => {
    if (!user || !activityTitle) {
      toast.error('请填写活动标题');
      return;
    }

    try {
      setLoading(true);
      const success = await gamificationService.addTimelineActivity(
        user.id,
        'lesson_complete',
        activityTitle,
        activityDescription || '测试活动描述',
        undefined,
        undefined,
        experienceGained
      );

      if (success) {
        toast.success('测试活动添加成功！');
        setActivityTitle('');
        setActivityDescription('');
        // 刷新页面以显示新活动
        window.location.reload();
      } else {
        toast.error('添加测试活动失败');
      }
    } catch (error) {
      console.error('添加测试活动失败:', error);
      toast.error('添加测试活动失败');
    } finally {
      setLoading(false);
    }
  };

  // 添加经验值到用户档案
  const addTestExperience = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const activity = {
        activity_type: 'lesson_complete' as const,
        activity_title: '测试经验值奖励',
        activity_description: '通过测试页面添加的经验值',
        experience_gained: experienceGained,
      };

      const success = await gamificationService.addExperience(user.id, experienceGained, activity);
      
      if (success) {
        toast.success(`成功添加 ${experienceGained} 经验值！`);
      } else {
        toast.error('添加经验值失败');
      }
    } catch (error) {
      console.error('添加经验值失败:', error);
      toast.error('添加经验值失败');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <TestTube className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">请先登录</h2>
            <p className="text-gray-500">登录后即可测试时间线功能</p>
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
            <div className="p-2 bg-blue-500 rounded-lg">
              <TestTube className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">时间线功能测试</h1>
              <p className="text-gray-600">测试学习时间线组件和相关功能</p>
            </div>
          </div>
        </div>

        {/* 测试控制面板 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>添加测试活动</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  活动标题
                </label>
                <Input
                  value={activityTitle}
                  onChange={(e) => setActivityTitle(e.target.value)}
                  placeholder="例如：完成课时：React基础"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  活动描述（可选）
                </label>
                <Input
                  value={activityDescription}
                  onChange={(e) => setActivityDescription(e.target.value)}
                  placeholder="例如：课时学习完成"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  经验值
                </label>
                <Input
                  type="number"
                  value={experienceGained}
                  onChange={(e) => setExperienceGained(Number(e.target.value))}
                  min="1"
                  max="1000"
                />
              </div>
              
              <Button 
                onClick={addTestActivity} 
                disabled={loading || !activityTitle}
                className="w-full"
              >
                {loading ? '添加中...' : '添加测试活动'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>快速测试</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600">
                <p>快速添加经验值到用户档案，同时创建时间线记录。</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  经验值数量
                </label>
                <Input
                  type="number"
                  value={experienceGained}
                  onChange={(e) => setExperienceGained(Number(e.target.value))}
                  min="1"
                  max="1000"
                />
              </div>
              
              <Button 
                onClick={addTestExperience} 
                disabled={loading}
                className="w-full"
                variant="outline"
              >
                {loading ? '添加中...' : '添加经验值'}
              </Button>
              
              <div className="text-xs text-gray-500">
                <p>这将同时更新用户等级和创建时间线记录</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 时间线展示 */}
        <LearningTimeline 
          userId={user.id} 
          limit={30} 
          showFilters={true} 
          compact={false} 
        />
      </div>
    </div>
  );
};

export default TimelineTest;
