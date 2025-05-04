import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CourseModule, Lesson, LessonType } from '@/types/course';
import { Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import ModuleItem from './ModuleItem';
import { getInitialContentByType } from './lessonTypeUtils';
import { 
  DndContext, 
  DragEndEvent, 
  DragOverEvent, 
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DndContextProps
} from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { courseService } from '@/services/courseService';
import { toast } from 'sonner';

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
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDeletingModule, setIsDeletingModule] = useState(false);
  const [isDeletingLesson, setIsDeletingLesson] = useState(false);
  
  // 使用PointerSensor而不是默认传感器，这样可以避免在点击按钮时触发拖拽
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 需要移动至少5px才触发拖拽
      }
    })
  );

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
      await courseService.deleteModule(moduleId);
      
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

  const addLesson = (moduleId: string, lessonType: LessonType) => {
    const targetModule = modules.find(module => module.id === moduleId);
    if (!targetModule) return;
    
    const orderIndex = targetModule.lessons ? targetModule.lessons.length : 0;
    
    const newLesson: Lesson = {
      id: uuidv4(),
      module_id: moduleId,
      type: lessonType,
      title: `新${lessonType === 'frame' ? '框架' : lessonType}课程`,
      content: getInitialContentByType(lessonType),
      order_index: orderIndex,
      isFrame: lessonType === 'frame',
      subLessons: lessonType === 'frame' ? [] : undefined
    };
    
    // 先创建一个模块的副本
    const updatedModules = modules.map(module => {
      if (module.id === moduleId) {
        // 确保lessons数组存在
        const currentLessons = module.lessons || [];
        return { 
          ...module, 
          lessons: [...currentLessons, newLesson] 
        };
      }
      return module;
    });
    
    // 更新状态
    setModules(updatedModules);
    
    // 对于框架类型，不直接进入编辑模式
    if (lessonType !== 'frame') {
      // 设置当前课时
      setCurrentLesson(newLesson);
    } else {
      toast.success('已添加框架容器，可以在框架中添加多个子课时');
    }
    
    // 确保模块是展开的
    if (expandedModule !== moduleId) {
      setExpandedModule(moduleId);
    }
  };

  const deleteLesson = async (moduleId: string, lessonId: string) => {
    try {
      setIsDeletingLesson(true);
      const toastId = toast.loading(`正在删除课时...`);
      
      // 首先更新前端状态
      setModules(modules.map(module => 
        module.id === moduleId 
          ? { ...module, lessons: module.lessons.filter(lesson => lesson.id !== lessonId) } 
          : module
      ));
      
      // 如果课时ID不是有效UUID（可能是新创建还未保存的），则跳过后端删除
      if (lessonId.startsWith('l') || !lessonId.includes('-')) {
        toast.success('课时已删除', { id: toastId });
        return;
      }
      
      // 调用后端删除API
      await courseService.deleteLesson(lessonId);
      
      toast.success('课时已成功删除', { id: toastId });
    } catch (error) {
      console.error('删除课时失败:', error);
      toast.error('删除课时失败，请稍后再试', { duration: 3000 });
    } finally {
      setIsDeletingLesson(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    // 设置当前正在拖拽的元素ID
    setActiveId(event.active.id as string);
    
    // 修改光标样式
    if (typeof document !== 'undefined') {
      document.body.style.cursor = 'grabbing';
    }
  };
  
  const handleDragOver = (event: DragOverEvent) => {
    // 当元素拖拽到另一个区域时，我们需要处理跨容器拖拽
    const { active, over } = event;
    
    if (!over) return;
    
    const activeId = active.id;
    const overId = over.id;
    
    // 如果是相同元素，不做任何处理
    if (activeId === overId) return;
    
    // 查找拖动项所在的模块
    const activeModuleId = active.data.current?.moduleId;
    if (!activeModuleId) return;
    
    // 如果over是模块ID，说明我们要把元素移动到另一个模块
    // 跨模块的拖拽我们暂时不用处理这里的逻辑，因为会在dragEnd中处理
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (typeof document !== 'undefined') {
      document.body.style.cursor = '';
    }
    setActiveId(null);
    
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }
    
    const activeId = active.id as string;
    const overId = over.id as string;
    const activeData = active.data.current;
    const overData = over.data.current;
    const activeModuleId = activeData?.moduleId as string | undefined;
    const overModuleId = overData?.moduleId as string | undefined;
    const overIsModule = !overData || overData.moduleId === overId;
    
    // --- 检测是否是拖入框架 ---
    const isDropIntoFrame = overId.startsWith('frame-');
    
    if (isDropIntoFrame && activeData?.type === 'lesson') {
      // 处理拖入框架的情况
      const frameId = overId.replace('frame-', '');
      
      setModules((prevModules) => {
        // 查找源模块和课时
        const sourceModuleIndex = prevModules.findIndex(m => m.id === activeModuleId);
        if (sourceModuleIndex === -1) return prevModules;
        
        const sourceModule = prevModules[sourceModuleIndex];
        const sourceLessons = sourceModule.lessons || [];
        const lessonIndex = sourceLessons.findIndex(l => l.id === activeId);
        if (lessonIndex === -1) return prevModules;
        
        const movedLesson = sourceLessons[lessonIndex];
        
        // 查找框架所在的模块和框架课时
        const frameModuleId = overData.moduleId;
        const frameModuleIndex = prevModules.findIndex(m => m.id === frameModuleId);
        if (frameModuleIndex === -1) return prevModules;
        
        const frameModule = prevModules[frameModuleIndex];
        const frameLessons = frameModule.lessons || [];
        const frameIndex = frameLessons.findIndex(l => l.id === frameId);
        if (frameIndex === -1) return prevModules;
        
        const frameLesson = frameLessons[frameIndex];
        
        // 准备要添加到框架中的课时
        const lessonToAddToFrame = {
          ...movedLesson,
          // 从课时数组中移除，但保持课时ID不变
          module_id: frameModuleId,
        };
        
        // 将课时添加到框架的subLessons中
        const updatedFrameLesson = {
          ...frameLesson,
          subLessons: [...(frameLesson.subLessons || []), lessonToAddToFrame]
        };
        
        // 更新框架所在模块的课时
        const updatedFrameModuleLessons = frameLessons.map((lesson, idx) => 
          idx === frameIndex ? updatedFrameLesson : lesson
        );
        
        // 从源模块中移除被拖动的课时
        const updatedSourceLessons = sourceLessons
          .filter((_, idx) => idx !== lessonIndex)
          .map((lesson, idx) => ({ ...lesson, order_index: idx }));
        
        // 构建新的模块数组
        return prevModules.map((module, idx) => {
          if (idx === sourceModuleIndex) {
            return { ...module, lessons: updatedSourceLessons };
          }
          if (idx === frameModuleIndex) {
            return { ...module, lessons: updatedFrameModuleLessons };
          }
          return module;
        });
      });
      
      return;
    }
    
    // --- Module Reordering --- 
    if (activeData?.type === 'module') {
      const activeIndex = modules.findIndex((m) => m.id === activeId);
      const overModuleTargetId = overIsModule ? overId : overModuleId;
      const overIndex = modules.findIndex((m) => m.id === overModuleTargetId);

      if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
        setModules((prevModules) => {
          const reordered = arrayMove(prevModules, activeIndex, overIndex);
          return reordered.map((module, index) => ({ ...module, order_index: index }));
        });
      }
      return;
    }

    // --- Lesson Reordering --- 
    if (activeData?.type !== 'module' && activeModuleId) {
      setModules((prevModules) => {
        const sourceModuleIndex = prevModules.findIndex(m => m.id === activeModuleId);
        if (sourceModuleIndex === -1) return prevModules; // Source module not found

        const sourceModule = prevModules[sourceModuleIndex];
        const sourceLessons = sourceModule.lessons || [];
        const lessonIndex = sourceLessons.findIndex(l => l.id === activeId);
        if (lessonIndex === -1) return prevModules; // Lesson not found

        const movedLesson = sourceLessons[lessonIndex];

        // Scenario 1: Same Module Drag
        if (!overIsModule && activeModuleId === overModuleId) {
          const overLessonIndex = sourceLessons.findIndex(l => l.id === overId);
          if (overLessonIndex === -1 || lessonIndex === overLessonIndex) return prevModules; // Target not found or no move

          const newSourceLessons = arrayMove(sourceLessons, lessonIndex, overLessonIndex)
            .map((lesson, index) => ({ ...lesson, order_index: index }));
            
          // Return new modules array with updated source module
          return prevModules.map((mod, index) => 
            index === sourceModuleIndex ? { ...sourceModule, lessons: newSourceLessons } : mod
          );
        }
        // Scenario 2: Cross-Module Drag (or drop onto module)
        else {
          const targetModuleId = overIsModule ? overId : overModuleId;
          const targetModuleIndex = prevModules.findIndex(m => m.id === targetModuleId);
          if (targetModuleIndex === -1) return prevModules; // Target module not found

          const targetModule = prevModules[targetModuleIndex];
          const targetLessons = targetModule.lessons || [];

          // Create new source lessons array (filter out moved lesson)
          const finalSourceLessons = sourceLessons
            .filter(l => l.id !== activeId)
            .map((lesson, index) => ({ ...lesson, order_index: index }));

          // Create new target lessons array
          let finalTargetLessons: Lesson[];
          const lessonToInsert = { ...movedLesson, module_id: targetModule.id }; // Update module_id

          if (overIsModule) {
            // Add to end if dropped onto module
            finalTargetLessons = [...targetLessons, lessonToInsert];
          } else {
            // Insert at specific position
            const overLessonIndex = targetLessons.findIndex(l => l.id === overId);
            if (overLessonIndex !== -1) {
              finalTargetLessons = [
                ...targetLessons.slice(0, overLessonIndex),
                lessonToInsert,
                ...targetLessons.slice(overLessonIndex)
              ];
            } else {
              // Fallback: add to end if target lesson somehow not found
              finalTargetLessons = [...targetLessons, lessonToInsert]; 
            }
          }
          
          // Recalculate order_index for the final target array
          const finalRecalculatedTargetLessons = finalTargetLessons
            .map((lesson, index) => ({ ...lesson, order_index: index }));

          // Return new modules array with updated source and target modules
          return prevModules.map((mod, index) => {
            if (index === sourceModuleIndex) {
              return { ...sourceModule, lessons: finalSourceLessons };
            }
            if (index === targetModuleIndex) {
              return { ...targetModule, lessons: finalRecalculatedTargetLessons };
            }
            return mod;
          });
        }
      });
    }
  };

  // 编辑/更新课时
  const updateLesson = (updatedLesson: Lesson) => {
    console.log('ModuleList - 正在更新课时:', updatedLesson);
    
    // 检查是否是框架中的子课时
    if (updatedLesson.parentFrameId && updatedLesson.isSubLesson) {
      const parentFrameId = updatedLesson.parentFrameId;
      // 处理子课时的更新
      setModules(prevModules => {
        // 查找包含父框架的模块
        const moduleWithFrame = prevModules.find(mod => 
          mod.lessons && mod.lessons.some(lesson => lesson.id === parentFrameId)
        );
        
        if (!moduleWithFrame) return prevModules;
        
        // 找到父框架
        const frameLesson = moduleWithFrame.lessons.find(l => l.id === parentFrameId);
        if (!frameLesson || !frameLesson.isFrame || !frameLesson.subLessons) return prevModules;
        
        // 更新子课时
        const { parentFrameId, isSubLesson, ...cleanUpdatedLesson } = updatedLesson;
        const updatedSubLessons = frameLesson.subLessons.map(subLesson => 
          subLesson.id === cleanUpdatedLesson.id ? cleanUpdatedLesson : subLesson
        );
        
        // 更新框架
        const updatedFrameLesson = {
          ...frameLesson,
          subLessons: updatedSubLessons
        };
        
        // 更新模块
        return prevModules.map(mod => {
          if (mod.id === moduleWithFrame.id) {
            return {
              ...mod,
              lessons: mod.lessons.map(l => 
                l.id === frameLesson.id ? updatedFrameLesson : l
              )
            };
          }
          return mod;
        });
      });
      
      // 重置当前编辑的课时
      setCurrentLesson(null);
      
      toast.success(`课时 "${updatedLesson.title}" 已更新`);
      return;
    }
    
    // 为了确保React状态更新，创建一个新的模块数组
    const updatedModules = modules.map(module => {
      // 找到包含这个课时的模块
      if (module.id === updatedLesson.module_id) {
        console.log(`找到模块 ${module.id}, 课时所属模块标题: "${module.title}"`);
        
        // 如果模块有课时列表
        if (module.lessons && module.lessons.length > 0) {
          // 创建一个新的课时数组，替换修改的课时
          const updatedLessons = module.lessons.map(lesson => {
            if (lesson.id === updatedLesson.id) {
              console.log(`更新课时 ${lesson.id}, 从 "${lesson.title}" 到 "${updatedLesson.title}"`);
              return updatedLesson; // 返回更新后的课时
            }
            return lesson; // 返回原始课时
          });
          
          // 返回更新后的模块
          return {
            ...module,
            lessons: updatedLessons
          };
        }
      }
      // 返回原始模块
      return module;
    });
    
    // 更新React状态
    setModules(updatedModules);
    
    // 如果当前正在编辑的课时就是被更新的课时，也更新当前课时状态
    setCurrentLesson(prev => 
      prev && prev.id === updatedLesson.id ? updatedLesson : prev
    );
    
    console.log('ModuleList - 课时更新完成');
    
    // 显示提示消息
    toast.success(`课时标题已更新为: ${updatedLesson.title}`, {
      duration: 1500
    });
  };

  // 实现DndContext的collisionDetection算法，使其能正确处理嵌套拖放
  const collisionDetection: DndContextProps['collisionDetection'] = (args) => {
    // 使用closestCenter算法作为基础
    const collisions = closestCenter(args);
    
    // 如果有碰撞，查找是否有框架容器在碰撞列表中
    const frameCollisions = collisions.filter(
      collision => collision.id.toString().startsWith('frame-')
    );
    
    // 如果存在框架碰撞，优先返回框架，提高框架拖放的优先级
    if (frameCollisions.length > 0) {
      return frameCollisions;
    }
    
    return collisions;
  };

  return (
    <DndContext 
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      collisionDetection={collisionDetection}
    >
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold">课程结构</h2>
          <div className="flex space-x-2">
            <Button onClick={addModule} className="bg-connect-blue hover:bg-blue-600">
              <Plus size={16} className="mr-2" /> 添加模块
            </Button>
          </div>
        </div>
        
        <div className="space-y-4">
          <SortableContext 
            items={modules.map(module => module.id)}
            strategy={verticalListSortingStrategy}
          >
            {modules.map((module) => (
              <ModuleItem 
                key={module.id} 
                module={module}
                expandedModule={expandedModule}
                onUpdateModuleTitle={updateModuleTitle}
                onDeleteModule={deleteModule}
                onToggleExpand={toggleModuleExpand}
                onEditLesson={setCurrentLesson}
                onUpdateLesson={updateLesson}
                onDeleteLesson={deleteLesson}
                onAddLesson={addLesson}
              />
            ))}
          </SortableContext>
        </div>
      </div>
    </DndContext>
  );
};

export default ModuleList;
