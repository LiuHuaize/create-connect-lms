# 前端性能优化快速应用指南

## 🚀 立即可执行的修改

### 1. 修改 Supabase 客户端超时设置

**文件**: `src/integrations/supabase/client.ts`

**查找**:
```typescript
signal: AbortSignal.timeout(isDevelopment ? 30000 : 10000)
```

**替换为**:
```typescript
signal: AbortSignal.timeout(isDevelopment ? 60000 : 30000)
```

---

### 2. 优化 React Query 缓存配置

**文件**: `src/App.tsx`

**查找**:
```typescript
staleTime: 3 * 60 * 1000,  // 默认3分钟标记为过期
gcTime: 15 * 60 * 1000,    // 默认15分钟内保留缓存数据
refetchOnWindowFocus: true, // 窗口获取焦点时自动重新获取数据
refetchOnMount: true,      // 组件挂载时重新获取数据
retry: 1,                  // 失败时最多重试1次
```

**替换为**:
```typescript
staleTime: 10 * 60 * 1000,    // 10分钟标记为过期
gcTime: 30 * 60 * 1000,       // 30分钟内保留缓存数据
refetchOnWindowFocus: false,   // 禁用窗口焦点重新获取
refetchOnMount: false,         // 禁用挂载时重新获取
retry: 2,                      // 失败时最多重试2次
retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
```

---

### 3. 添加优化的课程数据获取方法

**文件**: `src/services/courseService.ts`

**在文件末尾添加**:
```typescript
// 使用数据库函数的优化方法
async getCourseBasicOptimized(courseId: string): Promise<Course> {
  console.time('getCourseBasicOptimized');
  
  try {
    const { data, error } = await supabase.rpc('get_course_basic_optimized', {
      p_course_id: courseId
    });
    
    if (error) {
      console.error('获取课程基本信息失败:', error);
      throw error;
    }
    
    console.timeEnd('getCourseBasicOptimized');
    return data as Course;
  } catch (error) {
    console.timeEnd('getCourseBasicOptimized');
    // 降级到原始方法
    return this.getCourseBasicInfo(courseId);
  }
}

async getCourseModulesOptimized(courseId: string): Promise<CourseModule[]> {
  console.time('getCourseModulesOptimized');
  
  try {
    const { data, error } = await supabase.rpc('get_course_modules_structure', {
      p_course_id: courseId
    });
    
    if (error) {
      console.error('获取课程模块失败:', error);
      throw error;
    }
    
    console.timeEnd('getCourseModulesOptimized');
    return data || [];
  } catch (error) {
    console.timeEnd('getCourseModulesOptimized');
    // 降级到原始方法
    return this.getCourseModules(courseId);
  }
}

async getModuleLessonsOptimized(moduleId: string): Promise<Lesson[]> {
  console.time('getModuleLessonsOptimized');
  
  try {
    const { data, error } = await supabase.rpc('get_module_lessons', {
      p_module_id: moduleId
    });
    
    if (error) {
      console.error('获取模块课时失败:', error);
      throw error;
    }
    
    console.timeEnd('getModuleLessonsOptimized');
    return data || [];
  } catch (error) {
    console.timeEnd('getModuleLessonsOptimized');
    // 降级到原始方法
    return this.getModuleLessons(moduleId);
  }
}

// 分层加载课程数据的优化方法
async getCourseWithProgressiveLoading(courseId: string): Promise<Course & { modules?: CourseModule[] }> {
  console.time('getCourseWithProgressiveLoading');
  
  try {
    // 并行获取课程基本信息和模块结构
    const [courseData, modulesData] = await Promise.all([
      this.getCourseBasicOptimized(courseId),
      this.getCourseModulesOptimized(courseId)
    ]);
    
    // 只为第一个模块加载课时（其他按需加载）
    let modulesWithLessons = modulesData;
    if (modulesData && modulesData.length > 0) {
      const firstModuleId = modulesData[0].id;
      try {
        const firstModuleLessons = await this.getModuleLessonsOptimized(firstModuleId);
        modulesWithLessons[0] = {
          ...modulesData[0],
          lessons: firstModuleLessons.slice(0, 5) // 只加载前5个课时
        };
      } catch (error) {
        console.warn('加载第一个模块课时失败，跳过:', error);
      }
    }
    
    console.timeEnd('getCourseWithProgressiveLoading');
    
    return {
      ...courseData,
      modules: modulesWithLessons
    };
  } catch (error) {
    console.timeEnd('getCourseWithProgressiveLoading');
    console.warn('分层加载失败，降级到原始方法');
    return this.getCourseDetails(courseId);
  }
}
```

---

### 4. 修改课程数据加载器使用优化方法

**文件**: `src/hooks/useCourseDataLoader.ts`

**查找**:
```typescript
const courseWithModules = await courseService.getCourseOptimized(courseId, mode, moduleId);
```

**替换为**:
```typescript
const courseWithModules = await courseService.getCourseWithProgressiveLoading(courseId);
```

---

### 5. 优化课程数据 Hook 的缓存配置

**文件**: `src/pages/course/hooks/useCourseData.ts`

**查找 CACHE_CONFIG 对象并替换为**:
```typescript
const CACHE_CONFIG = {
  // 课程详情 - 较长缓存时间
  courseDetails: {
    staleTime: 15 * 60 * 1000,    // 15分钟
    gcTime: 45 * 60 * 1000,       // 45分钟
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  },
  // 注册信息 - 中等缓存时间
  enrollment: {
    staleTime: 8 * 60 * 1000,     // 8分钟
    gcTime: 20 * 60 * 1000,       // 20分钟
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  },
  // 课程列表 - 短缓存时间
  courseList: {
    staleTime: 5 * 60 * 1000,     // 5分钟
    gcTime: 15 * 60 * 1000,       // 15分钟
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  }
};
```

---

## 📋 应用步骤

1. **备份当前代码**
   ```bash
   git add .
   git commit -m "备份：应用性能优化前的代码"
   ```

2. **按顺序应用上述修改**
   - 先修改超时设置（立即生效）
   - 再修改缓存配置
   - 最后添加优化方法

3. **测试修改**
   ```bash
   npm run dev
   # 访问课程页面，观察加载速度
   ```

4. **验证功能**
   - 确认课程列表正常显示
   - 确认课程详情正常加载
   - 确认用户权限正常工作

5. **监控性能**
   - 打开浏览器开发者工具
   - 观察 Network 标签中的请求时间
   - 检查 Console 中的性能计时日志

---

## 🔄 如果出现问题

如果应用修改后出现问题，可以快速回滚：

```bash
git reset --hard HEAD~1
npm run dev
```

然后逐个应用修改，找出问题所在。

---

## 📊 预期效果

应用这些修改后，你应该看到：
- 首次加载时间减少 40-60%
- 二次访问（缓存命中）速度提升 80%
- 超时错误显著减少
- 用户体验明显改善
