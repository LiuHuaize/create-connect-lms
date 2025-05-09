import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  Plus, Trash2, AlertCircle, Download, Layers
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  Lesson, 
  QuizQuestion, 
  QuizQuestionType,
  VideoLessonContent,
  TextLessonContent,
  QuizLessonContent,
  AssignmentLessonContent,
  CardCreatorLessonContent,
  DragSortContent,
  ResourceLessonContent,
  FrameLessonContent,
  HotspotLessonContent,
  LessonContent
} from '@/types/course';
import { LexicalEditor, BlockNoteEditor } from '@/components/editor';
import VideoUploader from './creator/VideoUploader';
import CardCreatorLessonEditor from './CardCreatorLessonEditor';
import DragSortEditor from './creator/drag-sort/DragSortEditor';
import ResourceLessonEditor from './ResourceLessonEditor';
import FrameLessonEditor from './FrameLessonEditor';
import HotspotEditor from './creator/hotspot/HotspotEditor';
import { supabase } from '@/integrations/supabase/client';

// Quiz question types
const QUESTION_TYPES: { id: QuizQuestionType, name: string }[] = [
  { id: 'multiple_choice', name: '多选题' },
  { id: 'true_false', name: '判断题' },
  { id: 'short_answer', name: '简答题' }
];

interface LessonEditorProps {
  lesson: Lesson;
  onSave: (updatedLesson: Lesson | null) => void;
  onContentChange: (newContent: LessonContent) => void;
  onEditorFullscreenChange?: (isFullscreen: boolean) => void;
  onCourseDataSaved?: (updatedLesson: Lesson) => Promise<string | undefined | void>;
}

