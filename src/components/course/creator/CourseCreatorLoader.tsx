import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useCourseDataLoader } from '@/hooks/useCourseDataLoader';
import { Course, CourseModule } from '@/types/course';
import { useCourseCreator } from '@/hooks/useCourseCreator';
import CourseLoadingIndicator from './CourseLoadingIndicator';
import AutoSaveStatus from './AutoSaveStatus';
import { toast } from 'sonner';

interface CourseCreatorLoaderProps {
  children: React.ReactNode;
}

/**
 * 课程编辑器加载器组件
 * - 处理课程数据的优化加载
 * - 显示加载进度和自动保存状态
 * - 将加载的课程数据传递给子组件
 */
const CourseCreatorLoader: React.FC<CourseCreatorLoaderProps> = ({ children }) => {
  const location = useLocation();
  const courseId = new URLSearchParams(location.search).get('id');
  
  // 获取课程创建器的状态和方法
  const {
    setCourse,
    setModules,
    isAutoSaving,
    lastSaved,
    autoSaveEnabled,
    setAutoSaveEnabled,
    autoSaveStatus,
    retryCount,
    timeUntilNextSave,
  } = useCourseCreator();
  
  // 使用优化的课程数据加载器
  const {
    course,
    modules,
    isLoading,
    loadingProgress,
    loadingMessage,
    error,
    moduleDataLoaded,
    hasBackup,
    restoreFromBackup,
    reloadCourse
  } = useCourseDataLoader({
    courseId,
    onDataLoaded: (loadedCourse, loadedModules) => {
      // 当数据加载完成后，更新课程创建器的状态
      setCourse(loadedCourse);
      setModules(loadedModules);
      
      console.log(`课程 ${loadedCourse.title} 已加载，包含 ${loadedModules.length} 个模块`);
      
      // 显示加载完成的提示
      toast.success('课程加载完成', {
        description: `已加载 ${loadedModules.length} 个模块和课时`,
        duration: 3000,
      });
    }
  });
  
  // 如果加载出错且有本地备份，显示恢复选项
  useEffect(() => {
    if (error && hasBackup) {
      toast.error('加载课程出错', {
        description: (
          <div className="flex flex-col gap-2">
            <p>{error.message}</p>
            <button 
              onClick={() => restoreFromBackup()} 
              className="rounded bg-primary px-2 py-1 text-xs text-white"
            >
              从本地备份恢复
            </button>
          </div>
        ),
        duration: 10000,
      });
    } else if (error) {
      toast.error('加载课程出错', {
        description: error.message,
        duration: 5000,
      });
    }
  }, [error, hasBackup, restoreFromBackup]);

  return (
    <div className="relative min-h-screen w-full">
      {/* 显示加载指示器 */}
      <CourseLoadingIndicator
        isLoading={isLoading}
        loadingProgress={loadingProgress}
        loadingMessage={loadingMessage}
      />
      
      {/* 自动保存状态显示 */}
      <div className="fixed bottom-4 right-4 z-50">
        <AutoSaveStatus
          autoSaveEnabled={autoSaveEnabled}
          setAutoSaveEnabled={setAutoSaveEnabled}
          isAutoSaving={isAutoSaving}
          lastSaved={lastSaved}
          autoSaveStatus={autoSaveStatus}
          retryCount={retryCount}
          timeUntilNextSave={timeUntilNextSave}
        />
      </div>
      
      {/* 渲染子组件 */}
      {children}
      
      {/* 如果有错误且没有备份，显示重试按钮 */}
      {error && !hasBackup && (
        <div className="fixed bottom-20 right-4 z-50">
          <button
            onClick={() => reloadCourse()}
            className="flex items-center rounded-md bg-primary px-4 py-2 text-sm text-white shadow-md"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="mr-2 h-4 w-4" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
            重新加载
          </button>
        </div>
      )}
    </div>
  );
};

export default CourseCreatorLoader; 