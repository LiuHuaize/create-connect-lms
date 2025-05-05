import React, { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Menu } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import EditorLayout from '@/components/layout/EditorLayout';

// Lazy load page components
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Learning = lazy(() => import('@/pages/Learning'));
const Events = lazy(() => import('@/pages/Events'));
const CourseCreator = lazy(() => import('@/pages/CourseCreator'));
const CourseSelection = lazy(() => import('@/pages/CourseSelection'));
const Auth = lazy(() => import('@/pages/Auth'));
const CoursePage = lazy(() => import('@/pages/course/CoursePage'));
const UserManagement = lazy(() => import('@/pages/admin/UserManagement'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const ExploreCourses = lazy(() => import('@/pages/ExploreCourses'));
const TrashPage = lazy(() => import('@/pages/trash'));
const TeacherAssignmentsPage = lazy(() => import('@/pages/teacher/AssignmentsPage'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const BlockNoteEditorTest = lazy(() => import('@/components/editor').then(module => ({ default: module.BlockNoteEditorTest })));
const ModelTestComponent = lazy(() => import('@/components/ModelTestComponent'));
const CourseAssignmentsPage = lazy(() => import('@/pages/teacher/CourseAssignmentsPage'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex h-screen items-center justify-center">加载页面中...</div>
);

// Layout Wrapper for authenticated routes
const MainLayoutWrapper = () => {
  const location = useLocation();
  const isCoursePage = location.pathname.includes('/course/');
  return (
    <AppLayout isCoursePage={isCoursePage}>
      <Outlet />
    </AppLayout>
  );
};

// 预加载认证页面
const AuthLoadingFallback = () => (
  <div className="flex h-screen items-center justify-center bg-white">
    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
  </div>
);

// 预加载主要路由
const preloadRoutes = () => {
  // 异步预加载主要路由组件
  const preload = async () => {
    const importPromises = [
      import('@/pages/Dashboard'),
      import('@/pages/Learning')
    ];
    try {
      await Promise.all(importPromises);
    } catch (e) {
      console.error('路由预加载失败:', e);
    }
  };
  
  // 使用requestIdleCallback在浏览器空闲时预加载
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(preload, { timeout: 2000 });
  } else {
    setTimeout(preload, 2000);
  }
};

const AppRoutes = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user) {
      queryClient.prefetchQuery({ queryKey: ['courses'], staleTime: 5 * 60 * 1000 });
      queryClient.prefetchQuery({ queryKey: ['enrolledCourses', user.id], staleTime: 5 * 60 * 1000 });
      
      // 在用户登录后预加载常用路由
      preloadRoutes();
    }
  }, [user, queryClient]);

  return (
    <Routes>
      {/* 认证页面有单独的Suspense边界 */}
      <Route path="/auth" element={
        <Suspense fallback={<AuthLoadingFallback />}>
          <Auth />
        </Suspense>
      } />
      
      <Route path="/editor" element={<EditorLayout />}>
        <Route path="test" element={
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <BlockNoteEditorTest />
            </Suspense>
          </ProtectedRoute>
        } />
      </Route>

      <Route 
        path="/editor-test" 
        element={<Navigate to="/editor/test" replace />} 
      />

      <Route element={<MainLayoutWrapper />}>
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/auth" replace />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <Dashboard />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/learning" element={
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <Learning />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/explore-courses" element={
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <ExploreCourses />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/events" element={
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <Events />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/course/:courseId" element={
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <CoursePage />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/course/:courseId/lesson/:lessonId" element={
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <CoursePage />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <ProfilePage />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <SettingsPage />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/trash" element={
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <TrashPage />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/course-selection" element={
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <Suspense fallback={<LoadingFallback />}>
              <CourseSelection />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/teacher/assignments" element={
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <Suspense fallback={<LoadingFallback />}>
              <TeacherAssignmentsPage />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/course/:courseId/assignments" element={
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <Suspense fallback={<LoadingFallback />}>
              <CourseAssignmentsPage />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/course-creator" element={
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <Suspense fallback={<LoadingFallback />}>
              <CourseCreator />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Suspense fallback={<LoadingFallback />}>
              <UserManagement />
            </Suspense>
          </ProtectedRoute>
        } />
      </Route>

      <Route path="/model-test" element={
        <Suspense fallback={<LoadingFallback />}>
          <ModelTestComponent />
        </Suspense>
      } />

      <Route path="*" element={
        <Suspense fallback={<LoadingFallback />}>
          <NotFound />
        </Suspense>
      } />
    </Routes>
  );
};

export default AppRoutes; 