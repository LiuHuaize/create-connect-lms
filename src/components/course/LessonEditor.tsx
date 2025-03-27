import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { 
  FileText, Video, FileQuestion, 
  Plus, Trash2, AlertCircle
} from 'lucide-react';
import { 
  Lesson, 
  QuizQuestion, 
  QuizQuestionType,
  VideoLessonContent,
  TextLessonContent,
  QuizLessonContent,
  AssignmentLessonContent,
  LessonContent
} from '@/types/course';
import { LexicalEditor, BlockNoteEditor } from '@/components/editor';

// Quiz question types
const QUESTION_TYPES: { id: QuizQuestionType, name: string }[] = [
  { id: 'multiple_choice', name: '多选题' },
  { id: 'true_false', name: '判断题' },
  { id: 'short_answer', name: '简答题' }
];

interface LessonEditorProps {
  lesson: Lesson;
  onSave: (updatedLesson: Lesson | null) => void;
  onEditorFullscreenChange?: (isFullscreen: boolean) => void;
}

const LessonEditor = ({ lesson, onSave, onEditorFullscreenChange }: LessonEditorProps) => {
  // Initialize content with the correct structure based on lesson type
  const initializeContent = (): LessonContent => {
    const baseContent = lesson.content;
    
    switch (lesson.type) {
      case 'video':
        return { 
          videoUrl: (baseContent as VideoLessonContent).videoUrl || '', 
          description: (baseContent as VideoLessonContent).description || '' 
        } as VideoLessonContent;
      case 'text':
        return { 
          text: (baseContent as TextLessonContent).text || JSON.stringify([{
            type: "paragraph",
            content: ""
          }])
        } as TextLessonContent;
      case 'quiz':
        return { 
          questions: (baseContent as QuizLessonContent).questions || [] 
        } as QuizLessonContent;
      case 'assignment':
        return { 
          instructions: (baseContent as AssignmentLessonContent).instructions || '', 
          criteria: (baseContent as AssignmentLessonContent).criteria || '',
          aiGradingPrompt: (baseContent as AssignmentLessonContent).aiGradingPrompt || ''
        } as AssignmentLessonContent;
      default:
        return baseContent;
    }
  };
  
  const [currentContent, setCurrentContent] = useState<LessonContent>(initializeContent());
  
  // Form setup for lesson details
  const form = useForm({
    defaultValues: {
      title: lesson.title || '',
      ...currentContent
    }
  });
  
  const handleSubmit = (data) => {
    const updatedLesson: Lesson = {
      ...lesson,
      title: data.title,
      content: { ...currentContent }
    };
    
    // Depending on the lesson type, extract the relevant content fields
    if (lesson.type === 'video') {
      updatedLesson.content = { 
        videoUrl: data.videoUrl,
        description: data.description
      } as VideoLessonContent;
    } else if (lesson.type === 'text') {
      updatedLesson.content = { 
        text: data.text 
      } as TextLessonContent;
    } else if (lesson.type === 'quiz') {
      // Quiz questions are handled separately through the questions state
      updatedLesson.content = { 
        questions: questions 
      } as QuizLessonContent;
    } else if (lesson.type === 'assignment') {
      updatedLesson.content = { 
        instructions: data.instructions,
        criteria: data.criteria,
        aiGradingPrompt: data.aiGradingPrompt
      } as AssignmentLessonContent;
    }
    
    onSave(updatedLesson);
  };
  
  // 处理Lexical编辑器内容变化
  const handleLexicalEditorChange = (content: string) => {
    if (lesson.type === 'text') {
      setCurrentContent({
        ...(currentContent as TextLessonContent),
        text: content
      });
      
      form.setValue('text', content);
    }
  };
  
  // Quiz specific state and handlers
  const [questions, setQuestions] = useState<QuizQuestion[]>(
    lesson.type === 'quiz' 
      ? (currentContent as QuizLessonContent).questions || [
          {
            id: 'q1',
            type: 'multiple_choice',
            text: 'What is the primary purpose of a business plan?',
            options: [
              { id: 'o1', text: 'To secure funding' },
              { id: 'o2', text: 'To guide business operations' },
              { id: 'o3', text: 'To analyze the market' }
            ],
            correctOption: 'o2'
          }
        ]
      : []
  );
  
  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: `q${Date.now()}`,
      type: 'multiple_choice',
      text: '新问题',
      options: [
        { id: `o${Date.now()}-1`, text: '选项1' },
        { id: `o${Date.now()}-2`, text: '选项2' }
      ],
      correctOption: ''
    };
    
    const updatedQuestions = [...questions, newQuestion];
    setQuestions(updatedQuestions);
    setCurrentContent({ ...currentContent, questions: updatedQuestions } as QuizLessonContent);
  };
  
  const updateQuestion = (questionId: string, field: string, value: any) => {
    const updatedQuestions = questions.map(q => 
      q.id === questionId ? { ...q, [field]: value } : q
    );
    
    setQuestions(updatedQuestions);
    setCurrentContent({ ...currentContent, questions: updatedQuestions } as QuizLessonContent);
  };
  
  const updateOption = (questionId: string, optionId: string, value: string) => {
    const updatedQuestions = questions.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            options: q.options?.map(opt => 
              opt.id === optionId ? { ...opt, text: value } : opt
            ) 
          } 
        : q
    );
    
    setQuestions(updatedQuestions);
    setCurrentContent({ ...currentContent, questions: updatedQuestions } as QuizLessonContent);
  };
  
  const addOption = (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    
    if (question && question.options) {
      const newOption = {
        id: `o${Date.now()}`,
        text: `选项${question.options.length + 1}`
      };
      
      const updatedQuestions = questions.map(q => 
        q.id === questionId 
          ? { ...q, options: [...(q.options || []), newOption] } 
          : q
      );
      
      setQuestions(updatedQuestions);
      setCurrentContent({ ...currentContent, questions: updatedQuestions } as QuizLessonContent);
    }
  };
  
  const deleteOption = (questionId: string, optionId: string) => {
    const updatedQuestions = questions.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            options: q.options?.filter(opt => opt.id !== optionId),
            correctOption: q.correctOption === optionId ? '' : q.correctOption
          } 
        : q
    );
    
    setQuestions(updatedQuestions);
    setCurrentContent({ ...currentContent, questions: updatedQuestions } as QuizLessonContent);
  };
  
  const deleteQuestion = (questionId: string) => {
    const updatedQuestions = questions.filter(q => q.id !== questionId);
    setQuestions(updatedQuestions);
    setCurrentContent({ ...currentContent, questions: updatedQuestions } as QuizLessonContent);
  };
  
  const setCorrectOption = (questionId: string, optionId: string) => {
    const updatedQuestions = questions.map(q => 
      q.id === questionId ? { ...q, correctOption: optionId } : q
    );
    
    setQuestions(updatedQuestions);
    setCurrentContent({ ...currentContent, questions: updatedQuestions } as QuizLessonContent);
  };
  
  // 处理编辑器全屏状态变化
  const handleEditorFullscreenToggle = (isFullscreen: boolean) => {
    if (onEditorFullscreenChange) {
      onEditorFullscreenChange(isFullscreen);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>课程标题</FormLabel>
              <FormControl>
                <Input placeholder="输入课程标题" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        
        {/* Render different content fields based on lesson type */}
        {lesson.type === 'video' && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="videoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>视频URL</FormLabel>
                  <FormControl>
                    <Input placeholder="输入YouTube或其他视频平台的URL" {...field} />
                  </FormControl>
                  <FormDescription>
                    支持YouTube、Vimeo和其他视频平台链接
                  </FormDescription>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>视频描述</FormLabel>
                  <FormControl>
                    <Textarea placeholder="为视频添加描述文本" className="min-h-20" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center mb-4 text-gray-700">
                <Video size={18} className="mr-2 text-blue-600" />
                <span className="font-medium">Video Preview</span>
              </div>
              
              <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                <AlertCircle size={24} className="text-gray-400 mr-2" />
                <span className="text-gray-400">Video preview will appear here</span>
              </div>
            </div>
          </div>
        )}
        
        {lesson.type === 'text' && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>内容</FormLabel>
                  <FormControl>
                    <BlockNoteEditor
                      initialContent={(currentContent as TextLessonContent).text || ''}
                      onChange={handleLexicalEditorChange}
                      placeholder="在此输入课程内容..."
                      className="min-h-[300px] border-0 shadow-none"
                      onFullscreenToggle={handleEditorFullscreenToggle}
                    />
                  </FormControl>
                  <FormDescription>
                    使用编辑器工具栏来格式化内容并添加链接、列表等元素。点击右上角可以全屏编辑。
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>
        )}
        
        {lesson.type === 'quiz' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">测验问题</h3>
              <Button type="button" onClick={addQuestion} size="sm" variant="outline">
                <Plus size={16} className="mr-2" /> 添加问题
              </Button>
            </div>
            
            {questions.length === 0 ? (
              <div className="text-center p-8 border border-dashed border-gray-300 rounded-md">
                <FileQuestion className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">还没有问题。点击上方"添加问题"按钮开始创建测验。</p>
              </div>
            ) : (
              <div className="space-y-6">
                {questions.map((question, index) => (
                  <div key={question.id} className="border border-gray-200 rounded-md p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium">问题 {index + 1}</h4>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteQuestion(question.id)}
                        className="h-8 w-8 p-0 text-red-500"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          问题类型
                        </label>
                        <select
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-connect-blue/20 focus:border-connect-blue"
                          value={question.type}
                          onChange={(e) => updateQuestion(question.id, 'type', e.target.value)}
                        >
                          {QUESTION_TYPES.map((type) => (
                            <option key={type.id} value={type.id}>
                              {type.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          问题文本
                        </label>
                        <Input
                          value={question.text}
                          onChange={(e) => updateQuestion(question.id, 'text', e.target.value)}
                          placeholder="输入问题内容"
                        />
                      </div>
                      
                      {(question.type === 'multiple_choice' || question.type === 'true_false') && (
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                              选项
                            </label>
                            {question.type === 'multiple_choice' && (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => addOption(question.id)}
                                className="h-6"
                              >
                                <Plus size={14} className="mr-1" /> 添加选项
                              </Button>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            {question.options?.map((option) => (
                              <div key={option.id} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`correct-${question.id}`}
                                  checked={question.correctOption === option.id}
                                  onChange={() => setCorrectOption(question.id, option.id)}
                                  className="h-4 w-4 text-connect-blue"
                                />
                                <Input
                                  value={option.text}
                                  onChange={(e) => updateOption(question.id, option.id, e.target.value)}
                                  className="flex-1"
                                />
                                {question.type === 'multiple_choice' && question.options && question.options.length > 2 && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => deleteOption(question.id, option.id)}
                                    className="h-8 w-8 p-0 text-red-500"
                                  >
                                    <Trash2 size={14} />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">选择正确答案</p>
                        </div>
                      )}
                      
                      {question.type === 'short_answer' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            答案示例（仅供参考）
                          </label>
                          <Textarea
                            placeholder="输入可能的正确答案示例"
                            rows={3}
                            value={question.sampleAnswer || ''}
                            onChange={(e) => updateQuestion(question.id, 'sampleAnswer', e.target.value)}
                          />
                          
                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                            <p className="text-xs text-yellow-700 font-medium mb-1">AI评分说明</p>
                            <p className="text-xs text-yellow-600">
                              简答题将使用AI进行自动评分。系统会根据问题和示例答案来评判学生的回答。
                              您可以在作业的"AI评分提示"部分提供更详细的评分标准和要求。
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {lesson.type === 'assignment' && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>作业说明</FormLabel>
                  <FormControl>
                    <Textarea className="min-h-40" placeholder="为学生提供详细的作业说明和要求" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="criteria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>评分标准</FormLabel>
                  <FormControl>
                    <Textarea className="min-h-32" placeholder="描述作业的评分标准和要求" {...field} />
                  </FormControl>
                  <FormDescription>
                    这些评分标准将展示给学生，帮助他们了解作业要求和评分方式
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="aiGradingPrompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AI评分提示</FormLabel>
                  <FormControl>
                    <Textarea 
                      className="min-h-32" 
                      placeholder="指导AI如何评分，例如：'这是一篇关于商业计划的作业，请评估以下几点：1. 内容完整性(30%)，2. 逻辑性(30%)，3. 创新性(20%)，4. 表达清晰度(20%)'" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    输入提示词指导AI如何评分学生作业。这些提示词不会展示给学生，仅用于AI评分。
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>
        )}
        
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={() => onSave(null)}>
            取消
          </Button>
          <Button type="submit" className="bg-connect-blue hover:bg-blue-600">
            保存课程
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default LessonEditor;
