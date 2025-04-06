import { useState, useEffect } from 'react';
import { Course, CourseModule, Lesson } from '@/types/course';
import { useNavigate, useLocation } from 'react-router-dom';
import { courseService } from '@/services/courseService';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';

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
    tags: [],
    category: null
  });

  const [modules, setModules] = useState<CourseModule[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
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
            // 如果有模块，将第一个模块设置为展开状态
            if (courseDetails.modules.length > 0) {
              setExpandedModule(courseDetails.modules[0].id);
            }
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
      console.log('开始保存课程:', course);
      
      if (!user?.id) {
        throw new Error('用户未登录或无法获取用户ID，请重新登录后再试');
      }
      
      if (!course.title.trim()) {
        toast.error('请填写课程标题');
        return;
      }
      
      // 1. 保存课程基本信息
      const courseToSave = {
        ...course,
        author_id: user.id
      };
      
      console.log('准备发送到后端的课程数据:', courseToSave);
      const savedCourse = await courseService.saveCourse(courseToSave);
      console.log('课程基本信息保存成功:', savedCourse);
      
      setCourse(prev => ({ 
        ...prev, 
        id: savedCourse.id 
      }));
      
      // 2. 保存所有模块和课时
      console.log('开始保存课程模块，数量:', modules.length);
      const savedModules = await Promise.all(
        modules.map(async (module, index) => {
          console.log(`开始保存模块 #${index + 1}:`, module.title);
          const moduleToSave = { ...module };
          
          // 确保使用保存后的课程ID
          if (savedCourse.id) {
            moduleToSave.course_id = savedCourse.id;
          }
          
          // 确保模块ID是有效的UUID
          if (!moduleToSave.id || moduleToSave.id.startsWith('m')) {
            moduleToSave.id = uuidv4();
          }
          
          try {
            const savedModule = await courseService.addCourseModule(moduleToSave);
            console.log(`模块 #${index + 1} 保存成功:`, savedModule.id);

            // 保存模块下的所有课时
            if (module.lessons && module.lessons.length > 0) {
              console.log(`开始保存模块 #${index + 1} 的 ${module.lessons.length} 个课时`);
              await Promise.all(
                module.lessons.map(async (lesson, lessonIndex) => {
                  // 确保课时的ID是有效的UUID
                  const lessonToSave = { ...lesson };
                  if (!lessonToSave.id || lessonToSave.id.startsWith('l')) {
                    lessonToSave.id = uuidv4();
                  }
                  
                  try {
                    const savedLesson = await courseService.addLesson({
                      ...lessonToSave,
                      module_id: savedModule.id!
                    });
                    console.log(`课时 #${lessonIndex + 1} 保存成功:`, savedLesson.id);
                    return savedLesson;
                  } catch (error) {
                    console.error(`保存课时 #${lessonIndex + 1} 失败:`, error);
                    throw error;
                  }
                })
              );
              console.log(`模块 #${index + 1} 的所有课时保存完成`);
            }

            return savedModule;
          } catch (error) {
            console.error(`保存模块 #${index + 1} 失败:`, error);
            throw error;
          }
        })
      );

      // 如果是新课程，重定向到带有ID的课程编辑页面
      if (!courseId && savedCourse.id) {
        console.log('重定向到课程编辑页面:', savedCourse.id);
        navigate(`/course-creator?id=${savedCourse.id}`, { replace: true });
      }

      console.log('课程保存完成');
      toast.success('课程保存成功');
      
      // 更新模块数据，确保所有模块和课时都有正确的ID
      const updatedModules = savedModules.map((savedModule, index) => ({
        ...savedModule,
        lessons: modules[index].lessons || []
      }));
      
      setModules(updatedModules);
      
      return savedCourse.id;
    } catch (error) {
      console.error('保存课程失败:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : '未知错误，请稍后重试或联系支持';
      toast.error(`保存课程失败: ${errorMessage}`);
      throw error;
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
