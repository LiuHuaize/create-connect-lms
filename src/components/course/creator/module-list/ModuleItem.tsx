import React from 'react';
import { CourseModule, Lesson, LessonType } from '@/types/course';
import ModuleHeader from './ModuleHeader';
import LessonItem from './LessonItem';
import LessonTypeButton from './LessonTypeButton';
import { LESSON_TYPES } from './lessonTypeUtils';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ModuleItemProps {
  module: CourseModule;
  expandedModule: string | null;
  onUpdateModuleTitle: (moduleId: string, title: string) => void;
  onDeleteModule: (moduleId: string) => void;
  onToggleExpand: (moduleId: string) => void;
  onEditLesson: (lesson: Lesson) => void;
  onUpdateLesson?: (lesson: Lesson) => void;
  onDeleteLesson: (moduleId: string, lessonId: string) => void;
  onAddLesson: (moduleId: string, lessonType: LessonType) => void;
  onMoveLessonUp?: (moduleId: string, lessonId: string) => void;
  onMoveLessonDown?: (moduleId: string, lessonId: string) => void;
}

const ModuleItem: React.FC<ModuleItemProps> = ({
  module,
  expandedModule,
  onUpdateModuleTitle,
  onDeleteModule,
  onToggleExpand,
  onEditLesson,
  onUpdateLesson,
  onDeleteLesson,
  onAddLesson,
  onMoveLessonUp,
  onMoveLessonDown
}) => {
  const isExpanded = expandedModule === module.id;
  
  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({
    id: module.id!,
    data: {
      moduleId: module.id,
      accepts: ['lesson']
    }
  });

  const { 
    attributes,
    listeners,
    setNodeRef: setSortableNodeRef, 
    transform,
    transition,
    isDragging
  } = useSortable({
    id: module.id!,
    data: { 
      type: 'module',
      moduleId: module.id 
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto',
    position: 'relative' as 'relative'
  };

  return (
    <div 
      ref={setSortableNodeRef} 
      style={style} 
      className="border border-gray-200 rounded-lg bg-white shadow-sm mb-4"
    >
      <ModuleHeader 
        moduleId={module.id!}
        title={module.title}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
        onUpdateTitle={onUpdateModuleTitle}
        onDeleteModule={onDeleteModule}
        attributes={attributes}
        listeners={listeners}
      />
      
      {isExpanded && (
        <div className="p-4 pt-0 border-t border-gray-200">
          <div 
            className={`space-y-2 mb-4 rounded-md p-2 min-h-[50px] ${isOver ? 'bg-blue-50 border border-dashed border-blue-300' : ''}`}
            ref={setDroppableNodeRef}
          >
            {module.lessons && module.lessons.length > 0 ? (
              <SortableContext 
                items={module.lessons.map(lesson => lesson.id)} 
                strategy={verticalListSortingStrategy}
              >
                {module.lessons
                  .sort((a, b) => a.order_index - b.order_index)
                  .map((lesson, index) => (
                    <LessonItem 
                      key={lesson.id} 
                      lesson={lesson} 
                      moduleId={module.id!}
                      index={index}
                      onEditLesson={onEditLesson}
                      onUpdateLesson={onUpdateLesson}
                      onDeleteLesson={onDeleteLesson}
                      onMoveUp={onMoveLessonUp}
                      onMoveDown={onMoveLessonDown}
                      isFirst={index === 0}
                      isLast={index === module.lessons.length - 1}
                    />
                  ))
                }
              </SortableContext>
            ) : (
              <div className="text-center py-4 text-gray-400 text-sm italic">
                {isOver 
                  ? "放置课时到这里..." 
                  : "此模块暂无课时，请添加内容"}
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {LESSON_TYPES.map((type) => (
              <LessonTypeButton 
                key={type.id} 
                icon={type.icon}
                name={type.name}
                type={type.id}
                moduleId={module.id!}
                onAddLesson={onAddLesson}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModuleItem;
