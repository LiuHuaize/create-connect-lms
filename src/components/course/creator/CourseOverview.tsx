import React from 'react';
import { BookOpen, Book, User, Image, Check, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Course, CourseModule } from '@/types/course';
import { Badge } from '@/components/ui/badge';

interface CourseOverviewProps {
  course: Course;
  modules: CourseModule[];
  completionPercentage: number;
  coverImageURL: string | null;
}

const CourseOverview: React.FC<CourseOverviewProps> = ({ 
  course, 
  modules, 
  completionPercentage, 
  coverImageURL 
}) => {
  const getPublishRequirements = () => {
    const requirements = [
      { name: '课程标题', complete: Boolean(course.title?.trim()) },
      { name: '课程封面', complete: Boolean(coverImageURL || course.cover_image) },
      { 
        name: '至少一个完成的模块', 
        complete: modules.length > 0 && modules.some(module => 
          module.lessons && module.lessons.length > 0
        ) 
      }
    ];
    return requirements;
  };

  return (
    <div className="bg-white sticky top-20 rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="font-bold mb-4">课程概览</h3>
      <p className="text-sm text-gray-600 mb-4">预览您的课程卡片</p>
      
      <div className="bg-gray-100 border border-gray-200 rounded-lg aspect-video flex items-center justify-center mb-4 overflow-hidden">
        {(coverImageURL || course.cover_image) ? (
          <img 
            src={coverImageURL || course.cover_image} 
            alt="课程封面" 
            className="w-full h-full object-cover"
          />
        ) : (
          <Image size={32} className="text-gray-400" />
        )}
      </div>
      
      <h4 className="font-semibold mb-2">{course.title || "您的课程标题"}</h4>
      <p className="text-sm text-gray-500 mb-4">{course.short_description || "您的课程描述将显示在这里。请确保描述具有吸引力，能够吸引学生。"}</p>
      
      <div className="flex items-center gap-2 mb-1">
        <BookOpen size={14} className="text-gray-400" />
        <span className="text-xs text-gray-500">
          适用年级: {course.grade_range_min && course.grade_range_max 
            ? `${course.grade_range_min}-${course.grade_range_max}` 
            : '所有'}
        </span>
      </div>
      
      <div className="flex items-center gap-2 mb-4">
        <Book size={14} className="text-gray-400" />
        <span className="text-xs text-gray-500">
          学科: {course.primary_subject || '未指定'}
          {course.secondary_subject ? ` + ${course.secondary_subject}` : ''}
        </span>
      </div>
      
      <div className="mb-5">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-medium text-gray-600">课程完成度</span>
          <span className="text-xs font-medium text-blue-500">{completionPercentage}%</span>
        </div>
        <Progress value={completionPercentage} className="h-1.5" />
      </div>
      
      <div className="space-y-2.5">
        <p className="text-xs font-medium text-gray-700">发布要求</p>
        {getPublishRequirements().map((req, index) => (
          <div key={index} className="flex items-center text-xs">
            <div className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mr-2 ${
              req.complete ? 'bg-green-500' : 'bg-gray-200'
            }`}>
              {req.complete && <Check className="h-2.5 w-2.5 text-white" />}
            </div>
            <span className={req.complete ? 'text-gray-700' : 'text-gray-500'}>
              {req.name}
            </span>
          </div>
        ))}
      </div>
      
      {completionPercentage < 50 && (
        <div className="mt-5 bg-amber-50 border border-amber-100 rounded-lg p-3 flex gap-2 items-start">
          <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            完成更多内容以增加发布成功率。高质量的课程更容易吸引学生。
          </p>
        </div>
      )}
    </div>
  );
};

export default CourseOverview;
