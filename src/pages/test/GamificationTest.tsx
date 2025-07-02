import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { gamificationService } from '@/services/gamificationService';
import { supabase } from '@/integrations/supabase/client';

export const GamificationTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [userProfile, setUserProfile] = useState<any>(null);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  };

  const testAddExperience = async () => {
    setLoading(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        setResult('用户未登录');
        return;
      }

      // 测试添加经验值
      const success = await gamificationService.handleLessonComplete(
        user.id,
        '41ec3c86-157c-4323-8d95-3e78b2ab0fad', // 测验课时ID
        '1e34037f-4aef-4fe5-9a6b-3e46b5498e9c', // 课程ID
        '想一想', // 课时标题
        'quiz', // 课时类型
        100 // 分数
      );

      if (success) {
        setResult('成功添加经验值！');
        await loadUserProfile();
      } else {
        setResult('添加经验值失败');
      }
    } catch (error) {
      console.error('测试失败:', error);
      setResult(`测试失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const profile = await gamificationService.getUserProfile(user.id);
      setUserProfile(profile);
    } catch (error) {
      console.error('加载用户档案失败:', error);
    }
  };

  const testTextLesson = async () => {
    setLoading(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        setResult('用户未登录');
        return;
      }

      const success = await gamificationService.handleLessonComplete(
        user.id,
        'test-text-lesson-' + Date.now(),
        'test-course-id',
        '测试文本课时',
        'text'
      );

      if (success) {
        setResult('成功添加文本课时经验值！');
        await loadUserProfile();
      } else {
        setResult('添加经验值失败');
      }
    } catch (error) {
      console.error('测试失败:', error);
      setResult(`测试失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testVideoLesson = async () => {
    setLoading(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        setResult('用户未登录');
        return;
      }

      const success = await gamificationService.handleLessonComplete(
        user.id,
        'test-video-lesson-' + Date.now(),
        'test-course-id',
        '测试视频课时',
        'video'
      );

      if (success) {
        setResult('成功添加视频课时经验值！');
        await loadUserProfile();
      } else {
        setResult('添加经验值失败');
      }
    } catch (error) {
      console.error('测试失败:', error);
      setResult(`测试失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadUserProfile();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>游戏化系统测试</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={testAddExperience} 
              disabled={loading}
              className="bg-ghibli-skyBlue hover:bg-ghibli-skyBlue/80"
            >
              {loading ? '测试中...' : '测试测验经验值'}
            </Button>
            
            <Button 
              onClick={testTextLesson} 
              disabled={loading}
              className="bg-ghibli-grassGreen hover:bg-ghibli-grassGreen/80"
            >
              {loading ? '测试中...' : '测试文本课时'}
            </Button>
            
            <Button 
              onClick={testVideoLesson} 
              disabled={loading}
              className="bg-ghibli-coral hover:bg-ghibli-coral/80"
            >
              {loading ? '测试中...' : '测试视频课时'}
            </Button>
          </div>

          {result && (
            <div className="p-4 bg-gray-100 rounded-lg">
              <p className="text-sm">{result}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {userProfile && (
        <Card>
          <CardHeader>
            <CardTitle>当前用户档案</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-ghibli-deepTeal">
                  {userProfile.username}
                </div>
                <div className="text-sm text-gray-500">用户名</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-ghibli-deepTeal">
                  {userProfile.total_level}
                </div>
                <div className="text-sm text-gray-500">等级</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-ghibli-deepTeal">
                  {userProfile.total_experience}
                </div>
                <div className="text-sm text-gray-500">总经验值</div>
              </div>
              
              <div className="text-center">
                <Badge variant="secondary" className="bg-ghibli-sunshine text-white">
                  {userProfile.title}
                </Badge>
                <div className="text-sm text-gray-500 mt-1">称号</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
