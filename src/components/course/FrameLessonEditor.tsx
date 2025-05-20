import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Layers, MoveUp, MoveDown, ArrowLeft, Edit, Save, Loader2 } from 'lucide-react';
import { 
  Lesson, 
  FrameLessonContent,
  LessonType,
  LessonContent
} from '@/types/course';
import { LESSON_TYPES, getLessonTypeIcon, getLessonTypeName, getInitialContentByType } from '../course/creator/module-list/lessonTypeUtils';
import { v4 as uuidv4 } from 'uuid';
import LessonEditor from './LessonEditor';
import { toast } from 'sonner';
import { debounce } from '@/lib/utils';

// 创建一个带节流功能的输入组件
const ThrottledInput = ({ 
  value, 
  onChange, 
  className, 
  placeholder, 
  id 
}: { 
  value: string; 
  onChange: (value: string) => void; 
  className?: string; 
  placeholder?: string; 
  id?: string; 
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [isDebouncing, setIsDebouncing] = useState(false);
  
  // 存储最新的回调函数引用
  const onChangeRef = React.useRef(onChange);
  
  // 每当onChange更新时，更新其引用
  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  
  // 使用debounce函数处理输入，减少更新频率
  const debouncedOnChange = useCallback(
    debounce((newValue: string) => {
      setIsDebouncing(false);
      // 使用ref中存储的最新回调，避免闭包问题
      onChangeRef.current(newValue);
    }, 300),
    []
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsDebouncing(true);
    debouncedOnChange(newValue);
  };

  // 当外部传入的值变化时，更新内部状态
  React.useEffect(() => {
    if (!isDebouncing) {
      setInputValue(value);
    }
  }, [value, isDebouncing]);

  return (
    <Input
      id={id}
      value={inputValue}
      onChange={handleChange}
      className={className}
      placeholder={placeholder}
    />
  );
};

// 创建一个带节流功能的文本区域组件
const ThrottledTextarea = ({ 
  value, 
  onChange, 
  className, 
  placeholder, 
  id 
}: { 
  value: string; 
  onChange: (value: string) => void; 
  className?: string; 
  placeholder?: string; 
  id?: string; 
}) => {
  const [textValue, setTextValue] = useState(value || '');
  const [isDebouncing, setIsDebouncing] = useState(false);
  
  // 存储最新的回调函数引用
  const onChangeRef = React.useRef(onChange);
  
  // 每当onChange更新时，更新其引用
  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  
  // 使用debounce函数处理输入，减少更新频率
  const debouncedOnChange = useCallback(
    debounce((newValue: string) => {
      setIsDebouncing(false);
      // 使用ref中存储的最新回调，避免闭包问题
      onChangeRef.current(newValue);
    }, 300),
    []
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setTextValue(newValue);
    setIsDebouncing(true);
    debouncedOnChange(newValue);
  };

  // 当外部传入的值变化时，更新内部状态
  React.useEffect(() => {
    if (!isDebouncing) {
      setTextValue(value || '');
    }
  }, [value, isDebouncing]);

  return (
    <Textarea
      id={id}
      value={textValue}
      onChange={handleChange}
      className={className}
      placeholder={placeholder}
    />
  );
};

interface FrameLessonEditorProps {
  lesson: Lesson;
  onSave: (content: FrameLessonContent) => void;
  onCourseDataSaved?: (updatedLesson: Lesson) => Promise<string | undefined | void>;
}

const FrameLessonEditor: React.FC<FrameLessonEditorProps> = ({ lesson, onSave, onCourseDataSaved }) => {
  const [content, setContent] = useState<FrameLessonContent>(
    (lesson.content as FrameLessonContent) || {
      title: lesson.title || '课程框架',
      description: '',
      lessons: []
    }
  );
  
  // 添加状态来跟踪当前正在编辑的子课时
  const [currentEditingLesson, setCurrentEditingLesson] = useState<Lesson | null>(null);
  // 添加保存状态
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // 处理描述变更
  const handleDescriptionChange = (value: string) => {
    const newContent = { ...content, description: value };
    setContent(newContent);
    onSave(newContent);
  };

  // 处理标题变更
  const handleTitleChange = (value: string) => {
    const newContent = { ...content, title: value };
    setContent(newContent);
    onSave(newContent);
  };

  // 添加新课时
  const addLesson = (type: LessonType) => {
    const newLessonId = uuidv4();
    const newLesson: Lesson = {
      id: newLessonId,
      title: `新${getLessonTypeName(type)}`,
      type,
      content: getInitialContentByType(type),
      module_id: lesson.module_id,
      order_index: content.lessons.length
    };

    const newLessons = [...content.lessons, newLesson];
    const newContent = { ...content, lessons: newLessons };
    
    setContent(newContent);
    onSave(newContent);
    
    // 主动保存框架内容到数据库
    saveFrameToDatabase(newContent, `已添加新${getLessonTypeName(type)}`);
  };

  // 删除课时
  const removeLesson = (lessonId: string) => {
    const lessonToRemove = content.lessons.find(l => l.id === lessonId);
    const lessonTitle = lessonToRemove?.title || '课时';
    
    const newLessons = content.lessons.filter(l => l.id !== lessonId);
    const reorderedLessons = newLessons.map((l, index) => ({
      ...l,
      order_index: index
    }));
    
    const newContent = { ...content, lessons: reorderedLessons };
    setContent(newContent);
    onSave(newContent);
    
    // 主动保存框架内容到数据库
    saveFrameToDatabase(newContent, `已删除 "${lessonTitle}"`);
  };

  // 更新课时标题
  const updateLessonTitle = (lessonId: string, newTitle: string) => {
    const newLessons = content.lessons.map(l => 
      l.id === lessonId ? { ...l, title: newTitle } : l
    );
    
    const newContent = { ...content, lessons: newLessons };
    setContent(newContent);
    onSave(newContent);
    
    // 这里不主动保存，因为用户可能正在连续编辑标题
  };

  // 上移课时
  const moveLessonUp = (index: number) => {
    if (index <= 0) return; // 已经是第一个
    
    const newLessons = [...content.lessons];
    [newLessons[index - 1], newLessons[index]] = [newLessons[index], newLessons[index - 1]];
    
    const reorderedLessons = newLessons.map((l, idx) => ({
      ...l,
      order_index: idx
    }));
    
    const newContent = { ...content, lessons: reorderedLessons };
    setContent(newContent);
    onSave(newContent);
    
    // 主动保存框架内容到数据库
    saveFrameToDatabase(newContent, `已调整课时顺序`);
  };

  // 下移课时
  const moveLessonDown = (index: number) => {
    if (index >= content.lessons.length - 1) return; // 已经是最后一个
    
    const newLessons = [...content.lessons];
    [newLessons[index], newLessons[index + 1]] = [newLessons[index + 1], newLessons[index]];
    
    const reorderedLessons = newLessons.map((l, idx) => ({
      ...l,
      order_index: idx
    }));
    
    const newContent = { ...content, lessons: reorderedLessons };
    setContent(newContent);
    onSave(newContent);
    
    // 主动保存框架内容到数据库
    saveFrameToDatabase(newContent, `已调整课时顺序`);
  };

  // 编辑子课时内容
  const editLesson = (lessonToEdit: Lesson) => {
    setCurrentEditingLesson(lessonToEdit);
  };

  // 保存子课时内容
  const handleSaveSubLesson = (updatedLesson: Lesson | null) => {
    if (!updatedLesson) {
      // 如果取消编辑，只返回到列表视图
      setCurrentEditingLesson(null);
      return;
    }

    // 更新课时内容
    const newLessons = content.lessons.map(l => 
      l.id === updatedLesson.id ? updatedLesson : l
    );
    
    const newContent = { ...content, lessons: newLessons };
    setContent(newContent);
    onSave(newContent);
    
    // 立即保存子课时到数据库以确保内容不丢失
    if (onCourseDataSaved) {
      // 创建一个包含最新内容的框架课时对象
      const frameLessonToSave: Lesson = {
        ...lesson,
        title: newContent.title,
        content: newContent
      };
      
      // 使用setTimeout以确保React状态已更新
      setTimeout(async () => {
        try {
          console.log('正在保存框架课时到数据库，包含更新的子课时:', updatedLesson.title);
          await onCourseDataSaved(frameLessonToSave);
          console.log('框架课时已成功保存到数据库');
          toast.success(`子课时 "${updatedLesson.title}" 已保存至数据库`);
        } catch (error) {
          console.error('保存框架课时失败:', error);
          toast.error(`保存失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      }, 100);
    }
    
    // 返回到列表视图
    setCurrentEditingLesson(null);
  };

  // 处理子课时内容变化
  const handleSubLessonContentChange = (newContent: LessonContent) => {
    if (!currentEditingLesson) return;
    
    // 更新当前编辑的课时内容
    setCurrentEditingLesson({
      ...currentEditingLesson,
      content: newContent
    });
  };

  // 保存框架和所有子课时到数据库
  const handleSaveToDatabase = async () => {
    if (!onCourseDataSaved) {
      toast.warning('保存功能不可用');
      return;
    }

    // 更新框架课时
    const updatedLesson: Lesson = {
      ...lesson,
      title: content.title,
      content: content
    };

    try {
      setIsSaving(true);
      const toastId = toast.loading('正在保存框架和子课时到数据库...');
      
      // 强制延迟一小段时间，确保所有输入框的防抖更新已完成
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // 保存框架课时
      await onCourseDataSaved(updatedLesson);
      
      toast.success('保存成功', { id: toastId });
      console.log('框架课时保存成功，包含子课时：', content.lessons.length);
      
    } catch (error) {
      console.error('保存框架课时失败：', error);
      toast.error(`保存失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // 公共的框架保存函数，用于复用
  const saveFrameToDatabase = (newContent: FrameLessonContent, successMessage: string) => {
    if (!onCourseDataSaved) return;
    
    // 创建一个包含最新内容的框架课时对象
    const frameLessonToSave: Lesson = {
      ...lesson,
      title: newContent.title,
      content: newContent
    };
    
    // 使用setTimeout以确保React状态已更新，并增加延迟
    setTimeout(async () => {
      try {
        // 增加小延迟，确保可能的防抖输入已完成
        await new Promise(resolve => setTimeout(resolve, 300));
        
        await onCourseDataSaved(frameLessonToSave);
        console.log('框架课时已成功保存到数据库，课时数量:', newContent.lessons.length);
        toast.success(successMessage);
      } catch (error) {
        console.error('保存框架课时失败:', error);
        toast.error(`保存失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }, 300); // 增加延迟时间
  };

  // 如果有正在编辑的子课时，显示该课时的编辑界面
  if (currentEditingLesson) {
    return (
      <div className="space-y-4">
        <div className="flex items-center mb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setCurrentEditingLesson(null)}
            className="flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>返回框架</span>
          </Button>
          <h3 className="ml-4 text-lg font-medium">
            编辑: {currentEditingLesson.title}
          </h3>
        </div>
        
        <LessonEditor 
          lesson={currentEditingLesson}
          onSave={handleSaveSubLesson}
          onContentChange={handleSubLessonContentChange}
          onCourseDataSaved={onCourseDataSaved}
        />
      </div>
    );
  }

  // 默认显示框架编辑界面
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Layers className="h-5 w-5 text-ghibli-purple" /> 
          框架编辑器
        </h2>
        <Button 
          onClick={handleSaveToDatabase}
          disabled={isSaving || !onCourseDataSaved}
          className="bg-connect-blue hover:bg-blue-600"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              保存到数据库
            </>
          )}
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-ghibli-purple" />
            <span>框架设置</span>
          </CardTitle>
          <CardDescription>
            配置此框架的基本信息
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="frame-title">框架标题</Label>
            <ThrottledInput 
              id="frame-title" 
              value={content.title} 
              onChange={handleTitleChange}
              placeholder="输入框架标题" 
            />
          </div>
          <div>
            <Label htmlFor="frame-description">框架描述</Label>
            <ThrottledTextarea 
              id="frame-description" 
              value={content.description || ''}
              onChange={handleDescriptionChange}
              placeholder="描述此框架的用途和内容" 
              className="min-h-20"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>框架内容</span>
          </CardTitle>
          <CardDescription>
            框架中包含的课时内容，学生将按顺序学习这些内容
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {content.lessons.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border border-dashed rounded-md">
                此框架内暂无内容，请添加课时
              </div>
            ) : (
              <div className="space-y-2">
                {content.lessons.map((frameLessonItem, index) => (
                  <div 
                    key={frameLessonItem.id} 
                    className="flex items-center gap-2 p-3 border rounded-md bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="mr-2">
                      {getLessonTypeIcon(frameLessonItem.type)}
                    </div>
                    <ThrottledInput
                      value={frameLessonItem.title}
                      onChange={(value) => updateLessonTitle(frameLessonItem.id, value)}
                      className="flex-1"
                    />
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => editLesson(frameLessonItem)}
                        title="编辑内容"
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => moveLessonUp(index)}
                        disabled={index === 0}
                        title="上移"
                      >
                        <MoveUp className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => moveLessonDown(index)}
                        disabled={index === content.lessons.length - 1}
                        title="下移"
                      >
                        <MoveDown className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeLesson(frameLessonItem.id)}
                        className="text-red-500 hover:text-red-700"
                        title="删除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          {LESSON_TYPES
            .filter(type => type.id !== 'frame') // 防止嵌套框架
            .map(type => (
              <Button
                key={type.id}
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                onClick={() => addLesson(type.id)}
              >
                <div className="mr-1">{type.icon}</div>
                <span>添加{type.name}</span>
              </Button>
            ))}
        </CardFooter>
      </Card>
    </div>
  );
};

export default FrameLessonEditor; 