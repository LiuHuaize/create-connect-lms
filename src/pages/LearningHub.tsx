import React from 'react';
import { Container } from '@/components/ui/container';
import { CourseProgressCard } from '@/components/learning/CourseProgressCard';
import { SkillBadge } from '@/components/learning/SkillBadge';
import { ActivityItem } from '@/components/learning/ActivityItem';
import { ChevronRight, Trophy, Sparkles, LineChart } from 'lucide-react';
import { Link } from 'react-router-dom';

const LearningHub: React.FC = () => {
  // 模拟数据
  const courses = [
    {
      id: '1',
      title: '测试课程',
      description: '这是一个测试课程的描述',
      progress: 37,
      imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
      lastAccessed: '2023-05-05',
      duration: '2小时'
    },
    {
      id: '2',
      title: '西游记PBL项目制学习课程',
      description: '通过项目式学习深入解读《西游记》，探索其文化内涵与现实意义',
      progress: 0,
      imageUrl: 'https://images.unsplash.com/photo-1535905557558-afc4877a26fc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1374&q=80',
      lastAccessed: '2023-04-14',
      duration: '5小时'
    },
    {
      id: '3',
      title: '西游记PBL探索之旅',
      description: '一个奇妙的文学探索旅程',
      progress: 0,
      imageUrl: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
      duration: '3小时'
    }
  ];

  const skills = [
    { label: '产品原型设计', variant: 'secondary' },
    { label: '用户体验', variant: 'primary' },
    { label: '项目管理', variant: 'accent' }
  ];

  const activities = [
    {
      title: '产品设计工作坊',
      date: '07月09日',
      time: '21:27',
      tags: ['线上'],
      isOnline: true
    }
  ];

  return (
    <Container className="py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 左侧：课程进度 */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-foreground">我的学习</h2>
            <div className="flex space-x-3">
              <div className="flex items-center bg-card px-3 py-1.5 rounded-lg text-sm text-muted-foreground">
                <span className="font-medium text-foreground">总体完成度</span>
                <div className="ml-3 flex items-center gap-1">
                  <LineChart className="w-4 h-4 text-primary" />
                  <span className="text-primary font-semibold">21%</span>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">目标: 100%</div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">正在学习</h3>
            <Link to="/learning/all" className="text-primary hover:underline text-sm flex items-center">
              查看全部 <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map(course => (
              <CourseProgressCard
                key={course.id}
                title={course.title}
                description={course.description}
                progress={course.progress}
                imageUrl={course.imageUrl}
                lastAccessed={course.lastAccessed}
                duration={course.duration}
                onClick={() => console.log(`Navigate to course ${course.id}`)}
              />
            ))}
          </div>

          <div className="flex items-center justify-between mt-8">
            <h3 className="text-lg font-medium">为您推荐</h3>
            <Link to="/explore-courses" className="text-primary hover:underline text-sm flex items-center">
              更多课程 <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="flex gap-2 flex-wrap py-2">
            <span className="text-sm text-muted-foreground mr-2">相关主题:</span>
            <SkillBadge label="商业规划" variant="secondary" />
            <SkillBadge label="游戏设计" variant="accent" />
            <SkillBadge label="产品开发" variant="primary" />
          </div>
        </div>

        {/* 右侧：技能和活动 */}
        <div className="space-y-6">
          {/* 获得的技能 */}
          <div className="progress-card">
            <div className="flex items-center mb-4">
              <Trophy className="h-5 w-5 text-primary mr-2" />
              <h3 className="text-lg font-medium">获得的技能</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">最近掌握的能力</p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {skills.map((skill, index) => (
                <SkillBadge 
                  key={index} 
                  label={skill.label} 
                  variant={skill.variant as any} 
                />
              ))}
            </div>
          </div>

          {/* 即将举行的活动 */}
          <div className="progress-card">
            <div className="flex items-center mb-4">
              <Sparkles className="h-5 w-5 text-accent mr-2" />
              <h3 className="text-lg font-medium">即将举行的活动</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">最近的学习活动</p>
            
            {activities.length > 0 ? (
              <div className="space-y-3">
                {activities.map((activity, index) => (
                  <ActivityItem
                    key={index}
                    title={activity.title}
                    date={activity.date}
                    time={activity.time}
                    tags={activity.tags}
                    isOnline={activity.isOnline}
                  />
                ))}
                <Link 
                  to="/events" 
                  className="block text-center text-primary hover:underline text-sm mt-4 py-2"
                >
                  查看全部活动
                </Link>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-6">暂无推荐活动</p>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
};

export default LearningHub; 