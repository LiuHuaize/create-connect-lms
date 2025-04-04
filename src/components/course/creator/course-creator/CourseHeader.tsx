
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Course, CourseModule } from '@/types/course';
import { courseService } from '@/services/courseService';
import { toast } from 'sonner';
import CoursePreview from '../CoursePreview';

interface CourseHeaderProps {
  course: Course;
  modules: CourseModule[];
  handleBackToSelection: () => void;
  handleSaveCourse: () => Promise<void>;
}

const CourseHeader: React.FC<CourseHeaderProps> = ({
  course,
  modules,
  handleBackToSelection,
  handleSaveCourse,
}) => {
  const [previewOpen, setPreviewOpen] = useState(false);

  const handlePublishCourse = async () => {
    try {
      if (!course.id) {
        await handleSaveCourse();
      }

      await courseService.updateCourseStatus(course.id!, 'published');
      toast.success('课程已发布');
    } catch (error) {
      console.error('发布课程失败:', error);
      toast.error('发布课程失败');
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-2" 
            onClick={handleBackToSelection}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> 返回课程列表
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">课程创建器</h1>
          <p className="text-gray-500">设计并发布您自己的课程</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => setPreviewOpen(true)}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            预览
          </Button>
          <Button variant="outline" onClick={handleSaveCourse}>保存草稿</Button>
          <Button onClick={handlePublishCourse} className="bg-connect-blue hover:bg-blue-600">发布</Button>
        </div>
      </div>

      <CoursePreview 
        isOpen={previewOpen} 
        onClose={() => setPreviewOpen(false)} 
        course={course}
        modules={modules}
      />
    </>
  );
};

export default CourseHeader;
