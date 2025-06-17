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

// 创建QueryClient并配置紧急修复的缓存策略
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 紧急修复：禁用所有可能导致重复请求的自动刷新
      staleTime: 5 * 60 * 1000,      // 5分钟默认缓存
      gcTime: 30 * 60 * 1000,        // 30分钟保留
      refetchOnWindowFocus: false,    // 禁用窗口聚焦刷新
      refetchOnMount: false,          // 禁用挂载时刷新
      refetchOnReconnect: false,      // 禁用重连刷新
      retry: 1,                       // 减少重试次数
      // 全局防重复请求
      queryKeyHashFn: (queryKey) => JSON.stringify(queryKey),
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
