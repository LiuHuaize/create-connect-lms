
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import NotFound from "./pages/NotFound";
import Sidebar from "./components/layout/Sidebar";
import { Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Import all pages
import Dashboard from "./pages/Dashboard";
import Learning from "./pages/Learning";
import Events from "./pages/Events";
import Community from "./pages/Community";
import CourseCreator from "./pages/CourseCreator";
import Projects from "./pages/Projects";
import Workspaces from "./pages/Workspaces";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import UserManagement from "./pages/UserManagement"; 
import { BlockNoteEditorTest } from "./components/editor";
import CoursePage from "./pages/course/CoursePage";

const queryClient = new QueryClient();

// Protected route component with role check
const ProtectedRoute = ({ 
  children, 
  allowedRoles = ['student', 'teacher', 'admin'] 
}: { 
  children: React.ReactNode,
  allowedRoles?: Array<'student' | 'teacher' | 'admin'>
}) => {
  const { user, userRole, loading } = useAuth();
  
  if (loading) {
    return <div className="flex h-screen items-center justify-center">加载中...</div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" />;
  }
  
  if (userRole && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" />;
  }
  
  return <>{children}</>;
};

const AppContent = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [editorFullscreen, setEditorFullscreen] = useState(false);
  const { user, userRole } = useAuth();

  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Handle editor fullscreen state change
  const handleEditorFullscreenChange = (isFullscreen: boolean) => {
    setEditorFullscreen(isFullscreen);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar, on mobile devices can slide in, hide when editor is fullscreen */}
      {!editorFullscreen && user && (
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
          isMobile={isMobile}
          userRole={userRole}
        />
      )}
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        {isMobile && !editorFullscreen && user && (
          <div className="bg-white border-b border-gray-200 p-4 flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1 rounded-md hover:bg-gray-100"
              aria-label="打开菜单"
            >
              <Menu size={24} />
            </button>
            <div className="ml-4 text-lg font-semibold">亿小步</div>
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <Routes>
            <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Navigate to="/auth" />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/learning" element={
              <ProtectedRoute>
                <Learning />
              </ProtectedRoute>
            } />
            <Route path="/community" element={
              <ProtectedRoute>
                <Community />
              </ProtectedRoute>
            } />
            <Route path="/events" element={
              <ProtectedRoute>
                <Events />
              </ProtectedRoute>
            } />
            <Route path="/projects" element={
              <ProtectedRoute>
                <Projects />
              </ProtectedRoute>
            } />
            <Route path="/workspaces" element={
              <ProtectedRoute>
                <Workspaces />
              </ProtectedRoute>
            } />
            <Route path="/course/:courseId" element={
              <ProtectedRoute>
                <CoursePage />
              </ProtectedRoute>
            } />
            <Route path="/course/:courseId/lesson/:lessonId" element={
              <ProtectedRoute>
                <CoursePage />
              </ProtectedRoute>
            } />
            <Route path="/course-creator" element={
              <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                <CourseCreator onEditorFullscreenChange={handleEditorFullscreenChange} />
              </ProtectedRoute>
            } />
            <Route path="/user-management" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UserManagement />
              </ProtectedRoute>
            } />
            <Route path="/editor-test" element={
              <ProtectedRoute>
                <BlockNoteEditorTest onEditorFullscreenChange={handleEditorFullscreenChange} />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AppContent />
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
