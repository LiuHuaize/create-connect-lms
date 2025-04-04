
import React from 'react';
import { Button } from '@/components/ui/button';
import CourseCard from '@/components/ui/CourseCard';
import { Course } from '@/types/course';

interface CourseListProps {
  courses: Course[];
  onEnroll: (courseId: string) => void;
}

const CourseList: React.FC<CourseListProps> = ({ courses, onEnroll }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <div key={course.id} className="relative">
          <CourseCard
            type={course.category === '商业规划' ? 'skill' : 
                  course.price === 0 || course.price === null ? 'free' : 'career'}
            title={course.title}
            description={course.short_description || course.description || ''}
            certificate={Boolean(course.price)}
            level={course.difficulty === 'initial' ? '初级' : 
                  course.difficulty === 'intermediate' ? '中级' : 
                  course.difficulty === 'advanced' ? '高级' : ''}
            hours={10} // 默认值，实际应从数据库获取
          />
          <div className="mt-4 flex justify-end">
            <Button 
              onClick={() => onEnroll(course.id || '')}
              variant="default"
              size="sm"
            >
              加入课程
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CourseList;
