import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Star, Calendar, TrendingUp, Award, BookOpen, Target, Zap } from 'lucide-react';
import { gamificationService, UserGameProfile, calculateExpToNextLevel } from '@/services/gamificationService';
import { supabase } from '@/integrations/supabase/client';
import SkillRadarChart from './SkillRadarChart';
import SkillDetails from './SkillDetails';
import { LearningTimeline } from './LearningTimeline';

interface UserProfileProps {
  userId?: string;
}

export const UserProfile: React.FC<UserProfileProps> = ({ userId }) => {
  const [profile, setProfile] = useState<UserGameProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        // 如果没有指定userId，使用当前用户
        const targetUserId = userId || user.id;
        await loadUserProfile(targetUserId);
      }
    };

    getCurrentUser();
  }, [userId]);

  const loadUserProfile = async (targetUserId: string) => {
    try {
      setLoading(true);

      // 获取用户档案
      const userProfile = await gamificationService.getUserProfile(targetUserId);
      setProfile(userProfile);
    } catch (error) {
      console.error('加载用户档案失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ghibli-skyBlue"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">无法加载用户档案</p>
      </div>
    );
  }

  const expToNextLevel = calculateExpToNextLevel(profile.total_experience);
  const currentLevelExp = profile.total_experience % 100; // 当前等级的经验值
  const progressPercentage = (currentLevelExp / 100) * 100;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* 用户基本信息卡片 */}
      <Card className="bg-gradient-to-r from-ghibli-skyBlue/10 to-ghibli-grassGreen/10">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="bg-ghibli-skyBlue text-white text-xl">
                {profile.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-2xl text-ghibli-deepTeal">
                {profile.username}
              </CardTitle>
              <Badge variant="secondary" className="mt-1 bg-ghibli-sunshine text-white">
                {profile.title}
              </Badge>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 text-ghibli-deepTeal">
                <Trophy className="h-6 w-6" />
                <span className="text-2xl font-bold">等级 {profile.total_level}</span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {profile.total_experience} 总经验值
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 经验值进度条 */}
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>距离下一级</span>
                <span>{expToNextLevel} EXP</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{currentLevelExp} EXP</span>
                <span>100 EXP</span>
              </div>
            </div>

            {/* 统计信息 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <Star className="h-6 w-6 text-ghibli-sunshine mx-auto mb-1" />
                <div className="text-lg font-semibold text-ghibli-deepTeal">
                  {profile.total_level}
                </div>
                <div className="text-xs text-gray-500">等级</div>
              </div>
              
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <TrendingUp className="h-6 w-6 text-ghibli-grassGreen mx-auto mb-1" />
                <div className="text-lg font-semibold text-ghibli-deepTeal">
                  {profile.total_experience}
                </div>
                <div className="text-xs text-gray-500">总经验</div>
              </div>
              
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <Calendar className="h-6 w-6 text-ghibli-coral mx-auto mb-1" />
                <div className="text-lg font-semibold text-ghibli-deepTeal">
                  {profile.learning_streak}
                </div>
                <div className="text-xs text-gray-500">连续天数</div>
              </div>
              
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <BookOpen className="h-6 w-6 text-ghibli-lavender mx-auto mb-1" />
                <div className="text-lg font-semibold text-ghibli-deepTeal">
                  {profile.learning_streak > 0 ? '活跃' : '待激活'}
                </div>
                <div className="text-xs text-gray-500">学习状态</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 主要内容区域 - 使用标签页 */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            概览
          </TabsTrigger>
          <TabsTrigger value="skills" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            技能雷达
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            技能详情
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            学习时间线
          </TabsTrigger>
        </TabsList>

        {/* 概览标签页 */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-ghibli-deepTeal">
                <TrendingUp className="h-5 w-5" />
                <span>学习概览</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{profile.total_level}</div>
                  <div className="text-sm text-gray-600">当前等级</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600 mb-2">{profile.total_experience}</div>
                  <div className="text-sm text-gray-600">总经验值</div>
                </div>
              </div>

              {/* 小尺寸技能雷达图预览 */}
              <div className="mt-6">
                <SkillRadarChart userId={profile.id} size="small" showDetails={false} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 技能雷达图标签页 */}
        <TabsContent value="skills" className="space-y-4">
          <SkillRadarChart userId={profile.id} size="large" showDetails={true} />
        </TabsContent>

        {/* 技能详情标签页 */}
        <TabsContent value="details" className="space-y-4">
          <SkillDetails userId={profile.id} />
        </TabsContent>

        {/* 学习时间线标签页 */}
        <TabsContent value="timeline" className="space-y-4">
          <LearningTimeline
            userId={profile.id}
            limit={20}
            showFilters={true}
            compact={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
