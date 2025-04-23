import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Lesson, CardCreatorLessonContent } from '@/types/course';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface CardCreatorLessonEditorProps {
  lesson: Lesson;
  onUpdate: (updatedLesson: Lesson) => void;
}

const CardCreatorLessonEditor: React.FC<CardCreatorLessonEditorProps> = ({ lesson, onUpdate }) => {
  const content = lesson.content as CardCreatorLessonContent;
  
  // 使用本地状态跟踪表单变化
  const [instructions, setInstructions] = useState(content.instructions || '');
  const [templateType, setTemplateType] = useState<'image' | 'text'>(content.templateType || 'text');
  const [templateImageUrl, setTemplateImageUrl] = useState(content.templateImageUrl || '');
  const [templateDescription, setTemplateDescription] = useState(content.templateDescription || '');
  
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
            <Label htmlFor="templateImageUrl">模板图片URL</Label>
            <Input 
              id="templateImageUrl"
              value={templateImageUrl}
              onChange={(e) => setTemplateImageUrl(e.target.value)}
              placeholder="输入模板图片的URL"
            />
            <p className="text-sm text-gray-500">
              上传一张图片作为卡片模板的参考，或输入图片URL。
            </p>
            {templateImageUrl && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">预览:</p>
                <img 
                  src={templateImageUrl} 
                  alt="Card Template Preview" 
                  className="max-h-60 object-contain rounded-md border border-gray-200"
                />
              </div>
            )}
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