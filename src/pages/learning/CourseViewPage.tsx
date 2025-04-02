
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, BookOpen, Clock, Calendar, User, 
  ChevronRight, ChevronDown, CheckCircle, 
  Circle, Loader2, PlayCircle, FileText, 
  FileQuestion, CheckSquare
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getCourseById, getCourseModules } from '@/services/courseService';
import { DbCourse } from '@/types/db';
import { CourseModule, Lesson } from '@/types/course';

const LessonTypeIcons = {
  video: <PlayCircle size={16} className="text-blue-600" />,
  text: <FileText size={16} className="text-green-600" />,
  quiz: <FileQuestion size={16} className="text-amber-600" />,
  assignment: <CheckSquare size={16} className="text-purple-600" />
};

const CourseViewPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { toast } = useToast();
  
  const [course, setCourse] = useState<DbCourse | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const loadCourse = async () => {
      if (!courseId) return;
      
      setIsLoading(true);
      try {
        // Load course details
        const courseData = await getCourseById(courseId);
        if (!courseData) {
          toast({
            title: "课程不存在",
            description: "无法找到请求的课程",
            variant: "destructive"
          });
          return;
        }
        
        setCourse(courseData);
        
        // Load modules and lessons
        const courseModules = await getCourseModules(courseId);
        if (courseModules) {
          setModules(courseModules);
          
          // Expand first module by default
          if (courseModules.length > 0) {
            setExpandedModules({ [courseModules[0].id]: true });
          }
        }
      } catch (error) {
        console.error('Error loading course:', error);
        toast({
          title: "加载失败",
          description: "加载课程内容时发生错误",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCourse();
  }, [courseId, toast]);
  
  const toggleModuleExpansion = (moduleId: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 min-h-[70vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-connect-blue mx-auto mb-4" />
          <h2 className="text-xl font-semibold">加载中...</h2>
          <p className="text-gray-500 mt-2">请稍候，正在加载课程内容</p>
        </div>
      </div>
    );
  }
  
  if (!course) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">课程不存在</h2>
          <p className="text-gray-500 mb-6">无法找到请求的课程，可能已被删除或您没有访问权限。</p>
          <Button asChild>
            <Link to="/learning">返回课程列表</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="animate-fade-in p-6 max-w-7xl mx-auto">
      <Link to="/learning" className="inline-flex items-center text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft size={16} className="mr-2" /> 返回课程列表
      </Link>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Course Content */}
        <div className="lg:col-span-2">
          {/* Course header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              {course.category && (
                <Badge variant="outline">
                  {course.category}
                </Badge>
              )}
              {course.difficulty && (
                <Badge variant="outline">
                  {course.difficulty === 'beginner' && '初级'}
                  {course.difficulty === 'intermediate' && '中级'}
                  {course.difficulty === 'advanced' && '高级'}
                </Badge>
              )}
              {course.status === 'draft' && (
                <Badge variant="secondary">
                  草稿
                </Badge>
              )}
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{course.title}</h1>
            
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-6">
              <div className="flex items-center">
                <Clock size={16} className="mr-1" />
                <span>未知时长</span>
              </div>
              <div className="flex items-center">
                <BookOpen size={16} className="mr-1" />
                <span>{modules.reduce((acc, m) => acc + m.lessons.length, 0)} 课时</span>
              </div>
              <div className="flex items-center">
                <Calendar size={16} className="mr-1" />
                <span>创建于 {new Date(course.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            
            {course.description && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
                <h2 className="text-xl font-bold mb-4">课程介绍</h2>
                <div className="prose max-w-none">
                  {course.description.split('\n').map((paragraph, i) => (
                    <p key={i} className="mb-4">{paragraph}</p>
                  ))}
                </div>
              </div>
            )}
            
            {/* Course content */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold mb-6">课程内容</h2>
              
              <div className="space-y-4">
                {modules.length === 0 ? (
                  <p className="text-gray-500 py-8 text-center">
                    此课程尚无内容
                  </p>
                ) : (
                  modules.map((module, moduleIndex) => (
                    <div key={module.id} className="border border-gray-200 rounded-md overflow-hidden">
                      <button
                        className="flex items-center justify-between w-full p-4 text-left font-medium hover:bg-gray-50"
                        onClick={() => toggleModuleExpansion(module.id)}
                      >
                        <div className="flex items-center">
                          <span className="text-gray-400 mr-3">{moduleIndex + 1}.</span>
                          <span>{module.title}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <span className="text-sm text-gray-500 mr-2">
                            {module.lessons.length} 课时
                          </span>
                          {expandedModules[module.id] ? (
                            <ChevronDown size={18} />
                          ) : (
                            <ChevronRight size={18} />
                          )}
                        </div>
                      </button>
                      
                      {expandedModules[module.id] && (
                        <div className="border-t border-gray-200">
                          <ul className="divide-y divide-gray-100">
                            {module.lessons.map((lesson, lessonIndex) => (
                              <li key={lesson.id}>
                                <Link 
                                  to={`/learning/course/${courseId}/lesson/${lesson.id}`}
                                  className="flex items-center p-3 hover:bg-gray-50"
                                >
                                  <Circle size={16} className="text-gray-300 mr-3" />
                                  <div className="flex items-center">
                                    {LessonTypeIcons[lesson.type]}
                                    <span className="ml-2">{lesson.title}</span>
                                  </div>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Course Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            {course.cover_image_url && (
              <div className="aspect-video mb-4 rounded-md overflow-hidden">
                <img 
                  src={course.cover_image_url} 
                  alt={course.title} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <Button className="w-full mb-4 bg-connect-blue hover:bg-blue-600">
              开始学习
            </Button>
            
            <div className="border-t border-gray-200 mt-4 pt-4">
              <h3 className="text-lg font-semibold mb-3">课程内容</h3>
              <ul className="space-y-2">
                <li className="flex justify-between">
                  <span className="text-gray-600">章节数</span>
                  <span className="font-medium">{modules.length}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">课时数</span>
                  <span className="font-medium">{modules.reduce((acc, m) => acc + m.lessons.length, 0)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">视频</span>
                  <span className="font-medium">
                    {modules.reduce((acc, m) => 
                      acc + m.lessons.filter(l => l.type === 'video').length, 0
                    )}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">阅读材料</span>
                  <span className="font-medium">
                    {modules.reduce((acc, m) => 
                      acc + m.lessons.filter(l => l.type === 'text').length, 0
                    )}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">测验</span>
                  <span className="font-medium">
                    {modules.reduce((acc, m) => 
                      acc + m.lessons.filter(l => l.type === 'quiz').length, 0
                    )}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">作业</span>
                  <span className="font-medium">
                    {modules.reduce((acc, m) => 
                      acc + m.lessons.filter(l => l.type === 'assignment').length, 0
                    )}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseViewPage;