const LessonEditor = ({ lesson, onSave, onContentChange, onEditorFullscreenChange, onCourseDataSaved }: LessonEditorProps) => {
  // Initialize content with the correct structure based on lesson type
  const initializeContent = (): LessonContent => {
    const baseContent = lesson.content;
    
    switch (lesson.type) {
      case 'video':
        return { 
          videoUrl: (baseContent as VideoLessonContent).videoUrl || '', 
          description: (baseContent as VideoLessonContent).description || '',
          videoFilePath: (baseContent as VideoLessonContent).videoFilePath || lesson.video_file_path || '',
          bilibiliUrl: (baseContent as VideoLessonContent).bilibiliUrl || ''
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
          aiGradingPrompt: (baseContent as AssignmentLessonContent).aiGradingPrompt || '',
          allowFileUpload: (baseContent as AssignmentLessonContent).allowFileUpload || false
        } as AssignmentLessonContent;
      case 'card_creator':
        return {
          instructions: (baseContent as CardCreatorLessonContent).instructions || '',
          templateType: (baseContent as CardCreatorLessonContent).templateType || 'text',
          templateDescription: (baseContent as CardCreatorLessonContent).templateDescription || '',
          templateImageUrl: (baseContent as CardCreatorLessonContent).templateImageUrl || '',
        } as CardCreatorLessonContent;
      case 'drag_sort':
        return {
          introduction: (baseContent as DragSortContent)?.introduction || '将下面的项目拖拽到正确的分类中',
          items: (baseContent as DragSortContent)?.items || [],
          categories: (baseContent as DragSortContent)?.categories || [],
          correctMappings: (baseContent as DragSortContent)?.correctMappings || []
        } as DragSortContent;
      case 'resource':
        return {
          description: (baseContent as ResourceLessonContent)?.description || '',
          resourceFiles: (baseContent as ResourceLessonContent)?.resourceFiles || []
        } as ResourceLessonContent;
      case 'frame':
        return {
          title: (baseContent as FrameLessonContent)?.title || lesson.title || '课程框架',
          description: (baseContent as FrameLessonContent)?.description || '',
          lessons: (baseContent as FrameLessonContent)?.lessons || []
        } as FrameLessonContent;
      case 'hotspot':
        return {
          backgroundImage: (baseContent as HotspotLessonContent)?.backgroundImage || '',
          introduction: (baseContent as HotspotLessonContent)?.introduction || '',
          hotspots: (baseContent as HotspotLessonContent)?.hotspots || []
        } as HotspotLessonContent;
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
  
  const handleVideoUploaded = (filePath: string) => {
    if (lesson.type === 'video') {
      const newContent = {
        ...(currentContent as VideoLessonContent),
        videoFilePath: filePath
      };
      setCurrentContent(newContent);
      onContentChange(newContent);
    }
  };
  
  const handleSubmit = async (data) => {
    console.log('正在保存课时数据:', data);
    const updatedLesson: Lesson = {
      ...lesson,
      title: data.title.trim(), // 确保标题被正确处理
      content: { ...currentContent }
    };
    
    // 记录日志以便调试
    console.log(`提交课时标题更新: 从 "${lesson.title}" 到 "${data.title.trim()}"`);
    
    // Depending on the lesson type, extract the relevant content fields
    if (lesson.type === 'video') {
      updatedLesson.content = { 
        description: data.description,
        videoFilePath: (currentContent as VideoLessonContent).videoFilePath || '',
        bilibiliUrl: data.bilibiliUrl || ''
      } as VideoLessonContent;
      updatedLesson.video_file_path = (currentContent as VideoLessonContent).videoFilePath || null;
      updatedLesson.bilibili_url = data.bilibiliUrl || null;
    } else if (lesson.type === 'resource') {
      // Resource lessons are handled separately in the resource editor
    } else if (lesson.type === 'text') {
      updatedLesson.content = {
        text: data.text
      } as TextLessonContent;
    } else if (lesson.type === 'quiz') {
      // Quiz is handled by the quiz editor
    } else if (lesson.type === 'assignment') {
      // 处理作业内容
      updatedLesson.content = {
        instructions: data.instructions || '',
        criteria: data.criteria || '',
        aiGradingPrompt: data.aiGradingPrompt || '',
        allowFileUpload: data.allowFileUpload || false
      } as AssignmentLessonContent;
      
      // 记录日志，检查数据是否正确传递
      console.log('保存作业要求数据:', {
        instructions: data.instructions,
        criteria: data.criteria,
        aiGradingPrompt: data.aiGradingPrompt,
        allowFileUpload: data.allowFileUpload
      });
    }
    
    // 首先更新课程内容的状态
    onSave(updatedLesson);
    
    // 然后如果提供了数据库保存回调，则调用它保存到数据库
    // 直接传递更新后的课时对象，确保保存的是最新数据
    if (onCourseDataSaved) {
      try {
        const toastId = toast.loading('正在保存课程到数据库...');
        console.log('即将保存到数据库的课时数据:', JSON.stringify(updatedLesson));
        await onCourseDataSaved(updatedLesson);
        toast.success('保存成功', { id: toastId });
        form.reset(data); // 重置表单状态，避免意外的isDirty状态
      } catch (error) {
        console.error('保存失败:', error);
        toast.error(`保存失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }
  };
  
  // 处理Lexical编辑器内容变化
  const handleLexicalEditorChange = (content: string) => {
    if (lesson.type === 'text') {
      const newContent = {
        ...(currentContent as TextLessonContent),
        text: content
      };
      setCurrentContent(newContent);
      form.setValue('text', content);
      onContentChange(newContent);
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
      correctOption: '',
      hint: ''
    };
    
    const updatedQuestions = [...questions, newQuestion];
    setQuestions(updatedQuestions);
    const newQuizContent = { ...currentContent, questions: updatedQuestions } as QuizLessonContent;
    setCurrentContent(newQuizContent);
    onContentChange(newQuizContent);
  };
  
  const updateQuestion = (questionId: string, field: string, value: any) => {
    const updatedQuestions = questions.map(q => {
      if (q.id === questionId) {
        // 处理问题类型变更的特殊情况
        if (field === 'type' && value === 'short_answer') {
          // 对于简答题，移除选项并清除正确答案选择
          return { 
            ...q, 
            [field]: value,
            options: [], // 移除所有选项
            correctOption: '', // 清除正确答案选择
            sampleAnswer: q.sampleAnswer || '' // 保留示例答案
          };
        }
        return { ...q, [field]: value };
      }
      return q;
    });
    
    setQuestions(updatedQuestions);
    const newQuizContent = { ...currentContent, questions: updatedQuestions } as QuizLessonContent;
    setCurrentContent(newQuizContent);
    onContentChange(newQuizContent);
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
    const newQuizContent = { ...currentContent, questions: updatedQuestions } as QuizLessonContent;
    setCurrentContent(newQuizContent);
    onContentChange(newQuizContent);
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
      const newQuizContent = { ...currentContent, questions: updatedQuestions } as QuizLessonContent;
      setCurrentContent(newQuizContent);
      onContentChange(newQuizContent);
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
    const newQuizContent = { ...currentContent, questions: updatedQuestions } as QuizLessonContent;
    setCurrentContent(newQuizContent);
    onContentChange(newQuizContent);
  };
  
  const deleteQuestion = (questionId: string) => {
    const updatedQuestions = questions.filter(q => q.id !== questionId);
    setQuestions(updatedQuestions);
    const newQuizContent = { ...currentContent, questions: updatedQuestions } as QuizLessonContent;
    setCurrentContent(newQuizContent);
    onContentChange(newQuizContent);
  };
  
  const setCorrectOption = (questionId: string, optionId: string) => {
    const updatedQuestions = questions.map(q => 
      q.id === questionId ? { ...q, correctOption: optionId } : q
    );
    
    setQuestions(updatedQuestions);
    const newQuizContent = { ...currentContent, questions: updatedQuestions } as QuizLessonContent;
    setCurrentContent(newQuizContent);
    onContentChange(newQuizContent);
  };
  
  // 处理编辑器全屏状态变化
  const handleEditorFullscreenToggle = (isFullscreen: boolean) => {
    if (onEditorFullscreenChange) {
      onEditorFullscreenChange(isFullscreen);
    }
  };
  
  // 新增处理B站URL变更的函数
  const handleBilibiliUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (lesson.type === 'video') {
      let url = event.target.value;
      
      // 检测是否是普通B站视频链接（非嵌入式链接）
      const biliRegex = /https?:\/\/(www\.)?bilibili\.com\/video\/(BV[\w]+)(\?.*)?/;
      const match = url.match(biliRegex);
      
      if (match) {
        // 获取BV号
        const bvid = match[2];
        // 转换为嵌入式链接
        url = `https://player.bilibili.com/player.html?bvid=${bvid}&page=1&as_wide=1&high_quality=1&danmaku=0`;
        // 通知用户链接已转换
        toast.success('B站链接已自动转换为嵌入格式并设置为宽屏模式');
      } else if (url.includes('player.bilibili.com') && !url.includes('as_wide=1')) {
        // 如果是嵌入式链接但没有as_wide参数，添加该参数
        url = url.includes('?') ? 
          `${url}&as_wide=1` : 
          `${url}?as_wide=1`;
        toast.success('已自动添加宽屏模式参数');
      }
      
      const newContent = {
        ...(currentContent as VideoLessonContent),
        bilibiliUrl: url
      };
      setCurrentContent(newContent);
      form.setValue('bilibiliUrl', url);
      onContentChange(newContent);
    }
  };
  
  // 处理资源编辑器的内容变化
  const handleResourceContentChange = (updatedLesson: Lesson) => {
    setCurrentContent(updatedLesson.content);
    onContentChange(updatedLesson.content);
  };
  
  // 获取课程ID
  const getCourseId = async (): Promise<string> => {
    if (!lesson.module_id) {
      return '';
    }
    
    try {
      const { data, error } = await supabase
        .from('course_modules')
        .select('course_id')
        .eq('id', lesson.module_id)
        .single();
      
      if (error) {
        throw error;
      }
      
      return data?.course_id || '';
    } catch (error) {
      console.error('获取课程ID失败:', error);
      return '';
    }
  };
  
  const [courseId, setCourseId] = useState<string>('');
  
  // 在组件挂载时获取课程ID
  React.useEffect(() => {
    if (lesson.module_id) {
      getCourseId().then(id => setCourseId(id));
    }
  }, [lesson.module_id]);
  
  // 渲染特定类型的课时编辑器
  const renderLessonEditor = () => {
    // 资源编辑器有自己的保存按钮和表单，单独处理
    if (lesson.type === 'resource') {
      return (
        <ResourceLessonEditor
          lesson={lesson}
          onChange={handleResourceContentChange}
          onSave={async () => {
            try {
              if (onCourseDataSaved) {
                // 创建更新后的课时对象
                const updatedResourceLesson = {
                  ...lesson,
                  content: currentContent
                };
                console.log('保存资源模块，课时内容:', updatedResourceLesson);
                await onCourseDataSaved(updatedResourceLesson);
                toast.success('资源模块保存成功');
              } else {
                console.error('无法保存: onCourseDataSaved未定义');
                toast.error('保存失败: 系统错误');
              }
            } catch (error) {
              console.error('保存资源模块失败:', error);
              toast.error('保存失败，请稍后重试');
            }
          }}
          isSaving={false}
          courseId={courseId}
        />
      );
    }
    
    // 卡片创建器也有自己的UI和逻辑，单独处理
    if (lesson.type === 'card_creator') {
      return (
        <CardCreatorLessonEditor 
          lesson={lesson}
          onUpdate={(updatedLesson) => {
            setCurrentContent(updatedLesson.content);
            onContentChange(updatedLesson.content);
          }}
        />
      );
    }
    
    // 拖拽分类也有自己的UI和逻辑，单独处理
    if (lesson.type === 'drag_sort') {
      return (
        <DragSortEditor 
          lesson={lesson}
          onSave={(content) => {
            setCurrentContent(content);
            onContentChange(content);
          }}
        />
      );
    }
    
    // 框架也有自己的UI和逻辑，单独处理
    if (lesson.type === 'frame') {
      return (
        <FrameLessonEditor
          lesson={lesson}
          onSave={(content) => {
            setCurrentContent(content);
            onContentChange(content);
          }}
          onCourseDataSaved={onCourseDataSaved}
        />
      );
    }
    
    // 热点课程也有自己的UI和逻辑，单独处理
    if (lesson.type === 'hotspot') {
      return (
        <HotspotEditor
          lesson={lesson}
          onUpdate={(updatedLesson) => {
            setCurrentContent(updatedLesson.content);
            onContentChange(updatedLesson.content);
          }}
        />
      );
    }
    
    // 其他类型使用常规表单
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
              <div>
                <FormLabel className="block text-sm font-medium text-gray-700 mb-2">上传视频</FormLabel>
                <VideoUploader 
                  onVideoUploaded={handleVideoUploaded} 
                  initialVideoPath={lesson.video_file_path || null}
                />
                <p className="text-xs text-gray-500 mt-1">
                  上传视频文件或使用URL。视频文件将存储在我们的服务器上。
                </p>
              </div>
              
              <FormField
                control={form.control}
                name="bilibiliUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>哔哩哔哩视频嵌入</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="输入B站视频iframe嵌入代码" 
                        {...field} 
                        onChange={(e) => {
                          field.onChange(e);
                          handleBilibiliUrlChange(e);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      例如：https://player.bilibili.com/player.html?aid=xxx&bvid=xxx&cid=xxx&page=1&as_wide=1&high_quality=1&danmaku=0
                      <br />
                      <span className="text-xs">
                        <strong>参数说明</strong>：
                        aid/bvid(视频ID, 必填) | 
                        page(第几个视频, 默认1) | 
                        as_wide(是否宽屏, 1为宽屏) | 
                        high_quality(是否高清, 1为高清) | 
                        danmaku(是否显示弹幕, 0为关闭)
                      </span>
                    </FormDescription>
                  </FormItem>
                )}
              />
              
              {(currentContent as VideoLessonContent).bilibiliUrl && (
                <div className="mt-2">
                  <FormLabel className="block text-sm font-medium text-gray-700 mb-2">预览</FormLabel>
                  <div className="aspect-video bg-gray-100 rounded-md overflow-hidden mx-auto max-w-3xl">
                    <iframe 
                      src={(function() {
                        const url = (currentContent as VideoLessonContent).bilibiliUrl || '';
                        // 确保添加as_wide=1参数
                        if (url.includes('as_wide=1')) {
                          return url;
                        } else if (url.includes('?')) {
                          return `${url}&as_wide=1&high_quality=1`;
                        } else {
                          return `${url}?as_wide=1&high_quality=1`;
                        }
                      })()}
                      allowFullScreen={true}
                      className="w-full h-full"
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        aspectRatio: '16/9', 
                        border: 'none',
                        display: 'block',
                        margin: '0 auto'
                      }}
                      scrolling="no" 
                      frameBorder="0"
                      sandbox="allow-top-navigation allow-same-origin allow-forms allow-scripts"
                    />
                  </div>
                </div>
              )}
              
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
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            提示信息（答错时显示）
                          </label>
                          <Textarea
                            placeholder="输入当学生答错时显示的提示信息"
                            rows={2}
                            value={question.hint || ''}
                            onChange={(e) => updateQuestion(question.id, 'hint', e.target.value)}
                          />
                          <p className="text-xs text-gray-500 mt-1">给学生的提示，帮助他们思考正确答案</p>
                        </div>
                        
                        {question.type === 'short_answer' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              示例答案
                            </label>
                            <Textarea
                              placeholder="输入示例正确答案，帮助学生理解期望的回答"
                              rows={3}
                              value={question.sampleAnswer || ''}
                              onChange={(e) => updateQuestion(question.id, 'sampleAnswer', e.target.value)}
                            />
                            <p className="text-xs text-gray-500 mt-1">作为参考答案，可用于AI评分或学生自查</p>
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

              <FormField
                control={form.control}
                name="allowFileUpload"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <div className="flex h-6 items-center">
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </div>
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>允许文件上传</FormLabel>
                      <FormDescription>
                        启用后，学生可以上传文件作为作业的一部分
                      </FormDescription>
                    </div>
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

  return (
    <div className="w-full p-4">
      {renderLessonEditor()}
    </div>
  );
};

export default LessonEditor;
