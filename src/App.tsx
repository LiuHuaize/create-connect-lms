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

// 创建QueryClient并配置优化后的缓存策略
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 优化缓存策略，根据不同数据类型设置差异化配置
      staleTime: 3 * 60 * 1000,  // 默认3分钟标记为过期(原为5分钟)
      gcTime: 15 * 60 * 1000,    // 默认15分钟内保留缓存数据(原为30分钟)
      refetchOnWindowFocus: true, // 窗口获取焦点时自动重新获取数据(改为true)
      refetchOnMount: true,      // 组件挂载时重新获取数据(改为true)
      retry: 1,                  // 失败时最多重试1次
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
