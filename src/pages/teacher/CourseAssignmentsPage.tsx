import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { courseService } from '@/services/courseService';
import { AssignmentSubmissionViewer } from '@/components/course/AssignmentSubmissionViewer';

export default function CourseAssignmentsPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [course, setCourse] = useState<any>(null);
  
  // 加载课程信息
  useEffect(() => {
    if (courseId) {
      loadCourse();
    }
  }, [courseId]);
  
  // 加载课程详情
  const loadCourse = async () => {
    try {
      setIsLoading(true);
      
      const data = await courseService.getCourseBasicInfo(courseId!);
      setCourse(data);
    } catch (error) {
      console.error('加载课程详情失败:', error);
      toast({
        title: '加载失败',
        description: '无法加载课程详情',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container py-8">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/teacher/assignments')}
          className="mr-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回
        </Button>
        
        <div>
          <h1 className="text-2xl font-bold">{isLoading ? '加载中...' : course?.title || '未知课程'}</h1>
          {!isLoading && course && (
            <p className="text-gray-500">{course.description}</p>
          )}
        </div>
      </div>
      
      {courseId && (
        <div className="bg-white p-6 rounded-lg shadow">
          {/* 使用我们前面创建的页面组件 */}
          <AssignmentSubmissionViewer
            courseId={courseId}
          />
        </div>
      )}
    </div>
  );
} 