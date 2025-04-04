
import React from 'react';
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Course, CourseModule } from '@/types/course';
import CourseSidebar from './CourseSidebar';

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
      <DrawerContent className="h-[85vh] max-h-[85vh]">
        <DrawerHeader className="border-b px-4 py-2">
          <DrawerTitle className="text-lg">课程大纲</DrawerTitle>
          <DrawerDescription className="text-sm">{courseData?.title}</DrawerDescription>
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
        <DrawerFooter className="pt-2 px-4 border-t">
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">关闭</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default MobileDrawer;
