
import React, { useState, useEffect } from 'react';
import { Course, CourseModule } from '@/types/course';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

// Import the components
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
  const isMobile = useIsMobile();
  
  // 当预览打开时重置到默认标签
  useEffect(() => {
    if (isOpen) {
      setActiveTab("overview");
    }
  }, [isOpen]);
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`max-w-5xl p-0 overflow-hidden bg-white ${isMobile ? 'h-[95vh] w-[95vw] max-w-[95vw]' : ''}`}>
        <div className="flex flex-col h-full">
          {/* 课程封面区域 */}
          <div className="relative">
            <CourseHeader course={course} onClose={onClose} />
            <DialogClose asChild className="absolute top-2 right-2 z-10">
              <Button variant="ghost" size="icon" className="rounded-full bg-white/80 hover:bg-white/90">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
          
          {/* 课程内容区域 */}
          <div className="flex-1 overflow-auto">
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CoursePreview;
