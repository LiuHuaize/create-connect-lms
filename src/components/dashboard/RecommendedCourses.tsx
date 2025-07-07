import React from 'react';
import { Star, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CourseCard from '@/components/ui/CourseCard';

interface Course {
  id: string;
  title: string;
  shortDescription?: string;
  courseType?: 'skill' | 'free' | 'career';
  level?: string;
  duration?: number;
  coursesCount?: number;
  certificate?: boolean;
  coverImage?: string | null;
  gradeRangeMin?: number | null;
  gradeRangeMax?: number | null;
  primarySubject?: string | null;
  secondarySubject?: string | null;
}

interface RecommendedCoursesProps {
  recommendedCourses: Course[];
  loadingRecommended: boolean;
}

const RecommendedCourses: React.FC<RecommendedCoursesProps> = ({ 
  recommendedCourses = [],
  loadingRecommended 
}) => {
  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-3">为您推荐</h2>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">相关主题:</span>
            <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 cursor-pointer font-medium">商业规划</Badge>
            <Badge variant="secondary" className="bg-purple-500/10 text-purple-700 hover:bg-purple-500/20 cursor-pointer font-medium">游戏设计</Badge>
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 cursor-pointer font-medium">产品开发</Badge>
          </div>
        </div>
        
        <Link to="/explore-courses" className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors mt-2 sm:mt-0">
          更多课程 <ArrowRight size={14} />
        </Link>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loadingRecommended ? (
          <div className="text-center py-12 col-span-full">
            <p className="text-gray-500">正在加载推荐课程...</p>
          </div>
        ) : recommendedCourses && recommendedCourses.length > 0 ? (
          recommendedCourses.map((course) => (
            <CourseCard
              key={course.id}
              id={course.id}
              type={course.courseType || 'skill'}
              title={course.title}
              description={course.shortDescription || ''}
              coursesCount={course.coursesCount}
              certificate={course.certificate}
              level={course.level || '初级'}
              hours={course.duration || 0}
              coverImage={course.coverImage}
              gradeRangeMin={course.gradeRangeMin}
              gradeRangeMax={course.gradeRangeMax}
              primarySubject={course.primarySubject}
              secondarySubject={course.secondarySubject}
            />
          ))
        ) : (
          <div className="text-center py-16 col-span-full bg-gray-50 rounded-xl">
            <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">暂无推荐课程</p>
            <Link to="/explore-courses">
              <Button className="bg-primary hover:bg-primary/90">浏览所有课程</Button>
            </Link>
          </div>
        )}
      </div>
      
      <div className="flex justify-center mt-6 sm:hidden">
        <Link to="/explore-courses" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
          查看更多 <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
};

export default RecommendedCourses; 