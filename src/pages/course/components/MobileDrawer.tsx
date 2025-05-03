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
      <DrawerContent className="h-[90vh] max-h-[90vh] bg-background rounded-t-xl">
        <DrawerHeader className="border-b border-border px-4 py-4 relative">
          <div className="absolute left-4 top-4 w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
            <BookOpen size={16} />
          </div>
          <div className="ml-12">
            <DrawerTitle className="text-lg text-foreground font-semibold">课程大纲</DrawerTitle>
            <DrawerDescription className="text-sm text-muted-foreground mt-1">{courseData?.title}</DrawerDescription>
          </div>
          <DrawerClose className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors">
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
        
        <DrawerFooter className="pt-2 px-4 border-t border-border">
          <DrawerClose asChild>
            <Button 
              variant="outline" 
              className="w-full rounded-xl py-3 text-foreground hover:bg-muted transition-all"
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
