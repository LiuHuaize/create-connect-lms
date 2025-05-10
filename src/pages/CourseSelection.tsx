import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit, ExternalLink, BookOpen, PenLine, ChevronRight, Eye, Copy, CheckCircle, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { courseService } from '@/services/courseService';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Course } from '@/types/course';
import { toast } from 'sonner';
import { useCoursesData } from '@/hooks/useCoursesData';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';

// 定义复制进度状态的类型
type CopyStatus = {
  isOpen: boolean;
  isCompleted: boolean;
  isFailed: boolean;
  progress: number;
  statusText: string;
  error?: string;
};

// 定义删除确认状态的类型
type DeleteConfirmState = {
  isOpen: boolean;
  courseId?: string;
  courseName?: string;
  isDeleting: boolean;
};

const CourseSelection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();
  const { fetchEnrolledCourses } = useCoursesData();
  
  // 添加复制状态
  const [copyStatus, setCopyStatus] = useState<CopyStatus>({
    isOpen: false,
    isCompleted: false,
    isFailed: false,
    progress: 0,
    statusText: '准备复制课程...'
  });
  
  // 添加删除确认状态
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({
    isOpen: false,
    courseId: undefined,
    courseName: undefined,
    isDeleting: false
  });

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        const userCourses = await courseService.getUserCourses(user.id);
        setCourses(userCourses);
      } catch (error) {
        console.error('获取课程失败:', error);
        toast.error('获取课程失败');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [user]);

  const handleCreateNewCourse = () => {
    navigate('/course-creator');
  };

  const handleEditCourse = (courseId: string) => {
    navigate(`/course-creator?id=${courseId}`);
  };

  // 修改复制课程函数，添加进度更新逻辑
  const handleDuplicateCourse = async (courseId: string) => {
    // 打开进度弹窗并重置状态
    setCopyStatus({
      isOpen: true,
      isCompleted: false,
      isFailed: false,
      progress: 0,
      statusText: '准备复制课程...'
    });
    
    try {
      // 添加事件监听器来捕获复制过程中的日志更新
      const originalConsoleLog = console.log;
      console.log = function(...args) {
        const message = args.join(' ');
        originalConsoleLog.apply(console, args);
        
        // 根据日志内容更新进度
        if (message.includes('开始复制课程')) {
          setCopyStatus(prev => ({ ...prev, progress: 5, statusText: '开始复制课程...' }));
        } else if (message.includes('获取到原课程')) {
          setCopyStatus(prev => ({ ...prev, progress: 15, statusText: '获取原课程信息...' }));
        } else if (message.includes('创建新课程成功')) {
          setCopyStatus(prev => ({ ...prev, progress: 30, statusText: '创建新课程...' }));
        } else if (message.includes('准备复制模块')) {
          setCopyStatus(prev => ({ ...prev, progress: 40, statusText: '准备复制课程模块...' }));
        } else if (message.includes('创建新模块成功')) {
          setCopyStatus(prev => ({ ...prev, progress: 50, statusText: '复制课程模块...' }));
        } else if (message.includes('开始复制模块') && message.includes('课时')) {
          setCopyStatus(prev => ({ ...prev, progress: 60, statusText: '复制课时内容...' }));
        } else if (message.includes('开始复制模块资源文件')) {
          setCopyStatus(prev => ({ ...prev, progress: 75, statusText: '复制课程资源文件...' }));
        } else if (message.includes('模块资源文件复制完成')) {
          setCopyStatus(prev => ({ ...prev, progress: 85, statusText: '资源文件复制完成...' }));
        } else if (message.includes('课程复制完成')) {
          setCopyStatus(prev => ({ ...prev, progress: 95, statusText: '课程复制完成，更新列表...' }));
        }
      };
      
      // 复制课程
      const duplicatedCourse = await courseService.duplicateCourse(courseId);
      
      // 更新课程列表
      const userCourses = await courseService.getUserCourses(user!.id);
      setCourses(userCourses);
      
      // 恢复原始控制台输出
      console.log = originalConsoleLog;
      
      // 更新复制完成状态
      setCopyStatus(prev => ({ 
        ...prev, 
        isCompleted: true, 
        progress: 100, 
        statusText: `课程已成功复制：${duplicatedCourse.title}` 
      }));
      
      // 3秒后自动关闭弹窗
      setTimeout(() => {
        setCopyStatus(prev => ({ ...prev, isOpen: false }));
        toast.success("课程复制成功");
      }, 3000);
      
    } catch (error) {
      // 恢复原始控制台输出
      console.log = console.log;
      console.error('复制课程失败:', error);
      
      // 更新失败状态
      setCopyStatus(prev => ({ 
        ...prev, 
        isFailed: true, 
        progress: 100, 
        statusText: '复制课程失败', 
        error: error instanceof Error ? error.message : '未知错误' 
      }));
      
      toast.error("复制课程失败，请重试");
    }
  };

  // 处理删除课程
  const handleDeleteCourse = (courseId: string, courseTitle: string) => {
    // 打开确认对话框
    setDeleteConfirm({
      isOpen: true,
      courseId,
      courseName: courseTitle,
      isDeleting: false
    });
  };
  
  // 执行永久删除
  const confirmDeleteCourse = async () => {
    if (!deleteConfirm.courseId) return;
    
    try {
      // 设置删除中状态
      setDeleteConfirm(prev => ({ ...prev, isDeleting: true }));
      
      // 调用服务永久删除课程
      await courseService.permanentlyDeleteCourse(deleteConfirm.courseId);
      
      // 更新课程列表
      if (user?.id) {
        const userCourses = await courseService.getUserCourses(user.id);
        setCourses(userCourses);
      }
      
      // 关闭确认对话框
      setDeleteConfirm({
        isOpen: false,
        courseId: undefined,
        courseName: undefined,
        isDeleting: false
      });
      
      toast.success("课程已永久删除");
    } catch (error) {
      console.error('删除课程失败:', error);
      
      // 重置删除状态
      setDeleteConfirm(prev => ({ ...prev, isDeleting: false }));
      
      toast.error("删除课程失败，请重试");
    }
  };
  
  // 取消删除
  const cancelDeleteCourse = () => {
    setDeleteConfirm({
      isOpen: false,
      courseId: undefined,
      courseName: undefined,
      isDeleting: false
    });
  };

  const handleViewCourse = (courseId: string) => {
    fetchEnrolledCourses();
    navigate(`/course/${courseId}/details`);
  };

  const handleEnterCourse = (courseId: string) => {
    fetchEnrolledCourses();
    navigate(`/course/${courseId}`);
  };

  // 关闭进度弹窗
  const handleCloseDialog = () => {
    setCopyStatus(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="animate-fade-in p-4 sm:p-8 max-w-7xl mx-auto">
      <div className="mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">我的课程</h1>
        <p className="text-sm sm:text-base text-gray-500">选择一个课程继续编辑或创建新课程</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        <Card className="group border border-gray-200 hover:border-gray-300 bg-gradient-to-br from-white to-gray-50 hover:shadow-md transition-all duration-300 overflow-hidden">
          <CardContent className="pt-8 flex flex-col items-center justify-center h-60">
            <div className="rounded-full bg-blue-50 p-4 mb-5 group-hover:bg-blue-100 transition-colors">
              <PlusCircle className="h-10 w-10 sm:h-12 sm:w-12 text-blue-500 group-hover:text-blue-600 transition-colors" />
            </div>
            <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">创建新课程</h3>
            <p className="text-sm text-gray-500 text-center">从零开始设计一个全新课程</p>
          </CardContent>
          <CardFooter className="justify-center pb-8">
            <Button 
              onClick={handleCreateNewCourse} 
              size={isMobile ? "sm" : "default"}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6"
            >
              开始创建
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardFooter>
        </Card>

        {isLoading ? (
          Array.from({ length: 2 }).map((_, index) => (
            <Card key={`skeleton-${index}`} className="border border-gray-200 bg-white overflow-hidden">
              <div className="h-32 bg-gray-100 animate-pulse" />
              <CardHeader className="pb-2">
                <div className="h-6 w-2/3 bg-gray-100 rounded animate-pulse" />
              </CardHeader>
              <CardContent className="pb-2">
                <div className="h-4 w-full bg-gray-100 rounded animate-pulse mb-2" />
                <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse mb-4" />
                <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="h-9 w-20 bg-gray-100 rounded animate-pulse" />
                <div className="h-9 w-20 bg-gray-100 rounded animate-pulse" />
              </CardFooter>
            </Card>
          ))
        ) : (
          courses.map((course) => (
            <Card key={course.id} className="border border-gray-200 hover:border-gray-300 bg-white hover:shadow-md transition-all duration-300 overflow-hidden">
              <div 
                className="h-32 sm:h-40 bg-gradient-to-r from-gray-50 to-gray-100 bg-cover bg-center relative" 
                style={{ 
                  backgroundImage: course.cover_image 
                    ? `url(${course.cover_image})` 
                    : 'none'
                }}
              >
                {!course.cover_image && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <BookOpen size={40} className="text-gray-300" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                
                {/* 添加复制按钮到左上角 */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 left-2 h-8 w-8 rounded-full bg-white/90 text-blue-500 hover:bg-white hover:text-blue-600 shadow-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDuplicateCourse(course.id!);
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                
                {/* 添加删除按钮 */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/90 text-red-500 hover:bg-white hover:text-red-600 shadow-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCourse(course.id!, course.title);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <CardHeader className="pb-2 relative">
                <CardTitle className="text-lg sm:text-xl line-clamp-1 font-semibold">{course.title}</CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                  {course.short_description || '暂无描述'}
                </p>
                <div className="flex items-center mt-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    course.status === 'published' 
                      ? 'bg-green-50 text-green-600 border border-green-100' 
                      : 'bg-amber-50 text-amber-600 border border-amber-100'
                  }`}>
                    {course.status === 'published' ? '已发布' : '草稿'}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-full border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700"
                    onClick={() => handleEditCourse(course.id!)}
                  >
                    <PenLine className="h-4 w-4 mr-1.5" /> 编辑
                  </Button>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="rounded-full border-blue-100 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700"
                  onClick={() => handleViewCourse(course.id!)}
                >
                  <Eye className="h-4 w-4 mr-1.5" /> 查看详情
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      {!isLoading && courses.length === 0 && (
        <div className="text-center p-10 bg-gray-50 rounded-lg border border-dashed border-gray-200 mt-4">
          <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-medium text-gray-700 mb-1">暂无课程</h3>
          <p className="text-gray-500 mb-4">您还没有创建任何课程，点击"创建新课程"开始吧</p>
          <Button onClick={handleCreateNewCourse} className="bg-blue-600 hover:bg-blue-700">
            <PlusCircle className="h-4 w-4 mr-2" /> 
            创建新课程
          </Button>
        </div>
      )}

      {/* 课程复制进度弹窗 */}
      <Dialog open={copyStatus.isOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{copyStatus.isCompleted ? '课程复制完成' : copyStatus.isFailed ? '复制失败' : '正在复制课程'}</DialogTitle>
            <DialogDescription>
              {copyStatus.statusText}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Progress value={copyStatus.progress} className="h-2 mb-4" />
            
            <div className="flex items-center justify-center mt-4">
              {!copyStatus.isCompleted && !copyStatus.isFailed ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
                  <p className="text-sm text-gray-500">{copyStatus.statusText}</p>
                </div>
              ) : copyStatus.isCompleted ? (
                <div className="flex flex-col items-center">
                  <CheckCircle className="h-10 w-10 text-green-500 mb-2" />
                  <p className="text-sm text-gray-600 text-center">{copyStatus.statusText}</p>
                  <p className="text-xs text-gray-500 mt-2">弹窗将自动关闭...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
                  <p className="text-sm text-gray-600 text-center">复制失败</p>
                  {copyStatus.error && (
                    <p className="text-xs text-red-500 mt-2 text-center">{copyStatus.error}</p>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={handleCloseDialog}
                  >
                    关闭
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* 删除课程确认对话框 */}
      <AlertDialog open={deleteConfirm.isOpen} onOpenChange={cancelDeleteCourse}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认永久删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要永久删除课程 <span className="font-semibold">{deleteConfirm.courseName}</span> 吗？
              <p className="mt-2 text-red-500">警告：此操作无法撤销，课程及其所有内容将被立即删除。</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteConfirm.isDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDeleteCourse();
              }}
              disabled={deleteConfirm.isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white focus:ring-red-500"
            >
              {deleteConfirm.isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  删除中...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  永久删除
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CourseSelection;
