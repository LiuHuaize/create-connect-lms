import React, { useState, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { CardCreatorTask } from '@/types/card-creator';

interface CardTemplateConfigProps {
  initialData?: Partial<CardCreatorTask>;
  onSave: (data: Partial<CardCreatorTask>) => Promise<void>;
  isSaving: boolean;
}

export function CardTemplateConfig({
  initialData,
  onSave,
  isSaving
}: CardTemplateConfigProps) {
  const [formData, setFormData] = useState<Partial<CardCreatorTask>>({
    title: '',
    description: '',
    template_type: 'image',
    requires_image: false,
    max_submissions: 1,
    due_date: '',
    ...initialData
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: '',
        description: '',
        template_type: 'image',
        requires_image: false,
        max_submissions: 1,
        due_date: '',
        ...initialData
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'number' ? parseInt(value) : value;
    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">任务标题</Label>
        <Input
          id="title"
          name="title"
          placeholder="输入卡片任务标题"
          value={formData.title || ''}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">任务描述</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="详细描述卡片制作任务要求和目标"
          value={formData.description || ''}
          onChange={handleChange}
          rows={4}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="template_type">模板类型</Label>
        <Select
          value={formData.template_type || 'image'}
          onValueChange={(value) => handleSelectChange('template_type', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="选择模板类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="image">图片模板</SelectItem>
            <SelectItem value="text">文本描述模板</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.template_type === 'text' && (
        <div className="space-y-2">
          <Label htmlFor="template_text">模板文本描述</Label>
          <Textarea
            id="template_text"
            name="template_text"
            placeholder="详细描述卡片的外观，元素和样式"
            value={formData.template_text || ''}
            onChange={handleChange}
            rows={4}
          />
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Switch
          id="requires_image"
          checked={formData.requires_image || false}
          onCheckedChange={(checked) => handleSwitchChange('requires_image', checked)}
        />
        <Label htmlFor="requires_image">需要学生上传图片</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="max_submissions">最大提交次数</Label>
        <Input
          id="max_submissions"
          name="max_submissions"
          type="number"
          min={1}
          value={formData.max_submissions || 1}
          onChange={handleChange}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="due_date">截止日期</Label>
        <Input
          id="due_date"
          name="due_date"
          type="datetime-local"
          value={formData.due_date || ''}
          onChange={handleChange}
        />
      </div>

      <Button type="submit" disabled={isSaving} className="w-full">
        {isSaving ? '保存中...' : '保存模板设置'}
      </Button>
    </form>
  );
} 