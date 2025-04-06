import React, { useState } from 'react';
import { Play, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lesson, CourseModule, LessonType, TextLessonContent } from '@/types/course';
import LessonNavigation from './LessonNavigation';
import { NavigateFunction } from 'react-router-dom';
import BlockNoteRenderer from '@/components/editor/BlockNoteRenderer';
import { courseService } from '@/services/courseService';

interface LessonContentProps {
  selectedLesson: Lesson | null;
  selectedUnit: CourseModule | null;
  courseData: any;
  enrollmentId: string | null;
  navigate: NavigateFunction;
}

const LessonContent: React.FC<LessonContentProps> = ({
  selectedLesson,
  selectedUnit,
  courseData,
  enrollmentId,
  navigate
}) => {
  const [userAnswers, setUserAnswers] = useState<{[key: string]: string}>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState<{score: number, totalQuestions: number} | null>(null);
  
  // 处理用户选择答案
  const handleAnswerSelect = (questionId: string, optionId: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };
  
  // 处理测验提交
  const handleQuizSubmit = () => {
    if (!selectedLesson || selectedLesson.type !== 'quiz') return;
    
    const quizContent = selectedLesson.content as any;
    if (!quizContent?.questions) return;
    
    let correctAnswers = 0;
    const totalQuestions = quizContent.questions.length;
    
    quizContent.questions.forEach((question: any) => {
      if (userAnswers[question.id] === question.correctOption) {
        correctAnswers++;
      }
    });
    
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    setQuizResult({score, totalQuestions});
    setQuizSubmitted(true);
    
    // 如果有注册ID，可以调用API标记课时完成
    if (enrollmentId && selectedLesson.id && courseData?.id) {
      try {
        // 调用API来记录测验结果和更新课程进度
        courseService.markLessonComplete(selectedLesson.id, courseData.id, enrollmentId)
          .then(() => {
            console.log('测验完成并标记为已完成');
          })
          .catch(error => {
            console.error('标记课时完成失败:', error);
          });
      } catch (error) {
        console.error('提交测验结果失败:', error);
      }
    }
  };

  const renderLessonContent = () => {
    if (!selectedLesson) return null;
    
    switch (selectedLesson.type) {
      case 'text':
        const textContent = selectedLesson.content as TextLessonContent;
        return (
          <div className="prose max-w-none">
            {textContent?.text ? (
              (() => {
                try {
                  const text = textContent.text;
                  
                  // 检查是否可能是BlockNote格式
                  if (text.trim().startsWith('[')) {
                    try {
                      // 尝试使用专用渲染组件
                      return <BlockNoteRenderer content={text} />;
                    } catch (error) {
                      console.error('BlockNote渲染失败:', error);
                    }
                  }
                  
                  // 如果不是BlockNote格式或渲染失败，尝试其他格式解析
                  try {
                    // 尝试解析文本内容
                    const parsed = JSON.parse(text);
                    // 检查是否是数组
                    if (Array.isArray(parsed)) {
                      return parsed.map((block: any) => {
                        if (block.type === 'paragraph' && block.content && Array.isArray(block.content)) {
                          return `<p>${block.content.map((item: any) => item.text || '').join('')}</p>`;
                        }
                        return '';
                      }).join('');
                    } else {
                      // 如果不是预期的格式，直接显示文本
                      return <p>{text}</p>;
                    }
                  } catch (error) {
                    // 解析失败时,直接显示原始文本
                    console.error('解析文本内容失败:', error);
                    return <p>{text}</p>;
                  }
                } catch (error) {
                  console.error('处理课程内容失败:', error);
                  return <p>内容无法显示</p>;
                }
              })()
            ) : (
              <p>此课时暂无内容</p>
            )}
          </div>
        );
      case 'video':
        return (
          <div className="aspect-video bg-gradient-to-br from-gray-900 to-blue-900 rounded-xl flex items-center justify-center mb-6 shadow-lg overflow-hidden">
            {selectedLesson.video_file_path ? (
              <video 
                controls 
                className="w-full h-full"
                src={selectedLesson.video_file_path}
              >
                您的浏览器不支持视频播放
              </video>
            ) : (
              <div className="text-center">
                <div className="p-4 rounded-full bg-white/20 backdrop-blur-md inline-block mb-4 cursor-pointer hover:bg-white/30 transition-all">
                  <Play size={48} className="text-white" />
                </div>
                <p className="text-white font-medium">暂无视频内容</p>
              </div>
            )}
          </div>
        );
      case 'quiz':
        const quizContent = selectedLesson.content as any;
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
              <h3 className="font-medium text-blue-800 mb-2 flex items-center">
                <Check size={18} className="mr-2" /> 测验说明
              </h3>
              <p className="text-blue-700 text-sm">完成下面的题目来测试你的理解。每道题选择一个正确答案。</p>
            </div>
            
            {quizSubmitted && quizResult && (
              <div className={`p-4 rounded-lg mb-4 ${quizResult.score >= 60 ? 'bg-green-50 border border-green-100' : 'bg-yellow-50 border border-yellow-100'}`}>
                <h3 className={`font-medium mb-2 ${quizResult.score >= 60 ? 'text-green-800' : 'text-yellow-800'}`}>
                  测验结果
                </h3>
                <p className={quizResult.score >= 60 ? 'text-green-700' : 'text-yellow-700'}>
                  你的得分: {quizResult.score}% ({Math.round(quizResult.score * quizResult.totalQuestions / 100)}/{quizResult.totalQuestions} 题正确)
                </p>
              </div>
            )}
            
            {quizContent?.questions && quizContent.questions.length > 0 ? (
              <div className="space-y-6">
                {quizContent.questions.map((question: any, qIndex: number) => (
                  <div key={question.id || `q-${qIndex}`} className="quiz-container">
                    <h4 className="font-medium text-lg mb-4">问题 {qIndex + 1}: {question.text || '未命名问题'}</h4>
                    {question.options && (
                      <div className="space-y-3">
                        {question.options.map((option: any, oIndex: number) => (
                          <label key={option.id || `opt-${oIndex}`} className="quiz-option flex items-start">
                            <input 
                              type="radio" 
                              name={`q-${question.id || qIndex}`} 
                              className="mr-3 h-4 w-4 accent-blue-500 mt-1" 
                              checked={userAnswers[question.id] === option.id}
                              onChange={() => handleAnswerSelect(question.id, option.id)}
                              disabled={quizSubmitted}
                            />
                            <span>{option.text}</span>
                            {quizSubmitted && option.id === question.correctOption && (
                              <span className="ml-2 text-green-600 text-sm">(正确答案)</span>
                            )}
                          </label>
                        ))}
                      </div>
                    )}
                    
                    {question.type === 'short_answer' && (
                      <div className="mt-4">
                        <textarea 
                          className="w-full p-3 border border-gray-300 rounded-md" 
                          rows={4}
                          placeholder="在此输入您的答案..."
                          value={userAnswers[question.id] || ''}
                          onChange={(e) => handleAnswerSelect(question.id, e.target.value)}
                          disabled={quizSubmitted}
                        ></textarea>
                      </div>
                    )}
                  </div>
                ))}
                
                <div className="flex justify-end">
                  {!quizSubmitted ? (
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={handleQuizSubmit}
                    >
                      提交答案
                    </Button>
                  ) : (
                    <Button 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => navigate('/learning')}
                    >
                      返回课程
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="quiz-container">
                  <h4 className="font-medium text-lg mb-4">问题 1: 新问题</h4>
                  <div className="space-y-3">
                    {['选项1', '选项2'].map((option, index) => (
                      <label key={index} className="quiz-option">
                        <input 
                          type="radio" 
                          name="q1" 
                          className="mr-3 h-4 w-4 accent-blue-500" 
                          disabled={quizSubmitted}
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={handleQuizSubmit}
                  >
                    提交答案
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      // Handle other types with a default case
      default:
        return (
          <div className="space-y-6">
            <div className="interactive-container">
              <div className="text-center">
                <h3 className="text-xl font-bold text-blue-700 mb-4">互动内容区域</h3>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  开始互动
                </Button>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">学习目标</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <div className="mr-2 mt-0.5 text-blue-500">
                        <Check size={16} />
                      </div>
                      <span>理解基本概念</span>
                    </li>
                    <li className="flex items-start">
                      <div className="mr-2 mt-0.5 text-blue-500">
                        <Check size={16} />
                      </div>
                      <span>应用所学知识解决简单问题</span>
                    </li>
                    <li className="flex items-start">
                      <div className="mr-2 mt-0.5 text-blue-500">
                        <Check size={16} />
                      </div>
                      <span>通过互动加深理解</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">说明</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">
                    跟随指示完成互动练习。你可以随时暂停并返回。
                    如果遇到困难，可以点击右下角的帮助按钮获取提示。
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      {selectedLesson && selectedUnit ? (
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <Card className="border-none shadow-md overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100 py-4">
              <div className="flex items-center text-xs sm:text-sm text-gray-600 mb-1">
                <span className="truncate">{selectedUnit.title} / {selectedLesson.title}</span>
              </div>
              <CardTitle className="text-xl sm:text-2xl">{selectedLesson.title}</CardTitle>
            </CardHeader>
            
            <CardContent className="p-4 sm:p-6">
              {renderLessonContent()}
              
              <LessonNavigation 
                courseData={courseData}
                selectedLesson={selectedLesson}
                enrollmentId={enrollmentId}
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-6 text-center">
          <Card>
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col items-center justify-center py-6">
                <div className="bg-blue-50 p-4 rounded-full mb-4">
                  <Check className="h-8 w-8 sm:h-12 sm:w-12 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">暂无课时内容</h3>
                <p className="text-gray-500 mb-4 text-sm sm:text-base">此课程暂未添加课时内容，请稍后再查看</p>
                <Button
                  onClick={() => navigate('/learning')}
                >
                  返回课程列表
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default LessonContent;
