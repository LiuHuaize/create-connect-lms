import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Upload, Image, Music, Info, X, Trash } from 'lucide-react';
import { HotspotLessonContent, Hotspot, Lesson } from '@/types/course';
import HotspotCreator from './HotspotCreator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import CustomEditor from './CustomEditor';
import HotspotSaveButton from './HotspotSaveButton';

interface HotspotEditorProps {
  lesson: Lesson;
  onUpdate: (updatedLesson: Lesson) => void;
  onSave?: () => Promise<void | string | undefined>;
  isSaving?: boolean;
}

const HotspotEditor: React.FC<HotspotEditorProps> = ({ 
  lesson, 
  onUpdate, 
  onSave, 
  isSaving = false 
}) => {
  // 获取课程内容，如果不存在则初始化
  const initialContent: HotspotLessonContent = lesson.content as HotspotLessonContent || {
    backgroundImage: '',
    introduction: '',
    hotspots: []
  };

  // 状态
  const [content, setContent] = useState<HotspotLessonContent>(initialContent);
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  // 引用DOM元素
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  
  // 存储桶名称
  const STORAGE_BUCKET = 'course-assets';

  // 当内容变化时更新课程（添加防抖）
  const debounceTimeoutRef = useRef<number | null>(null);
  
  const debouncedUpdate = useCallback((updatedContent: HotspotLessonContent) => {
    if (debounceTimeoutRef.current) {
      window.clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = window.setTimeout(() => {
      onUpdate({
        ...lesson,
        content: updatedContent
      });
      console.log('热点课程已更新', updatedContent);
    }, 500); // 500ms防抖
  }, [lesson, onUpdate]);

  useEffect(() => {
    debouncedUpdate(content);
    
    return () => {
      if (debounceTimeoutRef.current) {
        window.clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [content, debouncedUpdate]);

  // 更新背景图片
  const handleBackgroundImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请上传图片文件');
      return;
    }

    setIsUploading(true);

    try {
      // 生成唯一文件名
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${lesson.id || 'new'}/background_${fileName}`;

      // 上传到Supabase存储
      const { error: uploadError, data } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 获取公共URL
      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      // 更新内容
      setContent({
        ...content,
        backgroundImage: urlData.publicUrl
      });

      toast.success('背景图片上传成功');
    } catch (error) {
      console.error('上传失败:', error);
      toast.error('图片上传失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  // 更新热点列表
  const handleUpdateHotspots = (updatedHotspots: Hotspot[]) => {
    setContent({
      ...content,
      hotspots: updatedHotspots
    });
  };

  // 打开热点编辑
  const handleEditHotspot = (hotspot: Hotspot) => {
    // 深拷贝热点对象，避免引用问题
    setActiveHotspot({...hotspot});
  };

  // 更新热点详情
  const handleUpdateHotspotDetails = (updatedHotspot: Hotspot) => {
    // 先检查热点是否存在
    if (!updatedHotspot || !updatedHotspot.id) return;
    
    const updatedHotspots = content.hotspots.map(h => 
      h.id === updatedHotspot.id ? {...updatedHotspot} : h
    );
    
    // 更新content状态
    setContent({
      ...content,
      hotspots: updatedHotspots
    });
    
    // 同时更新激活的热点状态
    setActiveHotspot({...updatedHotspot});
  };

  // 当焦点在输入框时防止事件冒泡
  useEffect(() => {
    if (isFocused) {
      // 添加全局事件阻止器
      const stopEvents = (e: MouseEvent) => {
        if (descriptionRef.current?.contains(e.target as Node) || 
            titleRef.current?.contains(e.target as Node)) {
          e.stopPropagation();
        }
      };
      
      document.addEventListener('mousedown', stopEvents, true);
      document.addEventListener('click', stopEvents, true);
      
      return () => {
        document.removeEventListener('mousedown', stopEvents, true);
        document.removeEventListener('click', stopEvents, true);
      };
    }
  }, [isFocused]);

  // 上传热点音频
  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeHotspot) return;
    
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    if (!file.type.startsWith('audio/')) {
      toast.error('请上传音频文件');
      return;
    }

    setIsUploading(true);

    try {
      // 生成唯一文件名
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${lesson.id || 'new'}/hotspot_${activeHotspot.id}_audio_${fileName}`;

      // 上传到Supabase存储
      const { error: uploadError, data } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 获取公共URL
      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      // 更新热点
      const updatedHotspot = {
        ...activeHotspot,
        audioUrl: urlData.publicUrl
      };
      
      handleUpdateHotspotDetails(updatedHotspot);
      setActiveHotspot(updatedHotspot);

      toast.success('音频上传成功');
    } catch (error) {
      console.error('上传失败:', error);
      toast.error('音频上传失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  // 上传热点图片
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeHotspot) return;
    
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请上传图片文件');
      return;
    }

    setIsUploading(true);

    try {
      // 生成唯一文件名
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${lesson.id || 'new'}/hotspot_${activeHotspot.id}_image_${fileName}`;

      // 上传到Supabase存储
      const { error: uploadError, data } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 获取公共URL
      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      // 更新热点
      const updatedHotspot = {
        ...activeHotspot,
        imageUrl: urlData.publicUrl
      };
      
      handleUpdateHotspotDetails(updatedHotspot);
      setActiveHotspot(updatedHotspot);

      toast.success('图片上传成功');
    } catch (error) {
      console.error('上传失败:', error);
      toast.error('图片上传失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  // 删除热点音频
  const handleRemoveAudio = () => {
    if (!activeHotspot) return;
    
    const updatedHotspot = {
      ...activeHotspot,
      audioUrl: undefined
    };
    
    handleUpdateHotspotDetails(updatedHotspot);
    setActiveHotspot(updatedHotspot);
    toast.success('已删除音频');
  };

  // 删除热点图片
  const handleRemoveImage = () => {
    if (!activeHotspot) return;
    
    const updatedHotspot = {
      ...activeHotspot,
      imageUrl: undefined
    };
    
    handleUpdateHotspotDetails(updatedHotspot);
    setActiveHotspot(updatedHotspot);
    toast.success('已删除图片');
  };

  // 强制立即保存当前内容（不使用防抖）
  const forceSave = useCallback(() => {
    // 先清除可能存在的防抖计时器
    if (debounceTimeoutRef.current) {
      window.clearTimeout(debounceTimeoutRef.current);
    }
    
    // 立即更新课时内容
    onUpdate({
      ...lesson,
      content: content
    });
    
    console.log('热点课程内容已强制更新', content);
    
    // 如果提供了外部保存函数，调用它
    return onSave?.();
  }, [content, lesson, onSave, onUpdate]);

  return (
    <div className="space-y-6">
      {/* 基本信息 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>交互式热点课程编辑器</CardTitle>
          {onSave && (
            <HotspotSaveButton onSave={forceSave} isSaving={isSaving} />
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 介绍文字 */}
          <div className="space-y-2">
            <Label htmlFor="introduction">介绍文字（可选）</Label>
            <Textarea
              id="introduction"
              placeholder="输入课程介绍或指导文字..."
              value={content.introduction || ''}
              onChange={(e) => {
                e.stopPropagation();
                setContent({ ...content, introduction: e.target.value });
              }}
              onFocus={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="min-h-[100px] pointer-events-auto"
            />
          </div>
          
          {/* 背景图片上传 */}
          <div className="space-y-2">
            <Label>背景图片</Label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label
                  htmlFor="bg-image-upload"
                  className="flex items-center gap-2 cursor-pointer p-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Upload className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {isUploading ? '上传中...' : '上传背景图片'}
                  </span>
                  {isUploading && <Spinner size="sm" className="ml-2" />}
                </Label>
                <Input
                  id="bg-image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleBackgroundImageUpload}
                  disabled={isUploading}
                />
              </div>
              
              {content.backgroundImage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setContent({ ...content, backgroundImage: '' })}
                >
                  <Trash className="h-4 w-4 mr-1" /> 删除
                </Button>
              )}
            </div>
            
            {/* 预览 */}
            {content.backgroundImage && (
              <div className="mt-4 border rounded-md overflow-hidden">
                <img
                  src={content.backgroundImage}
                  alt="背景图片"
                  className="w-full max-h-[300px] object-contain"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 热点创建器 */}
      {content.backgroundImage ? (
        <Card>
          <CardHeader>
            <CardTitle>热点创建</CardTitle>
          </CardHeader>
          <CardContent>
            <HotspotCreator
              backgroundImage={content.backgroundImage}
              hotspots={content.hotspots}
              onUpdateHotspots={handleUpdateHotspots}
              onEditHotspot={handleEditHotspot}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">请先上传背景图片才能创建热点</p>
          </CardContent>
        </Card>
      )}

      {/* 热点编辑 */}
      {activeHotspot && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>编辑热点 #{content.hotspots.findIndex(h => h.id === activeHotspot.id) + 1}</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setActiveHotspot(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4" onClick={(e) => e.stopPropagation()}>
            <Tabs defaultValue="basic">
              <TabsList className="mb-4">
                <TabsTrigger value="basic" onClick={(e) => e.stopPropagation()}>基本信息</TabsTrigger>
                <TabsTrigger value="media" onClick={(e) => e.stopPropagation()}>媒体内容</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4" onClick={(e) => e.stopPropagation()}>
                {/* 标题 */}
                <div>
                  <Label htmlFor="title">标题</Label>
                  <CustomEditor
                    value={activeHotspot.title}
                    onChange={(value) => {
                      const updatedHotspot = {
                        ...activeHotspot,
                        title: value
                      };
                      handleUpdateHotspotDetails(updatedHotspot);
                    }}
                    placeholder="热点标题"
                    minHeight="40px"
                  />
                </div>
                
                {/* 描述 */}
                <div>
                  <Label htmlFor="description">描述</Label>
                  <CustomEditor
                    value={activeHotspot.description}
                    onChange={(value) => {
                      const updatedHotspot = {
                        ...activeHotspot,
                        description: value
                      };
                      handleUpdateHotspotDetails(updatedHotspot);
                    }}
                    placeholder="热点描述内容"
                    minHeight="100px"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="media" className="space-y-4" onClick={(e) => e.stopPropagation()}>
                {/* 图片上传 */}
                <div className="space-y-2">
                  <Label>热点图片（可选）</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Label
                        htmlFor="hotspot-image-upload"
                        className="flex items-center gap-2 cursor-pointer p-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <Image className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {isUploading ? '上传中...' : '上传图片'}
                        </span>
                        {isUploading && <Spinner size="sm" className="ml-2" />}
                      </Label>
                      <Input
                        id="hotspot-image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={isUploading}
                      />
                    </div>
                    
                    {activeHotspot.imageUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveImage}
                      >
                        <Trash className="h-4 w-4 mr-1" /> 删除
                      </Button>
                    )}
                  </div>
                  
                  {/* 图片预览 */}
                  {activeHotspot.imageUrl && (
                    <div className="mt-2 border rounded-md overflow-hidden">
                      <img
                        src={activeHotspot.imageUrl}
                        alt={activeHotspot.title}
                        className="w-full max-h-[150px] object-contain"
                      />
                    </div>
                  )}
                </div>
                
                <Separator />
                
                {/* 音频上传 */}
                <div className="space-y-2">
                  <Label>热点音频（可选）</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Label
                        htmlFor="hotspot-audio-upload"
                        className="flex items-center gap-2 cursor-pointer p-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <Music className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {isUploading ? '上传中...' : '上传音频'}
                        </span>
                        {isUploading && <Spinner size="sm" className="ml-2" />}
                      </Label>
                      <Input
                        id="hotspot-audio-upload"
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={handleAudioUpload}
                        disabled={isUploading}
                      />
                    </div>
                    
                    {activeHotspot.audioUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveAudio}
                      >
                        <Trash className="h-4 w-4 mr-1" /> 删除
                      </Button>
                    )}
                  </div>
                  
                  {/* 音频预览 */}
                  {activeHotspot.audioUrl && (
                    <div className="mt-2">
                      <audio
                        controls
                        src={activeHotspot.audioUrl}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
      
      {/* 热点列表预览 */}
      {content.hotspots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>热点列表</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {content.hotspots.map((hotspot, index) => (
                <div
                  key={hotspot.id}
                  className="p-3 border rounded-md flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => setActiveHotspot(hotspot)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs">
                      {index + 1}
                    </div>
                    <span className="font-medium">{hotspot.title}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <span>坐标: {hotspot.x.toFixed(1)}%, {hotspot.y.toFixed(1)}%</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-2 h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        const updatedHotspots = content.hotspots.filter(h => h.id !== hotspot.id);
                        handleUpdateHotspots(updatedHotspots);
                        if (activeHotspot?.id === hotspot.id) {
                          setActiveHotspot(null);
                        }
                      }}
                    >
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          {onSave && (
            <CardFooter className="flex justify-end border-t pt-4">
              <HotspotSaveButton onSave={forceSave} isSaving={isSaving} />
            </CardFooter>
          )}
        </Card>
      )}
    </div>
  );
};

export default HotspotEditor; 