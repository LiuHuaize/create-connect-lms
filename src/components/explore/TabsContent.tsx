import React, { useMemo } from 'react';
import { TabsContent } from "@/components/ui/tabs";
import CourseList from '@/components/explore/CourseList';
import LoadingCourses from '@/components/explore/LoadingCourses';
import EmptyState from '@/components/explore/EmptyState';
import { Course } from '@/types/course';
import { CourseWithStats } from '@/hooks/useCoursesData';

interface TabsContentProps {
  activeTab: string;
  loading: boolean;
  filteredCourses: CourseWithStats[];
  handleViewCourseDetails: (courseId: string) => void;
  loadingEnrollment: boolean;
}

const ExploreTabsContent: React.FC<TabsContentProps> = ({
  activeTab,
  loading,
  filteredCourses,
  handleViewCourseDetails,
  loadingEnrollment
}) => {
  // 排序逻辑
  const sortedCourses = useMemo(() => {
    if (!filteredCourses || filteredCourses.length === 0) return filteredCourses;
    
    switch (activeTab) {
      case 'latest':
        // 按发布时间降序排序（最新在前）
        return [...filteredCourses].sort((a, b) => {
          const dateA = new Date(a.created_at || 0);
          const dateB = new Date(b.created_at || 0);
          return dateB.getTime() - dateA.getTime();
        });
        
      case 'popular':
        // 按加入人数降序排序（热门在前）
        return [...filteredCourses].sort((a, b) => {
          const enrollmentA = a.enrollment_count || 0;
          const enrollmentB = b.enrollment_count || 0;
          return enrollmentB - enrollmentA;
        });
        
      case 'recommended':
      default:
        // 推荐页面保持原有顺序
        return filteredCourses;
    }
  }, [filteredCourses, activeTab]);

  return (
    <>
      <TabsContent value="recommended" className="mt-6">
        {loading ? (
          <LoadingCourses />
        ) : sortedCourses.length === 0 ? (
          <EmptyState />
        ) : (
          <CourseList 
            courses={sortedCourses} 
            onEnroll={handleViewCourseDetails}
            loadingEnrollment={loadingEnrollment}
          />
        )}
      </TabsContent>
      
      <TabsContent value="popular" className="mt-6">
        {loading ? (
          <LoadingCourses />
        ) : sortedCourses.length === 0 ? (
          <EmptyState />
        ) : (
          <CourseList 
            courses={sortedCourses} 
            onEnroll={handleViewCourseDetails}
            loadingEnrollment={loadingEnrollment}
          />
        )}
      </TabsContent>
      
      <TabsContent value="latest" className="mt-6">
        {loading ? (
          <LoadingCourses />
        ) : sortedCourses.length === 0 ? (
          <EmptyState />
        ) : (
          <CourseList 
            courses={sortedCourses} 
            onEnroll={handleViewCourseDetails}
            loadingEnrollment={loadingEnrollment}
          />
        )}
      </TabsContent>
    </>
  );
};

export default ExploreTabsContent;
