import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { CardPreview } from './CardPreview';
import { CardCreatorTask, CardSubmission } from '@/types/card-creator';
import { CardCreatorService } from '@/services/card-creator-service';
import { useCardGenerator } from '@/hooks/useCardGenerator';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Star, Wand2, Download, Send, Check, Clock, Brain, Image as ImageIcon, Code, Lightbulb } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';
import { containsMarkdown } from '@/utils/markdownUtils';

interface CardCreatorStudentProps {
  taskId: string;
  studentId: string;
  task: CardCreatorTask;
  onSubmit?: (submission: CardSubmission) => void;
}

// 生成步骤枚举
enum GenerationStep {
  NotStarted = 'not_started',
  AnalyzingPrompt = 'analyzing_prompt',
  GeneratingHTML = 'generating_html',
  GeneratingImage = 'generating_image',
  RenderingCard = 'rendering_card',
  Completed = 'completed'
}

// AI冷知识数组
const AI_FACTS = [
  "你知道吗？高质量的AI图像生成可能需要1分钟到1分半左右，这是正常的",
  "AI生成的图像每一次都会略有不同，即使是相同的提示词",
  "AI绘画模型曾经学习了数十亿张图片才能创作出精美图像",
  "AI决定图像风格时，会平衡你的描述和它学过的艺术风格",
  "耐心等待是值得的！AI正在创作独一无二的图像",
  "AI图像生成需要强大的GPU算力，一次生成可能要进行上亿次计算",
  "图像生成比HTML创建更耗时，因为需要精确构建每个像素",
  "AI会仔细分析你的输入，确保生成的图像与你的描述匹配",
  "生成图像可能需要一点时间，但我们正在尽可能快地处理",
  "AI是如何生成图像的？它通过逐步细化随机噪点来创建清晰图像",
  "AI需要在GPU上进行数百万次矩阵运算才能生成一张图片",
  "AI图像创作背后有数年的科学研究和工程创新",
  "AI可能会自动判断是否需要生成图像，根据你的内容和模板类型决定",
];

