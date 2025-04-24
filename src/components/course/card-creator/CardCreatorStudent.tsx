import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { CardPreview } from './CardPreview';
import { CardCreatorTask, CardSubmission } from '@/types/card-creator';
import { CardCreatorService } from '@/services/card-creator-service';
import { useCardGenerator } from '@/hooks/useCardGenerator';
import { motion } from 'framer-motion';
import { Sparkles, Star, Wand2, Download, Send } from 'lucide-react';

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
    <div className="card-creator-student space-y-6 rounded-xl overflow-hidden bg-gradient-to-br from-sky-50 to-indigo-50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="task-info space-y-4 p-6 bg-white border-b border-blue-100"
      >
        <div className="flex items-center mb-2">
          <Star className="h-6 w-6 text-amber-400 mr-2" />
          <h3 className="text-xl font-bold text-blue-700">{task.title}</h3>
        </div>
        <p className="text-blue-600 text-base leading-relaxed">{task.instructions}</p>
        
        {task.template_type === 'image' && task.template_image_url && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="template-preview bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl"
          >
            <p className="text-sm font-medium mb-3 text-purple-700 flex items-center">
              <Sparkles className="h-4 w-4 mr-1 text-purple-500" /> 参考模板
            </p>
            <img 
              src={task.template_image_url} 
              alt="Card Template" 
              className="max-h-60 object-contain rounded-md border border-purple-100 shadow-sm mx-auto"
            />
          </motion.div>
        )}
        
        {task.template_type === 'text' && task.template_description && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="template-description bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-xl"
          >
            <p className="text-sm font-medium mb-3 text-blue-700 flex items-center">
              <Sparkles className="h-4 w-4 mr-1 text-blue-500" /> 模板描述
            </p>
            <p className="text-blue-600 italic text-base bg-white/70 backdrop-blur-sm p-4 rounded-lg border border-blue-100 shadow-sm">
              {task.template_description}
            </p>
          </motion.div>
        )}
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="student-input space-y-3 px-6"
      >
        <label htmlFor="content" className="font-medium block text-indigo-700 flex items-center">
          <Star className="h-4 w-4 mr-2 text-amber-400" />
          填写你的内容：
        </label>
        <Textarea 
          id="content"
          value={content}
          onChange={handleInputChange}
          placeholder="请在这里输入你想要的内容，创造属于你的精彩卡片吧！"
          rows={8}
          className="w-full border-2 border-blue-200 focus:border-blue-400 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-200 transition-all duration-200"
        />
      </motion.div>
      
      {error && (
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="error-message text-red-500 bg-red-50 p-3 mx-6 rounded-lg border border-red-100"
        >
          {error}
        </motion.div>
      )}
      
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="actions flex space-x-4 px-6 pb-6"
      >
        <Button 
          onClick={handleGenerateCard} 
          disabled={isGenerating || !content.trim() || isGeneratorLoading}
          className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-md hover:shadow-lg transition-all duration-200 rounded-full pl-4 pr-5 py-6"
        >
          {isGenerating ? (
            <>
              <Spinner className="mr-2 h-5 w-5" />
              <span className="font-medium">魔法生成中...</span>
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-5 w-5" />
              <span className="font-medium">点击生成我的卡片</span>
            </>
          )}
        </Button>
        
        {generatedCardUrl && (
          <Button 
            onClick={handleSubmit}
            disabled={isSaving}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-md hover:shadow-lg transition-all duration-200 rounded-full px-5 py-6"
          >
            {isSaving ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                <span className="font-medium">提交中...</span>
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                <span className="font-medium">提交我的作品</span>
              </>
            )}
          </Button>
        )}
      </motion.div>
      
      {generatedCardUrl && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="result space-y-4 px-6 pb-6"
        >
          <div className="border-t border-blue-100 pt-4">
            <h3 className="text-lg font-medium mb-4 text-indigo-700 flex items-center">
              <Sparkles className="mr-2 h-5 w-5 text-amber-400" /> 
              看！你的精彩卡片：
            </h3>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <CardPreview imageUrl={generatedCardUrl} />
            </motion.div>
          </div>
          
          <Button 
            onClick={handleDownload}
            variant="outline"
            className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 rounded-full flex items-center px-5"
          >
            <Download className="mr-2 h-4 w-4" />
            保存我的卡片
          </Button>
        </motion.div>
      )}
    </div>
  );
} 