
import React from 'react';
import { BookOpen } from 'lucide-react';
import { CourseModule } from '@/types/course';

interface ContentTabProps {
  modules: CourseModule[];
}

const ContentTab: React.FC<ContentTabProps> = ({ modules }) => {
  return (
    <div className="bg-white p-6 rounded-lg border">
      <h2 className="text-xl font-bold mb-4">课程大纲</h2>
      <div className="space-y-6">
        {modules.length > 0 ? (
          modules.map((module, index) => (
            <div key={module.id}>
              <h3 className="text-lg font-semibold flex items-center">
                <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mr-2 text-sm">
                  {index + 1}
                </span>
                {module.title}
              </h3>
              
              {module.lessons && module.lessons.length > 0 ? (
                <div className="mt-3 ml-9 space-y-3">
                  {module.lessons.map((lesson, i) => (
                    <div key={lesson.id} className="flex items-start gap-3 p-3 rounded-md hover:bg-gray-50">
                      <div className="mt-0.5">
                        {lesson.type === 'video' && (
                          <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center">
                            <BookOpen className="h-4 w-4" />
                          </div>
                        )}
                        {lesson.type === 'text' && (
                          <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                            <BookOpen className="h-4 w-4" />
                          </div>
                        )}
                        {lesson.type === 'quiz' && (
                          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">
                            <BookOpen className="h-4 w-4" />
                          </div>
                        )}
                        {lesson.type === 'assignment' && (
                          <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center">
                            <BookOpen className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{lesson.title}</p>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <span>
                            {lesson.type === 'video' && '视频'}
                            {lesson.type === 'text' && '阅读材料'}
                            {lesson.type === 'quiz' && '测验'}
                            {lesson.type === 'assignment' && '作业'}
                          </span>
                          <span className="mx-2">•</span>
                          <span>约 20 分钟</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 ml-9 mt-2">
                  该模块暂无课时内容
                </p>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500">暂无课程内容</p>
            <p className="text-sm text-gray-400 mt-1">请添加课程模块和课时</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentTab;
