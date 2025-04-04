
import React from 'react';
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Course, CourseModule } from '@/types/course';
import CourseSidebar from './CourseSidebar';
import { X } from 'lucide-react';

interface MobileDrawerProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  courseData: Course & { modules?: CourseModule[] };
  selectedLesson: any;
  progress: number;
}

const MobileDrawer: React.FC<MobileDrawerProps> = ({
  sidebarOpen,
  setSidebarOpen,
  courseData,
  selectedLesson,
  progress
}) => {
  return (
    <Drawer open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <DrawerContent className="h-[90vh] max-h-[90vh]">
        <DrawerHeader className="border-b px-4 py-2 flex justify-between items-center">
          <div>
            <DrawerTitle className="text-lg font-medium">课程大纲</DrawerTitle>
            <DrawerDescription className="text-sm text-gray-500">{courseData?.title}</DrawerDescription>
          </div>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon">
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>
        <div className="flex-1 overflow-auto">
          <CourseSidebar 
            courseData={courseData} 
            selectedLesson={selectedLesson} 
            progress={progress} 
            setSidebarOpen={setSidebarOpen}
            isMobile={true}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default MobileDrawer;
