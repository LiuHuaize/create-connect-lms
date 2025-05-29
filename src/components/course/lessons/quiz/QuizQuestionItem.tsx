import React from 'react';
import { QuizQuestion } from '@/types/course';
import { CheckCircle, X, HelpCircle } from 'lucide-react';
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
    <div className="bg-white rounded-xl shadow-sm p-6 hover-card transition-all duration-300 border border-macaron-lightGray">
      <h4 className="font-medium text-lg mb-4 flex items-start text-macaron-darkGray">
        <span className="flex-shrink-0 mr-2 w-7 h-7 rounded-full bg-macaron-lavender/30 text-macaron-deepLavender flex items-center justify-center text-sm font-bold">
          {questionIndex + 1}
        </span>
        <span className="flex-1">
          {question.text && containsMarkdown(question.text) ? (
            <MarkdownRenderer>{question.text}</MarkdownRenderer>
          ) : (
            <span>{question.text || '未命名问题'}</span>
          )}
        </span>
      </h4>
      
      {/* 显示提示 */}
      {showHint && question.hint && !showCorrectAnswer && (
        <div className="mb-4 p-3 bg-macaron-yellow/20 border border-macaron-yellow/50 rounded-lg flex items-start animate-fade-in">
          <div className="text-amber-500 h-5 w-5 mr-2 flex-shrink-0 mt-0.5">
            <HelpCircle size={20} />
          </div>
          <div>
            <p className="text-macaron-darkGray font-medium mb-1">提示：</p>
            {containsMarkdown(question.hint) ? (
              <MarkdownRenderer>{question.hint}</MarkdownRenderer>
            ) : (
              <p className="text-macaron-gray">{question.hint}</p>
            )}
          </div>
        </div>
      )}
      
      {/* 当显示正确答案时的提示（针对答错情况） */}
      {showCorrectAnswer && userAnswer !== question.correctOption && (
        <div className="mb-4 p-3 bg-macaron-mint/20 border border-macaron-mint/50 rounded-lg flex items-start animate-fade-in">
          <CheckCircle className="text-macaron-deepMint h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-macaron-deepMint font-medium">已显示正确答案</p>
          </div>
        </div>
      )}
      
      {/* 选项列表 - 只在非简答题类型时显示 */}
      {question.type !== 'short_answer' && question.options && (
        <div className="space-y-3 mt-4">
          {question.options.map((option, oIndex) => {
            // 高亮显示选择但错误的答案
            const isSelected = selectedAnswer === option.id;
            const isCorrect = option.id === question.correctOption;
            const shouldHighlightCorrect = (quizSubmitted || showCorrectAnswer) && isCorrect;
            const shouldHighlightWrong = isSelected && !isCorrect && showCorrectAnswer;
            
            return (
              <label 
                key={option.id || `opt-${oIndex}`} 
                className={`flex items-start p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                  shouldHighlightCorrect 
                    ? 'bg-macaron-mint/20 border-macaron-mint shadow-sm' 
                    : shouldHighlightWrong 
                      ? 'bg-macaron-pink/20 border-macaron-pink shadow-sm' 
                      : isSelected
                        ? 'bg-macaron-lavender/20 border-macaron-lavender shadow-sm'
                        : 'border-macaron-lightGray hover:bg-macaron-cream/30'
                }`}
              >
                <input 
                  type="radio" 
                  name={`q-${question.id}`} 
                  className="mr-3 h-5 w-5 accent-macaron-deepLavender mt-0.5" 
                  checked={selectedAnswer === option.id}
                  onChange={() => onAnswerSelect(question.id, option.id)}
                  disabled={quizSubmitted || showCorrectAnswer}
                />
                <div className={`flex-1 ${
                  shouldHighlightCorrect 
                    ? 'text-macaron-deepMint font-medium' 
                    : shouldHighlightWrong 
                      ? 'text-macaron-deepPink' 
                      : 'text-macaron-darkGray'
                }`}>
                  {option.text && containsMarkdown(option.text) ? (
                    <MarkdownRenderer>{option.text}</MarkdownRenderer>
                  ) : (
                    <span>{option.text}</span>
                  )}
                </div>
                {shouldHighlightCorrect && (
                  <span className="ml-2 text-macaron-deepMint text-sm flex items-center font-bold">
                    <CheckCircle className="h-5 w-5 mr-1" /> 正确答案
                  </span>
                )}
                {shouldHighlightWrong && (
                  <span className="ml-2 text-macaron-deepPink text-sm flex items-center font-bold">
                    <X className="h-5 w-5 mr-1" /> 不正确
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
            className="w-full p-3 border border-macaron-lightGray rounded-lg focus:ring-2 focus:ring-macaron-lavender focus:outline-none" 
            rows={4}
            placeholder="在此输入您的答案..."
            value={userAnswer || ''}
            onChange={(e) => onAnswerSelect(question.id, e.target.value)}
            disabled={quizSubmitted || showCorrectAnswer}
          ></textarea>
          
          {/* 显示正确答案示例（当需要显示正确答案时） */}
          {showCorrectAnswer && question.sampleAnswer && (
            <div className="mt-3 p-3 bg-macaron-mint/20 border border-macaron-mint/50 rounded-lg">
              <p className="text-macaron-deepMint font-medium mb-1">参考答案:</p>
              {containsMarkdown(question.sampleAnswer) ? (
                <MarkdownRenderer>{question.sampleAnswer}</MarkdownRenderer>
              ) : (
                <p className="text-macaron-darkGray">{question.sampleAnswer}</p>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* 检查单个答案的按钮 */}
      {!quizSubmitted && (
        <div className="flex justify-end mt-4">
          <Button 
            variant="outline"
            className="text-macaron-darkGray border-macaron-lavender/30 hover:bg-macaron-lavender/20 transition-all duration-300"
            onClick={() => {
              // 修改：所有类型的题目只要有回答就认为正确
              const hasAnswer = question.type === 'short_answer' 
                ? (userAnswer && userAnswer.trim() !== '')
                : (selectedAnswer && selectedAnswer.trim() !== '');
              onCheckAnswer(question.id, hasAnswer ? 'correct' : '');
            }}
            disabled={question.type === 'short_answer' 
              ? (!userAnswer || userAnswer.trim() === '')
              : (!selectedAnswer || selectedAnswer.trim() === '')}
          >
            检查答案
          </Button>
        </div>
      )}
    </div>
  );
};

export default QuizQuestionItem; 