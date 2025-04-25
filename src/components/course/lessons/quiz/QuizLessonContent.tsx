import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Loader2, X } from 'lucide-react';
import { NavigateFunction } from 'react-router-dom';
import QuizQuestionItem from './QuizQuestionItem';
import { courseService } from '@/services/courseService';

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
  selectedAnswer
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-ghibli-lightTeal/20 border border-ghibli-teal/30 rounded-xl p-5">
        <h3 className="font-medium text-ghibli-deepTeal mb-2 flex items-center">
          <Check size={18} className="mr-2" /> 测验说明
        </h3>
        <p className="text-ghibli-brown text-sm">完成下面的题目来测试你的理解。每道题选择一个正确答案。</p>
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
                className="bg-ghibli-teal hover:bg-ghibli-deepTeal text-white"
                onClick={onQuizSubmit}
                disabled={isLoading}
              >
                {isLoading ? '提交中...' : '提交答案'}
              </Button>
            ) : (
              <Button 
                className="bg-ghibli-teal hover:bg-ghibli-deepTeal text-white"
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
              className="bg-ghibli-teal hover:bg-ghibli-deepTeal text-white"
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