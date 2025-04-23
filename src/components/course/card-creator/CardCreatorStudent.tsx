import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { CardPreview } from './CardPreview';
import { CardCreatorTask, CardSubmission } from '@/types/card-creator';
import { CardCreatorService } from '@/services/card-creator-service';
import { useCardGenerator } from '@/hooks/useCardGenerator';

interface CardCreatorStudentProps {
  taskId: string;
  studentId: string;
  task: CardCreatorTask;
  onSubmit?: (submission: CardSubmission) => void;
}

export function CardCreatorStudent({ taskId, studentId, task, onSubmit }: CardCreatorStudentProps) {
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedCardUrl, setGeneratedCardUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { generateCard, isLoading: isGeneratorLoading } = useCardGenerator();
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };
  
  const handleGenerateCard = async () => {
    if (!content.trim()) {
      setError('请先输入内容');
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const imageUrl = await generateCard({
        teacherInstructions: task.instructions,
        templateType: task.template_type,
        templateImageUrl: task.template_image_url,
        templateDescription: task.template_description,
        studentContent: content
      });
      
      setGeneratedCardUrl(imageUrl);
    } catch (err) {
      console.error('Error generating card:', err);
      setError('生成卡片时出错，请重试');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleSubmit = async () => {
    if (!generatedCardUrl) {
      setError('请先生成卡片');
      return;
    }
    
    setIsSaving(true);
    try {
      const submission: CardSubmission = {
        task_id: taskId,
        student_id: studentId,
        content: content,
        card_image_url: generatedCardUrl
      };
      
      const savedSubmission = await CardCreatorService.createSubmission(submission);
      if (savedSubmission) {
        onSubmit?.(savedSubmission);
      } else {
        throw new Error('保存提交失败');
      }
    } catch (error) {
      console.error('Error submitting card:', error);
      setError('提交卡片时出错，请重试');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDownload = () => {
    if (!generatedCardUrl) return;
    
    // 创建一个临时链接并触发下载
    const a = document.createElement('a');
    a.href = generatedCardUrl;
    a.download = `card-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  return (
    <div className="card-creator-student space-y-6 p-6 bg-white rounded-lg shadow">
      <div className="task-info space-y-4 bg-gray-50 p-4 rounded-md">
        <h3 className="text-xl font-bold">{task.title}</h3>
        <p className="text-gray-700">{task.instructions}</p>
        
        {task.template_type === 'image' && task.template_image_url && (
          <div className="template-preview">
            <p className="text-sm font-medium mb-2">参考模板：</p>
            <img 
              src={task.template_image_url} 
              alt="Card Template" 
              className="max-h-60 object-contain rounded-md border border-gray-200"
            />
          </div>
        )}
        
        {task.template_type === 'text' && task.template_description && (
          <div className="template-description">
            <p className="text-sm font-medium mb-2">模板描述：</p>
            <p className="text-gray-600 italic text-sm bg-white p-3 rounded-md border border-gray-200">
              {task.template_description}
            </p>
          </div>
        )}
      </div>
      
      <div className="student-input space-y-2">
        <label htmlFor="content" className="font-medium block">
          填写你的内容：
        </label>
        <Textarea 
          id="content"
          value={content}
          onChange={handleInputChange}
          placeholder="请根据上述要求输入你的内容..."
          rows={8}
          className="w-full"
        />
      </div>
      
      {error && (
        <div className="error-message text-red-500">
          {error}
        </div>
      )}
      
      <div className="actions flex space-x-4">
        <Button 
          onClick={handleGenerateCard} 
          disabled={isGenerating || !content.trim() || isGeneratorLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isGenerating ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              <span>生成中...</span>
            </>
          ) : '生成卡片'}
        </Button>
        
        {generatedCardUrl && (
          <Button 
            onClick={handleSubmit}
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isSaving ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                <span>提交中...</span>
              </>
            ) : '提交卡片'}
          </Button>
        )}
      </div>
      
      {generatedCardUrl && (
        <div className="result space-y-4">
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-medium mb-3">生成结果：</h3>
            <CardPreview imageUrl={generatedCardUrl} />
          </div>
          
          <Button 
            onClick={handleDownload}
            variant="outline"
            className="text-blue-600"
          >
            下载卡片
          </Button>
        </div>
      )}
    </div>
  );
} 