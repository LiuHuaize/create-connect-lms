# 项目重构建议

## App.tsx重构

当前`App.tsx`组件包含了多种职责，建议进行以下重构：

### 1. 路由配置分离

将路由配置从`App.tsx`中分离出来，创建专门的路由配置文件：

```
src/routes/index.tsx
```

### 2. 布局组件分离

将布局相关代码抽取为单独的组件：

```
src/components/layout/AppLayout.tsx
src/components/layout/AuthLayout.tsx
```

### 3. 权限控制抽象

封装权限控制逻辑为独立组件：

```
src/components/auth/ProtectedRoute.tsx
```

### 4. App.tsx简化示例

重构后的App.tsx将会非常简洁：

```tsx
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AuthProvider } from "./contexts/AuthContext";
import { queryClient } from "./lib/react-query";
import AppRoutes from "./routes";

const App = () => {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <AppRoutes />
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

export default App;
```

## 整体项目结构优化

### 文件组织建议

```
src/
├── assets/             # 静态资源
├── components/         # 共享组件
│   ├── ui/             # UI组件
│   ├── layout/         # 布局组件
│   ├── auth/           # 认证相关组件
│   └── [feature]/      # 按功能分组的组件
├── contexts/           # React上下文
├── hooks/              # 自定义Hooks
├── lib/                # 第三方库配置
├── pages/              # 页面组件
├── routes/             # 路由配置
├── services/           # API服务
├── stores/             # 状态管理
├── types/              # 类型定义
└── utils/              # 工具函数
```

### 关键优化点

1. **模块化路由**:

```tsx
// src/routes/index.tsx
import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import AppLayout from "@/components/layout/AppLayout";
import AuthLayout from "@/components/layout/AuthLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

// 懒加载页面组件
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Learning = lazy(() => import("@/pages/Learning"));
// ...其他页面

// 路由配置
const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* 公共路由 */}
        <Route element={<AuthLayout />}>
          <Route path="/auth" element={<Auth />} />
        </Route>
        
        {/* 受保护路由 */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/learning" element={<Learning />} />
          {/* ...其他受保护路由 */}
        </Route>
        
        {/* 角色限制路由 */}
        <Route element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><AppLayout /></ProtectedRoute>}>
          <Route path="/course-creator" element={<CourseCreator />} />
          {/* ...其他限制路由 */}
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
```

2. **布局组件**:

```tsx
// src/components/layout/AppLayout.tsx
import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import MobileHeader from "./MobileHeader";

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  
  // 响应式逻辑...
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        isMobile={isMobile} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {isMobile && (
          <MobileHeader onMenuClick={() => setSidebarOpen(true)} />
        )}
        
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
```

3. **查询客户端配置分离**:

```tsx
// src/lib/react-query.ts
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分钟内数据视为新鲜
      gcTime: 30 * 60 * 1000, // 30分钟内保留缓存数据
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 1,
    },
  },
});
```

## 渐进式重构计划

1. **阶段1**: 提取和重构路由配置
2. **阶段2**: 创建布局组件
3. **阶段3**: 重构权限控制逻辑
4. **阶段4**: 重构各个功能模块的大型组件

## 性能优化建议

1. **懒加载路由**: 使用`React.lazy`和`Suspense`
2. **组件拆分和记忆化**: 使用`memo`, `useCallback`, `useMemo`
3. **虚拟化列表**: 长列表使用`react-window`或`react-virtualized`
4. **图片优化**: 使用WebP格式和适当的尺寸
5. **CSS优化**: 减少CSS文件大小和选择器复杂度 