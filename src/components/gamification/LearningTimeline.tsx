import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  BookOpen, 
  Award, 
  Target, 
  Clock, 
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Filter,
  RefreshCw
} from 'lucide-react';
import { gamificationService } from '@/services/gamificationService';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

// 时间线活动类型图标映射
const activityIcons = {
  lesson_complete: BookOpen,
  quiz_pass: Target,
  course_complete: Award,
  daily_streak: TrendingUp,
  project_submit: Clock,
} as const;

// 活动类型颜色映射
const activityColors = {
  lesson_complete: 'bg-blue-500',
  quiz_pass: 'bg-green-500', 
  course_complete: 'bg-purple-500',
  daily_streak: 'bg-orange-500',
  project_submit: 'bg-indigo-500',
} as const;

// 活动类型中文名称映射
const activityNames = {
  lesson_complete: '完成课时',
  quiz_pass: '通过测验',
  course_complete: '完成课程',
  daily_streak: '连续学习',
  project_submit: '提交项目',
} as const;

interface TimelineActivity {
  id: string;
  user_id: string;
  activity_type: keyof typeof activityIcons;
  activity_title: string;
  activity_description?: string;
  course_id?: string;
  lesson_id?: string;
  experience_gained: number;
  created_at: string;
  courses?: { title: string };
  lessons?: { title: string };
}

interface LearningTimelineProps {
  userId?: string;
  limit?: number;
  showFilters?: boolean;
  compact?: boolean;
}

export const LearningTimeline: React.FC<LearningTimelineProps> = ({
  userId,
  limit = 20,
  showFilters = true,
  compact = false
}) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  
  const [timeline, setTimeline] = useState<TimelineActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<string>('all');
  const [showAll, setShowAll] = useState(false);

  // 加载时间线数据
  const loadTimeline = async () => {
    if (!targetUserId) {
      console.log('LearningTimeline: 没有用户ID');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('LearningTimeline: 开始加载时间线数据，用户ID:', targetUserId);
      const data = await gamificationService.getUserTimeline(targetUserId, showAll ? 100 : limit);
      console.log('LearningTimeline: 获取到的时间线数据:', data);
      setTimeline(data);
    } catch (err) {
      console.error('加载学习时间线失败:', err);
      setError(`加载学习时间线失败: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimeline();
  }, [targetUserId, limit, showAll]);

  // 切换展开/收起
  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  // 过滤时间线数据
  const filteredTimeline = timeline.filter(activity => {
    if (filterType === 'all') return true;
    return activity.activity_type === filterType;
  });

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return '刚刚';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}小时前`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}天前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ghibli-skyBlue"></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center p-8">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={loadTimeline} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            重试
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-ghibli-deepTeal">
            <Calendar className="h-5 w-5" />
            <span>学习时间线</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            {showFilters && (
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="all">全部活动</option>
                <option value="lesson_complete">完成课时</option>
                <option value="quiz_pass">通过测验</option>
                <option value="course_complete">完成课程</option>
                <option value="daily_streak">连续学习</option>
              </select>
            )}
            <Button onClick={loadTimeline} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredTimeline.length > 0 ? (
          <div className="space-y-4">
            {filteredTimeline.map((activity, index) => {
              const IconComponent = activityIcons[activity.activity_type] || BookOpen;
              const colorClass = activityColors[activity.activity_type] || 'bg-gray-500';
              const isExpanded = expandedItems.has(activity.id);
              const isLast = index === filteredTimeline.length - 1;
              
              return (
                <div key={activity.id} className="relative">
                  {/* 时间线连接线 */}
                  {!isLast && (
                    <div className="absolute left-4 top-12 w-0.5 h-8 bg-gray-200"></div>
                  )}
                  
                  <div className={cn(
                    "flex items-start space-x-4 p-4 rounded-lg transition-colors",
                    compact ? "bg-gray-50" : "bg-white border hover:bg-gray-50"
                  )}>
                    {/* 活动图标 */}
                    <div className={cn(
                      "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                      colorClass
                    )}>
                      <IconComponent className="h-4 w-4 text-white" />
                    </div>
                    
                    {/* 活动内容 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-ghibli-deepTeal">
                            {activity.activity_title}
                          </h4>
                          {activity.activity_description && (
                            <p className="text-xs text-gray-600 mt-1">
                              {activity.activity_description}
                            </p>
                          )}
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {activityNames[activity.activity_type]}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              {formatTime(activity.created_at)}
                            </span>
                          </div>
                        </div>
                        
                        {/* 经验值和展开按钮 */}
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="bg-ghibli-sunshine text-white">
                            +{activity.experience_gained} EXP
                          </Badge>
                          {(activity.courses || activity.lessons) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpanded(activity.id)}
                              className="h-6 w-6 p-0"
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {/* 展开的详细信息 */}
                      {isExpanded && (activity.courses || activity.lessons) && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          {activity.courses && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">课程：</span>
                              {activity.courses.title}
                            </p>
                          )}
                          {activity.lessons && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">课时：</span>
                              {activity.lessons.title}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* 显示更多按钮 */}
            {!showAll && timeline.length >= limit && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAll(true)}
                  className="text-sm"
                >
                  显示更多活动
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>还没有学习活动记录</p>
            <p className="text-sm">完成课程和课时来获得经验值吧！</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LearningTimeline;
