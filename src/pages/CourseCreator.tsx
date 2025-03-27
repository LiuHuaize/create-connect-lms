import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  FilePlus, Upload, Trash2, Plus, Pencil, Edit, Save, 
  BookOpen, Video, FileText, Image, Clock, CheckSquare, 
  FileQuestion, ChevronDown, ChevronRight
} from 'lucide-react';
import LessonEditor from '@/components/course/LessonEditor';
import { CourseModule, Lesson, LessonType, LessonContent } from '@/types/course';

type LessonTypeInfo = {
  id: LessonType;
  name: string;
  icon: React.ReactNode;
};

const LESSON_TYPES: LessonTypeInfo[] = [
  { id: 'video', name: 'Video', icon: <Video size={16} className="text-blue-600" /> },
  { id: 'text', name: 'Text Content', icon: <FileText size={16} className="text-green-600" /> },
  { id: 'quiz', name: 'Quiz', icon: <FileQuestion size={16} className="text-amber-600" /> },
  { id: 'assignment', name: 'Assignment', icon: <CheckSquare size={16} className="text-purple-600" /> }
];

const getInitialContentByType = (type: LessonType): LessonContent => {
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
      return { text: '' }; // Default to text content
  }
};

const initialModules: CourseModule[] = [
  {
    id: 'm1',
    title: 'Introduction to Business Planning',
    lessons: [
      { id: 'l1', type: 'video', title: 'Introduction Video', content: { videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } },
      { id: 'l2', type: 'text', title: 'Business Plan Overview', content: { text: "# Business Plan Overview\n\nA business plan is a written document that describes in detail how a business—usually a startup—defines its objectives and how it plans to achieve its goals. A business plan lays out a written roadmap for the firm from marketing, financial, and operational standpoints." } }
    ]
  },
  {
    id: 'm2',
    title: 'Market Research and Analysis',
    lessons: []
  }
];

