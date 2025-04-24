import { useState } from 'react';
import { generateCompleteCard } from '../services/ai/cardCreator';
import { htmlToImage, downloadHtmlImage } from '../utils/html2image';
import { supabase } from '../integrations/supabase/client';

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
  const generateCard = async (params: CardGeneratorParams): Promise<string> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 1. 调用后端服务生成HTML和可能的图像
      const { html, imageUrl } = await generateCompleteCard(params);
      
      // 保存HTML内容
      setResult(prev => ({ ...prev, htmlContent: html, imageUrl }));
      
      // 2. 将HTML转换为图像
      const imageDataUrl = await htmlToImage(html);
      
      // 保存生成的图像数据URL
      setResult(prev => ({ ...prev, imageDataUrl }));
      
      return imageDataUrl;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '生成卡片时发生未知错误';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // 将生成的卡片保存到Supabase Storage
  const saveCardToStorage = async (
    courseId: string, 
    taskId: string, 
    userId: string
  ): Promise<string> => {
    if (!result.imageDataUrl) {
      throw new Error('没有可保存的卡片图像');
    }
    
    try {
      // 转换数据URL为Blob
      const base64Data = result.imageDataUrl.split(',')[1];
      const blob = await fetch(`data:image/png;base64,${base64Data}`).then(res => res.blob());
      
      // 生成唯一的文件路径
      const timestamp = new Date().toISOString();
      const filePath = `cards/${courseId}/${taskId}/${userId}_${timestamp}.png`;
      
      // 上传到Supabase Storage
      const { data, error } = await supabase.storage
        .from('student-submissions')
        .upload(filePath, blob, {
          contentType: 'image/png',
          upsert: false // 不覆盖，保留多个版本
        });
      
      if (error) {
        throw new Error(`保存卡片失败: ${error.message}`);
      }
      
      // 获取公开URL
      const { data: urlData } = supabase.storage
        .from('student-submissions')
        .getPublicUrl(filePath);
      
      return urlData.publicUrl;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '保存卡片时发生未知错误';
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