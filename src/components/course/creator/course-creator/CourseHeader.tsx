import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye, Loader2, Check, Clock } from 'lucide-react';
import { Course, CourseModule } from '@/types/course';
import { courseService } from '@/services/courseService';
import { toast } from 'sonner';
import CoursePreview from '../CoursePreview';

interface CourseHeaderProps {
  course: Course;
  modules: CourseModule[];
  handleBackToSelection: () => void;
  handleSaveCourse: () => Promise<string | undefined>;
  isAutoSaving?: boolean;
  lastSaved?: Date | null;
  setCourse?: React.Dispatch<React.SetStateAction<Course>>;
}

const CourseHeader: React.FC<CourseHeaderProps> = ({
  course,
  modules,
  handleBackToSelection,
  handleSaveCourse,
  isAutoSaving = false,
  lastSaved = null,
  setCourse
}) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await handleSaveCourse();
      toast.success('课程已保存');
    } catch (error) {
      console.error('保存课程失败:', error);
      toast.error('保存课程失败，请检查网络连接或刷新页面后重试');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishCourse = async () => {
    try {
      setIsPublishing(true);
      
      // 先保存课程内容
      const savedCourseId = await handleSaveCourse();
      if (!savedCourseId) {
        throw new Error('保存课程失败，无法发布');
      }
      
      // 检查课程内容是否足够发布
      if (modules.length === 0) {
        toast.error('课程需要至少包含一个模块才能发布');
        return;
      }
      
      // 检查每个模块是否有内容
      const hasEmptyModule = modules.some(module => !module.lessons || module.lessons.length === 0);
      if (hasEmptyModule) {
        toast.error('所有模块都必须包含至少一个课时才能发布');
        return;
      }
      
      // 更新课程状态为发布
      const updatedCourse = await courseService.updateCourseStatus(savedCourseId, 'published');
      
      // 更新本地状态
      if (setCourse) {
        setCourse(prev => ({
          ...prev,
          status: updatedCourse.status
        }));
      }
      
      toast.success('课程已成功发布，现在学生可以访问此课程');
      
      // 强制重新获取课程数据以确保显示的是最新状态
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('发布课程失败:', error);
      toast.error(error instanceof Error ? error.message : "未知错误");
    } finally {
      setIsPublishing(false);
    }
  };

  // 格式化上次保存时间
  const getLastSavedText = () => {
    if (!lastSaved) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - lastSaved.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) {
      return '刚刚保存';
    } else if (diffMins < 60) {
      return `${diffMins}分钟前保存`;
    } else {
      const hours = Math.floor(diffMins / 60);
      return `${hours}小时前保存`;
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
          {/* 自动保存状态指示器 */}
          {course.id && (
            <div className="flex items-center mr-3 text-sm text-gray-500">
              {isAutoSaving ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin text-gray-400" />
                  <span>自动保存中...</span>
                </>
              ) : lastSaved ? (
                <>
                  <Check className="h-3 w-3 mr-1 text-green-500" />
                  <span>{getLastSavedText()}</span>
                </>
              ) : (
                <>
                  <Clock className="h-3 w-3 mr-1 text-gray-400" />
                  <span>未保存</span>
                </>
              )}
            </div>
          )}
          
          <Button 
            variant="outline" 
            onClick={() => setPreviewOpen(true)}
            className="gap-2"
            disabled={isSaving || isPublishing}
          >
            <Eye className="h-4 w-4" />
            预览
          </Button>
          <Button 
            variant="outline" 
            onClick={handleSave}
            disabled={isSaving || isPublishing}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : '保存草稿'}
          </Button>
          <Button 
            onClick={handlePublishCourse} 
            className="bg-connect-blue hover:bg-blue-600"
            disabled={isSaving || isPublishing}
          >
            {isPublishing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                发布中...
              </>
            ) : '发布'}
          </Button>
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
