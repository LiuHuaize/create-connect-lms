
import React from 'react';
import { CourseModule, Lesson, LessonType } from '@/types/course';
import ModuleHeader from './ModuleHeader';
import LessonItem from './LessonItem';
import LessonTypeButton from './LessonTypeButton';
import { LESSON_TYPES } from './lessonTypeUtils';

interface ModuleItemProps {
  module: CourseModule;
  expandedModule: string | null;
  onUpdateModuleTitle: (moduleId: string, title: string) => void;
  onDeleteModule: (moduleId: string) => void;
  onToggleExpand: (moduleId: string) => void;
  onEditLesson: (lesson: Lesson) => void;
  onDeleteLesson: (moduleId: string, lessonId: string) => void;
  onAddLesson: (moduleId: string, lessonType: LessonType) => void;
}

const ModuleItem: React.FC<ModuleItemProps> = ({
  module,
  expandedModule,
  onUpdateModuleTitle,
  onDeleteModule,
  onToggleExpand,
  onEditLesson,
  onDeleteLesson,
  onAddLesson
}) => {
  const isExpanded = expandedModule === module.id;

  return (
    <div className="border border-gray-200 rounded-lg">
      <ModuleHeader 
        moduleId={module.id!}
        title={module.title}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
        onUpdateTitle={onUpdateModuleTitle}
        onDeleteModule={onDeleteModule}
      />
      
      {isExpanded && (
        <div className="p-4 pt-0 border-t border-gray-200">
          <div className="space-y-2 mb-4">
            {module.lessons && module.lessons.map((lesson) => (
              <LessonItem 
                key={lesson.id} 
                lesson={lesson} 
                moduleId={module.id!}
                onEditLesson={onEditLesson}
                onDeleteLesson={onDeleteLesson}
              />
            ))}
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
