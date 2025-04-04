
import React, { useState } from 'react';
import { Course, CourseModule } from '@/types/course';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent } from '@/components/ui/tabs';

// Import the new components
import CourseHeader from './preview/CourseHeader';
import CourseTabNavigation from './preview/CourseTabNavigation';
import OverviewTab from './preview/OverviewTab';
import ContentTab from './preview/ContentTab';
import InfoTab from './preview/InfoTab';
import { useCoursePreviewCalculations } from './preview/useCoursePreviewCalculations';

interface CoursePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  modules: CourseModule[];
}

const CoursePreview: React.FC<CoursePreviewProps> = ({
  isOpen,
  onClose,
  course,
  modules,
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const { totalLessons, estimatedHours, formatDate } = useCoursePreviewCalculations(course, modules);
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden bg-white">
        <div className="flex flex-col h-[90vh]">
          {/* 课程封面区域 */}
          <CourseHeader course={course} onClose={onClose} />
          
          {/* 课程内容区域 */}
          <div className="flex-1 overflow-auto">
            <div className="px-6 py-4 border-b bg-gray-50">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <CourseTabNavigation 
                  activeTab={activeTab} 
                  onTabChange={setActiveTab} 
                />
              </Tabs>
            </div>
            
            <div className="p-6">
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CoursePreview;
