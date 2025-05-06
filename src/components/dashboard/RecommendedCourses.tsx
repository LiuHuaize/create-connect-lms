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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2 sm:mb-0">为您推荐</h2>
          <div className="flex flex-wrap items-center gap-2 text-sm mt-2">
            <span className="text-gray-500">相关主题:</span>
            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer">商业规划</Badge>
            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 cursor-pointer">游戏设计</Badge>
            <Badge className="bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer">产品开发</Badge>
          </div>
        </div>
        
        <Link to="/explore-courses" className="hidden sm:flex items-center gap-1 text-connect-blue hover:underline text-sm mt-2 sm:mt-0">
          更多课程 <ArrowRight size={16} />
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
          <div className="text-center py-12 col-span-full">
            <p className="text-gray-500 mb-4">暂无推荐课程</p>
            <Link to="/explore-courses">
              <Button variant="outline">浏览所有课程</Button>
            </Link>
          </div>
        )}
      </div>
      
      <div className="flex justify-center mt-6 sm:hidden">
        <Link to="/explore-courses">
          <Button variant="outline" className="flex items-center gap-1">
            查看更多 <ArrowRight size={16} />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default RecommendedCourses; 