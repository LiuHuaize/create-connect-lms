import React from 'react';
import { ChevronDown, Activity, Calendar, BookOpen, Star, Cpu } from 'lucide-react';
import CourseCard from '@/components/ui/CourseCard';
import FeatureCard from '@/components/ui/FeatureCard';
import { MessageSquare, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Dashboard = () => {
  return (
    <div className="animate-fade-in p-6 max-w-7xl mx-auto">
      {/* 学习进度部分 */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">我的学习进度</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 总体完成度 */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium">总体完成度</CardTitle>
                <Activity className="h-5 w-5 text-connect-blue" />
              </div>
              <CardDescription>本月学习情况</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">75%</span>
                  <span className="text-sm text-muted-foreground">目标: 100%</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span>本周学习时间: 4.5小时</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  提升 15%
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* 进行中的课程 */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium">进行中的课程</CardTitle>
                <BookOpen className="h-5 w-5 text-connect-blue" />
              </div>
              <CardDescription>继续你的学习</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">商业计划开发</span>
                    <span className="text-sm text-muted-foreground">68%</span>
                  </div>
                  <Progress value={68} className="h-2 mt-1" />
                </div>
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">卡牌游戏设计基础</span>
                    <span className="text-sm text-muted-foreground">42%</span>
                  </div>
                  <Progress value={42} className="h-2 mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 获得的技能 */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium">获得的技能</CardTitle>
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
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">已报名的活动</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-0">
              <div className="flex">
                <div className="w-24 bg-connect-blue/10 flex items-center justify-center p-4">
                  <Calendar className="h-8 w-8 text-connect-blue" />
                </div>
                <div className="p-4">
                  <div className="flex items-center">
                    <h3 className="font-medium">产品设计工作坊</h3>
                    <Badge className="ml-2">线上</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">4月15日，下午2:00 - 4:00</p>
                  <div className="flex items-center mt-2 text-sm text-muted-foreground">
                    <span>已报名人数: 42</span>
                    <span className="mx-2">•</span>
                    <span>主讲人: 张明</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <div className="flex">
                <div className="w-24 bg-amber-500/10 flex items-center justify-center p-4">
                  <Calendar className="h-8 w-8 text-amber-600" />
                </div>
                <div className="p-4">
                  <div className="flex items-center">
                    <h3 className="font-medium">行业专家问答会</h3>
                    <Badge className="ml-2" variant="outline">线下</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">4月20日，晚上7:00 - 9:00</p>
                  <div className="flex items-center mt-2 text-sm text-muted-foreground">
                    <span>已报名人数: 28</span>
                    <span className="mx-2">•</span>
                    <span>地点: 创新中心</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">为你推荐</h1>
            <div className="flex items-center gap-1 text-sm text-gray-500 ml-2">
              <span>相关主题:</span>
              <button className="text-connect-blue hover:underline">商业规划</button>
              <span>|</span>
              <button className="text-connect-blue hover:underline">游戏设计</button>
              <span>|</span>
              <button className="text-connect-blue hover:underline">产品开发</button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
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
      
      <div className="flex justify-center mb-12">
        <button className="flex items-center gap-2 py-2 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
          查看更多 <ChevronDown size={16} />
        </button>
      </div>
      
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">发现更多功能</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
