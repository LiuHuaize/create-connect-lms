
import React from 'react';
import { Button } from '@/components/ui/button';
import { CourseModule, Lesson, LessonType } from '@/types/course';
import { Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import ModuleItem from './ModuleItem';
import { getInitialContentByType } from './lessonTypeUtils';

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

  const deleteModule = (moduleId: string) => {
    setModules(modules.filter(module => module.id !== moduleId));
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
      title: `新${lessonType}课程`,
      content: getInitialContentByType(lessonType),
      order_index: orderIndex
    };
    
    const updatedModules = modules.map(module => {
      if (module.id === moduleId) {
        const updatedLessons = [...(module.lessons || [])];
        updatedLessons.push(newLesson as Lesson);
        return { ...module, lessons: updatedLessons };
      }
      return module;
    });
    
    setModules(updatedModules);
    setCurrentLesson(newLesson);
  };

  const deleteLesson = (moduleId: string, lessonId: string) => {
    const updatedModules = modules.map(module => {
      if (module.id === moduleId) {
        return { 
          ...module, 
          lessons: module.lessons.filter(lesson => lesson.id !== lessonId) 
        };
      }
      return module;
    });
    
    setModules(updatedModules);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold">课程结构</h2>
        <Button onClick={addModule} className="bg-connect-blue hover:bg-blue-600">
          <Plus size={16} className="mr-2" /> 添加模块
        </Button>
      </div>
      
      <div className="space-y-4">
        {modules.map((module) => (
          <ModuleItem 
            key={module.id} 
            module={module}
            expandedModule={expandedModule}
            onUpdateModuleTitle={updateModuleTitle}
            onDeleteModule={deleteModule}
            onToggleExpand={toggleModuleExpand}
            onEditLesson={setCurrentLesson}
            onDeleteLesson={deleteLesson}
            onAddLesson={addLesson}
          />
        ))}
      </div>
    </div>
  );
};

export default ModuleList;
