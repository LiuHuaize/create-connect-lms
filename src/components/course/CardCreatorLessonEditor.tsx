import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Lesson, CardCreatorLessonContent } from '@/types/course';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CardTemplateUploader } from './card-creator/CardTemplateUploader';
import { supabase } from '@/integrations/supabase/client';

interface CardCreatorLessonEditorProps {
  lesson: Lesson;
  onUpdate: (updatedLesson: Lesson) => void;
}

const CardCreatorLessonEditor: React.FC<CardCreatorLessonEditorProps> = ({ lesson, onUpdate }) => {
  const content = lesson.content as CardCreatorLessonContent;
  // Supabase存储桶名称
  const STORAGE_BUCKET = 'course-assets';
  
  // 使用本地状态跟踪表单变化
  const [instructions, setInstructions] = useState(content.instructions || '');
  const [templateType, setTemplateType] = useState<'image' | 'text'>(content.templateType || 'text');
  const [templateImageUrl, setTemplateImageUrl] = useState(content.templateImageUrl || '');
  const [templateDescription, setTemplateDescription] = useState(content.templateDescription || '');
  const [isUploading, setIsUploading] = useState(false);
  
  // 当表单值变化时更新课程内容
  useEffect(() => {
    const updatedContent: CardCreatorLessonContent = {
      instructions,
      templateType,
      ...(templateType === 'image' ? { templateImageUrl } : { templateDescription }),
    };
    
    onUpdate({
      ...lesson,
      content: updatedContent
    });
  }, [instructions, templateType, templateImageUrl, templateDescription]);
  
  // 处理图片上传
  const handleImageUpload = async (file: File) => {
    if (!file) return;
    
    setIsUploading(true);
    try {
      console.log('开始上传图片，模块ID:', lesson.module_id);
      
      // 检查lesson.module_id是否存在
      if (!lesson.module_id) {
        throw new Error('模块ID不存在');
      }
      
      // 先获取课程ID
      const { data: moduleData, error: moduleError } = await supabase
        .from('course_modules')
        .select('course_id')
        .eq('id', lesson.module_id)
        .single();
      
      if (moduleError) {
        console.error('获取课程ID时出错:', moduleError);
        throw moduleError;
      }
      
      if (!moduleData?.course_id) {
        console.error('无法获取课程ID，moduleData:', moduleData);
        throw new Error('无法获取课程ID');
      }
      
      const courseId = moduleData.course_id;
      console.log('获取到课程ID:', courseId);
      
      // 获取文件扩展名并生成安全的文件名（不含中文字符）
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 10);
      const safeFileName = `${timestamp}_${randomString}.${fileExtension}`;
      
      // 生成唯一的文件路径
      const filePath = `courses/${courseId}/card-templates/${safeFileName}`;
      console.log('文件路径:', filePath);
      console.log('使用存储桶:', STORAGE_BUCKET);
      
      // 上传到Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file);
      
      if (uploadError) {
        console.error('Supabase上传错误详情:', JSON.stringify(uploadError));
        throw uploadError;
      }
      
      console.log('上传成功:', uploadData);
      
      // 获取公开URL
      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);
      
      console.log('获取到的公共URL:', urlData.publicUrl);
      setTemplateImageUrl(urlData.publicUrl);
    } catch (error) {
      console.error('模板图片上传失败:', error);
      alert(`模板图片上传失败，请重试。错误: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>卡片创建任务</CardTitle>
        <CardDescription>设置学生的卡片创建任务，提供说明和模板</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="instructions">任务说明</Label>
          <Textarea 
            id="instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="详细描述学生需要在卡片中包含的内容和要求..."
            rows={5}
          />
          <p className="text-sm text-gray-500">
            请详细说明学生需要在卡片中包含哪些内容以及评分标准等。
          </p>
        </div>
        
        <div className="space-y-4">
          <Label>模板类型</Label>
          <RadioGroup 
            value={templateType} 
            onValueChange={(value) => setTemplateType(value as 'image' | 'text')}
            className="flex flex-col space-y-1"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="image" id="image" />
              <Label htmlFor="image">图片模板</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="text" id="text" />
              <Label htmlFor="text">文字描述</Label>
            </div>
          </RadioGroup>
        </div>
        
        {templateType === 'image' ? (
          <div className="space-y-2">
            <Label>上传模板图片</Label>
            <CardTemplateUploader 
              onUpload={handleImageUpload} 
              previewUrl={templateImageUrl} 
              isUploading={isUploading}
            />
            <p className="text-sm text-gray-500">
              上传一张图片作为卡片模板的参考，学生将根据此模板创建卡片。
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="templateDescription">模板描述</Label>
            <Textarea 
              id="templateDescription"
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              placeholder="详细描述卡片的结构、风格、布局等..."
              rows={5}
            />
            <p className="text-sm text-gray-500">
              请详细描述卡片的布局、设计风格、颜色方案等，AI将根据您的描述生成对应风格的卡片。
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <p className="text-sm text-gray-500">
          学生会根据您的设置创建个性化卡片，卡片将使用AI根据您的模板样式生成。
        </p>
      </CardFooter>
    </Card>
  );
};

export default CardCreatorLessonEditor; 