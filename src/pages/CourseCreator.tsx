
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { courseService } from '@/services/courseService';
import { useAuth } from '@/contexts/AuthContext';
import { Course, CourseModule, Lesson } from '@/types/course';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  FilePlus, Upload, Trash2, Plus, Pencil, Edit, Save, 
  BookOpen, Video, FileText, Image, Clock, CheckSquare, 
  FileQuestion, ChevronDown, ChevronRight
} from 'lucide-react';
import LessonEditor from '@/components/course/LessonEditor';
import { LessonType, LessonContent } from '@/types/course';
import { supabase } from '@/integrations/supabase/client';

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
    course_id: 'temp-course-id',
    title: '商业规划简介',
    order_index: 0,
    lessons: [
      { 
        id: 'l1', 
        type: 'video', 
        title: '介绍视频', 
        content: { videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        module_id: 'm1', 
        order_index: 0 
      },
      { 
        id: 'l2', 
        type: 'text', 
        title: '商业计划概述', 
        content: { text: "# 商业计划概述\n\n商业计划是一份详细描述业务（通常是初创企业）如何定义其目标以及如何实现这些目标的书面文档。商业计划从营销、财务和运营角度为公司提供书面路线图。" },
        module_id: 'm1',
        order_index: 1
      }
    ]
  },
  {
    id: 'm2',
    course_id: 'temp-course-id',
    title: '市场研究与分析',
    order_index: 1,
    lessons: []
  }
];

interface CourseCreatorProps {
  onEditorFullscreenChange?: (isFullscreen: boolean) => void;
}

