import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { SeriesQuestion, SeriesQuestionnaire, Lesson } from '@/types/course';
import { FileQuestion, Settings, Eye, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import SeriesQuestionList from './SeriesQuestionList';
import AIGradingSettings from './AIGradingSettings';
import SkillTagSelector from '../SkillTagSelector';
import SeriesQuestionnairePreview from './SeriesQuestionnairePreview';

interface SeriesQuestionnaireEditorProps {
  lesson: Lesson;
  onSave: (content: any) => void;
  onCourseDataSaved?: (updatedLesson: Lesson) => Promise<string | undefined | void>;
}

interface QuestionnaireFormData {
  title: string;
  description: string;
  instructions: string;
  ai_grading_prompt: string;
  ai_grading_criteria: string;
  max_score: number;
  time_limit_minutes?: number;
  allow_save_draft: boolean;
  skill_tags: string[];
}

const SeriesQuestionnaireEditor: React.FC<SeriesQuestionnaireEditorProps> = ({
  lesson,
  onSave,
  onCourseDataSaved
}) => {
  // 从课时内容中提取系列问答数据
  const existingContent = lesson.content as any;
  const [questions, setQuestions] = useState<SeriesQuestion[]>(
    existingContent?.questions || []
  );
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<QuestionnaireFormData>({
    defaultValues: {
      title: existingContent?.title || '',
      description: existingContent?.description || '',
      instructions: existingContent?.instructions || '',
      ai_grading_prompt: existingContent?.ai_grading_prompt || '',
      ai_grading_criteria: existingContent?.ai_grading_criteria || '',
      max_score: existingContent?.max_score || 100,
      time_limit_minutes: existingContent?.time_limit_minutes || undefined,
      allow_save_draft: existingContent?.allow_save_draft ?? true,
      skill_tags: lesson.skill_tags || []
    }
  });

  // 监听表单变化，自动保存
  const watchedValues = form.watch();
  useEffect(() => {
    const timer = setTimeout(() => {
      handleAutoSave();
    }, 1000); // 1秒后自动保存

    return () => clearTimeout(timer);
  }, [watchedValues, questions]);

  // 自动保存
  const handleAutoSave = () => {
    const formData = form.getValues();
    const content = {
      ...formData,
      questions: questions.map((q, index) => ({
        ...q,
        order_index: index + 1
      }))
    };
    onSave(content);
  };

  // 手动保存
  const handleSave = async () => {
    const formData = form.getValues();

    // 验证必填字段
    if (!formData.title.trim()) {
      toast.error('请输入系列问答标题');
      return;
    }

    if (questions.length === 0) {
      toast.error('请至少添加一个问题');
      return;
    }

    // 验证所有问题都有标题和内容
    const invalidQuestions = questions.filter(q => !q.title.trim() || !q.question_text.trim());
    if (invalidQuestions.length > 0) {
      toast.error('请完善所有问题的标题和内容');
      return;
    }

    const content = {
      ...formData,
      questions: questions.map((q, index) => ({
        ...q,
        order_index: index + 1
      }))
    };

    // 先更新本地状态
    onSave(content);

    // 如果有数据库保存函数，则保存到数据库
    if (onCourseDataSaved) {
      setIsSaving(true);
      try {
        const updatedLesson: Lesson = {
          ...lesson,
          content: content
        };

        const toastId = toast.loading('正在保存系列问答...');
        await onCourseDataSaved(updatedLesson);
        toast.success('系列问答已保存到数据库', { id: toastId });
      } catch (error) {
        console.error('保存系列问答失败:', error);
        toast.error('保存系列问答失败，请重试');
      } finally {
        setIsSaving(false);
      }
    } else {
      toast.success('系列问答已保存');
    }
  };

  // 处理问题变化
  const handleQuestionsChange = (updatedQuestions: SeriesQuestion[]) => {
    setQuestions(updatedQuestions);
  };

  // 处理技能标签变化
  const handleSkillTagsChange = (skills: string[]) => {
    form.setValue('skill_tags', skills);
  };

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <FileQuestion className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">系列问答编辑器</h2>
            <p className="text-sm text-gray-600">创建结构化的问答序列，适用于写作练习、调查问卷等场景</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            预览
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                保存
              </>
            )}
          </Button>
        </div>
      </div>

      <Form {...form}>
        <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">基本信息</TabsTrigger>
          <TabsTrigger value="questions">问题设计</TabsTrigger>
          <TabsTrigger value="grading">评分设置</TabsTrigger>
          <TabsTrigger value="preview">预览</TabsTrigger>
        </TabsList>

        {/* 基本信息 */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
              <p className="text-sm text-gray-600">设置系列问答的基本信息和说明</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                rules={{ required: '请输入标题' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>标题 *</FormLabel>
                    <FormControl>
                      <Input placeholder="输入系列问答标题" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>描述</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="简要描述这个系列问答的目的和内容"
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      向学生说明这个系列问答的目的和要求
                    </FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>答题说明</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="输入详细的答题说明和要求"
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      详细的答题指导，帮助学生更好地完成问答
                    </FormDescription>
                  </FormItem>
                )}
              />

              {/* 技能标签选择器 */}
              <div className="space-y-2">
                <FormLabel>技能标签</FormLabel>
                <SkillTagSelector
                  selectedSkills={form.watch('skill_tags') || []}
                  onSkillsChange={handleSkillTagsChange}
                  label=""
                  description="选择此系列问答主要培养的技能维度"
                  maxSelections={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 问题设计 */}
        <TabsContent value="questions" className="space-y-6">
          <SeriesQuestionList
            questions={questions}
            onChange={handleQuestionsChange}
            questionnaireId={lesson.id}
          />
        </TabsContent>

        {/* 评分设置 */}
        <TabsContent value="grading" className="space-y-6">
          <AIGradingSettings form={form} />
        </TabsContent>

        {/* 预览 */}
        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                预览效果
              </CardTitle>
              <p className="text-sm text-gray-600">查看学生看到的界面效果</p>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-6 bg-gray-50">
                <div className="space-y-6">
                  {/* 标题和描述 */}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {form.watch('title') || '系列问答标题'}
                    </h3>
                    {form.watch('description') && (
                      <p className="text-gray-600 mb-4">{form.watch('description')}</p>
                    )}
                    {form.watch('instructions') && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 mb-2">答题说明</h4>
                        <p className="text-blue-800 text-sm whitespace-pre-wrap">
                          {form.watch('instructions')}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 问题预览 */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">
                      问题列表 ({questions.length} 个问题)
                    </h4>
                    {questions.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        暂无问题，请先在"问题设计"标签页中添加问题
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {questions.map((question, index) => (
                          <div key={question.id} className="bg-white border rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
                                {index + 1}
                              </span>
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-900 mb-1">
                                  {question.title || '未命名问题'}
                                  {question.required && (
                                    <span className="text-red-500 ml-1">*</span>
                                  )}
                                </h5>
                                {question.description && (
                                  <p className="text-sm text-gray-600 mb-2">{question.description}</p>
                                )}
                                <p className="text-sm text-gray-800 mb-3">
                                  {question.question_text || '暂无问题内容'}
                                </p>
                                <div className="bg-gray-50 border rounded p-3">
                                  <p className="text-sm text-gray-500">
                                    {question.placeholder_text || '在此输入你的答案...'}
                                  </p>
                                </div>
                                {(question.min_words || question.max_words) && (
                                  <p className="text-xs text-gray-500 mt-2">
                                    字数要求: 
                                    {question.min_words && ` 最少${question.min_words}字`}
                                    {question.min_words && question.max_words && '，'}
                                    {question.max_words && ` 最多${question.max_words}字`}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 设置信息 */}
                  <div className="bg-white border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">设置信息</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">最高分数:</span>
                        <span className="ml-2 font-medium">{form.watch('max_score') || 100}分</span>
                      </div>
                      <div>
                        <span className="text-gray-600">时间限制:</span>
                        <span className="ml-2 font-medium">
                          {form.watch('time_limit_minutes') ? `${form.watch('time_limit_minutes')}分钟` : '无限制'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">保存草稿:</span>
                        <span className="ml-2 font-medium">
                          {form.watch('allow_save_draft') ? '允许' : '不允许'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">技能标签:</span>
                        <span className="ml-2 font-medium">
                          {form.watch('skill_tags')?.length ? form.watch('skill_tags').join(', ') : '无'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </Form>

      {/* 预览对话框 */}
      <SeriesQuestionnairePreview
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={form.watch('title') || '未命名系列问答'}
        description={form.watch('description')}
        instructions={form.watch('instructions')}
        questions={questions}
        timeLimit={form.watch('time_limit_minutes')}
        maxScore={form.watch('max_score')}
        skillTags={form.watch('skill_tags')}
      />
    </div>
  );
};

export default SeriesQuestionnaireEditor;