const CourseCreator = () => {
  const [modules, setModules] = useState<CourseModule[]>(initialModules);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [expandedModule, setExpandedModule] = useState('m1');
  
  const addModule = () => {
    const newModule = {
      id: `m${modules.length + 1}`,
      title: `New Module ${modules.length + 1}`,
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
  
  const addLesson = (moduleId: string, lessonType: LessonType) => {
    const newLesson: Lesson = {
      id: `l${Date.now()}`,
      type: lessonType,
      title: `New ${LESSON_TYPES.find(type => type.id === lessonType)?.name} Lesson`,
      content: getInitialContentByType(lessonType)
    };
    
    setModules(modules.map(module => 
      module.id === moduleId 
        ? { ...module, lessons: [...module.lessons, newLesson] } 
        : module
    ));
    
    setCurrentLesson(newLesson);
  };
  
  const updateLesson = (moduleId: string, lessonId: string, updatedLesson: Lesson | null) => {
    if (!updatedLesson) {
      setCurrentLesson(null);
      return;
    }
    
    setModules(modules.map(module => 
      module.id === moduleId 
        ? { 
            ...module, 
            lessons: module.lessons.map(lesson => 
              lesson.id === lessonId ? updatedLesson : lesson
            ) 
          } 
        : module
    ));
    setCurrentLesson(null);
  };
  
  const deleteLesson = (moduleId: string, lessonId: string) => {
    setModules(modules.map(module => 
      module.id === moduleId 
        ? { ...module, lessons: module.lessons.filter(lesson => lesson.id !== lessonId) } 
        : module
    ));
    
    if (currentLesson && currentLesson.id === lessonId) {
      setCurrentLesson(null);
    }
  };
  
  const toggleModuleExpand = (moduleId: string) => {
    setExpandedModule(expandedModule === moduleId ? null : moduleId);
  };

  return (
    <div className="animate-fade-in p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Creator</h1>
          <p className="text-gray-500">Design and publish your own course</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline">Preview</Button>
          <Button variant="outline">Save Draft</Button>
          <Button className="bg-connect-blue hover:bg-blue-600">Publish</Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="mb-6 w-full justify-start">
              <TabsTrigger value="details">Course Details</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-4">Basic Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course Title</label>
                    <Input placeholder="e.g. Comprehensive Business Plan Creation" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                    <Input placeholder="Brief description (1-2 sentences)" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Description</label>
                    <Textarea placeholder="Detailed description of your course content and goals" className="min-h-32" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-connect-blue/20 focus:border-connect-blue">
                      <option>Business Planning</option>
                      <option>Game Design</option>
                      <option>Product Development</option>
                      <option>Marketing</option>
                      <option>Project Management</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input type="radio" name="level" className="mr-2" />
                        <span>Beginner</span>
                      </label>
                      <label className="flex items-center">
                        <input type="radio" name="level" className="mr-2" checked />
                        <span>Intermediate</span>
                      </label>
                      <label className="flex items-center">
                        <input type="radio" name="level" className="mr-2" />
                        <span>Advanced</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-4">Course Image</h2>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                  <p className="text-sm text-gray-500 mb-2">Drag and drop an image, or click to browse</p>
                  <p className="text-xs text-gray-400 mb-4">Recommended size: 1280x720px (16:9 ratio)</p>
                  <Button variant="outline" size="sm">
                    <Upload size={16} className="mr-2" /> Upload Image
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="content" className="space-y-6">
              {currentLesson ? (
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold">Edit Lesson</h2>
                    <Button variant="outline" size="sm" onClick={() => setCurrentLesson(null)}>
                      Back to Course Structure
                    </Button>
                  </div>
                  
                  <LessonEditor 
                    lesson={currentLesson}
                    onSave={(updatedLesson) => {
                      const moduleId = modules.find(m => 
                        m.lessons.some(l => l.id === currentLesson.id)
                      )?.id;
                      
                      if (moduleId) {
                        updateLesson(moduleId, currentLesson.id, updatedLesson);
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold">Course Structure</h2>
                    <Button size="sm" onClick={addModule}>
                      <Plus size={16} className="mr-2" /> Add Module
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {modules.map((module) => (
                      <div key={module.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 p-4 flex justify-between items-center">
                          <div className="flex items-center flex-1">
                            <button 
                              onClick={() => toggleModuleExpand(module.id)}
                              className="mr-2 text-gray-500 hover:text-gray-700"
                            >
                              {expandedModule === module.id ? 
                                <ChevronDown size={18} /> : 
                                <ChevronRight size={18} />
                              }
                            </button>
                            <span className="font-medium mr-2">Module {modules.indexOf(module) + 1}:</span>
                            <Input 
                              value={module.title} 
                              onChange={(e) => updateModuleTitle(module.id, e.target.value)}
                              className="border-0 bg-transparent focus:ring-0" 
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="p-1 text-gray-500 hover:text-gray-700">
                              <Edit size={16} />
                            </button>
                            <button 
                              className="p-1 text-gray-500 hover:text-red-500"
                              onClick={() => deleteModule(module.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        
                        {expandedModule === module.id && (
                          <div className="p-4 space-y-3">
                            {module.lessons.map((lesson) => {
                              const lessonType = LESSON_TYPES.find(type => type.id === lesson.type);
                              
                              return (
                                <div key={lesson.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg">
                                  <div className="flex items-center">
                                    <div className="p-2 bg-gray-50 rounded-md mr-3">
                                      {lessonType?.icon}
                                    </div>
                                    <span>{lesson.title}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button 
                                      className="p-1 text-gray-500 hover:text-gray-700"
                                      onClick={() => setCurrentLesson(lesson)}
                                    >
                                      <Pencil size={14} />
                                    </button>
                                    <button 
                                      className="p-1 text-gray-500 hover:text-red-500"
                                      onClick={() => deleteLesson(module.id, lesson.id)}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                            
                            <div className="relative">
                              <Button variant="outline" size="sm" className="w-full">
                                <Plus size={14} className="mr-2" /> Add Lesson
                              </Button>
                              
                              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
                                {LESSON_TYPES.map((type) => (
                                  <button
                                    key={type.id}
                                    className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-50"
                                    onClick={() => addLesson(module.id, type.id)}
                                  >
                                    <span className="mr-2">{type.icon}</span>
                                    {type.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="settings" className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-4">Course Settings</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" checked />
                      <span className="text-sm font-medium">Enable Course Certificate</span>
                    </label>
                    <p className="text-xs text-gray-500 ml-6">Students will receive a certificate upon completion</p>
                  </div>
                  
                  <div>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" checked />
                      <span className="text-sm font-medium">Allow Student Discussions</span>
                    </label>
                    <p className="text-xs text-gray-500 ml-6">Students can ask questions and discuss course content</p>
                  </div>
                  
                  <div>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm font-medium">Require Quiz Completion</span>
                    </label>
                    <p className="text-xs text-gray-500 ml-6">Students must pass quizzes to advance to next module</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course Access</label>
                    <select className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-connect-blue/20 focus:border-connect-blue">
                      <option>Free Access</option>
                      <option>Premium Only</option>
                      <option>Private (Invitation Only)</option>
                    </select>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm sticky top-6">
            <div className="p-5 border-b border-gray-200">
              <h3 className="font-bold mb-1">Course Overview</h3>
              <p className="text-sm text-gray-500">Preview of your course card</p>
            </div>
            
            <div className="p-5">
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <div className="h-40 bg-gray-100 flex items-center justify-center">
                  <Image size={32} className="text-gray-400" />
                </div>
                
                <div className="p-4">
                  <div className="bg-connect-lightBlue text-connect-blue inline-block px-2 py-1 rounded-full text-xs font-medium mb-2">
                    Business Planning
                  </div>
                  <h3 className="font-bold mb-2">Your Course Title</h3>
                  <p className="text-sm text-gray-600 mb-4">Your course description will appear here. Make it compelling to attract students.</p>
                  
                  <div className="flex items-center text-sm text-gray-500 mb-1">
                    <BookOpen size={14} className="mr-1" />
                    <span>{modules.length} Modules</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock size={14} className="mr-1" />
                    <span>0 hours total</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-5 space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Completion Status</h4>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-connect-blue h-2.5 rounded-full" style={{ width: '40%' }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">40% complete - add more content to finish</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-1">Required for Publishing</h4>
                  <ul className="text-xs space-y-1">
                    <li className="flex items-center text-green-600">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Course title
                    </li>
                    <li className="flex items-center text-red-600">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      Course image
                    </li>
                    <li className="flex items-center text-red-600">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      At least one complete module
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCreator;
