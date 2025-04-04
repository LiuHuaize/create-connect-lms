
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CourseModule, Lesson, LessonType } from '@/types/course';
import { Plus, Trash2, Pencil, ChevronDown, ChevronRight, Video, FileText, FileQuestion, CheckSquare } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

type LessonTypeInfo = {
  id: LessonType;
  name: string;
  icon: React.ReactNode;
};

const LESSON_TYPES: LessonTypeInfo[] = [
  { id: 'video', name: '视频', icon: <Video size={16} className="text-blue-600" /> },
  { id: 'text', name: '文本内容', icon: <FileText size={16} className="text-green-600" /> },
  { id: 'quiz', name: '测验', icon: <FileQuestion size={16} className="text-amber-600" /> },
  { id: 'assignment', name: '作业', icon: <CheckSquare size={16} className="text-purple-600" /> }
];

const getInitialContentByType = (type: LessonType) => {
  switch(type) {
    case 'video':
      return { videoUrl: '' };
    case 'text':
      return { text: '' };
    case 'quiz':
      return { questions: [] };
    case 'assignment':
      return { instructions: '', criteria: '' };
    default:
      return { text: '' };
  }
};

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
      id: uuidv4(), // 使用UUID代替字符串ID
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
      id: uuidv4(), // 使用UUID
      module_id: moduleId,
      type: lessonType,
      title: `新${LESSON_TYPES.find(type => type.id === lessonType)?.name}课程`,
      content: getInitialContentByType(lessonType),
      order_index: orderIndex
    };
    
    setModules(modules.map(module => 
      module.id === moduleId 
        ? { ...module, lessons: [...(module.lessons || []), newLesson] } 
        : module
    ));
    
    setCurrentLesson(newLesson);
  };

  const deleteLesson = (moduleId: string, lessonId: string) => {
    setModules(modules.map(module => 
      module.id === moduleId 
        ? { ...module, lessons: module.lessons.filter(lesson => lesson.id !== lessonId) } 
        : module
    ));
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
          <div key={module.id} className="border border-gray-200 rounded-lg">
            <div 
              className="flex items-center justify-between p-4 cursor-pointer"
              onClick={() => toggleModuleExpand(module.id)}
            >
              <div className="flex items-center gap-2">
                {expandedModule === module.id ? 
                  <ChevronDown size={16} /> : 
                  <ChevronRight size={16} />
                }
                <input
                  type="text"
                  value={module.title}
                  onChange={(e) => updateModuleTitle(module.id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="text-lg font-medium focus:outline-none focus:ring-1 focus:ring-connect-blue rounded px-1"
                />
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteModule(module.id);
                }}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
            
            {expandedModule === module.id && (
              <div className="p-4 pt-0 border-t border-gray-200">
                <div className="space-y-2 mb-4">
                  {module.lessons && module.lessons.map((lesson) => (
                    <div 
                      key={lesson.id} 
                      className="flex items-center justify-between p-3 border border-gray-100 rounded-md hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-2">
                        {LESSON_TYPES.find(type => type.id === lesson.type)?.icon}
                        <span>{lesson.title}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setCurrentLesson(lesson)}
                          className="text-gray-400 hover:text-connect-blue transition-colors"
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={() => deleteLesson(module.id, lesson.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {LESSON_TYPES.map((type) => (
                    <Button 
                      key={type.id} 
                      variant="outline" 
                      className="text-sm"
                      onClick={() => addLesson(module.id, type.id as LessonType)}
                    >
                      {type.icon}
                      <span className="ml-2">添加{type.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModuleList;
