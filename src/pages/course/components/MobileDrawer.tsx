import React from 'react';
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { X, BookOpen } from 'lucide-react';
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
      <DrawerContent className="h-[90vh] max-h-[90vh] bg-white dark:bg-slate-800 rounded-t-xl">
        <DrawerHeader className="border-b border-slate-200 dark:border-slate-700 px-4 py-4 relative">
          <div className="absolute left-4 top-4 w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
            <BookOpen size={16} />
          </div>
          <div className="ml-12">
            <DrawerTitle className="text-lg text-slate-800 dark:text-slate-200 font-semibold">课程大纲</DrawerTitle>
            <DrawerDescription className="text-sm text-slate-600 dark:text-slate-400 mt-1">{courseData?.title}</DrawerDescription>
          </div>
          <DrawerClose className="absolute right-4 top-4 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
            <X size={20} />
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
        
        <DrawerFooter className="pt-2 px-4 border-t border-slate-200 dark:border-slate-700">
          <DrawerClose asChild>
            <Button 
              variant="outline" 
              className="w-full rounded-xl py-3 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
            >
              关闭
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default MobileDrawer;
