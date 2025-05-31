import React from 'react';
import { QuizQuestion } from '@/types/course';
import { CheckCircle, X, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';
import { containsMarkdown } from '@/utils/markdownUtils';
import { validateAnswer } from '@/utils/quizValidation';

interface QuizQuestionItemProps {
  question: QuizQuestion;
  questionIndex: number;
  userAnswer: string | string[];  // 修改：支持单选和多选答案
  selectedAnswer: string | string[];  // 修改：支持单选和多选答案
  quizSubmitted: boolean;
  showHint: boolean;
  showCorrectAnswer: boolean;
  onAnswerSelect: (questionId: string, optionId: string | string[]) => void;  // 修改：支持数组答案
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
  // 修改：为多选题添加答案验证逻辑 - 使用新的验证函数
  const getValidationResult = () => {
    return validateAnswer(question, userAnswer);
  };

  const validationResult = getValidationResult();
  const isCorrect = validationResult.isCorrect;

  // 修改：处理多选题的选择逻辑
  const handleOptionSelect = (optionId: string) => {
    if (question.type === 'multiple_choice') {
      const currentSelections = Array.isArray(selectedAnswer) ? selectedAnswer : [];
      const isCurrentlySelected = currentSelections.includes(optionId);
      
      const newSelections = isCurrentlySelected
        ? currentSelections.filter(id => id !== optionId)
        : [...currentSelections, optionId];
      
      onAnswerSelect(question.id, newSelections);
    } else {
      // 单选题逻辑保持不变
      onAnswerSelect(question.id, optionId);
    }
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 hover-card transition-all duration-300 border border-macaron-lightGray">
      <h4 className="font-medium text-lg mb-4 flex items-start text-macaron-darkGray">
        <span className="flex-shrink-0 mr-2 w-7 h-7 rounded-full bg-macaron-lavender/30 text-macaron-deepLavender flex items-center justify-center text-sm font-bold">
          {questionIndex + 1}
        </span>
        <span className="flex-1">
          {/* 修改：添加问题类型标签 */}
          <div className="mb-2">
            <span className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${
              question.type === 'multiple_choice' 
                ? 'bg-orange-100 text-orange-700' 
                : question.type === 'single_choice'
                  ? 'bg-blue-100 text-blue-700'
                  : question.type === 'true_false'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-purple-100 text-purple-700'
            }`}>
              {question.type === 'multiple_choice' ? '多选题' 
                : question.type === 'single_choice' ? '单选题'
                : question.type === 'true_false' ? '判断题'
                : '简答题'}
            </span>
          </div>
          {question.text && containsMarkdown(question.text) ? (
            <MarkdownRenderer>{question.text}</MarkdownRenderer>
          ) : (
            <span>{question.text || '未命名问题'}</span>
          )}
        </span>
      </h4>

      {/* 修改：添加多选题选择提示和评分模式信息 */}
      {question.type === 'multiple_choice' && !quizSubmitted && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-orange-700 text-sm">
            这是多选题，请选择所有正确答案
            {question.correctOptions && question.correctOptions.length > 0 && 
              ` （共有 ${question.correctOptions.length} 个正确答案）`}
            {Array.isArray(selectedAnswer) && selectedAnswer.length > 0 && 
              ` · 已选择 ${selectedAnswer.length} 个答案`}
          </p>
          {question.scoringMode === 'partial' && (
            <p className="text-orange-600 text-xs mt-1">
              📊 部分给分模式：选择部分正确答案也会得到相应分数
            </p>
          )}
        </div>
      )}
      
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
      
      {/* 修改：当显示正确答案时的提示 - 增加部分给分信息 */}
      {showCorrectAnswer && (
        <div className="mb-4 p-3 bg-macaron-mint/20 border border-macaron-mint/50 rounded-lg flex items-start animate-fade-in">
          <CheckCircle className="text-macaron-deepMint h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-macaron-deepMint font-medium">
              {isCorrect ? '完全正确！' : '已显示正确答案'}
            </p>
            {!isCorrect && question.type === 'multiple_choice' && validationResult.partialScore && (
              <p className="text-macaron-gray text-sm mt-1">
                部分得分：{Math.round(validationResult.partialScore * 100)}%
              </p>
            )}
          </div>
        </div>
      )}
      
      {/* 选项列表 - 只在非简答题类型时显示 */}
      {question.type !== 'short_answer' && question.options && (
        <div className="space-y-3 mt-4">
          {question.options.map((option, oIndex) => {
            // 修改：更新选择状态判断逻辑
            let isSelected = false;
            if (question.type === 'multiple_choice') {
              isSelected = Array.isArray(selectedAnswer) && selectedAnswer.includes(option.id);
            } else {
              isSelected = selectedAnswer === option.id;
            }

            // 修改：更新正确答案判断逻辑
            let isCorrectOption = false;
            if (question.type === 'multiple_choice') {
              isCorrectOption = question.correctOptions?.includes(option.id) || false;
            } else {
              isCorrectOption = option.id === question.correctOption;
            }

            const shouldHighlightCorrect = (quizSubmitted || showCorrectAnswer) && isCorrectOption;
            const shouldHighlightWrong = isSelected && !isCorrectOption && showCorrectAnswer;
            
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
                {/* 修改：根据问题类型使用不同的输入控件 */}
                {question.type === 'multiple_choice' ? (
                  <input 
                    type="checkbox" 
                    className="mr-3 h-5 w-5 accent-macaron-deepLavender mt-0.5" 
                    checked={isSelected}
                    onChange={() => handleOptionSelect(option.id)}
                    disabled={quizSubmitted || showCorrectAnswer}
                  />
                ) : (
                  <input 
                    type="radio" 
                    name={`q-${question.id}`} 
                    className="mr-3 h-5 w-5 accent-macaron-deepLavender mt-0.5" 
                    checked={isSelected}
                    onChange={() => handleOptionSelect(option.id)}
                    disabled={quizSubmitted || showCorrectAnswer}
                  />
                )}
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
            value={typeof userAnswer === 'string' ? userAnswer : ''}
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
              // 修改：更新答案检查逻辑
              let hasAnswer = false;
              if (question.type === 'short_answer') {
                hasAnswer = typeof userAnswer === 'string' && userAnswer.trim() !== '';
              } else if (question.type === 'multiple_choice') {
                hasAnswer = Array.isArray(selectedAnswer) && selectedAnswer.length > 0;
              } else {
                hasAnswer = typeof selectedAnswer === 'string' && selectedAnswer.trim() !== '';
              }
              onCheckAnswer(question.id, hasAnswer ? 'correct' : '');
            }}
            disabled={(() => {
              if (question.type === 'short_answer') {
                return typeof userAnswer !== 'string' || userAnswer.trim() === '';
              } else if (question.type === 'multiple_choice') {
                return !Array.isArray(selectedAnswer) || selectedAnswer.length === 0;
              } else {
                return typeof selectedAnswer !== 'string' || selectedAnswer.trim() === '';
              }
            })()}
          >
            检查答案
          </Button>
        </div>
      )}
    </div>
  );
};

export default QuizQuestionItem; 