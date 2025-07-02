import React, { useState } from 'react';
import { BookOpen, Video, FileText, HelpCircle, ArrowLeft } from 'lucide-react';
import { CourseModule, Lesson, TextLessonContent, QuizLessonContent, CodeLessonContent, VideoLessonContent } from '@/types/course';
import { ScrollArea } from '@/components/ui/scroll-area';
import BlockNoteRenderer from '@/components/editor/BlockNoteRenderer';

interface ContentTabProps {
  modules: CourseModule[];
}

const ContentTab: React.FC<ContentTabProps> = ({ modules }) => {
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const getLessonIcon = (lessonType: string) => {
    switch (lessonType) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'text':
        return <FileText className="h-4 w-4" />;
      case 'quiz':
        return <HelpCircle className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const renderLessonContent = (lesson: Lesson) => {
    return (
      <div className="p-6">
        <div className="flex items-center mb-4">
          <button 
            onClick={() => setSelectedLesson(null)}
            className="mr-3 flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回课程大纲
          </button>
          <h3 className="text-lg font-semibold">{lesson.title}</h3>
        </div>

        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          {lesson.type === 'text' && lesson.content && (
            <div className="prose max-w-none">
              {((lesson.content as TextLessonContent).text) ? (
                (() => {
                  try {
                    const textContent = (lesson.content as TextLessonContent).text;
                    
                    // 检查是否可能是BlockNote格式
                    if (textContent.trim().startsWith('[')) {
                      try {
                        // 尝试使用专用渲染组件
                        return <BlockNoteRenderer content={textContent} />;
                      } catch (error) {
                        console.error('BlockNote渲染失败:', error);
                      }
                    }
                    
                    // 如果不是BlockNote格式或渲染失败，以纯文本显示
                    return <p>{textContent}</p>;
                  } catch (error) {
                    console.error('处理课程内容失败:', error);
                    return <p>内容无法显示</p>;
                  }
                })()
              ) : (
                <p>此课时暂无内容</p>
              )}
            </div>
          )}
          
          {lesson.type === 'video' && (
            <div className="space-y-4 mx-auto max-w-4xl">
              {/* 视频描述部分 - 移到上方 */}
              {(lesson.content as VideoLessonContent).description && (
                <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-1 h-5 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full mt-1"></div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                        <Video size={16} className="text-blue-600" />
                        视频介绍
                      </h4>
                      <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                        {(lesson.content as VideoLessonContent).description}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="aspect-video bg-gray-200 flex items-center justify-center rounded-lg shadow-md overflow-hidden">
                {(lesson.content as VideoLessonContent).bilibiliUrl ? (
                  <iframe
                    src={(function() {
                      const url = (lesson.content as VideoLessonContent).bilibiliUrl || '';
                      // 确保添加as_wide=1参数
                      if (url.includes('as_wide=1')) {
                        return url;
                      } else if (url.includes('?')) {
                        return `${url}&as_wide=1&high_quality=1`;
                      } else {
                        return `${url}?as_wide=1&high_quality=1`;
                      }
                    })()}
                    allowFullScreen={true}
                    className="w-full h-full rounded-lg"
                    style={{
                      width: '100%',
                      height: '100%',
                      aspectRatio: '16/9',
                      border: 'none',
                      display: 'block',
                      margin: '0 auto'
                    }}
                    scrolling="no"
                    frameBorder="0"
                    sandbox="allow-top-navigation allow-same-origin allow-forms allow-scripts"
                  />
                ) : lesson.video_file_path ? (
                  <video
                    controls
                    className="w-full h-full rounded-lg object-contain"
                    src={lesson.video_file_path}
                    style={{
                      margin: '0 auto',
                      maxHeight: '100%',
                      maxWidth: '100%'
                    }}
                  >
                    您的浏览器不支持视频播放
                  </video>
                ) : (
                  <div className="text-center py-12">
                    <Video className="h-16 w-16 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">视频内容未上传</p>
                    <p className="text-gray-400 text-sm mt-1">请上传视频文件或添加B站链接</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {lesson.type === 'quiz' && lesson.content && (
            <div className="space-y-6">
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <h3 className="text-lg font-semibold mb-2">测验内容预览</h3>
                <p className="text-sm text-purple-700">共 {(lesson.content as QuizLessonContent).questions ? (lesson.content as QuizLessonContent).questions.length : 0} 道题目</p>
              </div>
              
              {(lesson.content as QuizLessonContent).questions && (lesson.content as QuizLessonContent).questions.length > 0 ? (
                <div className="space-y-6">
                  {(lesson.content as QuizLessonContent).questions.map((question: any, index: number) => (
                    <div key={question.id || index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start mb-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mr-2 text-sm">
                          {index + 1}
                        </span>
                        <h4 className="font-medium">{question.text || '未命名问题'}</h4>
                      </div>
                      
                      {question.type !== 'short_answer' && question.options && question.options.length > 0 && (
                        <div className="ml-8 space-y-2">
                          {question.options.map((option: any) => (
                            <div key={option.id} className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full border border-gray-300"></div>
                              <span>{option.text}</span>
                              {option.id === question.correctOption && (
                                <span className="text-xs text-green-600 ml-2">(正确答案)</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {question.type === 'short_answer' && (
                        <div className="ml-8 mt-2">
                          <div className="bg-gray-100 p-3 rounded border border-gray-200">
                            <p className="text-sm text-gray-500 italic">简答题 - 学生将在此输入回答</p>
                          </div>
                          {question.sampleAnswer && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500">示例答案:</p>
                              <p className="text-sm mt-1">{question.sampleAnswer}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8">
                  <HelpCircle className="h-12 w-12 text-purple-300 mx-auto mb-2" />
                  <p className="text-gray-500">此测验暂无问题</p>
                </div>
              )}
            </div>
          )}
          
          {lesson.type === 'code' && lesson.content && (
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4 font-mono text-sm overflow-x-auto whitespace-pre text-gray-900">
                {typeof lesson.content === 'object' && lesson.content !== null && 'code' in lesson.content
                  ? (lesson.content as CodeLessonContent).code
                  : '// 无代码内容'}
              </div>
            </div>
          )}
          
          {lesson.type !== 'text' && lesson.type !== 'video' && lesson.type !== 'quiz' && lesson.type !== 'code' && (
            <div className="text-center p-6">
              <BookOpen className="h-12 w-12 text-blue-400 mx-auto mb-2" />
              <p className="text-gray-700">内容预览</p>
              <p className="text-gray-500 text-sm mt-1">此类型内容的预览将在后续版本提供</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (selectedLesson) {
    return renderLessonContent(selectedLesson);
  }

  return (
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
                    <div 
                      key={lesson.id} 
                      className="flex items-start gap-3 p-3 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedLesson(lesson)}
                    >
                      <div className="mt-0.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center
                          ${lesson.type === 'video' ? 'bg-red-100 text-red-700' : ''}
                          ${lesson.type === 'text' ? 'bg-green-100 text-green-700' : ''}
                          ${lesson.type === 'quiz' ? 'bg-purple-100 text-purple-700' : ''}
                          ${lesson.type === 'assignment' ? 'bg-yellow-100 text-yellow-700' : ''}
                          ${!['video', 'text', 'quiz', 'assignment'].includes(lesson.type) ? 'bg-blue-100 text-blue-700' : ''}
                        `}>
                          {getLessonIcon(lesson.type)}
                        </div>
                      </div>
                      <div>
                        <p className="font-medium">{lesson.title}</p>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <span>
                            {lesson.type === 'video' && '视频'}
                            {lesson.type === 'text' && '阅读材料'}
                            {lesson.type === 'quiz' && '测验'}
                            {lesson.type === 'assignment' && '作业'}
                            {!['video', 'text', 'quiz', 'assignment'].includes(lesson.type) && '内容'}
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
  );
};

export default ContentTab;
