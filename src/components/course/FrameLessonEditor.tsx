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
  LessonContent,
  HotspotLessonContent
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
  onCourseDataSaved?: (updatedFrameLesson: Lesson) => Promise<string | undefined | void>;
}

const FrameLessonEditor: React.FC<FrameLessonEditorProps> = ({ lesson, onSave, onCourseDataSaved }) => {
  const [content, setContent] = useState<FrameLessonContent>(
    (lesson.content as FrameLessonContent) || {
      title: lesson.title || '课程框架',
      description: '',
      lessons: []
    }
  );
  
  const [currentEditingLesson, setCurrentEditingLesson] = useState<Lesson | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Debounced save function for title and description
  const debouncedSaveFrameDetails = useCallback(
    debounce((newFrameContent: FrameLessonContent) => {
      if (onCourseDataSaved) {
        const frameLessonToSave: Lesson = {
          ...lesson,
          content: newFrameContent,
        };
        onCourseDataSaved(frameLessonToSave)
          .then(() => toast.success('框架信息已自动保存'))
          .catch(() => toast.error('框架信息自动保存失败'));
      }
    }, 1000),
    [lesson, onCourseDataSaved] // Dependencies for useCallback
  );
  
  const handleDescriptionChange = (value: string) => {
    const newContent = { ...content, description: value };
    setContent(newContent);
    onSave(newContent); // Inform parent about content change
    debouncedSaveFrameDetails(newContent);
  };

  const handleTitleChange = (value: string) => {
    const newContent = { ...content, title: value };
    setContent(newContent);
    onSave(newContent); // Inform parent about content change
    debouncedSaveFrameDetails(newContent);
  };
  
  const saveFrameToDatabase = useCallback(async (newFrameContent: FrameLessonContent, successMessage: string) => {
    if (!onCourseDataSaved) return;
    
    setIsSaving(true);
    const frameLessonToSave: Lesson = {
      ...lesson, // 'lesson' is the prop for FrameLessonEditor (the FrameLesson itself)
      content: newFrameContent,
    };

    try {
      const toastId = toast.loading("正在保存框架内容...");
      await onCourseDataSaved(frameLessonToSave);
      toast.success(successMessage, { id: toastId });
    } catch (error) {
      console.error('保存框架课时失败:', error);
      toast.error('保存框架内容失败，请重试');
    } finally {
      setIsSaving(false);
    }
  }, [lesson, onCourseDataSaved]);


  const addLesson = (type: LessonType) => {
    const newLessonId = uuidv4();
    const newLesson: Lesson = {
      id: newLessonId,
      title: `新${getLessonTypeName(type)}`,
      type,
      content: getInitialContentByType(type),
      module_id: lesson.module_id, // Should this be the FrameLesson's id or its module_id?
      order_index: content.lessons.length
    };

    const newLessons = [...content.lessons, newLesson];
    const newContent = { ...content, lessons: newLessons };
    
    setContent(newContent);
    onSave(newContent); // Update parent's state (LessonEditor for Frame)
    
    // Save the whole frame lesson
    saveFrameToDatabase(newContent, `已添加新课时: ${newLesson.title}`);
  };

  const removeLesson = (lessonId: string) => {
    const lessonToRemove = content.lessons.find(l => l.id === lessonId);
    const lessonTitle = lessonToRemove?.title || '课时';
    
    const newLessons = content.lessons.filter(l => l.id !== lessonId)
      .map((l, index) => ({ ...l, order_index: index }));
    
    const newContent = { ...content, lessons: newLessons };
    setContent(newContent);
    onSave(newContent);
    saveFrameToDatabase(newContent, `已删除课时: "${lessonTitle}"`);
  };
  
  const updateLessonTitle = (lessonId: string, newTitle: string) => {
    const newLessons = content.lessons.map(l => 
      l.id === lessonId ? { ...l, title: newTitle } : l
    );
    const newContent = { ...content, lessons: newLessons };
    setContent(newContent);
    onSave(newContent);
    // Title changes are often intermediate, save themまとめて
    // Consider debouncing this save or saving on blur/explicit action
    saveFrameToDatabase(newContent, `课时 "${newTitle}" 标题已更新`);
  };

  const moveLessonUp = (index: number) => {
    if (index <= 0) return;
    const newLessons = [...content.lessons];
    [newLessons[index - 1], newLessons[index]] = [newLessons[index], newLessons[index - 1]];
    const reorderedLessons = newLessons.map((l, idx) => ({ ...l, order_index: idx }));
    const newContent = { ...content, lessons: reorderedLessons };
    setContent(newContent);
    onSave(newContent);
    saveFrameToDatabase(newContent, '课时顺序已更新');
  };

  const moveLessonDown = (index: number) => {
    if (index >= content.lessons.length - 1) return;
    const newLessons = [...content.lessons];
    [newLessons[index + 1], newLessons[index]] = [newLessons[index], newLessons[index + 1]];
    const reorderedLessons = newLessons.map((l, idx) => ({ ...l, order_index: idx }));
    const newContent = { ...content, lessons: reorderedLessons };
    setContent(newContent);
    onSave(newContent);
    saveFrameToDatabase(newContent, '课时顺序已更新');
  };

  const editLesson = (lessonToEdit: Lesson) => {
    setCurrentEditingLesson(lessonToEdit);
  };

  // Called when the child LessonEditor (for sub-lesson) calls its onSave (e.g., "Back" button)
  const handleSaveSubLessonAndExit = (updatedSubLesson: Lesson | null) => {
    if (updatedSubLesson) {
      const newLessons = content.lessons.map(l =>
        l.id === updatedSubLesson.id ? updatedSubLesson : l
      );
      const newContent = { ...content, lessons: newLessons };
      setContent(newContent);
      onSave(newContent); 
      // Here, we assume the sub-lesson's content is finalized by the sub-editor.
      // We now save the entire frame.
      saveFrameToDatabase(newContent, `子课时 "${updatedSubLesson.title}" 已更新并关闭编辑器`);
    }
    setCurrentEditingLesson(null);
  };
  
  // Called when the child LessonEditor (for sub-lesson) calls its onContentChange
  const handleSubLessonContentChange = (subLessonId: string, newSubLessonContent: LessonContent) => {
    const newLessons = content.lessons.map(l =>
      l.id === subLessonId ? { ...l, content: newSubLessonContent } : l
    );
    const newFrameContent = { ...content, lessons: newLessons };
    setContent(newFrameContent);
    // Propagate the change upwards immediately for real-time updates or auto-save features in parent
    onSave(newFrameContent); 
    // Optionally, debounce a full save of the frame here if needed for auto-save
    // debouncedSaveFrameDetails(newFrameContent); 
  };

  // This is called when the "Save" button INSIDE the sub-lesson's editor is clicked
  const handleSubLessonEditorDirectSave = async (updatedSubLessonFromEditor: Lesson): Promise<string | undefined | void> => {
    console.log('FrameLessonEditor: handleSubLessonEditorDirectSave received updated sub-lesson:', updatedSubLessonFromEditor);
    
    // 1. Update the sub-lesson within the FrameLessonEditor's content state
    const newLessons = content.lessons.map(l =>
      l.id === updatedSubLessonFromEditor.id
        ? updatedSubLessonFromEditor // Use the complete updated sub-lesson from the editor
        : l
    );
    const newFrameContent = { ...content, lessons: newLessons };
    setContent(newFrameContent); // Update FrameLessonEditor's local state

    // 2. Propagate the updated FrameLessonContent upwards to FrameLessonEditor's parent (e.g., LessonEditor for Frame)
    // This onSave is FrameLessonEditor's own prop
    onSave(newFrameContent);

    // 3. Now, trigger the save of the entire FrameLesson (which includes the updated sub-lesson) to the database.
    // This onCourseDataSaved is FrameLessonEditor's own prop.
    if (onCourseDataSaved) {
      const frameLessonToSave: Lesson = {
        ...lesson, // 'lesson' is the FrameLesson prop passed to FrameLessonEditor
        content: newFrameContent, // Embed the updated FrameLessonContent which now has the new sub-lesson data
      };
      console.log('FrameLessonEditor: Calling its own onCourseDataSaved (for the FrameLesson) with:', frameLessonToSave);
      // The promise returned by onCourseDataSaved (which eventually calls useCourseCreator) will be returned
      return onCourseDataSaved(frameLessonToSave);
    }
    console.warn('FrameLessonEditor: onCourseDataSaved prop is not defined. Cannot save frame to DB.');
    return undefined;
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
          onSave={handleSaveSubLessonAndExit}
          onContentChange={(newSubLessonC) => {
            handleSubLessonContentChange(currentEditingLesson.id, newSubLessonC);
          }}
          onCourseDataSaved={handleSubLessonEditorDirectSave}
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
          onClick={() => {
            if (onCourseDataSaved) {
              saveFrameToDatabase(content, '框架课时已成功保存到数据库');
            }
          }}
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