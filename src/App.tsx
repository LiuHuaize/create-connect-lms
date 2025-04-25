import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import NotFound from "./pages/NotFound";
import Sidebar from "./components/layout/Sidebar";
import { Menu } from "lucide-react";
import { useState, useEffect, StrictMode } from "react";
import { useAuth } from "./contexts/AuthContext";

// 导入BlockNote必要的样式
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

// Import all pages
import Dashboard from "./pages/Dashboard";
import Learning from "./pages/Learning";
import Events from "./pages/Events";
import CourseCreator from "./pages/CourseCreator";
import CourseSelection from "./pages/CourseSelection"; 
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import { BlockNoteEditorTest } from "./components/editor";
import CoursePage from "./pages/course/CoursePage";
import UserManagement from "./pages/admin/UserManagement";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import ExploreCourses from "./pages/ExploreCourses";
import ModelTestComponent from "./components/ModelTestComponent";
import TrashPage from "./pages/trash";

// 创建QueryClient并配置默认缓存策略
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分钟内数据视为新鲜
      gcTime: 30 * 60 * 1000, // 30分钟内保留缓存数据
      refetchOnWindowFocus: false, // 窗口获取焦点时不重新获取数据
      refetchOnMount: false, // 组件挂载时不重新获取数据
      retry: 1, // 失败时最多重试1次
    },
  },
});

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
  const queryClient = useQueryClient();
  const location = useLocation();

  // 判断当前是否在课程页面
  const isCoursePage = location.pathname.includes('/course/');

  // 添加路径变化监听，自动隐藏主侧边栏
  useEffect(() => {
    // 当进入课程页面时，如果是移动设备，自动关闭侧边栏
    if (isCoursePage && isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isCoursePage, isMobile]);
  
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
  
  // 添加预加载数据逻辑
  useEffect(() => {
    // 如果用户已登录，预加载常用数据
    if (user) {
      // 预加载所有课程数据
      queryClient.prefetchQuery({
        queryKey: ['courses'],
        staleTime: 5 * 60 * 1000 // 5分钟内保持数据新鲜
      });
      
      // 预加载用户已加入的课程
      queryClient.prefetchQuery({
        queryKey: ['enrolledCourses', user.id],
        staleTime: 5 * 60 * 1000
      });
    }
  }, [user, queryClient]);

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
        {isMobile && !editorFullscreen && user && !isCoursePage && (
          <div className="bg-sidebar border-b border-sidebar-border p-4 flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1 rounded-md hover:bg-sidebar-accent/50"
              aria-label="打开菜单"
            >
              <Menu size={24} />
            </button>
            <div className="ml-4 text-lg font-semibold text-sidebar-foreground">菜单</div>
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto bg-background">
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
            <Route path="/explore-courses" element={
              <ProtectedRoute>
                <ExploreCourses />
              </ProtectedRoute>
            } />
            <Route path="/events" element={
              <ProtectedRoute>
                <Events />
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
            <Route path="/course-selection" element={
              <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                <CourseSelection />
              </ProtectedRoute>
            } />
            <Route path="/course-creator" element={
              <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                <CourseCreator />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UserManagement />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            } />
            <Route path="/trash" element={
              <ProtectedRoute>
                <TrashPage />
              </ProtectedRoute>
            } />
            <Route path="/editor-test" element={
              <ProtectedRoute>
                <BlockNoteEditorTest onEditorFullscreenChange={handleEditorFullscreenChange} />
              </ProtectedRoute>
            } />
            <Route path="/model-test" element={<ModelTestComponent />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <StrictMode>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <ThemeProvider>
              <AuthProvider>
                <Toaster />
                <Sonner />
                <AppRoutes />
              </AuthProvider>
            </ThemeProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </StrictMode>
  );
};

export default App;
