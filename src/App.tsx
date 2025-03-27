import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotFound from "./pages/NotFound";
import Sidebar from "./components/layout/Sidebar";
import { Menu } from "lucide-react";
import { useState, useEffect } from "react";

// Import all pages
import Dashboard from "./pages/Dashboard";
import Learning from "./pages/Learning";
import Events from "./pages/Events";
import Community from "./pages/Community";
import CourseCreator from "./pages/CourseCreator";
import Projects from "./pages/Projects";
import Workspaces from "./pages/Workspaces";
import Index from "./pages/Index";
import { BlockNoteEditorTest } from "./components/editor";

const queryClient = new QueryClient();

const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [editorFullscreen, setEditorFullscreen] = useState(false);

  // 检测屏幕尺寸
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

  // 处理编辑器全屏状态变化
  const handleEditorFullscreenChange = (isFullscreen: boolean) => {
    setEditorFullscreen(isFullscreen);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="flex h-screen overflow-hidden">
            {/* 侧边栏，在移动设备上可以滑动显示，编辑器全屏时隐藏 */}
            {!editorFullscreen && (
              <Sidebar 
                isOpen={sidebarOpen} 
                onClose={() => setSidebarOpen(false)} 
                isMobile={isMobile} 
              />
            )}
            
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* 移动设备上的顶部栏 */}
              {isMobile && !editorFullscreen && (
                <div className="bg-white border-b border-gray-200 p-4 flex items-center">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-1 rounded-md hover:bg-gray-100"
                    aria-label="打开菜单"
                  >
                    <Menu size={24} />
                  </button>
                  <div className="ml-4 text-lg font-semibold">Connect LMS</div>
                </div>
              )}
              
              <div className="flex-1 overflow-y-auto bg-gray-50">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/learning" element={<Learning />} />
                  <Route path="/community" element={<Community />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/workspaces" element={<Workspaces />} />
                  <Route path="/course-creator" element={
                    <CourseCreator onEditorFullscreenChange={handleEditorFullscreenChange} />
                  } />
                  <Route path="/editor-test" element={
                    <BlockNoteEditorTest onEditorFullscreenChange={handleEditorFullscreenChange} />
                  } />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </div>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