export function CardCreatorStudent({ taskId, studentId, task, onSubmit }: CardCreatorStudentProps) {
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedCardUrl, setGeneratedCardUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // 生成过程状态追踪
  const [currentStep, setCurrentStep] = useState<GenerationStep>(GenerationStep.NotStarted);
  const [progress, setProgress] = useState(0);
  
  // 冷知识轮播状态
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [imageGenerationStartTime, setImageGenerationStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  const { generateCard, isLoading: isGeneratorLoading } = useCardGenerator();
  
  // 轮播冷知识的计时器
  useEffect(() => {
    let factInterval: ReturnType<typeof setInterval>;
    let timeInterval: ReturnType<typeof setInterval>;
    
    if (currentStep === GenerationStep.GeneratingImage) {
      // 设置图像生成开始时间
      if (imageGenerationStartTime === null) {
        setImageGenerationStartTime(Date.now());
      }
      
      // 轮播冷知识
      factInterval = setInterval(() => {
        setCurrentFactIndex(prev => (prev + 1) % AI_FACTS.length);
      }, 5000);
      
      // 更新已用时间
      timeInterval = setInterval(() => {
        if (imageGenerationStartTime) {
          const seconds = Math.floor((Date.now() - imageGenerationStartTime) / 1000);
          setElapsedSeconds(seconds);
        }
      }, 1000);
    } else {
      // 重置图像生成时间
      setImageGenerationStartTime(null);
      setElapsedSeconds(0);
    }
    
    return () => {
      clearInterval(factInterval);
      clearInterval(timeInterval);
    };
  }, [currentStep, imageGenerationStartTime]);
  
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
    setGeneratedCardUrl(null);
    
    // 重置生成状态
    setCurrentStep(GenerationStep.AnalyzingPrompt);
    setProgress(10);
    
    try {
      // 打印学生输入，便于调试
      console.log("[卡片生成] 学生输入内容:", content);
      console.log("[卡片生成] 教师任务说明:", task.instructions);
      
      // 分析提示阶段
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProgress(25);
      
      // 生成HTML阶段
      setCurrentStep(GenerationStep.GeneratingHTML);
      await new Promise(resolve => setTimeout(resolve, 800));
      setProgress(40);
      
      // 开始调用API生成卡片
      const onProgress = (step: string, percent: number) => {
        console.log(`[卡片生成进度] ${step}: ${percent}%`);
        
        if (step === 'html_complete' || step === 'generating_image') {
          setCurrentStep(GenerationStep.GeneratingImage);
          setProgress(60);
        } else if (step === 'no_image_needed') {
          // 跳过图像生成步骤，直接进入渲染阶段
          setCurrentStep(GenerationStep.RenderingCard);
          setProgress(80);
        } else if (step === 'image_complete') {
          setCurrentStep(GenerationStep.RenderingCard);
          setProgress(80);
        }
      };
      
      const imageUrl = await generateCard({
        teacherInstructions: task.instructions,
        templateType: task.template_type,
        templateImageUrl: task.template_image_url,
        templateDescription: task.template_description,
        studentInput: content
      }, onProgress);
      
      // 完成
      setCurrentStep(GenerationStep.Completed);
      setProgress(100);
      
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
  
  // 渲染生成进度指示器
  const renderProgressIndicator = () => {
    if (!isGenerating && currentStep === GenerationStep.NotStarted) {
      return null;
    }
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="generation-progress bg-ghibli-parchment border border-ghibli-teal/30 rounded-xl p-4 my-4"
      >
        <div className="font-medium text-ghibli-deepTeal mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-ghibli-teal" />
          生成进度
        </div>
        
        <div className="steps space-y-2">
          <div className={`step flex items-center gap-2 text-sm ${currentStep === GenerationStep.AnalyzingPrompt ? 'text-ghibli-deepTeal font-medium' : currentStep > GenerationStep.AnalyzingPrompt ? 'text-ghibli-teal' : 'text-gray-400'}`}>
            {currentStep > GenerationStep.AnalyzingPrompt ? <Check size={16} className="text-ghibli-teal" /> : currentStep === GenerationStep.AnalyzingPrompt ? <Clock size={16} className="animate-pulse" /> : <div className="w-4 h-4" />}
            <Brain size={16} className="mr-1" /> 
            分析内容
            {currentStep === GenerationStep.AnalyzingPrompt && (
              <span className="ml-2 text-xs bg-ghibli-lightTeal/50 text-ghibli-deepTeal px-2 py-0.5 rounded-full animate-pulse">
                进行中...
              </span>
            )}
          </div>
          
          <div className={`step flex items-center gap-2 text-sm ${currentStep === GenerationStep.GeneratingHTML ? 'text-ghibli-deepTeal font-medium' : currentStep > GenerationStep.GeneratingHTML ? 'text-ghibli-teal' : 'text-gray-400'}`}>
            {currentStep > GenerationStep.GeneratingHTML ? <Check size={16} className="text-ghibli-teal" /> : currentStep === GenerationStep.GeneratingHTML ? <Clock size={16} className="animate-pulse" /> : <div className="w-4 h-4" />}
            <Code size={16} className="mr-1" /> 
            构建卡片结构
            {currentStep === GenerationStep.GeneratingHTML && (
              <span className="ml-2 text-xs bg-ghibli-lightTeal/50 text-ghibli-deepTeal px-2 py-0.5 rounded-full animate-pulse">
                进行中...
              </span>
            )}
          </div>
          
          <div className={`step flex items-center gap-2 text-sm ${currentStep === GenerationStep.GeneratingImage ? 'text-ghibli-deepTeal font-medium' : currentStep > GenerationStep.GeneratingImage ? 'text-ghibli-teal' : 'text-gray-400'}`}>
            {currentStep > GenerationStep.GeneratingImage ? <Check size={16} className="text-ghibli-teal" /> : currentStep === GenerationStep.GeneratingImage ? <Clock size={16} className="animate-pulse" /> : <div className="w-4 h-4" />}
            <ImageIcon size={16} className="mr-1" /> 
            绘制卡片图像
            {currentStep === GenerationStep.GeneratingImage && (
              <span className="ml-2 text-xs bg-ghibli-lightTeal/50 text-ghibli-deepTeal px-2 py-0.5 rounded-full animate-pulse">
                进行中... {progress}%
              </span>
            )}
          </div>
          
          <div className={`step flex items-center gap-2 text-sm ${currentStep === GenerationStep.RenderingCard ? 'text-ghibli-deepTeal font-medium' : currentStep > GenerationStep.RenderingCard ? 'text-ghibli-teal' : 'text-gray-400'}`}>
            {currentStep > GenerationStep.RenderingCard ? <Check size={16} className="text-ghibli-teal" /> : currentStep === GenerationStep.RenderingCard ? <Clock size={16} className="animate-pulse" /> : <div className="w-4 h-4" />}
            <Sparkles size={16} className="mr-1" /> 
            组合最终卡片
          </div>
        </div>
        
        {/* 冷知识显示区域 */}
        {currentStep === GenerationStep.GeneratingImage && (
          <div className="mt-4 pt-3 border-t border-ghibli-teal/30">
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentFactIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                className="flex items-start space-x-2 text-sm text-ghibli-brown"
              >
                <Lightbulb size={16} className="text-ghibli-sunshine mt-0.5 flex-shrink-0" />
                <p>{AI_FACTS[currentFactIndex]}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    );
  };
  
  return (
    <div className="card-creator-student space-y-4 rounded-xl overflow-hidden bg-gradient-to-br from-ghibli-parchment to-ghibli-cream">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="task-info space-y-3 p-5 bg-white border-b border-ghibli-teal/30"
      >
        <div className="flex items-center mb-2">
          <Star className="h-6 w-6 text-ghibli-sunshine mr-2" />
          <h3 className="text-xl font-bold text-ghibli-deepTeal">{task.title}</h3>
        </div>
        <p className="text-ghibli-brown text-base leading-relaxed">
          {containsMarkdown(task.instructions) ? (
            <MarkdownRenderer>{task.instructions}</MarkdownRenderer>
          ) : (
            task.instructions
          )}
        </p>
        
        {task.template_type === 'image' && task.template_image_url && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="template-preview bg-gradient-to-r from-ghibli-lightTeal to-ghibli-sand/50 p-3 rounded-xl"
          >
            <p className="text-sm font-medium mb-2 text-ghibli-deepTeal flex items-center">
              <Sparkles className="h-4 w-4 mr-1 text-ghibli-teal" /> 参考模板
            </p>
            <div className="flex justify-center">
              <img 
                src={task.template_image_url} 
                alt="Card Template" 
                className="max-h-60 object-contain rounded-md border border-ghibli-teal/30 shadow-sm"
              />
            </div>
          </motion.div>
        )}
        
        {task.template_type === 'text' && task.template_description && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="template-description bg-gradient-to-r from-ghibli-lightTeal to-ghibli-sand/50 p-3 rounded-xl"
          >
            <p className="text-sm font-medium mb-2 text-ghibli-deepTeal flex items-center">
              <Sparkles className="h-4 w-4 mr-1 text-ghibli-teal" /> 模板描述
            </p>
            <div className="bg-white/70 backdrop-blur-sm p-3 rounded-lg border border-ghibli-teal/30 shadow-sm">
              {containsMarkdown(task.template_description) ? (
                <MarkdownRenderer>{task.template_description}</MarkdownRenderer>
              ) : (
                <p className="text-ghibli-brown italic text-base">{task.template_description}</p>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="student-input space-y-2 px-5"
      >
        <label htmlFor="content" className="font-medium block text-ghibli-deepTeal flex items-center">
          <Star className="h-4 w-4 mr-2 text-ghibli-sunshine" />
          填写你的内容：
        </label>
        <Textarea 
          id="content"
          value={content}
          onChange={handleInputChange}
          placeholder="请在这里输入你想要的内容，创造属于你的精彩卡片吧！"
          rows={6}
          className="w-full border-2 border-ghibli-teal/50 focus:border-ghibli-teal rounded-xl shadow-sm focus:ring-2 focus:ring-ghibli-teal/30 transition-all duration-200"
        />
      </motion.div>
      
      {/* 添加进度指示器 */}
      {isGenerating && (
        <motion.div className="px-5">
          {renderProgressIndicator()}
        </motion.div>
      )}
      
      {error && (
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="error-message text-ghibli-rust bg-red-50 p-3 mx-5 rounded-lg border border-ghibli-rust/30"
        >
          {error}
        </motion.div>
      )}
      
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="actions flex space-x-4 px-5 pb-5"
      >
        <Button 
          onClick={handleGenerateCard} 
          disabled={isGenerating || !content.trim() || isGeneratorLoading}
          className="bg-gradient-to-r from-ghibli-teal to-ghibli-deepTeal hover:from-ghibli-deepTeal hover:to-ghibli-deepTeal text-white shadow-md hover:shadow-lg transition-all duration-200 rounded-full pl-4 pr-5 py-6"
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
            className="bg-gradient-to-r from-ghibli-grassGreen to-ghibli-teal hover:from-ghibli-teal hover:to-ghibli-deepTeal text-white shadow-md hover:shadow-lg transition-all duration-200 rounded-full px-5 py-6"
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
          className="result space-y-3 px-5 pb-5"
        >
          <div className="border-t border-ghibli-teal/30 pt-3">
            <h3 className="text-lg font-medium mb-3 text-ghibli-deepTeal flex items-center">
              <Sparkles className="mr-2 h-5 w-5 text-ghibli-sunshine" /> 
              看！你的精彩卡片：
            </h3>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="flex justify-center items-center"
            >
              <div className="w-full max-w-lg">
                <CardPreview imageUrl={generatedCardUrl} />
              </div>
            </motion.div>
          </div>
          
          <div className="flex justify-center mt-3">
            <Button 
              onClick={handleDownload}
              variant="outline"
              className="text-ghibli-deepTeal border-ghibli-teal/50 hover:bg-ghibli-lightTeal/30 rounded-full flex items-center px-5"
            >
              <Download className="mr-2 h-4 w-4" />
              保存我的卡片
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}