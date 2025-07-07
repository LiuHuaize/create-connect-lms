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
        <TabsList className="mb-6 bg-gray-50 p-1.5 h-auto rounded-xl">
          <TabsTrigger 
            value="inProgress" 
            className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 px-6 py-2.5 rounded-lg font-medium"
          >
            <span className="flex items-center gap-2">
              进行中
              {inProgressCourses.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/20">
                  {inProgressCourses.length}
                </span>
              )}
            </span>
          </TabsTrigger>
          <TabsTrigger 
            value="completed"
            className="data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-green-500/25 px-6 py-2.5 rounded-lg font-medium"
          >
            <span className="flex items-center gap-2">
              已完成
              {completedCourses.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/20">
                  {completedCourses.length}
                </span>
              )}
            </span>
          </TabsTrigger>
          <TabsTrigger 
            value="saved"
            className="data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25 px-6 py-2.5 rounded-lg font-medium"
          >
            已保存
          </TabsTrigger>
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
