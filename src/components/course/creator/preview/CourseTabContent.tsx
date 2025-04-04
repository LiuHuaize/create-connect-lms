
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Course, CourseModule } from '@/types/course';
import { useIsMobile } from '@/hooks/use-mobile';
import CourseTabNavigation from './CourseTabNavigation';
import OverviewTab from './OverviewTab';
import ContentTab from './ContentTab';
import InfoTab from './InfoTab';
import useCoursePreviewCalculations from './useCoursePreviewCalculations';

interface CourseTabContentProps {
  course: Course;
  modules: CourseModule[];
}

const CourseTabContent: React.FC<CourseTabContentProps> = ({
  course,
  modules,
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const { totalLessons, estimatedHours, formatDate } = useCoursePreviewCalculations(course, modules);
  const isMobile = useIsMobile();
  
  // 当预览打开时重置到默认标签
  useEffect(() => {
    setActiveTab("overview");
  }, []);
  
  return (
    <>
      <div className={`px-4 py-3 border-b bg-gray-50 ${isMobile ? 'sticky top-0 z-10' : ''}`}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CourseTabNavigation 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
          />
        </Tabs>
      </div>
      
      <div className="p-4 md:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="overview" className="mt-0">
            <OverviewTab 
              course={course}
              modules={modules}
              totalLessons={totalLessons}
              estimatedHours={estimatedHours}
              formatDate={formatDate}
            />
          </TabsContent>
          
          <TabsContent value="content" className="mt-0">
            <ContentTab modules={modules} />
          </TabsContent>
          
          <TabsContent value="info" className="mt-0">
            <InfoTab course={course} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default CourseTabContent;
