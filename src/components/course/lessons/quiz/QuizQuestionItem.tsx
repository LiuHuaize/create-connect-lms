import React from 'react';
import { QuizQuestion } from '@/types/course';
import { CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';
import { containsMarkdown } from '@/utils/markdownUtils';

interface QuizQuestionItemProps {
  question: QuizQuestion;
  questionIndex: number;
  userAnswer: string;
  selectedAnswer: string;
  quizSubmitted: boolean;
  showHint: boolean;
  showCorrectAnswer: boolean;
  onAnswerSelect: (questionId: string, optionId: string) => void;
  onCheckAnswer: (questionId: string, correctOptionId: string) => void;
}

const QuizQuestionItem: React.FC<QuizQuestionItemProps> = ({
  question,
  questionIndex,
  userAnswer,
  selectedAnswer,
  quizSubmitted,
  showHint,
  showCorrectAnswer,
  onAnswerSelect,
  onCheckAnswer
}) => {
  const isCorrect = question.correctOption === userAnswer;
  
  return (
    <div className="quiz-container">
      <h4 className="font-medium text-lg mb-4">问题 {questionIndex + 1}: 
        {question.text && containsMarkdown(question.text) ? (
          <MarkdownRenderer>{question.text}</MarkdownRenderer>
        ) : (
          <span>{question.text || '未命名问题'}</span>
        )}
      </h4>
      
      {/* 显示提示 */}
      {showHint && question.hint && !showCorrectAnswer && (
        <div className="mb-4 p-3 bg-ghibli-sunshine/20 border border-ghibli-sunshine/50 rounded-lg flex items-start">
          <div className="text-ghibli-orange h-5 w-5 mr-2 flex-shrink-0 mt-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </div>
          <div>
            <p className="text-ghibli-brown font-medium mb-1">提示：</p>
            {containsMarkdown(question.hint) ? (
              <MarkdownRenderer>{question.hint}</MarkdownRenderer>
            ) : (
              <p className="text-ghibli-brown">{question.hint}</p>
            )}
          </div>
        </div>
      )}
      
      {/* 当显示正确答案时的提示（针对答错情况） */}
      {showCorrectAnswer && userAnswer !== question.correctOption && (
        <div className="mb-4 p-3 bg-ghibli-mint/20 border border-ghibli-teal/30 rounded-lg flex items-start">
          <CheckCircle className="text-ghibli-teal h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-ghibli-deepTeal font-medium">已显示正确答案</p>
          </div>
        </div>
      )}
      
      {/* 选项列表 */}
      {question.options && (
        <div className="space-y-3">
          {question.options.map((option, oIndex) => {
            // 高亮显示选择但错误的答案
            const isSelected = selectedAnswer === option.id;
            const isCorrect = option.id === question.correctOption;
            const shouldHighlightCorrect = (quizSubmitted || showCorrectAnswer) && isCorrect;
            const shouldHighlightWrong = isSelected && !isCorrect && !showCorrectAnswer;
            
            return (
              <label 
                key={option.id || `opt-${oIndex}`} 
                className={`quiz-option flex items-start p-3 rounded-lg border ${
                  shouldHighlightCorrect 
                    ? 'bg-ghibli-mint/20 border-ghibli-teal/50' 
                    : shouldHighlightWrong 
                      ? 'bg-ghibli-peach/20 border-ghibli-coral/50' 
                      : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input 
                  type="radio" 
                  name={`q-${question.id}`} 
                  className="mr-3 h-4 w-4 accent-blue-500 mt-1" 
                  checked={userAnswer === option.id}
                  onChange={() => onAnswerSelect(question.id, option.id)}
                  disabled={quizSubmitted || showCorrectAnswer}
                />
                <div className={`flex-1 ${shouldHighlightCorrect ? 'text-ghibli-deepTeal font-medium' : shouldHighlightWrong ? 'text-ghibli-brown' : ''}`}>
                  {option.text && containsMarkdown(option.text) ? (
                    <MarkdownRenderer>{option.text}</MarkdownRenderer>
                  ) : (
                    <span>{option.text}</span>
                  )}
                </div>
                {shouldHighlightCorrect && (
                  <span className="ml-2 text-ghibli-grassGreen/70 text-sm flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" /> 正确答案
                  </span>
                )}
                {shouldHighlightWrong && (
                  <span className="ml-2 text-ghibli-coral/70 text-sm flex items-center">
                    <X className="h-4 w-4 mr-1" /> 不正确
                  </span>
                )}
              </label>
            );
          })}
        </div>
      )}
      
      {/* 简答题输入框 */}
      {question.type === 'short_answer' && (
        <div className="mt-4">
          <textarea 
            className="w-full p-3 border border-gray-300 rounded-md" 
            rows={4}
            placeholder="在此输入您的答案..."
            value={userAnswer || ''}
            onChange={(e) => onAnswerSelect(question.id, e.target.value)}
            disabled={quizSubmitted || showCorrectAnswer}
          ></textarea>
        </div>
      )}
      
      {/* 检查单个答案的按钮 */}
      {!quizSubmitted && (
        <div className="flex justify-end mt-3">
          <Button 
            variant="outline"
            className="text-ghibli-brown border-ghibli-sand hover:bg-ghibli-cream/50"
            onClick={() => onCheckAnswer(question.id, question.correctOption || '')}
            disabled={!selectedAnswer}
          >
            检查答案
          </Button>
        </div>
      )}
    </div>
  );
};

export default QuizQuestionItem; 