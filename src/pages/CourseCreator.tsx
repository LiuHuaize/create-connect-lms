
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { courseService } from '@/services/courseService';
import { useAuth } from '@/contexts/AuthContext';
import { Course, CourseModule, Lesson } from '@/types/course';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LessonEditor from '@/components/course/LessonEditor';

// Import refactored components
import CourseDetailsForm from '@/components/course/creator/CourseDetailsForm';
import CourseImageUploader from '@/components/course/creator/CourseImageUploader';
import ModuleList from '@/components/course/creator/ModuleList';
import CourseOverview from '@/components/course/creator/CourseOverview';
import StudentStatistics from '@/components/course/creator/StudentStatistics';

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

  useEffect(() => {
    calculateCompletionPercentage();
  }, [course, modules]);

  const calculateCompletionPercentage = () => {
    let totalPoints = 0;
    let earnedPoints = 0;
    
    totalPoints += 1;
    if (course.title?.trim()) earnedPoints += 1;
    
    totalPoints += 1;
    if (coverImageURL || course.cover_image) earnedPoints += 1;
    
    totalPoints += 1;
    if (modules.length > 0) earnedPoints += 1;
    
    totalPoints += 1;
    const hasLessons = modules.some(module => module.lessons && module.lessons.length > 0);
    if (hasLessons) earnedPoints += 1;
    
    if (course.description?.trim()) earnedPoints += 0.5;
    if (course.short_description?.trim()) earnedPoints += 0.5;
    
    const percentage = Math.min(100, Math.round((earnedPoints / totalPoints) * 100));
    setCompletionPercentage(percentage);
  };

  const handleSaveCourse = async () => {
    try {
      console.log('Trying to save course:', course);
      
      // Create a copy without the difficulty field if needed
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

  const handleEditorFullscreenToggle = (isFullscreen: boolean) => {
    if (onEditorFullscreenChange) {
      onEditorFullscreenChange(isFullscreen);
    }
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
              <CourseDetailsForm course={course} setCourse={setCourse} />
              <CourseImageUploader 
                course={course}
                setCourse={setCourse}
                coverImageURL={coverImageURL}
                setCoverImageURL={setCoverImageURL}
              />
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
                <ModuleList 
                  modules={modules}
                  setModules={setModules}
                  setCurrentLesson={setCurrentLesson}
                  expandedModule={expandedModule}
                  setExpandedModule={setExpandedModule}
                />
              )}
            </TabsContent>
            
            <TabsContent value="settings">
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-4">课程设置</h2>
                <p className="text-gray-500">课程设置选项将在后续版本中提供。</p>
              </div>
            </TabsContent>
            
            <TabsContent value="students">
              <StudentStatistics />
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="lg:col-span-1">
          <CourseOverview 
            course={course}
            modules={modules}
            completionPercentage={completionPercentage}
            coverImageURL={coverImageURL}
          />
        </div>
      </div>
    </div>
  );
};

export default CourseCreator;
