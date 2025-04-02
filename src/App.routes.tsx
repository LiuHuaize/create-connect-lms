
import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';
import Learning from '@/pages/Learning';
import NotFound from '@/pages/NotFound';
import Auth from '@/pages/Auth';
import Projects from '@/pages/Projects';
import Events from '@/pages/Events';
import Community from '@/pages/Community';
import Workspaces from '@/pages/Workspaces';
import SettingsPage from '@/pages/SettingsPage';
import ProfilePage from '@/pages/ProfilePage';
import CourseCreator from '@/pages/CourseCreator';
import CourseListPage from '@/pages/learning/CourseListPage';
import CourseViewPage from '@/pages/learning/CourseViewPage';

export const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/projects" element={<Projects />} />
    <Route path="/events" element={<Events />} />
    <Route path="/community" element={<Community />} />
    <Route path="/workspaces" element={<Workspaces />} />
    <Route path="/settings" element={<SettingsPage />} />
    <Route path="/profile" element={<ProfilePage />} />

    {/* Learning routes */}
    <Route path="/learning" element={<CourseListPage />} />
    <Route path="/learning/course/:courseId" element={<CourseViewPage />} />
    
    {/* Course creator routes */}
    <Route path="/course-creator" element={<CourseCreator />} />
    <Route path="/course-creator/:courseId" element={<CourseCreator />} />
    
    {/* 404 route */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);
