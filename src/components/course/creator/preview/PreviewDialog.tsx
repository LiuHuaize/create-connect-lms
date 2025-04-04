
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Course, CourseModule } from '@/types/course';
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
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0 h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-end p-2 absolute right-2 top-2 z-10">
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        
        <CourseHeader course={course} onClose={onClose} />
        
        <ScrollArea className="flex-1 overflow-y-auto">
          <CourseTabContent course={course} modules={modules} />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default PreviewDialog;
