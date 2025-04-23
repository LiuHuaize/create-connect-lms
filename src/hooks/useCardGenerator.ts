import { useState } from 'react';
import html2canvas from 'html2canvas';

interface GenerateCardParams {
  teacherInstructions: string;
  templateType: 'image' | 'text';
  templateImageUrl?: string;
  templateDescription?: string;
  studentContent: string;
}

interface CardGeneratorResult {
  generateCard: (params: GenerateCardParams) => Promise<string>;
  isLoading: boolean;
  error: Error | null;
}

export function useCardGenerator(): CardGeneratorResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 调用Claude API生成HTML
  const generateHTML = async (params: GenerateCardParams): Promise<{
    html: string;
    imagePrompt: string | null;
  }> => {
    try {
      // 构建提示
      const userPrompt = `
        任务说明: ${params.teacherInstructions}
        
        ${params.templateType === 'text' 
          ? `模板描述: ${params.templateDescription}` 
          : '请分析下面的模板图片，理解其布局和风格。'
        }
        
        学生输入: ${params.studentContent}
        
        请生成一个HTML卡片，模仿${params.templateType === 'image' ? '图片' : '文字'}模板的风格和布局。
        如果需要生成图片来匹配模板的风格，请提供详细的图片生成提示。
        输出格式：JSON，包含两个字段 {html: "完整的HTML代码", imagePrompt: "如需生成图片的提示，否则为null"}
      `;

      // 模拟API调用 - 在实际应用中应该调用真实的API
      console.log('Generating HTML with prompt:', userPrompt);
      console.log('Template image URL:', params.templateImageUrl);
      
      // 这里应该是实际的AI API调用，临时使用模拟响应
      // TODO: 实现真实的Claude API调用
      return {
        html: `
          <div style="width: 400px; height: 300px; padding: 20px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); border-radius: 10px; font-family: Arial, sans-serif; position: relative; overflow: hidden;">
            <h2 style="color: #4a6fa5; margin-bottom: 15px;">${params.studentContent.split('\n')[0] || '卡片标题'}</h2>
            <div style="color: #333; font-size: 14px; line-height: 1.5;">
              ${params.studentContent.split('\n').slice(1).join('<br/>') || '卡片内容'}
            </div>
            ${params.templateType === 'image' ? '<div id="template-image-placeholder" style="position: absolute; bottom: 10px; right: 10px; width: 100px; height: 100px; background-color: #ddd; display: flex; justify-content: center; align-items: center; border-radius: 5px;"><span>图片占位</span></div>' : ''}
          </div>
        `,
        imagePrompt: params.templateType === 'image' ? "根据用户内容生成装饰图像，风格简约清新" : null
      };
    } catch (err) {
      console.error('Error generating HTML:', err);
      throw new Error('生成HTML失败');
    }
  };

  // 生成图片（如果需要）
  const generateImage = async (prompt: string): Promise<string> => {
    try {
      // 这里应该是实际的图像生成API调用，临时使用模拟图片
      // TODO: 实现真实的图像生成API调用
      console.log('Generating image with prompt:', prompt);
      
      // 返回模拟图片URL
      return 'https://picsum.photos/100/100';
    } catch (err) {
      console.error('Error generating image:', err);
      throw new Error('生成图片失败');
    }
  };

  // HTML转换为图片
  const htmlToImage = async (html: string): Promise<string> => {
    // 创建临时容器渲染HTML
    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    
    // 添加到DOM以便渲染
    document.body.appendChild(container);
    
    try {
      // 等待图片和字体加载
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 使用html2canvas将HTML转为canvas
      const canvas = await html2canvas(container, {
        allowTaint: true,
        useCORS: true,
        scale: 2
      });
      
      // 转换为DataURL
      return canvas.toDataURL('image/png');
    } finally {
      // 清理：从DOM移除容器
      document.body.removeChild(container);
    }
  };

  // 主函数：生成卡片
  const generateCard = async (params: GenerateCardParams): Promise<string> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 1. 生成HTML
      const { html, imagePrompt } = await generateHTML(params);
      
      // 2. 如果需要图片，生成图片
      let finalHtml = html;
      if (imagePrompt) {
        const imageUrl = await generateImage(imagePrompt);
        finalHtml = html.replace(
          '<div id="template-image-placeholder"', 
          `<div id="template-image-placeholder" style="background-image: url('${imageUrl}'); background-size: cover; background-position: center;"`
        );
      }
      
      // 3. 将HTML转为图片
      const cardImageUrl = await htmlToImage(finalHtml);
      
      return cardImageUrl;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('生成卡片失败');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    generateCard,
    isLoading,
    error
  };
} 