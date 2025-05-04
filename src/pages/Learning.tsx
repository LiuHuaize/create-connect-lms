import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useLearningData from '@/hooks/useLearningData';
import PageContainer from '@/components/layout/PageContainer';

// 导入拆分的组件
import InProgressCourses from '@/components/learning/InProgressCourses';
import CompletedCourses from '@/components/learning/CompletedCourses';
import SavedCourses from '@/components/learning/SavedCourses';
import LearningStats from '@/components/learning/LearningStats';

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
          
          <LearningStats 
            totalTimeSpent={120} 
            coursesInProgress={inProgressCourses.length} 
            coursesCompleted={completedCourses.length}
            streakDays={3}
          />
        </TabsContent>
        
        <TabsContent value="completed">
          <CompletedCourses 
            courses={completedCourses} 
            loading={loadingEnrolled} 
          />
          
          <LearningStats 
            totalTimeSpent={120} 
            coursesInProgress={inProgressCourses.length} 
            coursesCompleted={completedCourses.length}
            streakDays={3}
          />
        </TabsContent>
        
        <TabsContent value="saved">
          <SavedCourses />
          
          <LearningStats 
            totalTimeSpent={120} 
            coursesInProgress={inProgressCourses.length} 
            coursesCompleted={completedCourses.length}
            streakDays={3}
          />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default Learning;
