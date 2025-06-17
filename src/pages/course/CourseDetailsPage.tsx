import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Book, Clock, Award, User, GraduationCap, ArrowLeft, CheckCircle, AlertCircle, Loader2, Play, Edit, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/PageContainer';
import { useAuth } from '@/contexts/AuthContext';
import { Course, CourseModule } from '@/types/course';
import { useCoursesData } from '@/hooks/useCoursesData';
import { useCourseData } from './hooks/useCourseData';

// 加载中骨架屏组件
const CourseDetailsSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-64 bg-gray-200 rounded-xl mb-6"></div>
    <div className="h-10 bg-gray-200 rounded-lg mb-4 w-3/4"></div>
    <div className="h-6 bg-gray-200 rounded-lg mb-6 w-1/2"></div>
    <div className="flex gap-4 mb-6">
      <div className="h-8 bg-gray-200 rounded-full w-24"></div>
      <div className="h-8 bg-gray-200 rounded-full w-24"></div>
      <div className="h-8 bg-gray-200 rounded-full w-24"></div>
    </div>
    <div className="h-32 bg-gray-200 rounded-lg mb-6"></div>
    <div className="flex justify-end">
      <div className="h-10 bg-gray-200 rounded-lg w-40"></div>
    </div>
  </div>
);

// 课程不存在或已归档的提示
const CourseNotFound = () => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="bg-amber-100 p-3 rounded-full mb-4">
      <AlertCircle size={32} className="text-amber-600" />
    </div>
    <h2 className="text-2xl font-bold text-gray-900 mb-2">课程不可用</h2>
    <p className="text-gray-600 mb-6 text-center max-w-md">
      该课程可能不存在、已被归档或您没有访问权限。
    </p>
    <Button onClick={() => window.history.back()}>返回上一页</Button>
  </div>
);

