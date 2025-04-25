import { useState } from 'react';
import { generateCompleteCard } from '../services/ai/cardCreator';
import { htmlToImage, downloadHtmlImage } from '../utils/html2image';
import { supabase } from '../integrations/supabase/client';

// 日志记录函数
function logInfo(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [useCardGenerator-INFO] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

function logError(message: string, error: any) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [useCardGenerator-ERROR] ${message}`);
  console.error(error);
}

interface CardGeneratorParams {
  teacherInstructions: string;
  templateType: 'image' | 'text';
  templateImageUrl?: string;
  templateDescription?: string;
  studentInput: string;
}

interface CardGeneratorResult {
  htmlContent: string | null;
  imageDataUrl: string | null;
  imageUrl: string | null;
}

export function useCardGenerator() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CardGeneratorResult>({
    htmlContent: null,
    imageDataUrl: null,
    imageUrl: null
  });

  // 生成卡片的主要函数
  const generateCard = async (
    params: CardGeneratorParams,
    onProgress?: (step: string, percent: number) => void
  ): Promise<string> => {
    logInfo("useCardGenerator: 开始生成卡片", { 
      templateType: params.templateType,
      studentInputLength: params.studentInput.length
    });
    
    setIsLoading(true);
    setError(null);
    
    try {
      // 1. 调用后端服务生成HTML和可能的图像
      logInfo("useCardGenerator: 调用generateCompleteCard");
      const startTime = Date.now();
      
      // 提供进度回调
      const htmlProgressCallback = () => {
        onProgress?.('html_start', 30);
      };
      
      // 请求后5秒模拟HTML生成完成
      setTimeout(() => {
        onProgress?.('html_complete', 60);
      }, 5000);
      
      const { html, imageUrl, hasImageGeneration } = await generateCompleteCard(params);
      
      // 如果需要生成图像，通知进度
      if (hasImageGeneration) {
        onProgress?.('generating_image', 60);
        // 图像生成完成通知
        onProgress?.('image_complete', 80);
      } else {
        // 如果不需要生成图像，跳过图像生成步骤
        onProgress?.('no_image_needed', 80);
      }
      
      const apiTime = Date.now() - startTime;
      logInfo(`useCardGenerator: generateCompleteCard完成，耗时${apiTime}ms`, {
        htmlLength: html.length,
        hasImageUrl: !!imageUrl,
        needsImageGeneration: hasImageGeneration
      });
      
      // 修复：处理不需要图像时可能存在的占位符
      let finalHtml = html;
      if (!imageUrl && finalHtml.includes('__IMAGE_PLACEHOLDER__')) {
        // 如果没有图像URL但HTML中有占位符，替换为空或默认图像
        finalHtml = finalHtml.replace('__IMAGE_PLACEHOLDER__', '');
        logInfo("useCardGenerator: 已移除HTML中的图像占位符，因为没有生成图像");
      }
      
      // 保存HTML内容
      setResult(prev => ({ ...prev, htmlContent: finalHtml, imageUrl }));
      logInfo("useCardGenerator: HTML内容已保存到状态");
      
      // 2. 将HTML转换为图像
      logInfo("useCardGenerator: 开始将HTML转换为图像");
      onProgress?.('rendering_html', 85);
      
      const htmlToImageStartTime = Date.now();
      const imageDataUrl = await htmlToImage(finalHtml);
      const htmlToImageTime = Date.now() - htmlToImageStartTime;
      logInfo(`useCardGenerator: HTML转图像完成，耗时${htmlToImageTime}ms`, {
        imageDataUrlLength: imageDataUrl.length
      });
      
      // 渲染完成
      onProgress?.('render_complete', 95);
      
      // 保存生成的图像数据URL
      setResult(prev => ({ ...prev, imageDataUrl }));
      logInfo("useCardGenerator: 图像数据URL已保存到状态");
      
      // 全部完成
      setTimeout(() => {
        onProgress?.('complete', 100);
      }, 500);
      
      return imageDataUrl;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '生成卡片时发生未知错误';
      logError("useCardGenerator: 生成卡片失败", err);
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
      logInfo("useCardGenerator: 卡片生成流程结束，isLoading设置为false");
    }
  };

  // 将生成的卡片保存到Supabase Storage
  const saveCardToStorage = async (
    courseId: string, 
    taskId: string, 
    userId: string
  ): Promise<string> => {
    logInfo("useCardGenerator: 开始保存卡片到存储", {
      courseId, taskId, userId
    });
    
    if (!result.imageDataUrl) {
      const errorMsg = '没有可保存的卡片图像';
      logError("useCardGenerator: " + errorMsg, null);
      throw new Error(errorMsg);
    }
    
    try {
      // 转换数据URL为Blob
      logInfo("useCardGenerator: 转换数据URL为Blob");
      const base64Data = result.imageDataUrl.split(',')[1];
      const blob = await fetch(`data:image/png;base64,${base64Data}`).then(res => res.blob());
      
      // 生成唯一的文件路径
      const timestamp = new Date().toISOString();
      const filePath = `cards/${courseId}/${taskId}/${userId}_${timestamp}.png`;
      logInfo("useCardGenerator: 生成的文件路径", { filePath });
      
      // 上传到Supabase Storage
      logInfo("useCardGenerator: 开始上传到Supabase Storage");
      const uploadStartTime = Date.now();
      const { data, error } = await supabase.storage
        .from('student-submissions')
        .upload(filePath, blob, {
          contentType: 'image/png',
          upsert: false // 不覆盖，保留多个版本
        });
      const uploadTime = Date.now() - uploadStartTime;
      
      if (error) {
        logError("useCardGenerator: 保存卡片到存储失败", error);
        throw new Error(`保存卡片失败: ${error.message}`);
      }
      
      logInfo(`useCardGenerator: 上传成功，耗时${uploadTime}ms`, { data });
      
      // 获取公开URL
      const { data: urlData } = supabase.storage
        .from('student-submissions')
        .getPublicUrl(filePath);
      
      logInfo("useCardGenerator: 获取到公开URL", { publicUrl: urlData.publicUrl });
      
      return urlData.publicUrl;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '保存卡片时发生未知错误';
      logError("useCardGenerator: " + errorMsg, err);
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // 提交学生的卡片到数据库
  const submitCard = async (
    taskId: string,
    studentId: string,
    content: string,
    cardImageUrl: string
  ): Promise<void> => {
    try {
      // 使用SQL查询直接插入数据，避免类型问题
      const { error } = await supabase.rpc('insert_card_submission', {
        p_task_id: taskId,
        p_student_id: studentId,
        p_content: content,
        p_card_image_url: cardImageUrl
      });
      
      if (error) {
        throw new Error(`提交卡片失败: ${error.message}`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '提交卡片时发生未知错误';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // 下载生成的卡片
  const downloadCard = (filename: string = 'my-card.png') => {
    if (!result.imageDataUrl) {
      setError('没有可下载的卡片图像');
      return;
    }
    
    downloadHtmlImage(result.imageDataUrl, filename);
  };

  return {
    generateCard,
    saveCardToStorage,
    submitCard,
    downloadCard,
    isLoading,
    error,
    result
  };
} 