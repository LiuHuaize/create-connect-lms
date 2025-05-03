import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useLearningData from '@/hooks/useLearningData';
import PageContainer from '@/components/layout/PageContainer';

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
    <PageContainer title="我的学习">
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
    </PageContainer>
  );
};

export default Learning;