// 主组件
const CourseDetailsPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { handleEnrollCourse, loadingEnrollment, enrolledCourses } = useCoursesData();

  // 使用优化的课程数据hook
  const { loading, courseData, progress, enrollmentId } = useCourseData(courseId);

  // 本地状态管理
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  
  // 检查是否已加入此课程和是否为创建者
  useEffect(() => {
    if (enrolledCourses && courseId) {
      const enrolled = enrolledCourses.find(c => c.id === courseId);
      setIsEnrolled(!!enrolled);
    }
  }, [enrolledCourses, courseId]);

  // 检查当前用户是否为课程创建者
  useEffect(() => {
    if (courseData && user?.id) {
      setIsCreator(courseData.author_id === user.id);
    }
  }, [courseData, user?.id]);
  
  // 处理加入课程
  const handleEnroll = () => {
    if (!courseId) return;
    handleEnrollCourse(courseId);
  };
  
  // 处理继续学习
  const handleContinueLearning = () => {
    if (!courseId) return;
    navigate(`/course/${courseId}`);
  };
  
  // 处理编辑课程
  const handleEditCourse = () => {
    if (!courseId) return;
    navigate(`/course-creator?id=${courseId}`);
  };
  
  if (loading) {
    return (
      <PageContainer title="课程详情">
        <CourseDetailsSkeleton />
      </PageContainer>
    );
  }

  // 如果课程不存在，或者课程未发布且用户不是创建者，显示不可用消息
  if (!courseData || (courseData.status !== 'published' && !isCreator)) {
    return (
      <PageContainer title="课程不可用">
        <CourseNotFound />
      </PageContainer>
    );
  }

  // 从courseData中提取模块信息
  const modules = courseData.modules || [];
  
  return (
    <PageContainer
      title="课程详情"
      subtitle="了解课程内容和学习目标"
      backButton={{
        onClick: () => navigate(-1),
        icon: <ArrowLeft size={16} />,
        label: "返回课程列表"
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* 左侧：课程信息 */}
        <div className="md:col-span-2">
          {/* 封面图 - 增加高度并确保保持宽高比 */}
          <div
            className="w-full h-auto aspect-[16/9] rounded-xl mb-6 bg-gradient-to-r from-gray-100 to-gray-200 bg-cover bg-center relative overflow-hidden"
            style={{
              backgroundImage: courseData.cover_image
                ? `url(${courseData.cover_image})`
                : 'none'
            }}
          >
            {!courseData.cover_image && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Book size={64} className="text-gray-300" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent"></div>

            {/* 在封面图上添加课程状态标签 */}
            {isEnrolled && (
              <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-md">
                已加入
              </div>
            )}

            {/* 如果是草稿状态，显示草稿标签 */}
            {courseData.status !== 'published' && (
              <div className="absolute top-4 left-4 bg-amber-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-md flex items-center">
                <FileText size={14} className="mr-1" />
                草稿
              </div>
            )}
          </div>

          {/* 课程标题和基本信息 */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{courseData.title}</h1>
              <p className="text-gray-600">{courseData.short_description || courseData.description || '暂无课程描述'}</p>
            </div>

            {/* 移除左侧的按钮 */}
          </div>
          
          {/* 如果已加入，显示进度条 */}
          {isEnrolled && (
            <div className="mb-8 bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-blue-700">课程进度</span>
                <span className="font-semibold text-blue-700">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
          
          {/* 标签/分类信息 */}
          <div className="flex flex-wrap gap-2 mb-6">
            {courseData.category && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                {courseData.category}
              </Badge>
            )}
            {courseData.primary_subject && (
              <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100">
                {courseData.primary_subject}
              </Badge>
            )}
            {courseData.secondary_subject && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700 hover:bg-purple-100">
                {courseData.secondary_subject}
              </Badge>
            )}
          </div>

          {/* 元信息 */}
          <div className="flex flex-wrap gap-6 mb-8 text-sm">
            <div className="flex items-center">
              <Clock size={18} className="mr-2 text-gray-500" />
              <span className="text-gray-700">{courseData.duration_minutes ? `${courseData.duration_minutes}分钟` : '时长未设置'}</span>
            </div>
            <div className="flex items-center">
              <GraduationCap size={18} className="mr-2 text-gray-500" />
              <span className="text-gray-700">
                {courseData.grade_range_min && courseData.grade_range_max
                  ? `${courseData.grade_range_min}-${courseData.grade_range_max}年级`
                  : courseData.grade_range_min
                  ? `${courseData.grade_range_min}年级及以上`
                  : courseData.grade_range_max
                  ? `${courseData.grade_range_max}年级及以下`
                  : '所有年级'}
              </span>
            </div>
            <div className="flex items-center">
              <Award size={18} className="mr-2 text-gray-500" />
              <span className="text-gray-700">
                {courseData.difficulty === 'intermediate' ? '中级难度' :
                 courseData.difficulty === 'advanced' ? '高级难度' :
                 '初级难度'}
              </span>
            </div>
            <div className="flex items-center">
              <User size={18} className="mr-2 text-gray-500" />
              <span className="text-gray-700">作者</span>
            </div>
          </div>
          
          {/* 详细描述 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">课程介绍</h2>
            <div className="text-gray-700 prose max-w-none whitespace-pre-line">
              {courseData.description || '暂无详细描述'}
            </div>
          </div>

          {/* 课前准备材料 */}
          {courseData.preparation_materials && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">课前准备</h2>
              <div className="text-gray-700 prose max-w-none whitespace-pre-line">
                {courseData.preparation_materials}
              </div>
            </div>
          )}
          
          {/* 课程大纲预览 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">课程大纲</h2>
            {modules.length > 0 ? (
              <div className="space-y-4">
                {modules.slice(0, 3).map((module, index) => (
                  <Card key={module.id} className="border border-gray-200 hover:border-blue-200 transition-colors">
                    <CardContent className="p-4">
                      <h3 className="font-medium text-gray-900 text-center">
                        {index + 1}. {module.title}
                      </h3>
                    </CardContent>
                  </Card>
                ))}
                {modules.length > 3 && (
                  <p className="text-sm text-gray-500 italic">
                    还有 {modules.length - 3} 个模块未显示...
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 italic">暂无课程大纲</p>
            )}
          </div>
        </div>
        
        {/* 右侧：课程信息卡片 */}
        <div className="md:col-span-1">
          <div className="sticky top-8">
            <Card className="border border-gray-200 shadow-sm overflow-hidden">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">课程信息</h3>
                
                <div className="space-y-6">
                  {courseData.status !== 'published' && isCreator ? (
                    // 课程创建者查看草稿课程
                    <div className="flex items-center text-amber-600 mb-6">
                      <AlertCircle size={18} className="mr-2" />
                      <span className="text-sm font-medium">本课程尚未发布</span>
                    </div>
                  ) : isEnrolled ? (
                    // 已加入的已发布课程
                    <div className="flex items-center text-green-600 mb-6">
                      <CheckCircle size={18} className="mr-2" />
                      <span className="text-sm font-medium">您已加入此课程</span>
                    </div>
                  ) : (
                    // 未加入的已发布课程
                    <div className="text-gray-700 mb-6">
                      加入这门课程以开始您的学习之旅。课程内容将立即对您开放。
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">难度级别</span>
                      <span className="font-medium">
                        {courseData.difficulty === 'intermediate' ? '中级' :
                         courseData.difficulty === 'advanced' ? '高级' :
                         '初级'}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">适用年级</span>
                      <span className="font-medium">
                        {courseData.grade_range_min && courseData.grade_range_max
                          ? `${courseData.grade_range_min}-${courseData.grade_range_max}年级`
                          : courseData.grade_range_min
                          ? `${courseData.grade_range_min}年级及以上`
                          : courseData.grade_range_max
                          ? `${courseData.grade_range_max}年级及以下`
                          : '所有年级'}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">学科</span>
                      <span className="font-medium">
                        {courseData.primary_subject || '未指定'}
                        {courseData.secondary_subject ? ` + ${courseData.secondary_subject}` : ''}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">课程模块</span>
                      <span className="font-medium">{modules.length}个</span>
                    </div>

                    {courseData.preparation_materials && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">课前准备</span>
                        <span className="font-medium text-blue-600">查看详情</span>
                      </div>
                    )}
                  </div>
                  
                  {/* 底部的操作按钮 - 保留这个按钮，为课程创建者添加编辑选项 */}
                  <div className="pt-6 mt-4 border-t border-gray-200">
                    {isCreator && courseData.status !== 'published' ? (
                      // 课程创建者查看草稿状态课程时显示的按钮
                      <div className="space-y-3">
                        <Button
                          onClick={handleEditCourse}
                          className="w-full bg-amber-600 hover:bg-amber-700"
                        >
                          <Edit size={16} className="mr-2" />
                          继续编辑
                        </Button>
                        <Button
                          onClick={handleContinueLearning}
                          variant="outline"
                          className="w-full"
                        >
                          <Play size={16} className="mr-2" />
                          预览课程
                        </Button>
                      </div>
                    ) : isCreator ? (
                      // 课程创建者查看已发布课程
                      <div className="space-y-3">
                        <Button
                          onClick={handleContinueLearning}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          <Play size={16} className="mr-2" />
                          查看课程
                        </Button>
                        <Button
                          onClick={handleEditCourse}
                          variant="outline"
                          className="w-full"
                        >
                          <Edit size={16} className="mr-2" />
                          编辑课程
                        </Button>
                      </div>
                    ) : isEnrolled ? (
                      // 非创建者但已加入课程
                      <Button
                        onClick={handleContinueLearning}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        <Play size={16} className="mr-2" />
                        继续学习
                      </Button>
                    ) : (
                      // 非创建者且未加入课程
                      <Button
                        onClick={handleEnroll}
                        disabled={loadingEnrollment || courseData.status !== 'published'}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        {loadingEnrollment ? (
                          <>
                            <Loader2 size={16} className="mr-2 animate-spin" />
                            加入中...
                          </>
                        ) : (
                          '加入课程'
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {courseData.created_at && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      创建于: {new Date(courseData.created_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default CourseDetailsPage; 