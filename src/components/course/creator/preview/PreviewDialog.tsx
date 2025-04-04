
import React from 'react';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Course, CourseModule } from '@/types/course';
import { useIsMobile } from '@/hooks/use-mobile';
import CourseHeader from './CourseHeader';
import CourseTabContent from './CourseTabContent';

interface PreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  modules: CourseModule[];
}

const PreviewDialog: React.FC<PreviewDialogProps> = ({
  isOpen,
  onClose,
  course,
  modules,
}) => {
  const isMobile = useIsMobile();
  
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
            <CourseTabContent 
              course={course} 
              modules={modules}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PreviewDialog;
