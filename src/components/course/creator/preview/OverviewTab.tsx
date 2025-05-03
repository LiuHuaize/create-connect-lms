import React from 'react';
import { BookOpen, Clock, User, Calendar, GraduationCap, Book } from 'lucide-react';
import { Course, CourseModule } from '@/types/course';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/utils/date';

interface OverviewTabProps {
  course: Course;
  modules: CourseModule[];
  totalLessons: number;
  estimatedHours: number;
  formatDate: (dateString?: string) => string;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  course,
  modules,
  totalLessons,
  estimatedHours,
  formatDate
}) => {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-bold mb-4">关于本课程</h2>
          <p className="text-gray-700 whitespace-pre-line">
            {course.description || '这里将显示课程的详细描述，介绍课程内容、学习目标和预期成果。'}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-bold mb-4">课程内容</h2>
          <div className="space-y-3">
            {modules.map((module, index) => (
              <div key={module.id} className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 p-3 font-medium flex justify-between items-center">
                  <span>模块 {index + 1}：{module.title}</span>
                  <span className="text-sm text-gray-500">
                    {module.lessons?.length || 0} 课时
                  </span>
                </div>
                {module.lessons && module.lessons.length > 0 && (
                  <div className="divide-y">
                    {module.lessons.map((lesson, i) => (
                      <div key={lesson.id} className="p-3 flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-600">
                          {i + 1}
                        </div>
                        <div>
                          <p className="font-medium">{lesson.title}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            {lesson.type === 'video' && <span>视频课程</span>}
                            {lesson.type === 'text' && <span>阅读材料</span>}
                            {lesson.type === 'quiz' && <span>测验</span>}
                            {lesson.type === 'assignment' && <span>作业</span>}
                            <span>•</span>
                            <span>约 20 分钟</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-bold mb-4">课程信息</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-gray-700">{totalLessons} 课时</p>
                <p className="text-sm text-gray-500">课程包含的总课时数</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <GraduationCap className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-gray-700">
                  {course.grade_range_min && course.grade_range_max 
                    ? `${course.grade_range_min}-${course.grade_range_max}年级` 
                    : course.grade_range_min 
                    ? `${course.grade_range_min}年级及以上` 
                    : course.grade_range_max 
                    ? `${course.grade_range_max}年级及以下` 
                    : '所有年级'}
                </p>
                <p className="text-sm text-gray-500">适用年级范围</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Book className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-gray-700">
                  {course.primary_subject || '未指定'}
                  {course.secondary_subject ? ` + ${course.secondary_subject}` : ''}
                </p>
                <p className="text-sm text-gray-500">学科领域</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-gray-700">{formatDate(course.updated_at)}</p>
                <p className="text-sm text-gray-500">最近更新时间</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-gray-700">课程作者</p>
                <p className="text-sm text-gray-500">专业讲师</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-bold mb-4">课程标签</h2>
          <div className="flex flex-wrap gap-2">
            {course.category && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                {course.category}
              </Badge>
            )}
            {course.tags && course.tags.map((tag, i) => (
              <Badge key={i} variant="outline" className="bg-gray-50">
                {tag}
              </Badge>
            ))}
            {(!course.tags || course.tags.length === 0) && !course.category && (
              <span className="text-sm text-gray-500">暂无标签</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
