import React, { useEffect } from 'react';
import { ChevronDown, Activity, Calendar, BookOpen, Star, Cpu, MessageSquare, CheckCircle } from 'lucide-react';
import CourseCard from '@/components/ui/CourseCard';
import FeatureCard from '@/components/ui/FeatureCard';
import { Link } from 'react-router-dom';
import { useCoursesData, EnrolledCourse } from '@/hooks/useCoursesData';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const Dashboard = () => {
  const { user } = useAuth();
  const { enrolledCourses, loadingEnrolled, fetchEnrolledCourses } = useCoursesData();

  useEffect(() => {
    if (user) {
      fetchEnrolledCourses();
    }
  }, [user]);

  // 获取用户总体学习进度
  const calculateOverallProgress = () => {
    if (enrolledCourses.length === 0) return 0;
    
    const totalProgress = enrolledCourses.reduce((sum, course) => sum + course.progress, 0);
    return Math.round(totalProgress / enrolledCourses.length);
  };

  const overallProgress = calculateOverallProgress();
  
  // 获取进行中的课程（按进度排序）
  const inProgressCourses = enrolledCourses
    .filter(course => course.progress < 100)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 2); // 获取前2个课程

  return (
    <div className="animate-fade-in p-4 sm:p-6 max-w-7xl mx-auto">
      {/* 学习进度部分 */}
      <section className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">我的学习进度</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* 总体完成度 */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg font-medium">总体完成度</CardTitle>
                <Activity className="h-5 w-5 text-connect-blue" />
              </div>
              <CardDescription>学习情况</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{overallProgress}%</span>
                  <span className="text-sm text-muted-foreground">目标: 100%</span>
                </div>
                <Progress value={overallProgress} className="h-2" />
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span>已加入课程: {enrolledCourses.length}个</span>
                <Link to="/learning">
                  <Badge variant="outline" className="bg-connect-blue/10 text-connect-blue border-connect-blue/20 cursor-pointer">
                    查看全部
                  </Badge>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* 进行中的课程 */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg font-medium">进行中的课程</CardTitle>
                <BookOpen className="h-5 w-5 text-connect-blue" />
              </div>
              <CardDescription>继续你的学习</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingEnrolled ? (
                <div className="text-center py-2">
                  <p className="text-sm text-gray-500">加载中...</p>
                </div>
              ) : inProgressCourses.length > 0 ? (
                <div className="space-y-3">
                  {inProgressCourses.map(course => (
                    <div key={course.id}>
                      <div className="flex justify-between items-center">
                        <Link to={`/course/${course.id}`} className="text-sm font-medium hover:text-connect-blue transition-colors">
                          {course.title}
                        </Link>
                        <span className="text-sm text-muted-foreground">{course.progress || 0}%</span>
                      </div>
                      <Progress value={course.progress || 0} className="h-2 mt-1" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-sm text-gray-500">您还没有加入任何课程</p>
                  <Link to="/explore-courses" className="text-sm text-connect-blue hover:underline mt-1 inline-block">
                    浏览课程
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 获得的技能 */}
          <Card className="sm:col-span-2 lg:col-span-1">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg font-medium">获得的技能</CardTitle>
                <Cpu className="h-5 w-5 text-connect-blue" />
              </div>
              <CardDescription>最近掌握的能力</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-connect-purple/10 text-connect-purple hover:bg-connect-purple/20 border-0">市场分析</Badge>
                <Badge className="bg-connect-blue/10 text-connect-blue hover:bg-connect-blue/20 border-0">产品原型设计</Badge>
                <Badge className="bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 border-0">项目管理</Badge>
                <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-0">团队协作</Badge>
                <Badge className="bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 border-0">用户体验</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 即将到来的活动 */}
      <section className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">已报名的活动</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <Card>
            <CardContent className="p-0">
              <div className="flex flex-col sm:flex-row">
                <div className="w-full sm:w-24 h-16 sm:h-auto bg-connect-blue/10 flex items-center justify-center p-4">
                  <Calendar className="h-8 w-8 text-connect-blue" />
                </div>
                <div className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium">产品设计工作坊</h3>
                    <Badge className="ml-0 sm:ml-2">线上</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">4月15日，下午2:00 - 4:00</p>
                  <div className="flex flex-col sm:flex-row sm:items-center mt-2 text-sm text-muted-foreground">
                    <span>已报名人数: 42</span>
                    <span className="hidden sm:inline mx-2">•</span>
                    <span>主讲人: 张明</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <div className="flex flex-col sm:flex-row">
                <div className="w-full sm:w-24 h-16 sm:h-auto bg-amber-500/10 flex items-center justify-center p-4">
                  <Calendar className="h-8 w-8 text-amber-600" />
                </div>
                <div className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium">行业专家问答会</h3>
                    <Badge className="ml-0 sm:ml-2" variant="outline">线下</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">4月20日，晚上7:00 - 9:00</p>
                  <div className="flex flex-col sm:flex-row sm:items-center mt-2 text-sm text-muted-foreground">
                    <span>已报名人数: 28</span>
                    <span className="hidden sm:inline mx-2">•</span>
                    <span>地点: 创新中心</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-0">为你推荐</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm mt-2">
            <span className="text-gray-500">相关主题:</span>
            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer">商业规划</Badge>
            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 cursor-pointer">游戏设计</Badge>
            <Badge className="bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer">产品开发</Badge>
          </div>
        </div>
      </div>

      {/* 为你推荐部分 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
        <CourseCard
          type="skill"
          title="商业计划开发"
          description="学习如何创建全面的商业计划。了解市场研究、财务预测和战略规划。"
          coursesCount={7}
          certificate={true}
          level="中级"
          hours={22}
        />
        
        <CourseCard
          type="free"
          title="卡牌游戏设计基础"
          description="探索卡牌游戏设计的基础知识。学习游戏机制、平衡策略和原型制作技术。"
          level="中级"
          hours={1}
        />
        
        <CourseCard
          type="career"
          title="项目管理专业"
          description="构建端到端项目管理技能。掌握规划、执行、监控和团队领导能力。"
          coursesCount={7}
          certificate={true}
          level="中级"
          hours={50}
        />
      </div>
      
      <div className="flex justify-center mb-8 sm:mb-12">
        <button className="flex items-center gap-2 py-2 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
          查看更多 <ChevronDown size={16} />
        </button>
      </div>
      
      <section className="mb-8 sm:mb-12">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">发现更多功能</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <FeatureCard
            icon={<MessageSquare size={24} className="text-connect-blue" />}
            title="互动工作坊"
            description="通过行业专家的实时反馈和指导练习您的技能。"
          />
          
          <FeatureCard
            icon={<CheckCircle size={24} className="text-connect-blue" />}
            title="项目就绪检查器"
            description="分析您的项目计划并获取改进策略和执行的建议。"
          />
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
