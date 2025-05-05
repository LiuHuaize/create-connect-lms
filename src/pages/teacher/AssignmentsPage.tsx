import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart4,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  Layers,
  Search,
  UserCheck,
  Filter,
  GraduationCap,
  ArrowRight
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { courseService } from '@/services/courseService';
import { useAuth } from '@/contexts/AuthContext';
import { getUngradeSubmissionsCount } from '@/services/assignmentService';
import { Skeleton } from '@/components/ui/skeleton';

export default function TeacherAssignmentsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [ungradedCounts, setUngradedCounts] = useState<Record<string, number>>({});

  // 加载教师创建的课程
  useEffect(() => {
    if (user?.id) {
      loadCourses();
    }
  }, [user?.id]);

  // 加载课程
  const loadCourses = async () => {
    try {
      setIsLoading(true);
      
      if (!user?.id) {
        console.error('加载课程失败: 用户ID不存在');
        return;
      }
      
      const data = await courseService.getUserCourses(user.id);
      setCourses(data || []);
      
      // 加载各课程未评分作业数量
      if (data && data.length > 0) {
        const countsPromises = data.map(async (course) => {
          try {
            const count = await getUngradeSubmissionsCount(course.id);
            return { courseId: course.id, count: count || 0 };
          } catch (error) {
            console.error(`获取课程 ${course.id} 的未评分作业数量失败:`, error);
            return { courseId: course.id, count: 0 };
          }
        });
        
        const countsResults = await Promise.all(countsPromises);
        const countsMap = countsResults.reduce((acc, curr) => {
          acc[curr.courseId] = curr.count;
          return acc;
        }, {} as Record<string, number>);
        
        setUngradedCounts(countsMap);
      }
    } catch (error) {
      console.error('加载课程失败:', error);
      toast({
        title: '加载失败',
        description: '无法加载您创建的课程',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 过滤课程
  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (course.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 进入课程作业评分页面
  const handleViewCourseAssignments = (courseId: string) => {
    navigate(`/course/${courseId}/assignments`);
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">作业评分中心</h1>
        <p className="text-gray-500">查看和评分您课程中的学生作业提交</p>
      </div>

      {/* 搜索和过滤 */}
      <div className="mb-6">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="搜索课程..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* 课程列表 */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold flex items-center">
          <BookOpen className="mr-2 h-5 w-5" />
          我创建的课程
        </h2>

        {isLoading ? (
          // 加载状态
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="p-0">
                  <Skeleton className="h-48 w-full" />
                </CardHeader>
                <CardContent className="pt-6">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-4" />
                  <div className="flex space-x-2 mb-4">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          // 没有课程
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <GraduationCap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">没有找到课程</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery ? '没有找到匹配的课程，请尝试其他搜索词' : '您还没有创建任何课程'}
            </p>
            {!searchQuery && (
              <Button onClick={() => navigate('/course-selection')}>
                创建第一个课程
              </Button>
            )}
          </div>
        ) : (
          // 课程列表
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="overflow-hidden hover:shadow-md transition-shadow duration-300">
                <CardHeader className="p-0">
                  <div className="h-48 bg-gray-200 relative overflow-hidden">
                    {course.cover_image ? (
                      <img
                        src={course.cover_image}
                        alt={course.title}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gradient-to-r from-blue-50 to-indigo-50">
                        <BookOpen className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                    {ungradedCounts[course.id] > 0 && (
                      <Badge className="absolute top-3 right-3 bg-red-500">
                        {ungradedCounts[course.id]} 个未评分
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <h3 className="text-xl font-semibold mb-2 line-clamp-1">{course.title}</h3>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                    {course.description || '没有描述'}
                  </p>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="flex items-center">
                      <Layers className="mr-1 h-4 w-4 text-gray-500" />
                      <span>{course.modules_count || 0} 个模块</span>
                    </div>
                    <div className="flex items-center">
                      <FileText className="mr-1 h-4 w-4 text-gray-500" />
                      <span>{course.lessons_count || 0} 个课时</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <UserCheck className="mr-1 h-4 w-4" />
                    <span>{course.enrollments_count || 0} 名学生</span>
                  </div>
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => handleViewCourseAssignments(course.id)}
                  >
                    查看作业
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 