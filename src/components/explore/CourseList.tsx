
import React from 'react';
import { Button } from '@/components/ui/button';
import { Clock, Book, Users } from 'lucide-react';
import { Course } from '@/types/course';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

interface CourseListProps {
  courses: Course[];
  onEnroll: (courseId: string) => void;
}

const CourseList: React.FC<CourseListProps> = ({ courses, onEnroll }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
          <div className="h-52 overflow-hidden bg-gray-100 relative">
            {course.cover_image ? (
              <img 
                src={course.cover_image} 
                alt={course.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-50">
                <Book size={48} className="text-blue-300" />
              </div>
            )}
            <div className="absolute top-3 left-3">
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                course.category === '商业规划' ? 'bg-blue-100 text-blue-700' : 
                course.category === '游戏设计' ? 'bg-purple-100 text-purple-700' : 
                course.category === '产品开发' ? 'bg-green-100 text-green-700' :
                course.category === '编程' ? 'bg-amber-100 text-amber-700' :
                course.category === '创意写作' ? 'bg-pink-100 text-pink-700' :
                course.price === 0 || course.price === null ? 'bg-emerald-100 text-emerald-700' : 
                'bg-indigo-100 text-indigo-700'
              }`}>
                {course.category || '免费课程'}
              </span>
            </div>
          </div>
          
          <CardContent className="p-5">
            <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{course.title}</h3>
            <p className="text-sm text-gray-600 line-clamp-3 mb-4">
              {course.short_description || course.description || '暂无课程描述'}
            </p>
            
            <div className="flex items-center text-xs text-gray-500">
              <Clock size={14} className="mr-1" />
              <span>10 小时</span>
              
              {course.difficulty && (
                <>
                  <span className="mx-2">•</span>
                  <span>{
                    course.difficulty === 'initial' ? '初级' : 
                    course.difficulty === 'intermediate' ? '中级' : 
                    course.difficulty === 'advanced' ? '高级' : '所有级别'
                  }</span>
                </>
              )}
              
              <span className="mx-2">•</span>
              <Users size={14} className="mr-1" />
              <span>已有 {Math.floor(Math.random() * 100) + 5} 人加入</span>
            </div>
          </CardContent>
          
          <CardFooter className="bg-gray-50 p-4 border-t border-gray-100">
            <Button 
              onClick={() => onEnroll(course.id || '')}
              variant="default"
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              加入课程
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default CourseList;
