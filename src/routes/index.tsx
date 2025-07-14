import React, { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Menu } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import EditorLayout from '@/components/layout/EditorLayout';
import TestCourseOptimization from '../pages/TestCourseOptimization';
import TestDuplicateRequestsFix from '../pages/TestDuplicateRequestsFix';

// Lazy load page components
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Learning = lazy(() => import('@/pages/Learning'));
const Events = lazy(() => import('@/pages/Events'));
const CourseCreator = lazy(() => import('@/pages/CourseCreator'));
const CourseSelection = lazy(() => import('@/pages/CourseSelection'));
const Auth = lazy(() => import('@/pages/Auth'));
const CoursePage = lazy(() => import('@/pages/course/CoursePage'));
const CourseDetailsPage = lazy(() => import('@/pages/course/CourseDetailsPage'));
const UserManagement = lazy(() => import('@/pages/admin/UserManagement'));
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage').then(module => ({ default: module.ProfilePage })));
const ProfileEditPage = lazy(() => import('@/pages/ProfilePage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const ExploreCourses = lazy(() => import('@/pages/ExploreCourses'));
const TrashPage = lazy(() => import('@/pages/trash'));
const TeacherAssignmentsPage = lazy(() => import('@/pages/teacher/AssignmentsPage'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const BlockNoteEditorTest = lazy(() => import('@/components/editor').then(module => ({ default: module.BlockNoteEditorTest })));
const ModelTestComponent = lazy(() => import('@/components/ModelTestComponent'));
const CourseAssignmentsPage = lazy(() => import('@/pages/teacher/CourseAssignmentsPage'));
const TestVideoUploadPage = lazy(() => import('@/pages/test-video-upload'));
const QuizMarkdownTest = lazy(() => import('@/components/test/QuizMarkdownTest'));
const GamificationTest = lazy(() => import('@/pages/test/GamificationTest').then(module => ({ default: module.GamificationTest })));
const TestSeriesAIGrading = lazy(() => import('@/pages/test/TestSeriesAIGrading'));
const TestAchievements = lazy(() => import('@/pages/TestAchievements'));
const TestAchievementLogic = lazy(() => import('@/pages/TestAchievementLogic'));
const DebugAchievements = lazy(() => import('@/pages/DebugAchievements'));
const TestSkillRadar = lazy(() => import('@/pages/TestSkillRadar'));
const SkillRadarDemo = lazy(() => import('@/pages/SkillRadarDemo'));
const TestRadarOptimization = lazy(() => import('@/pages/test-radar-optimization'));
const TimelinePage = lazy(() => import('@/pages/timeline/TimelinePage'));
const TimelineTest = lazy(() => import('@/pages/test/TimelineTest'));
const SeriesQuestionnaireTest = lazy(() => import('@/pages/test/SeriesQuestionnaireTest'));
const TestNotificationPage = lazy(() => import('@/pages/test-notification'));
const TestNotificationFix = lazy(() => import('@/pages/test-notification-fix'));
const AIGradingWaitPage = lazy(() => import('@/pages/course/AIGradingWaitPage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const SubmissionDetailsPage = lazy(() => import('@/pages/SubmissionDetailsPage'));
const AssignmentDetailsPage = lazy(() => import('@/pages/AssignmentDetailsPage'));

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
          <Route path="/course/:courseId/details" element={<ProtectedRoute><CourseDetailsPage /></ProtectedRoute>} />
          <Route path="/course/:courseId" element={<ProtectedRoute><CoursePage /></ProtectedRoute>} />
          <Route path="/course/:courseId/lesson/:lessonId" element={<ProtectedRoute><CoursePage /></ProtectedRoute>} />
          <Route path="/course/:courseId/lesson/:lessonId/ai-grading/:questionnaireId" element={<ProtectedRoute><AIGradingWaitPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/profile/edit" element={<ProtectedRoute><ProfileEditPage /></ProtectedRoute>} />
          <Route path="/timeline" element={<ProtectedRoute><TimelinePage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/submissions/:submissionId" element={<ProtectedRoute><SubmissionDetailsPage /></ProtectedRoute>} />
          <Route path="/assignments/:assignmentId" element={<ProtectedRoute><AssignmentDetailsPage /></ProtectedRoute>} />
          <Route path="/trash" element={<ProtectedRoute><TrashPage /></ProtectedRoute>} />
          <Route path="/teacher/assignments" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><TeacherAssignmentsPage /></ProtectedRoute>} />
          <Route path="/course/:courseId/assignments" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><CourseAssignmentsPage /></ProtectedRoute>} />
          <Route path="/course-selection" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><CourseSelection /></ProtectedRoute>} />
          <Route path="/course-creator" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><CourseCreator /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><UserManagement /></ProtectedRoute>} />
        </Route>

        <Route path="/model-test" element={<ModelTestComponent />} />

        <Route path="/test-optimization" element={<TestCourseOptimization />} />

        <Route path="/test-duplicate-fix" element={<TestDuplicateRequestsFix />} />

        <Route path="/test-video-upload" element={<TestVideoUploadPage />} />

        <Route path="/test-quiz-markdown" element={<QuizMarkdownTest />} />

        <Route path="/test-gamification" element={<GamificationTest />} />
        <Route path="/test-series-ai-grading" element={<TestSeriesAIGrading />} />

        <Route path="/test-achievements" element={<TestAchievements />} />

        <Route path="/test-achievement-logic" element={<TestAchievementLogic />} />

        <Route path="/debug-achievements" element={<DebugAchievements />} />

        <Route path="/test-skill-radar" element={<TestSkillRadar />} />

        <Route path="/skill-radar-demo" element={<SkillRadarDemo />} />

        <Route path="/test-radar-optimization" element={<TestRadarOptimization />} />

        <Route path="/test-timeline" element={<TimelineTest />} />

        <Route path="/test-series-questionnaire" element={<SeriesQuestionnaireTest />} />

        <Route path="/test-notification" element={<TestNotificationPage />} />
        <Route path="/test-notification-fix" element={<TestNotificationFix />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes; 