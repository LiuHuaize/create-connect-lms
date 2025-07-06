import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { SeriesQuestion } from '@/types/course';
import { Trash2, GripVertical, Edit3, Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface SeriesQuestionEditorProps {
  question: SeriesQuestion;
  questionIndex: number;
  isEditing: boolean;
  onSave: (question: SeriesQuestion) => void;
  onDelete: (questionId: string) => void;
  onEdit: (questionId: string) => void;
  onCancel: () => void;
  dragHandleProps?: any;
}

interface QuestionFormData {
  title: string;
  description: string;
  question_text: string;
  required: boolean;
  min_words?: number;
  max_words?: number;
  placeholder_text: string;
}

const SeriesQuestionEditor: React.FC<SeriesQuestionEditorProps> = ({
  question,
  questionIndex,
  isEditing,
  onSave,
  onDelete,
  onEdit,
  onCancel,
  dragHandleProps
}) => {
  const form = useForm<QuestionFormData>({
    defaultValues: {
      title: question.title || '',
      description: question.description || '',
      question_text: question.question_text || '',
      required: question.required ?? true,
      min_words: question.min_words || undefined,
      max_words: question.max_words || undefined,
      placeholder_text: question.placeholder_text || ''
    }
  });

  // 重置表单数据当问题变化时
  useEffect(() => {
    form.reset({
      title: question.title || '',
      description: question.description || '',
      question_text: question.question_text || '',
      required: question.required ?? true,
      min_words: question.min_words || undefined,
      max_words: question.max_words || undefined,
      placeholder_text: question.placeholder_text || ''
    });
  }, [question, form]);

  const handleSave = (data: QuestionFormData) => {
    // 验证字数限制
    if (data.min_words && data.max_words && data.min_words > data.max_words) {
      toast.error('最小字数不能大于最大字数');
      return;
    }

    if (data.min_words && data.min_words < 1) {
      toast.error('最小字数必须大于0');
      return;
    }

    if (data.max_words && data.max_words < 1) {
      toast.error('最大字数必须大于0');
      return;
    }

    // 构建更新后的问题对象
    const updatedQuestion: SeriesQuestion = {
      ...question,
      title: data.title.trim(),
      description: data.description.trim() || undefined,
      question_text: data.question_text.trim(),
      required: data.required,
      min_words: data.min_words || undefined,
      max_words: data.max_words || undefined,
      placeholder_text: data.placeholder_text.trim() || undefined
    };

    onSave(updatedQuestion);
    toast.success('问题已保存');
  };

  const handleDelete = () => {
    if (window.confirm('确定要删除这个问题吗？此操作不可撤销。')) {
      onDelete(question.id);
      toast.success('问题已删除');
    }
  };

  // 如果不在编辑模式，显示预览
  if (!isEditing) {
    return (
      <Card className="relative group hover:shadow-md transition-all duration-200">
        {/* 拖拽手柄 */}
        <div 
          {...dragHandleProps}
          className="absolute left-2 top-1/2 transform -translate-y-1/2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="h-5 w-5 text-gray-400" />
        </div>

        <CardHeader className="pb-3 pl-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
                  {questionIndex + 1}
                </span>
                {question.title || '未命名问题'}
                {question.required && (
                  <span className="text-red-500 text-sm">*</span>
                )}
              </CardTitle>
              {question.description && (
                <p className="text-sm text-gray-600 mt-1">{question.description}</p>
              )}
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(question.id)}
                className="h-8 w-8 p-0"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 pl-10">
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium text-gray-700">问题内容</Label>
              <p className="text-sm text-gray-900 mt-1 p-3 bg-gray-50 rounded-md">
                {question.question_text || '暂无问题内容'}
              </p>
            </div>

            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
              <span>类型: {question.required ? '必答题' : '选答题'}</span>
              {question.min_words && (
                <span>最少: {question.min_words}字</span>
              )}
              {question.max_words && (
                <span>最多: {question.max_words}字</span>
              )}
              {question.placeholder_text && (
                <span>提示: {question.placeholder_text}</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 编辑模式
  return (
    <Card className="border-blue-200 shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
            {questionIndex + 1}
          </span>
          编辑问题
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
          {/* 问题标题 */}
          <FormField
            control={form.control}
            name="title"
            rules={{ required: '请输入问题标题' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>问题标题 *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="输入问题标题" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 问题描述 */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>问题描述</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="简要描述这个问题的目的（可选）" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  可选的问题说明，帮助学生理解问题意图
                </FormDescription>
              </FormItem>
            )}
          />

          {/* 问题内容 */}
          <FormField
            control={form.control}
            name="question_text"
            rules={{ required: '请输入问题内容' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>问题内容 *</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="输入具体的问题内容..." 
                    className="min-h-[100px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 占位符文本 */}
          <FormField
            control={form.control}
            name="placeholder_text"
            render={({ field }) => (
              <FormItem>
                <FormLabel>答题提示</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="在此输入你的答案..." 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  显示在答题框中的提示文字
                </FormDescription>
              </FormItem>
            )}
          />

          {/* 必填设置 */}
          <FormField
            control={form.control}
            name="required"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel>必答题</FormLabel>
                  <FormDescription>
                    学生必须回答此问题才能提交
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* 字数限制 */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="min_words"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>最少字数</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="如：50" 
                      min="1"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormDescription>
                    留空表示无限制
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="max_words"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>最多字数</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="如：200" 
                      min="1"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormDescription>
                    留空表示无限制
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              <X className="h-4 w-4 mr-2" />
              取消
            </Button>
            <Button type="submit">
              <Save className="h-4 w-4 mr-2" />
              保存问题
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default SeriesQuestionEditor;
