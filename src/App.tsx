
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotFound from "./pages/NotFound";
import Sidebar from "./components/layout/Sidebar";
import Navbar from "./components/layout/Navbar";

// Import all pages
import Dashboard from "./pages/Dashboard";
import Learning from "./pages/Learning";
import Events from "./pages/Events";
import Projects from "./pages/Projects";
import Workspaces from "./pages/Workspaces";
import Community from "./pages/Community";
import CourseCreator from "./pages/CourseCreator";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Navbar />
            <div className="flex-1 overflow-y-auto bg-gray-50">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/learning" element={<Learning />} />
                <Route path="/events" element={<Events />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/workspaces" element={<Workspaces />} />
                <Route path="/community" element={<Community />} />
                <Route path="/course-creator" element={<CourseCreator />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </div>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
