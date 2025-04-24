import { supabase } from "../../integrations/supabase/client";

interface CardGeneratorParams {
  teacherInstructions: string;
  templateType: 'image' | 'text';
  templateImageUrl?: string;
  templateDescription?: string;
  studentInput: string;
}

interface GenerateHtmlResponse {
  html: string;
  imagePrompt: string | null;
}

interface GenerateImageResponse {
  imageUrl: string;
}

/**
 * 调用Claude API分析内容并生成HTML和可能的图像提示
 */
export async function generateCardHtml(params: CardGeneratorParams): Promise<GenerateHtmlResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-card-html', {
      body: {
        teacherInstructions: params.teacherInstructions,
        templateType: params.templateType,
        templateImageUrl: params.templateImageUrl,
        templateDescription: params.templateDescription,
        studentInput: params.studentInput
      }
    });

    if (error) {
      console.error('Error generating HTML:', error);
      throw new Error(`HTML生成失败: ${error.message}`);
    }

    return data as GenerateHtmlResponse;
  } catch (error) {
    console.error('Error in generateCardHtml:', error);
    throw new Error('HTML生成服务暂时不可用，请稍后重试');
  }
}

/**
 * 如果需要生成图像，调用AI Hub Mix API
 */
export async function generateCardImage(prompt: string): Promise<string> {
  try {
    if (!prompt) {
      throw new Error('图像提示词不能为空');
    }

    const { data, error } = await supabase.functions.invoke('generate-card-image', {
      body: {
        prompt: prompt,
        size: "1024x1024"
      }
    });

    if (error) {
      console.error('Error generating image:', error);
      throw new Error(`图像生成失败: ${error.message}`);
    }

    const responseData = data as GenerateImageResponse;
    
    if (!responseData.imageUrl) {
      throw new Error('图像生成服务未返回图片URL');
    }

    return responseData.imageUrl;
  } catch (error) {
    console.error('Error in generateCardImage:', error);
    throw new Error('图像生成服务暂时不可用，请稍后重试');
  }
}

/**
 * 完整的卡片生成流程，包括HTML生成和可选的图像生成
 */
export async function generateCompleteCard(params: CardGeneratorParams): Promise<{
  html: string;
  imageUrl: string | null;
}> {
  try {
    // 第一步：生成HTML和潜在的图像提示
    const { html, imagePrompt } = await generateCardHtml(params);
    
    // 第二步：如果需要，生成图像
    let imageUrl: string | null = null;
    
    if (imagePrompt) {
      try {
        imageUrl = await generateCardImage(imagePrompt);
      } catch (imageError) {
        console.error('Error generating image:', imageError);
        // 即使图像生成失败，我们仍然返回HTML，只是没有图像
      }
    }
    
    // 第三步：如果生成了图像，替换HTML中的占位符
    let finalHtml = html;
    if (imageUrl) {
      finalHtml = html.replace('__IMAGE_PLACEHOLDER__', imageUrl);
    }
    
    return {
      html: finalHtml,
      imageUrl
    };
  } catch (error) {
    console.error('Error in complete card generation:', error);
    throw error; // 重新抛出错误，让调用方处理
  }
} 