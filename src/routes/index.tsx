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

const AppRoutes = () => {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user) {
      queryClient.prefetchQuery({ queryKey: ['courses'], staleTime: 5 * 60 * 1000 });
      queryClient.prefetchQuery({ queryKey: ['enrolledCourses', user.id], staleTime: 5 * 60 * 1000 });
    }
  }, [user, queryClient]);

  // 如果认证状态仍在加载中，显示加载界面，避免过早重定向
  if (loading) {
    return <LoadingFallback />;
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        
        <Route path="/editor" element={<EditorLayout />}>
          <Route path="test" element={
            <ProtectedRoute>
              <BlockNoteEditorTest />
            </ProtectedRoute>
          } />
        </Route>

        <Route 
          path="/editor-test" 
          element={<Navigate to="/editor/test" replace />} 
        />

        <Route element={<MainLayoutWrapper />}>
          <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/auth" replace />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/learning" element={<ProtectedRoute><Learning /></ProtectedRoute>} />
          <Route path="/explore-courses" element={<ProtectedRoute><ExploreCourses /></ProtectedRoute>} />
          <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
          <Route path="/course/:courseId" element={<ProtectedRoute><CoursePage /></ProtectedRoute>} />
          <Route path="/course/:courseId/lesson/:lessonId" element={<ProtectedRoute><CoursePage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/trash" element={<ProtectedRoute><TrashPage /></ProtectedRoute>} />
          <Route path="/teacher/assignments" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><TeacherAssignmentsPage /></ProtectedRoute>} />
          <Route path="/course/:courseId/assignments" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><CourseAssignmentsPage /></ProtectedRoute>} />
          <Route path="/course-selection" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><CourseSelection /></ProtectedRoute>} />
          <Route path="/course-creator" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><CourseCreator /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><UserManagement /></ProtectedRoute>} />
        </Route>

        <Route path="/model-test" element={<ModelTestComponent />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes; 