
import React from 'react';
import { ArrowLeft, BookOpen, Clock, User, Calendar } from 'lucide-react';
import { Course, CourseModule } from '@/types/course';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface CoursePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  modules: CourseModule[];
}

const CoursePreview: React.FC<CoursePreviewProps> = ({
  isOpen,
  onClose,
  course,
  modules,
}) => {
  // 计算课程总课时数
  const totalLessons = modules.reduce((acc, module) => 
    acc + (module.lessons?.length || 0), 0
  );

  // 计算估计学习时间（示例：每个课时平均20分钟）
  const estimatedHours = Math.max(1, Math.round(totalLessons * 20 / 60));
  
  // 格式化日期
  const formatDate = (dateString?: string) => {
    if (!dateString) return '刚刚更新';
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden bg-white">
        <div className="flex flex-col h-[90vh]">
          {/* 课程封面区域 */}
          <div 
            className="relative h-60 bg-gradient-to-r from-blue-600 to-indigo-700 overflow-hidden"
            style={{
              backgroundImage: course.cover_image 
                ? `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url(${course.cover_image})` 
                : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="absolute inset-0 bg-black/25" />
            <div className="absolute top-4 left-4 z-10">
              <Button 
                variant="outline" 
                size="sm"
                className="bg-white/70 backdrop-blur-sm" 
                onClick={onClose}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回
              </Button>
            </div>
            
            <div className="absolute bottom-6 left-6 text-white z-10">
              <h1 className="text-3xl font-bold mb-2">
                {course.title || '课程标题'}
              </h1>
              <p className="text-white/90 max-w-2xl">
                {course.short_description || '课程简短描述将显示在这里'}
              </p>
            </div>
          </div>
          
          {/* 课程内容区域 */}
          <div className="flex-1 overflow-auto">
            <div className="px-6 py-4 border-b bg-gray-50">
              <Tabs defaultValue="overview">
                <TabsList>
                  <TabsTrigger value="overview">课程概览</TabsTrigger>
                  <TabsTrigger value="content">课程内容</TabsTrigger>
                  <TabsTrigger value="info">课程信息</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <div className="p-6">
              <TabsContent value="overview" className="mt-0">
                <div className="grid gap-6 lg:grid-cols-3">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-lg border">
                      <h2 className="text-xl font-bold mb-4">关于本课程</h2>
                      <p className="text-gray-700 whitespace-pre-line">
                        {course.description || '这里将显示课程的详细描述，介绍课程内容、学习目标和预期成果。'}
                      </p>
                    </div>
                    
                    <div className="bg-white p-6 rounded-lg border">
                      <h2 className="text-xl font-bold mb-4">课程内容</h2>
                      <div className="space-y-3">
                        {modules.map((module, index) => (
                          <div key={module.id} className="border rounded-lg overflow-hidden">
                            <div className="bg-gray-50 p-3 font-medium flex justify-between items-center">
                              <span>模块 {index + 1}：{module.title}</span>
                              <span className="text-sm text-gray-500">
                                {module.lessons?.length || 0} 课时
                              </span>
                            </div>
                            {module.lessons && module.lessons.length > 0 && (
                              <div className="divide-y">
                                {module.lessons.map((lesson, i) => (
                                  <div key={lesson.id} className="p-3 flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-600">
                                      {i + 1}
                                    </div>
                                    <div>
                                      <p className="font-medium">{lesson.title}</p>
                                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                        {lesson.type === 'video' && <span>视频课程</span>}
                                        {lesson.type === 'text' && <span>阅读材料</span>}
                                        {lesson.type === 'quiz' && <span>测验</span>}
                                        {lesson.type === 'assignment' && <span>作业</span>}
                                        <span>•</span>
                                        <span>约 20 分钟</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg border">
                      <h2 className="text-lg font-bold mb-4">课程信息</h2>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <BookOpen className="h-5 w-5 text-gray-500" />
                          <div>
                            <p className="text-gray-700">{totalLessons} 课时</p>
                            <p className="text-sm text-gray-500">课程包含的总课时数</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Clock className="h-5 w-5 text-gray-500" />
                          <div>
                            <p className="text-gray-700">约 {estimatedHours} 小时</p>
                            <p className="text-sm text-gray-500">估计完成时间</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-gray-500" />
                          <div>
                            <p className="text-gray-700">{formatDate(course.updated_at)}</p>
                            <p className="text-sm text-gray-500">最近更新时间</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <User className="h-5 w-5 text-gray-500" />
                          <div>
                            <p className="text-gray-700">课程作者</p>
                            <p className="text-sm text-gray-500">专业讲师</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-lg border">
                      <h2 className="text-lg font-bold mb-4">课程标签</h2>
                      <div className="flex flex-wrap gap-2">
                        {course.category && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                            {course.category}
                          </Badge>
                        )}
                        {course.tags && course.tags.map((tag, i) => (
                          <Badge key={i} variant="outline" className="bg-gray-50">
                            {tag}
                          </Badge>
                        ))}
                        {(!course.tags || course.tags.length === 0) && !course.category && (
                          <span className="text-sm text-gray-500">暂无标签</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="content" className="mt-0">
                <div className="bg-white p-6 rounded-lg border">
                  <h2 className="text-xl font-bold mb-4">课程大纲</h2>
                  <div className="space-y-6">
                    {modules.length > 0 ? (
                      modules.map((module, index) => (
                        <div key={module.id}>
                          <h3 className="text-lg font-semibold flex items-center">
                            <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mr-2 text-sm">
                              {index + 1}
                            </span>
                            {module.title}
                          </h3>
                          
                          {module.lessons && module.lessons.length > 0 ? (
                            <div className="mt-3 ml-9 space-y-3">
                              {module.lessons.map((lesson, i) => (
                                <div key={lesson.id} className="flex items-start gap-3 p-3 rounded-md hover:bg-gray-50">
                                  <div className="mt-0.5">
                                    {lesson.type === 'video' && (
                                      <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center">
                                        <BookOpen className="h-4 w-4" />
                                      </div>
                                    )}
                                    {lesson.type === 'text' && (
                                      <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                                        <BookOpen className="h-4 w-4" />
                                      </div>
                                    )}
                                    {lesson.type === 'quiz' && (
                                      <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">
                                        <BookOpen className="h-4 w-4" />
                                      </div>
                                    )}
                                    {lesson.type === 'assignment' && (
                                      <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center">
                                        <BookOpen className="h-4 w-4" />
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-medium">{lesson.title}</p>
                                    <div className="flex items-center text-xs text-gray-500 mt-1">
                                      <span>
                                        {lesson.type === 'video' && '视频'}
                                        {lesson.type === 'text' && '阅读材料'}
                                        {lesson.type === 'quiz' && '测验'}
                                        {lesson.type === 'assignment' && '作业'}
                                      </span>
                                      <span className="mx-2">•</span>
                                      <span>约 20 分钟</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 ml-9 mt-2">
                              该模块暂无课时内容
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10">
                        <p className="text-gray-500">暂无课程内容</p>
                        <p className="text-sm text-gray-400 mt-1">请添加课程模块和课时</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="info" className="mt-0">
                <div className="bg-white p-6 rounded-lg border">
                  <h2 className="text-xl font-bold mb-4">课程详情</h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">课程描述</h3>
                      <p className="text-gray-700 whitespace-pre-line">
                        {course.description || '暂无课程描述'}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-2">学习目标</h3>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        <li>完成本课程后，您将掌握相关领域的核心概念</li>
                        <li>能够应用所学知识解决实际问题</li>
                        <li>获得实践经验和技能</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-2">适合人群</h3>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        <li>对该领域感兴趣的初学者</li>
                        <li>希望提升相关技能的学习者</li>
                        <li>寻求专业知识拓展的从业人员</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CoursePreview;
