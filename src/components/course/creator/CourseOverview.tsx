
import React from 'react';
import { BookOpen, Clock, Image } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Course, CourseModule } from '@/types/course';

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
        <span className="text-xs text-gray-500">{modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0)} 课时</span>
      </div>
      
      <div className="flex items-center gap-2 mb-4">
        <Clock size={14} className="text-gray-400" />
        <span className="text-xs text-gray-500">0 小时总时长</span>
      </div>
      
      <div className="mb-4">
        <h5 className="text-sm font-medium mb-2">完成状态</h5>
        <Progress value={completionPercentage} className="h-2.5" />
        <p className="text-xs text-gray-500 mt-1">{completionPercentage}% 完成 - 添加更多内容以完成发布</p>
      </div>
      
      <div className="space-y-2">
        <h5 className="text-sm font-medium">发布所需</h5>
        
        {getPublishRequirements().map((requirement, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            {requirement.complete ? (
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            ) : (
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            )}
            <span>{requirement.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourseOverview;
