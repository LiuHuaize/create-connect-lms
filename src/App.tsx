import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { StrictMode } from "react";
import AppRoutes from "./routes"; // Import the new AppRoutes

// 导入BlockNote必要的样式
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

// 创建QueryClient并配置默认缓存策略
// Moved QueryClient creation inside the App component to avoid potential issues with HMR
// Or keep it here if it needs to be accessed globally before App mounts
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

// // Protected route component with role check - MOVED to src/components/auth/ProtectedRoute.tsx
// interface ProtectedRouteProps {
//   children: React.ReactNode;
//   allowedRoles?: string[];
// }

// // ... ProtectedRoute implementation removed ...

// // AppRoutes component - MOVED to src/routes/index.tsx
// const AppRoutes = () => {
//   // ... AppRoutes implementation removed ...
// };

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
                {/* Render the imported AppRoutes */}
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
