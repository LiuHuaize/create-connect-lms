import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import useLearningData from '@/hooks/useLearningData';

// 导入拆分的组件
import InProgressCourses from '@/components/learning/InProgressCourses';
import CompletedCourses from '@/components/learning/CompletedCourses';
import SavedCourses from '@/components/learning/SavedCourses';

const Learning = () => {
  const {
    inProgressCourses,
    completedCourses,
    loadingEnrolled
  } = useLearningData();

  return (
    <div className="animate-fade-in p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 sm:mb-0">我的学习</h1>
        <Button asChild>
          <Link to="/explore-courses">
            <Search className="mr-2 h-4 w-4" /> 探索更多课程
          </Link>
        </Button>
      </div>
      
      <Tabs defaultValue="inProgress" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="inProgress">进行中</TabsTrigger>
          <TabsTrigger value="completed">已完成</TabsTrigger>
          <TabsTrigger value="saved">已保存</TabsTrigger>
        </TabsList>
        
        <TabsContent value="inProgress">
          <InProgressCourses 
            courses={inProgressCourses} 
            loading={loadingEnrolled} 
          />
        </TabsContent>
        
        <TabsContent value="completed">
          <CompletedCourses 
            courses={completedCourses} 
            loading={loadingEnrolled} 
          />
        </TabsContent>
        
        <TabsContent value="saved">
          <SavedCourses />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Learning;
