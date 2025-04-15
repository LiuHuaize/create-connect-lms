# ModuleList组件重构建议

## 当前问题

`ModuleList.tsx`组件过于庞大（约350行代码），包含了多种责任：

1. 模块和课时的状态管理
2. 模块和课时的添加、删除、更新操作
3. 拖拽功能相关逻辑
4. API调用
5. UI渲染

## 重构方案

### 1. 状态管理分离

将模块和课时的状态管理抽取到自定义hooks中：

```
src/components/course/creator/module-list/hooks/useModuleManagement.ts
```

### 2. 拖拽逻辑分离

将拖拽相关逻辑抽取到专门的hook中：

```
src/components/course/creator/module-list/hooks/useDragAndDrop.ts
```

### 3. API调用分离

将API调用逻辑抽取成专门的service函数：

```
src/components/course/creator/module-list/services/moduleService.ts
```

### 4. 组件分离

将大型组件拆分为更小的子组件：

1. **ModuleControls.tsx** - 处理模块的添加按钮和控制项
2. **ModuleDragContext.tsx** - 处理拖拽上下文和提供者
3. **EmptyState.tsx** - 处理无模块时的显示

### 5. 目录结构

重构后的目录结构建议：

```
src/components/course/creator/module-list/
├── ModuleList.tsx              # 主组件（简化版）
├── ModuleItem.tsx              # 现有的模块项组件
├── LessonItem.tsx              # 现有的课时项组件
├── ModuleHeader.tsx            # 现有的模块头组件
├── LessonTypeButton.tsx        # 现有的课时类型按钮组件
├── ModuleControls.tsx          # 新增：模块控制组件
├── ModuleDragContext.tsx       # 新增：拖拽上下文组件
├── EmptyState.tsx              # 新增：空状态组件
│
├── hooks/
│   ├── useModuleManagement.ts  # 模块管理逻辑
│   └── useDragAndDrop.ts       # 拖拽逻辑
│
├── services/
│   └── moduleService.ts        # 模块相关API调用
│
└── utils/
    ├── moduleUtils.ts          # 模块工具函数
    └── lessonTypeUtils.ts      # 现有的课时类型工具
```

### 6. 重构后的主组件示例

```tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { CourseModule, Lesson } from '@/types/course';
import { Plus } from 'lucide-react';
import { DndContext } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import ModuleItem from './ModuleItem';
import ModuleControls from './ModuleControls';
import EmptyState from './EmptyState';
import { useModuleManagement } from './hooks/useModuleManagement';
import { useDragAndDrop } from './hooks/useDragAndDrop';

interface ModuleListProps {
  modules: CourseModule[];
  setModules: React.Dispatch<React.SetStateAction<CourseModule[]>>;
  setCurrentLesson: React.Dispatch<React.SetStateAction<Lesson | null>>;
  expandedModule: string | null;
  setExpandedModule: React.Dispatch<React.SetStateAction<string | null>>;
}

const ModuleList: React.FC<ModuleListProps> = ({ 
  modules, 
  setModules, 
  setCurrentLesson, 
  expandedModule, 
  setExpandedModule 
}) => {
  const {
    addModule,
    deleteModule,
    updateModuleTitle,
    toggleModuleExpand,
    addLesson,
    deleteLesson,
    isDeletingModule,
    isDeletingLesson
  } = useModuleManagement({
    modules,
    setModules,
    setCurrentLesson,
    expandedModule,
    setExpandedModule
  });

  const {
    sensors,
    activeId,
    handleDragStart,
    handleDragOver,
    handleDragEnd
  } = useDragAndDrop({
    modules,
    setModules
  });

  if (modules.length === 0) {
    return <EmptyState onAddModule={addModule} />;
  }

  return (
    <div className="w-full space-y-4">
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={modules.map(module => module.id)} 
          strategy={verticalListSortingStrategy}
        >
          {modules.map((module) => (
            <ModuleItem
              key={module.id}
              module={module}
              isExpanded={expandedModule === module.id}
              onToggleExpand={toggleModuleExpand}
              onUpdateTitle={updateModuleTitle}
              onAddLesson={addLesson}
              onDeleteLesson={deleteLesson}
              onDeleteModule={deleteModule}
              isDeletingModule={isDeletingModule}
              isDeletingLesson={isDeletingLesson}
              setCurrentLesson={setCurrentLesson}
              activeId={activeId}
            />
          ))}
        </SortableContext>
      </DndContext>
      
      <ModuleControls onAddModule={addModule} />
    </div>
  );
};

export default ModuleList;
```

