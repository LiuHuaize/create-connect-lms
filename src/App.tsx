
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import NotFound from "./pages/NotFound";
import Sidebar from "./components/layout/Sidebar";
import { Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "./contexts/AuthContext";

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
import { BlockNoteEditorTest } from "./components/editor";
import CoursePage from "./pages/course/CoursePage";
import UserManagement from "./pages/admin/UserManagement";

const queryClient = new QueryClient();

// Protected route component with role check
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, loading, role } = useAuth();
  
  if (loading) {
    return <div className="flex h-screen items-center justify-center">加载中...</div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" />;
  }
  
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [editorFullscreen, setEditorFullscreen] = useState(false);
  const { user } = useAuth();

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

  const handleEditorFullscreenChange = (isFullscreen: boolean) => {
    setEditorFullscreen(isFullscreen);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {!editorFullscreen && user && (
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
          isMobile={isMobile} 
        />
      )}
      
      <div className="flex-1 flex flex-col overflow-hidden">
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
            <Route path="/admin/users" element={
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
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <AppRoutes />
          </AuthProvider>
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
