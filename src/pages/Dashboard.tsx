import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCoursesData } from '@/hooks/useCoursesData';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useEventsData } from '@/hooks/useEventsData';
import { useUserProgress } from '@/hooks/useUserProgress';
import { CalendarDays, Trophy, ArrowRight } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';

// 导入拆分后的组件
import DashboardProgress from '@/components/dashboard/DashboardProgress';
import OngoingCourses from '@/components/dashboard/OngoingCourses';
import AcquiredSkills from '@/components/dashboard/AcquiredSkills';
import UpcomingEvents from '@/components/dashboard/UpcomingEvents';
import RecommendedCourses from '@/components/dashboard/RecommendedCourses';

const Dashboard = () => {
  const { user } = useAuth();
  const { enrolledCourses, recommendedCourses, loadingEnrolled, loadingRecommended } = useCoursesData();
  const { events, loadingEvents } = useEventsData();
  const { overallProgress, skillsAcquired } = useUserProgress(enrolledCourses);

  // 过滤进行中的课程（进度小于100%）
  const ongoingCourses = React.useMemo(() => 
    enrolledCourses.filter(course => course.progress < 100).slice(0, 3), 
    [enrolledCourses]
  );

  // 过滤即将进行的活动（未开始且在未来7天内）
  const upcomingEvents = React.useMemo(() => {
    const now = new Date();
    const oneWeekLater = new Date();
    oneWeekLater.setDate(now.getDate() + 7);
    
    return events
      .filter(event => {
        const eventDate = new Date(event.date);
        return eventDate > now && eventDate < oneWeekLater;
      })
      .slice(0, 3);
  }, [events]);

  return (
    <PageContainer title="我的学习中心">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* 总体进度 */}
        <DashboardProgress overallProgress={overallProgress} />
        
        {/* 获得的技能 */}
        <AcquiredSkills skillsAcquired={skillsAcquired} />
        
        {/* 即将举行的活动 */}
        <UpcomingEvents upcomingEvents={upcomingEvents} loadingEvents={loadingEvents} />
      </div>
      
      {/* 正在学习的课程 */}
      <OngoingCourses 
        ongoingCourses={ongoingCourses} 
        loadingEnrolled={loadingEnrolled} 
      />
      
      {/* 推荐课程 */}
      <RecommendedCourses 
        recommendedCourses={recommendedCourses} 
        loadingRecommended={loadingRecommended} 
      />
    </PageContainer>
  );
};

export default Dashboard;
