import React from 'react';
import { TabsContent } from "@/components/ui/tabs";
import CourseList from '@/components/explore/CourseList';
import LoadingCourses from '@/components/explore/LoadingCourses';
import EmptyState from '@/components/explore/EmptyState';
import { Course } from '@/types/course';

interface TabsContentProps {
  activeTab: string;
  loading: boolean;
  filteredCourses: Course[];
  handleEnrollCourse: (courseId: string) => void;
  loadingEnrollment: boolean;
}

const ExploreTabsContent: React.FC<TabsContentProps> = ({
  activeTab,
  loading,
  filteredCourses,
  handleEnrollCourse,
  loadingEnrollment
}) => {
  return (
    <>
      <TabsContent value="recommended" className="mt-6">
        {loading ? (
          <LoadingCourses />
        ) : filteredCourses.length === 0 ? (
          <EmptyState />
        ) : (
          <CourseList 
            courses={filteredCourses} 
            onEnroll={handleEnrollCourse}
            loadingEnrollment={loadingEnrollment}
          />
        )}
      </TabsContent>
      
      <TabsContent value="popular" className="mt-6">
        {loading ? (
          <LoadingCourses />
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-gray-500">即将推出热门课程...</p>
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="latest" className="mt-6">
        {loading ? (
          <LoadingCourses />
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-gray-500">即将推出最新课程...</p>
          </div>
        )}
      </TabsContent>
    </>
  );
};

export default ExploreTabsContent;
