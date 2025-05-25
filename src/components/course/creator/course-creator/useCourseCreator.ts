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
  
  // 核心状态 - 只保留必要的6个状态
  const [course, setCourse] = useState<Course>({
    title: '',
    description: '',
    short_description: '',
    author_id: user?.id || '',
    status: 'draft',
    price: null,
    tags: [],
    category: null,
    grade_range_min: null,
    grade_range_max: null,
    primary_subject: null,
    secondary_subject: null
  });

  const [modules, setModules] = useState<CourseModule[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 用户ID变化时更新课程作者
  useEffect(() => {
    if (user?.id) {
      setCourse(prev => ({ ...prev, author_id: user.id }));
    }
  }, [user]);

  // 加载课程数据
  useEffect(() => {
    const loadCourse = async () => {
      if (!courseId) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const courseDetails = await courseService.getCourseDetails(courseId);
        
        setCourse(courseDetails);
        if (courseDetails.modules) {
          setModules(courseDetails.modules);
          // 如果有模块，将第一个模块设置为展开状态
          if (courseDetails.modules.length > 0) {
            setExpandedModule(courseDetails.modules[0].id);
          }
        }
      } catch (error) {
        console.error('加载课程失败:', error);
        toast.error('加载课程失败，请重试');
      } finally {
        setIsLoading(false);
      }
    };

    loadCourse();
  }, [courseId]);

  // 保存课程
  const handleSaveCourse = async () => {
    if (isSaving) return;
    
    try {
      setIsSaving(true);
      
      if (!user?.id) {
        throw new Error('用户未登录，请重新登录后再试');
      }
      
      if (!course.title.trim()) {
        toast.error('请填写课程标题');
        return;
      }

      // 保存课程基本信息
      const savedCourse = await courseService.saveCourse({
        ...course,
        author_id: user.id
      });

      // 如果是新课程，更新状态中的课程ID
      if (!course.id && savedCourse.id) {
        setCourse(prev => ({ ...prev, id: savedCourse.id }));
      }

      // 保存模块和课时
      const savedModules: CourseModule[] = [];
      for (const module of modules) {
        const savedModule = await courseService.addCourseModule({
          ...module,
          course_id: savedCourse.id
        });
        
        // 保存模块的课时
        const savedLessons: Lesson[] = [];
        if (module.lessons) {
          for (const lesson of module.lessons) {
            const savedLesson = await courseService.addLesson({
              ...lesson,
              module_id: savedModule.id
            });
            savedLessons.push(savedLesson);
          }
        }
        
        savedModules.push({
          ...savedModule,
          lessons: savedLessons
        });
      }

      // 更新状态
      setModules(savedModules);

      // 如果是新课程，重定向到带ID的URL
      if (!courseId && savedCourse.id) {
        navigate(`/course-creator?id=${savedCourse.id}`, { replace: true });
      }

      toast.success('课程保存成功');
      return savedCourse.id;
    } catch (error) {
      console.error('保存课程失败:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : '保存失败，请稍后重试';
      toast.error(`保存课程失败: ${errorMessage}`);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // 返回课程选择页面
  const handleBackToSelection = () => {
    navigate('/course-selection');
  };

  // 计算完成百分比（简化版本）
  const completionPercentage = (() => {
    let points = 0;
    let total = 4;
    
    if (course.title?.trim()) points++;
    if (course.cover_image) points++;
    if (modules.length > 0) points++;
    if (modules.some(m => m.lessons && m.lessons.length > 0)) points++;
    
    return Math.round((points / total) * 100);
  })();

  return {
    // 核心状态
    course,
    setCourse,
    modules,
    setModules,
    currentLesson,
    setCurrentLesson,
    expandedModule,
    setExpandedModule,
    isLoading,
    
    // 保存状态
    isSaving,
    
    // 计算属性
    completionPercentage,
    
    // 为了兼容性，保留一些原有的状态名
    loadingDetails: isLoading,
    moduleDataLoaded: !isLoading,
    coverImageURL: course.cover_image || null,
    setCoverImageURL: (url: string | null) => {
      setCourse(prev => ({ ...prev, cover_image: url }));
    },
    
    // 函数
    handleSaveCourse,
    handleBackToSelection,
    
    // 移除的功能 - 为了兼容性提供空实现
    canUndo: false,
    canRedo: false,
    handleUndo: () => {
      toast.info('撤销功能已被移除以提升性能');
    },
    handleRedo: () => {
      toast.info('重做功能已被移除以提升性能');
    }
  };
};
