
import { useState, useEffect } from 'react';
import { Course, CourseModule, Lesson } from '@/types/course';
import { useNavigate, useLocation } from 'react-router-dom';
import { courseService } from '@/services/courseService';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export const useCourseCreator = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const courseId = new URLSearchParams(location.search).get('id');
  
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
  const [isLoading, setIsLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [moduleDataLoaded, setModuleDataLoaded] = useState(true);

  useEffect(() => {
    const loadCourseBasicInfo = async () => {
      if (!courseId) {
        setLoadingDetails(false);
        setIsLoading(false);
        setModuleDataLoaded(true);
        return;
      }
      
      try {
        setIsLoading(true);
        setLoadingDetails(true);
        setModuleDataLoaded(false);
        
        const courseDetails = await courseService.getCourseDetails(courseId);
        
        setCourse(courseDetails);
        setCoverImageURL(courseDetails.cover_image || null);
        setLoadingDetails(false);
        
        setTimeout(async () => {
          if (courseDetails.modules) {
            setModules(courseDetails.modules);
          }
          setModuleDataLoaded(true);
          setIsLoading(false);
        }, 100);
      } catch (error) {
        console.error('加载课程失败:', error);
        toast.error('加载课程失败，请重试');
        setLoadingDetails(false);
        setIsLoading(false);
        setModuleDataLoaded(true);
      }
    };

    loadCourseBasicInfo();
  }, [courseId]);

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
    if (hasLessons) earnedPoints += 0.5;
    
    if (course.description?.trim()) earnedPoints += 0.5;
    if (course.short_description?.trim()) earnedPoints += 0.5;
    
    const percentage = Math.min(100, Math.round((earnedPoints / totalPoints) * 100));
    setCompletionPercentage(percentage);
  };

  const handleSaveCourse = async () => {
    try {
      console.log('Trying to save course:', course);
      
      const savedCourse = await courseService.saveCourse(course);
      console.log('Course saved successfully:', savedCourse);
      
      setCourse(prev => ({ 
        ...prev, 
        id: savedCourse.id 
      }));
      
      const savedModules = await Promise.all(
        modules.map(async (module) => {
          const moduleToSave = { ...module };
          
          if (savedCourse.id) {
            moduleToSave.course_id = savedCourse.id;
          }
          
          const savedModule = await courseService.addCourseModule(moduleToSave);

          if (module.lessons && module.lessons.length > 0) {
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

      if (!courseId && savedCourse.id) {
        navigate(`/course-creator?id=${savedCourse.id}`, { replace: true });
      }

      toast.success('课程保存成功');
    } catch (error) {
      console.error('保存课程失败:', error);
      toast.error(`保存课程失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const handleBackToSelection = () => {
    navigate('/course-selection');
  };

  return {
    course,
    setCourse,
    modules,
    setModules,
    currentLesson,
    setCurrentLesson,
    expandedModule,
    setExpandedModule,
    coverImageURL,
    setCoverImageURL,
    completionPercentage,
    isLoading,
    loadingDetails,
    moduleDataLoaded,
    handleSaveCourse,
    handleBackToSelection,
  };
};
