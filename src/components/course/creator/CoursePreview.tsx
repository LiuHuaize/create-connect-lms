
import React from 'react';
import { Course, CourseModule } from '@/types/course';
import PreviewDialog from './preview/PreviewDialog';

interface CoursePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  modules: CourseModule[];
}

const CoursePreview: React.FC<CoursePreviewProps> = (props) => {
  return <PreviewDialog {...props} />;
};

export default CoursePreview;
