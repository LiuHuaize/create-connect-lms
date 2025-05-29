import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Loader2, X, Trophy, Sparkles } from 'lucide-react';
import { NavigateFunction } from 'react-router-dom';
import QuizQuestionItem from './QuizQuestionItem';
import { courseService } from '@/services/courseService';
import confetti from 'canvas-confetti';

interface QuizLessonContentProps {
  lessonId: string;
  courseId: string;
  enrollmentId: string | null;
  content: any; // 这里使用any是因为原代码中直接使用了as any
  quizSubmitted: boolean;
  quizResult: { score: number; totalQuestions: number } | null;
  userAnswers: { [key: string]: string };
  navigate: NavigateFunction;
  onQuizSubmit: () => Promise<void>;
  onAnswerSelect: (questionId: string, optionId: string) => void;
  onCheckSingleAnswer: (questionId: string, correctOptionId: string) => void;
  onUnmarkComplete: () => Promise<void>;
  isLoading: boolean;
  isCompletionLoading: boolean;
  attemptCounts: { [key: string]: number };
  showHints: { [key: string]: boolean };
  showCorrectAnswers: { [key: string]: boolean };
  selectedAnswer: { [key: string]: string };
  refreshCourseData?: () => void;
}

const QuizLessonContent: React.FC<QuizLessonContentProps> = ({
  lessonId,
  courseId,
  enrollmentId,
  content,
  quizSubmitted,
  quizResult,
  userAnswers,
  navigate,
  onQuizSubmit,
  onAnswerSelect,
  onCheckSingleAnswer,
  onUnmarkComplete,
  isLoading,
  isCompletionLoading,
  attemptCounts,
  showHints,
  showCorrectAnswers,
  selectedAnswer,
  refreshCourseData
}) => {
  // 添加提交测验后的庆祝效果
  const triggerConfetti = () => {
    if (quizSubmitted && quizResult && (quizResult.score / quizResult.totalQuestions) >= 0.7) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  // 当测验已提交且有结果时触发
  React.useEffect(() => {
    if (quizSubmitted && quizResult) {
      triggerConfetti();
    }
  }, [quizSubmitted, quizResult]);

  // 检查是否所有问题都已回答
  const allQuestionsAnswered = () => {
    if (!content?.questions || content.questions.length === 0) return false;
    
    return content.questions.every((question: any) => 
      selectedAnswer[question.id] && selectedAnswer[question.id].trim() !== ''
    );
  };

  return (
    <div className="space-y-6">
      {quizSubmitted && quizResult && (
        <div className={`p-6 rounded-xl shadow-md mb-6 animate-fade-in ${
          (quizResult.score / quizResult.totalQuestions) >= 0.7 
            ? 'bg-macaron-mint/30' 
            : 'bg-macaron-pink/20'
        }`}>
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xl text-macaron-darkGray">
              测验结果
            </h3>
            {(quizResult.score / quizResult.totalQuestions) >= 0.7 && (
              <Trophy className="h-8 w-8 text-macaron-deepMint animate-pulse-slow" />
            )}
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-macaron-darkGray">得分</span>
              <span className="font-bold text-lg">
                {Math.round((quizResult.score / 100) * quizResult.totalQuestions)}/{quizResult.totalQuestions}
              </span>
            </div>
            <div className="h-3 w-full bg-macaron-lightGray rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{ 
                  width: `${(quizResult.score / quizResult.totalQuestions) * 100}%`,
                  backgroundColor: (quizResult.score / quizResult.totalQuestions) >= 0.7 ? '#2A7D65' : '#9C365D'
                }}
              ></div>
            </div>
          </div>
          {(quizResult.score / quizResult.totalQuestions) >= 0.7 && (
            <div className="mt-4 text-center">
              <p className="font-medium text-macaron-deepMint flex items-center justify-center">
                <Sparkles className="h-5 w-5 mr-2" /> 恭喜你通过了测验！
              </p>
            </div>
          )}
        </div>
      )}

      <div className="bg-macaron-lavender/30 border border-macaron-lavender rounded-xl p-5 hover-card">
        <h3 className="font-medium text-macaron-deepLavender mb-2 flex items-center">
          <Check size={18} className="mr-2" /> 测验说明
        </h3>
        <p className="text-macaron-darkGray text-sm">
          完成下面的题目来测试你的理解。
          {content?.questions?.some((q: any) => q.type === 'multiple_choice' || q.type === 'true_false') && 
            '对于选择题，请选择一个正确答案。'}
          {content?.questions?.some((q: any) => q.type === 'short_answer') && 
            '对于简答题，请在文本框中输入您的答案。'}
        </p>
      </div>
      
      {content?.questions && content.questions.length > 0 ? (
        <div className="space-y-6">
          {content.questions.map((question: any, qIndex: number) => (
            <QuizQuestionItem
              key={question.id || `q-${qIndex}`}
              question={question}
              questionIndex={qIndex}
              userAnswer={userAnswers[question.id] || ''}
              selectedAnswer={selectedAnswer[question.id] || ''}
              quizSubmitted={quizSubmitted}
              showHint={showHints[question.id] || false}
              showCorrectAnswer={showCorrectAnswers[question.id] || false}
              onAnswerSelect={onAnswerSelect}
              onCheckAnswer={onCheckSingleAnswer}
            />
          ))}
          
          <div className="flex justify-end">
            {!quizSubmitted ? (
              <Button 
                className="bg-macaron-deepLavender hover:bg-macaron-deepLavender/80 text-white transition-all duration-300 px-6 py-2 text-sm rounded-xl shadow-md hover:shadow-lg btn-hover-effect"
                onClick={onQuizSubmit}
                disabled={isLoading || !allQuestionsAnswered()}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    提交中...
                  </div>
                ) : '提交答案'}
              </Button>
            ) : (
              <div className="text-center text-macaron-darkGray">
                <p>测验已完成</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl shadow-sm p-6 bg-white hover-card">
            <h4 className="font-medium text-lg mb-4 text-macaron-darkGray">问题 1: 新问题</h4>
            <div className="space-y-3">
              {['选项1', '选项2'].map((option, index) => (
                <label key={index} className="flex items-center p-3 rounded-lg border border-macaron-lightGray hover:bg-macaron-cream/30 transition-all duration-200">
                  <input 
                    type="radio" 
                    name="q1" 
                    className="mr-3 h-4 w-4 accent-macaron-deepLavender" 
                    disabled={quizSubmitted}
                  />
                  <span className="text-macaron-darkGray">{option}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button 
              className="bg-macaron-deepLavender hover:bg-macaron-deepLavender/80 text-white transition-all duration-300 px-6 py-2 text-sm rounded-xl shadow-md hover:shadow-lg btn-hover-effect"
              onClick={onQuizSubmit}
            >
              提交答案
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizLessonContent; 