## useModuleManagement Hook示例

```tsx
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { CourseModule, Lesson, LessonType } from '@/types/course';
import { getInitialContentByType } from '../utils/lessonTypeUtils';
import { moduleService } from '../services/moduleService';
import { toast } from 'sonner';

interface UseModuleManagementProps {
  modules: CourseModule[];
  setModules: React.Dispatch<React.SetStateAction<CourseModule[]>>;
  setCurrentLesson: React.Dispatch<React.SetStateAction<Lesson | null>>;
  expandedModule: string | null;
  setExpandedModule: React.Dispatch<React.SetStateAction<string | null>>;
}

export const useModuleManagement = ({
  modules,
  setModules,
  setCurrentLesson,
  expandedModule,
  setExpandedModule
}: UseModuleManagementProps) => {
  const [isDeletingModule, setIsDeletingModule] = useState(false);
  const [isDeletingLesson, setIsDeletingLesson] = useState(false);

  const addModule = () => {
    const newModule: CourseModule = {
      id: uuidv4(),
      course_id: modules[0]?.course_id || 'temp-course-id',
      title: `新模块 ${modules.length + 1}`,
      order_index: modules.length,
      lessons: []
    };
    setModules([...modules, newModule]);
    setExpandedModule(newModule.id);
  };

  const updateModuleTitle = (moduleId: string, newTitle: string) => {
    setModules(modules.map(module => 
      module.id === moduleId ? { ...module, title: newTitle } : module
    ));
  };

  const deleteModule = async (moduleId: string) => {
    try {
      setIsDeletingModule(true);
      const toastId = toast.loading(`正在删除模块...`);

      // 首先更新前端状态
      setModules(modules.filter(module => module.id !== moduleId));
      
      // 如果模块ID不是有效UUID（可能是新创建还未保存的），则跳过后端删除
      if (moduleId.startsWith('m') || !moduleId.includes('-')) {
        toast.success('模块已删除', { id: toastId });
        return;
      }
      
      // 调用后端删除API
      await moduleService.deleteModule(moduleId);
      
      toast.success('模块及其所有课时已删除', { id: toastId });
    } catch (error) {
      console.error('删除模块失败:', error);
      toast.error('删除模块失败，请稍后再试', { duration: 3000 });
    } finally {
      setIsDeletingModule(false);
    }
  };

  const toggleModuleExpand = (moduleId: string) => {
    setExpandedModule(expandedModule === moduleId ? null : moduleId);
  };

  // 其他方法...
  
  return {
    addModule,
    updateModuleTitle,
    deleteModule,
    toggleModuleExpand,
    addLesson,  
    deleteLesson,
    isDeletingModule,
    isDeletingLesson
  };
};
```

## 重构优势

1. **关注点分离**: 将不同类型的逻辑放入不同文件中
2. **提高可读性**: 组件更简洁，逻辑更清晰
3. **易于测试**: 可以单独测试hooks和小组件
4. **可重用性**: 抽象出的hooks和服务可以在其他组件中重用
5. **维护性**: 减少单一文件的大小，使代码更易于维护

## 重构步骤

1. 创建目录结构
2. 实现service层
3. 提取hooks逻辑
4. 创建新的子组件
5. 简化主组件
6. 进行测试确保功能不变 