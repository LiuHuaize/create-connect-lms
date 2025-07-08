import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, Target, Users } from 'lucide-react';
import { SeriesQuestionnaireLessonContent as SeriesQuestionnaireContent } from '@/types/course';

interface SeriesQuestionnaireLessonContentProps {
  content: SeriesQuestionnaireContent;
}

const SeriesQuestionnaireLessonContent: React.FC<SeriesQuestionnaireLessonContentProps> = ({
  content
}) => {
  const questionnaire = content.questionnaire;

  if (!questionnaire) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">系列问答内容未配置</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 问答概览 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {questionnaire.title}
          </CardTitle>
          {questionnaire.description && (
            <p className="text-gray-600">{questionnaire.description}</p>
          )}
        </CardHeader>
        <CardContent>
          {/* 基本信息 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>{questionnaire.questions?.length || 0} 个问题</span>
            </div>
            
            {questionnaire.time_limit_minutes && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>时间限制: {questionnaire.time_limit_minutes} 分钟</span>
              </div>
            )}
            
            {questionnaire.max_score && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Target className="h-4 w-4" />
                <span>满分: {questionnaire.max_score} 分</span>
              </div>
            )}
          </div>

          {/* 技能标签 */}
          {questionnaire.skill_tags && questionnaire.skill_tags.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">相关技能</h4>
              <div className="flex flex-wrap gap-2">
                {questionnaire.skill_tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* 答题说明 */}
          {questionnaire.instructions && (
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h4 className="text-sm font-medium text-blue-800 mb-2">答题说明</h4>
              <p className="text-blue-700 text-sm whitespace-pre-wrap">
                {questionnaire.instructions}
              </p>
            </div>
          )}

          {/* 问题预览 */}
          {questionnaire.questions && questionnaire.questions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">问题预览</h4>
              <div className="space-y-3">
                {questionnaire.questions.slice(0, 3).map((question, index) => (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-gray-900 mb-1">
                          {question.title}
                          {question.required && (
                            <Badge variant="destructive" className="ml-2 text-xs">必答</Badge>
                          )}
                        </h5>
                        {question.description && (
                          <p className="text-gray-600 text-sm mb-2">{question.description}</p>
                        )}
                        <p className="text-gray-800 text-sm">{question.question_text}</p>
                        
                        {/* 字数要求 */}
                        {(question.min_words || question.max_words) && (
                          <div className="mt-2 text-xs text-gray-500">
                            字数要求: 
                            {question.min_words && ` 最少${question.min_words}字`}
                            {question.min_words && question.max_words && '，'}
                            {question.max_words && ` 最多${question.max_words}字`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {questionnaire.questions.length > 3 && (
                  <div className="text-center py-2">
                    <p className="text-gray-500 text-sm">
                      还有 {questionnaire.questions.length - 3} 个问题...
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI评分信息 */}
          {(questionnaire.ai_grading_prompt || questionnaire.ai_grading_criteria) && (
            <div className="mt-6 bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 mb-2">AI评分设置</h4>
              {questionnaire.ai_grading_prompt && (
                <div className="mb-2">
                  <p className="text-xs text-blue-600 font-medium">评分提示:</p>
                  <p className="text-blue-700 text-xs">{questionnaire.ai_grading_prompt}</p>
                </div>
              )}
              {questionnaire.ai_grading_criteria && (
                <div>
                  <p className="text-xs text-blue-600 font-medium">评分标准:</p>
                  <p className="text-blue-700 text-xs">{questionnaire.ai_grading_criteria}</p>
                </div>
              )}
            </div>
          )}

          {/* 其他设置 */}
          <div className="mt-6 flex flex-wrap gap-2">
            {questionnaire.allow_save_draft && (
              <Badge variant="outline" className="text-xs">
                允许保存草稿
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SeriesQuestionnaireLessonContent;