const CourseCreator: React.FC<CourseCreatorProps> = ({ onEditorFullscreenChange }) => {
  const { user } = useAuth();
  const [course, setCourse] = useState<Course>({
    title: '',
    description: '',
    short_description: '',
    author_id: user?.id || '',
    status: 'draft',
    price: null,
    tags: []
  });

  const [modules, setModules] = useState<CourseModule[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [expandedModule, setExpandedModule] = useState('m1');
  const [isUploading, setIsUploading] = useState(false);
  const [coverImageURL, setCoverImageURL] = useState<string | null>(null);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  useEffect(() => {
    if (user?.id) {
      setCourse(prev => ({ ...prev, author_id: user.id }));
    }
  }, [user]);

  // Calculate completion percentage based on course data
  useEffect(() => {
    calculateCompletionPercentage();
  }, [course, modules]);

  // Calculate course completion percentage
  const calculateCompletionPercentage = () => {
    let totalPoints = 0;
    let earnedPoints = 0;
    
    // Check title (required)
    totalPoints += 1;
    if (course.title?.trim()) earnedPoints += 1;
    
    // Check cover image (required)
    totalPoints += 1;
    if (coverImageURL || course.cover_image) earnedPoints += 1;
    
    // Check if there's at least one module
    totalPoints += 1;
    if (modules.length > 0) earnedPoints += 1;
    
    // Check if there's at least one lesson in any module
    totalPoints += 1;
    const hasLessons = modules.some(module => module.lessons && module.lessons.length > 0);
    if (hasLessons) earnedPoints += 1;
    
    // Optional items that improve completion but aren't required
    if (course.description?.trim()) earnedPoints += 0.5;
    if (course.short_description?.trim()) earnedPoints += 0.5;
    
    // Calculate percentage
    const percentage = Math.min(100, Math.round((earnedPoints / totalPoints) * 100));
    setCompletionPercentage(percentage);
  };

  const handleSaveCourse = async () => {
    try {
      const savedCourse = await courseService.saveCourse(course);
      
      const savedModules = await Promise.all(
        modules.map(async (module) => {
          const savedModule = await courseService.addCourseModule({
            ...module,
            course_id: savedCourse.id!
          });

          if (module.lessons) {
            await Promise.all(
              module.lessons.map(lesson => 
                courseService.addLesson({
                  ...lesson,
                  module_id: savedModule.id!
                })
              )
            );
          }

          return savedModule;
        })
      );

      toast.success('课程保存成功');
    } catch (error) {
      console.error('保存课程失败:', error);
      toast.error('保存课程失败');
    }
  };

  const handlePublishCourse = async () => {
    try {
      if (!course.id) {
        await handleSaveCourse();
      }

      await courseService.updateCourseStatus(course.id!, 'published');
      toast.success('课程已发布');
    } catch (error) {
      console.error('发布课程失败:', error);
      toast.error('发布课程失败');
    }
  };
  
  const addModule = () => {
    const newModule: CourseModule = {
      id: `m${modules.length + 1}`,
      course_id: course.id || 'temp-course-id',
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
  
  const addLesson = (moduleId: string, lessonType: LessonType) => {
    const targetModule = modules.find(module => module.id === moduleId);
    if (!targetModule) return;
    
    const orderIndex = targetModule.lessons ? targetModule.lessons.length : 0;
    
    const newLesson: Lesson = {
      id: `l${Date.now()}`,
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

  const handleEditorFullscreenToggle = (isFullscreen: boolean) => {
    if (onEditorFullscreenChange) {
      onEditorFullscreenChange(isFullscreen);
    }
  };

  // Handle file upload for course cover
  const handleCoverImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      setIsUploading(true);
      
      // Create a unique file name to prevent collisions
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `course-covers/${fileName}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('course-assets')
        .upload(filePath, file);
        
      if (error) {
        throw error;
      }
      
      // Get the public URL
      const { data: publicURL } = supabase.storage
        .from('course-assets')
        .getPublicUrl(filePath);
        
      // Update course state with the new cover image URL
      setCoverImageURL(publicURL.publicUrl);
      setCourse(prev => ({ ...prev, cover_image: publicURL.publicUrl }));
      
      toast.success('封面图片上传成功');
    } catch (error) {
      console.error('上传图片失败:', error);
      toast.error('上传图片失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  // Check if required fields for publish are complete
  const getPublishRequirements = () => {
    const requirements = [
      { name: '课程标题', complete: Boolean(course.title?.trim()) },
      { name: '课程封面', complete: Boolean(coverImageURL || course.cover_image) },
      { 
        name: '至少一个完成的模块', 
        complete: modules.length > 0 && modules.some(module => 
          module.lessons && module.lessons.length > 0
        ) 
      }
    ];
    return requirements;
  };

  return (
    <div className="animate-fade-in p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">课程创建器</h1>
          <p className="text-gray-500">设计并发布您自己的课程</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline">预览</Button>
          <Button variant="outline" onClick={handleSaveCourse}>保存草稿</Button>
          <Button onClick={handlePublishCourse} className="bg-connect-blue hover:bg-blue-600">发布</Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="mb-6 w-full justify-start">
              <TabsTrigger value="details">课程详情</TabsTrigger>
              <TabsTrigger value="content">内容</TabsTrigger>
              <TabsTrigger value="settings">设置</TabsTrigger>
              <TabsTrigger value="students">学生统计</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-4">基本信息</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">课程标题</label>
                    <Input 
                      placeholder="例如：全面的商业计划创建" 
                      value={course.title}
                      onChange={(e) => setCourse(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">简短描述</label>
                    <Input 
                      placeholder="简短描述（1-2句话）" 
                      value={course.short_description || ''}
                      onChange={(e) => setCourse(prev => ({ ...prev, short_description: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">详细描述</label>
                    <Textarea 
                      placeholder="关于课程内容和目标的详细描述" 
                      className="min-h-32" 
                      value={course.description || ''}
                      onChange={(e) => setCourse(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                    <select className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-connect-blue/20 focus:border-connect-blue">
                      <option>商业规划</option>
                      <option>游戏设计</option>
                      <option>产品开发</option>
                      <option>市场营销</option>
                      <option>项目管理</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">难度</label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input 
                          type="radio" 
                          name="level" 
                          className="mr-2" 
                          defaultChecked={false}
                          onChange={() => {}}
                        />
                        <span>初级</span>
                      </label>
                      <label className="flex items-center">
                        <input 
                          type="radio" 
                          name="level" 
                          className="mr-2" 
                          defaultChecked={true}
                          onChange={() => {}}
                        />
                        <span>中级</span>
                      </label>
                      <label className="flex items-center">
                        <input 
                          type="radio" 
                          name="level" 
                          className="mr-2" 
                          defaultChecked={false}
                          onChange={() => {}}
                        />
                        <span>高级</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-4">课程封面</h2>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  {(coverImageURL || course.cover_image) ? (
                    <div className="mb-4">
                      <div className="relative aspect-video mb-4 overflow-hidden rounded-md">
                        <img 
                          src={coverImageURL || course.cover_image} 
                          alt="课程封面" 
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setCoverImageURL(null);
                          setCourse(prev => ({ ...prev, cover_image: null }));
                        }}
                      >
                        <Trash2 size={16} className="mr-2" /> 移除图片
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                      <p className="text-sm text-gray-500 mb-2">拖放图片至此，或点击浏览</p>
                      <p className="text-xs text-gray-400 mb-4">推荐尺寸：1280x720像素（16:9比例）</p>
                      <label>
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={isUploading}
                          className="relative"
                        >
                          {isUploading ? (
                            <span className="flex items-center">
                              <span className="animate-spin mr-2">
                                <Clock size={16} />
                              </span>
                              上传中...
                            </span>
                          ) : (
                            <>
                              <Upload size={16} className="mr-2" /> 上传图片
                            </>
                          )}
                          <input 
                            type="file" 
                            accept="image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                            onChange={handleCoverImageUpload}
                            disabled={isUploading}
                          />
                        </Button>
                      </label>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="content" className="space-y-6">
              {currentLesson ? (
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold">编辑课程</h2>
                    <Button variant="outline" size="sm" onClick={() => setCurrentLesson(null)}>
                      返回课程结构
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
                    onEditorFullscreenChange={handleEditorFullscreenToggle}
                  />
                </div>
              ) : (
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
              )}
            </TabsContent>
            
            <TabsContent value="settings">
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-4">课程设置</h2>
                <p className="text-gray-500">课程设置选项将在后续版本中提供。</p>
              </div>
            </TabsContent>
            
            <TabsContent value="students">
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-6">学生统计</h2>
                
                {/* 学生进度概览 */}
                <div className="mb-8">
                  <h3 className="text-md font-semibold mb-4">进度概览</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <p className="text-sm text-gray-500 mb-1">注册学生</p>
                      <p className="text-2xl font-bold">42</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <p className="text-sm text-gray-500 mb-1">完成课程</p>
                      <p className="text-2xl font-bold">18</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <p className="text-sm text-gray-500 mb-1">平均完成率</p>
                      <p className="text-2xl font-bold">63%</p>
                    </div>
                  </div>
                </div>
                
                {/* 作业与评分统计 */}
                <div className="mb-8">
                  <h3 className="text-md font-semibold mb-4">作业与评分</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            作业
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            提交数
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            AI评分均分
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            教师评分均分
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            操作
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">商业计划书初稿</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">35/42</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">87.2</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">82.5</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <Button variant="link" size="sm">查看详情</Button>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">市场分析报告</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">28/42</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">79.8</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">75.1</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <Button variant="link" size="sm">查看详情</Button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* 学生个人进度 */}
                <div>
                  <h3 className="text-md font-semibold mb-4">学生个人进度</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            学生
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            完成进度
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            测验平均分
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            作业平均分
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            最近活动
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            操作
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-xs font-medium">ZL</span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">张立</div>
                                <div className="text-sm text-gray-500">zhang.li@example.com</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                              <div className="bg-connect-blue h-2.5 rounded-full" style={{ width: '85%' }}></div>
                            </div>
                            <div className="text-xs text-gray-500">85%</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">92.5</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">89.0</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">今天 10:23</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <Button variant="link" size="sm">查看详情</Button>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-xs font-medium">WX</span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">王小明</div>
                                <div className="text-sm text-gray-500">xiaoming.wang@example.com</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                              <div className="bg-connect-blue h-2.5 rounded-full" style={{ width: '47%' }}></div>
                            </div>
                            <div className="text-xs text-gray-500">47%</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">78.3</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">81.7</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">昨天 16:45</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <Button variant="link" size="sm">查看详情</Button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white sticky top-20 rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="font-bold mb-4">课程概览</h3>
            <p className="text-sm text-gray-600 mb-4">预览您的课程卡片</p>
            
            <div className="bg-gray-100 border border-gray-200 rounded-lg aspect-video flex items-center justify-center mb-4 overflow-hidden">
              {(coverImageURL || course.cover_image) ? (
                <img 
                  src={coverImageURL || course.cover_image} 
                  alt="课程封面" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <Image size={32} className="text-gray-400" />
              )}
            </div>
            
            <h4 className="font-semibold mb-2">{course.title || "您的课程标题"}</h4>
            <p className="text-sm text-gray-500 mb-4">{course.short_description || "您的课程描述将显示在这里。请确保描述具有吸引力，能够吸引学生。"}</p>
            
            <div className="flex items-center gap-2 mb-1">
              <BookOpen size={14} className="text-gray-400" />
              <span className="text-xs text-gray-500">{modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0)} 课时</span>
            </div>
            
            <div className="flex items-center gap-2 mb-4">
              <Clock size={14} className="text-gray-400" />
              <span className="text-xs text-gray-500">0 小时总时长</span>
            </div>
            
            <div className="mb-4">
              <h5 className="text-sm font-medium mb-2">完成状态</h5>
              <Progress value={completionPercentage} className="h-2.5" />
              <p className="text-xs text-gray-500 mt-1">{completionPercentage}% 完成 - 添加更多内容以完成发布</p>
            </div>
            
            <div className="space-y-2">
              <h5 className="text-sm font-medium">发布所需</h5>
              
              {getPublishRequirements().map((requirement, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  {requirement.complete ? (
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  )}
                  <span>{requirement.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCreator;
