import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CardTemplateUploader } from './CardTemplateUploader';
import { supabase } from '@/integrations/supabase/client';
import { CardCreatorTask } from '@/types/card-creator';
import { CardCreatorService } from '@/services/card-creator-service';

interface CardCreatorTeacherProps {
  courseId: string;
  onSave?: (task: CardCreatorTask) => void;
  onCancel?: () => void;
}

export function CardCreatorTeacher({ courseId, onSave, onCancel }: CardCreatorTeacherProps) {
  const [task, setTask] = useState<Partial<CardCreatorTask>>({
    course_id: courseId,
    title: '',
    instructions: '',
    template_type: 'image',
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTask(prev => ({ ...prev, [name]: value }));
  };

  const handleTemplateTypeChange = (value: 'image' | 'text') => {
    setTask(prev => ({ ...prev, template_type: value }));
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    
    setIsUploading(true);
    try {
      // 生成唯一的文件路径
      const filePath = `courses/${courseId}/card-templates/${Date.now()}_${file.name}`;
      
      // 上传到Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('course-assets')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // 获取公开URL
      const { data: urlData } = supabase.storage
        .from('course-assets')
        .getPublicUrl(filePath);
      
      setTask(prev => ({ ...prev, template_image_url: urlData.publicUrl }));
    } catch (error) {
      console.error('模板图片上传失败:', error);
      alert('模板图片上传失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    // 验证必填字段
    if (!task.title || !task.instructions) {
      alert('请填写标题和说明');
      return;
    }

    // 验证模板
    if (task.template_type === 'image' && !task.template_image_url) {
      alert('请上传模板图片');
      return;
    }

    if (task.template_type === 'text' && !task.template_description) {
      alert('请填写模板描述');
      return;
    }

    setIsSaving(true);
    try {
      const createdTask = await CardCreatorService.createTask(task as CardCreatorTask);
      if (createdTask) {
        onSave?.(createdTask);
      } else {
        throw new Error('创建任务失败');
      }
    } catch (error) {
      console.error('保存卡片任务失败:', error);
      alert('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="card-creator-teacher space-y-6 p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">创建卡片制作任务</h2>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>取消</Button>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="title">任务标题</Label>
        <Input 
          id="title"
          name="title"
          value={task.title || ''}
          onChange={handleTextChange}
          placeholder="例：个人职业档案卡制作"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="instructions">任务说明</Label>
        <Textarea 
          id="instructions"
          name="instructions"
          value={task.instructions || ''}
          onChange={handleTextChange}
          placeholder="请详细描述学生需要在卡片中包含的内容和要求..."
          rows={5}
        />
      </div>
      
      <div className="space-y-4">
        <Label>模板类型</Label>
        <RadioGroup 
          value={task.template_type} 
          onValueChange={(value) => handleTemplateTypeChange(value as 'image' | 'text')}
          className="flex space-x-4"
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
      
      {task.template_type === 'image' ? (
        <div className="space-y-2">
          <Label>上传模板图片</Label>
          <CardTemplateUploader 
            onUpload={handleImageUpload} 
            previewUrl={task.template_image_url} 
            isUploading={isUploading}
          />
          <p className="text-sm text-gray-500">
            上传一张图片作为卡片的模板和风格参考。学生将根据此图片的布局和风格创建他们的卡片。
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="template_description">模板描述</Label>
          <Textarea 
            id="template_description"
            name="template_description"
            value={task.template_description || ''}
            onChange={handleTextChange}
            placeholder="详细描述卡片的结构、风格、布局等..."
            rows={5}
          />
          <p className="text-sm text-gray-500">
            请详细描述卡片的布局、设计风格、颜色方案等，AI将根据您的描述生成对应风格的卡片。
          </p>
        </div>
      )}
      
      <div className="flex space-x-4 pt-4">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={isSaving}>
            取消
          </Button>
        )}
        <Button 
          onClick={handleSubmit} 
          disabled={isUploading || isSaving}
        >
          {isSaving ? '保存中...' : '保存任务设置'}
        </Button>
      </div>
    </div>
  );
} 