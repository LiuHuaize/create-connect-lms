
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, User, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DbCourse } from '@/types/db';
import { format } from 'date-fns';

interface CourseListProps {
  courses: DbCourse[];
  isLoading?: boolean;
  emptyMessage?: string;
  showAuthor?: boolean;
}

const CourseList: React.FC<CourseListProps> = ({ 
  courses, 
  isLoading = false, 
  emptyMessage = "没有找到课程",
  showAuthor = true
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-48 bg-gray-200 rounded-t-lg"></div>
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </CardContent>
            <CardFooter>
              <div className="h-8 bg-gray-200 rounded w-full"></div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">{emptyMessage}</h3>
        <p className="text-gray-500">创建或选择其他课程来学习</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <Card key={course.id} className="overflow-hidden transition-all hover:shadow-md">
          <div className="h-48 bg-gray-100 relative">
            {course.cover_image_url ? (
              <img 
                src={course.cover_image_url} 
                alt={course.title} 
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <BookOpen className="h-12 w-12 text-gray-400" />
              </div>
            )}
            {course.status === 'draft' && (
              <Badge variant="secondary" className="absolute top-2 right-2">
                草稿
              </Badge>
            )}
          </div>
          
          <CardHeader>
            <CardTitle className="line-clamp-2">{course.title}</CardTitle>
          </CardHeader>
          
          <CardContent>
            <p className="text-gray-500 text-sm line-clamp-2 mb-4">
              {course.short_description || course.description || '暂无描述'}
            </p>
            
            <div className="flex flex-wrap gap-y-2">
              {course.difficulty && (
                <Badge variant="outline" className="mr-2">
                  {course.difficulty === 'beginner' && '初级'}
                  {course.difficulty === 'intermediate' && '中级'}
                  {course.difficulty === 'advanced' && '高级'}
                </Badge>
              )}
              
              {course.category && (
                <Badge variant="outline" className="mr-2">
                  {course.category}
                </Badge>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4">
            <div className="flex justify-between w-full text-xs text-gray-500">
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                <span>未知时长</span>
              </div>
              
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                <span>{format(new Date(course.created_at), 'yyyy.MM.dd')}</span>
              </div>
            </div>
            
            <Button 
              className="w-full"
              asChild
            >
              <Link to={`/learning/course/${course.id}`}>
                查看课程
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default CourseList;
