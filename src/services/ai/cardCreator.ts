// 从.env获取API密钥
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const AIHUBMIX_API_KEY = import.meta.env.VITE_AIHUBMIX_API_KEY;

// 用于记录详细日志的函数
function logInfo(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [CardCreator-INFO] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

function logError(message: string, error: any) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [CardCreator-ERROR] ${message}`);
  console.error(error);
}

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

// 定义消息内容的接口
interface MessageContent {
  type: string;
  text?: string;
  image_url?: {
    url: string;
  };
}

/**
 * 调用Claude API分析内容并生成HTML和可能的图像提示
 */
export async function generateCardHtml(params: CardGeneratorParams): Promise<GenerateHtmlResponse> {
  logInfo("开始生成卡片HTML", { params });
  
  try {
    if (!OPENROUTER_API_KEY) {
      logError("API密钥未配置", "OpenRouter API密钥未配置");
      throw new Error("OpenRouter API密钥未配置");
    }

    const { 
      teacherInstructions, 
      templateType, 
      templateImageUrl, 
      templateDescription, 
      studentInput 
    } = params;

    logInfo("处理的学生输入", { studentInput });
    logInfo("模板类型", { templateType });
    
    if (templateType === 'image') {
      logInfo("使用图片模板", { templateImageUrl });
    } else {
      logInfo("使用文字模板", { templateDescription });
    }

    // 从学生输入中提取关键信息
    const studentKeywords = studentInput.split(/[,，、\s]+/).filter(word => word.length > 1);
    logInfo("从学生输入提取的关键词", { studentKeywords });

    // 构建用户提示 - 避免硬编码布局，让模型自由决定
    const userPrompt = `
      任务说明: ${teacherInstructions}
      
      ${templateType === 'text' 
        ? `模板描述: ${templateDescription}` 
        : '请分析下面的模板图片，理解其布局和风格。'}
      
      学生输入: ${studentInput}
      
      请根据以上信息，完成以下任务：
      
      1. 分析教师提供的要求和${templateType === 'image' ? '模板图片' : '文字描述模板'}
      2. 理解学生输入的内容
      3. 根据模板风格和学生输入，设计一个合适的HTML卡片
      4. 自行决定是否需要生成新的图像。如果需要，请提供简单明了的图像生成提示(imagePrompt)
      5. 请确保卡片内容主要反映学生的输入，而不是简单复述任务说明
      
      重要提示：
      - 这只是一个模板，不要在生成的卡片中包含"示例"、"照示例"、"档案示例"等文字
      - 图像提示应该简洁直接，只需描述要生成什么内容，例如"friendly husky dog"
      - 如果决定生成图片，请确保图片提示与学生输入的内容相关
      - 你生成的图片是为了辅助你做卡片，而不是说去生成卡片，比如一个狗狗卡片你用html无法画一只狗上去，因此你需要ai去画一只狗，而不是喊他生成完整的卡片

      你的回复必须是一个有效的JSON对象，格式如下：
      {
        "html": "完整的HTML代码，如果需要图片请使用__IMAGE_PLACEHOLDER__作为图片URL占位符",
        "imagePrompt": "如果需要生成图片，提供简洁的图像生成提示；如不需要则设为null"
      }
      
      HTML代码应该是独立的，包含内联样式，能够正确显示为卡片。布局和设计应参考提供的模板风格。
      只返回JSON格式的数据，不要包含任何其他文本或解释。
    `;

    logInfo("生成的用户提示", { prompt: userPrompt });

    // 准备消息内容
    const content: MessageContent[] = [
      {
        type: "text",
        text: userPrompt
      }
    ];
    
    // 如果提供了图片URL，添加到消息中
    if (templateType === 'image' && templateImageUrl) {
      logInfo("添加模板图片到API请求", { templateImageUrl });
      content.push({
        type: "image_url",
        image_url: {
          url: templateImageUrl
        }
      });
    }
    
    // 系统提示，去除硬编码的布局指示
    const systemPrompt = `你是一个专业的卡片生成器。你的任务是分析用户提供的模板和内容，然后生成HTML代码和可能的图片提示。

请遵循以下要求：
1. 分析教师提供的要求和模板，理解其风格和意图
2. 分析学生输入的内容，确保卡片主要展示学生输入的信息
3. 自主决定是否需要生成图片，如果需要，提供简洁的图像生成提示，比如说需要做一个狗狗卡片，显然狗狗是无法用html去做的，这时候你就需要去让之后的模型生成狗狗的图片了
4. 设计HTML时参考模板的风格和布局
5. 只返回有效的JSON格式，包含html和imagePrompt两个字段
6. 不要在JSON前后添加任何说明或其他文本

重要提示：
1. 这只是一个布局和风格模板，不要复制模板中的"示例"、"照示例"、"档案示例"等文字
2. 图像提示应该简洁明了，只描述需要生成的主体和风格，例如"animated husky"
3. 如果决定生成图片，请确保图片提示与学生输入的内容相关，而不是基于任务说明
4. 生成的卡片应该是完整的成品，而不是示例`;

    logInfo("使用的系统提示", { systemPrompt });
    
    // 记录API请求详情
    logInfo("准备发送Claude API请求", {
      model: "anthropic/claude-3.7-sonnet",
      systemPrompt: "已设置",
      content: "已准备"
    });
    
    // 调用 Claude API (通过 OpenRouter)
    logInfo("开始调用Claude API");
    const startTime = Date.now();
    
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin,
        "X-Title": "Card Creator"
      },
      body: JSON.stringify({
        model: "anthropic/claude-3.7-sonnet",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: content
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 2500,
        temperature: 0.5
      })
    });
    
    const apiTime = Date.now() - startTime;
    logInfo(`Claude API响应时间: ${apiTime}ms`);
    
    if (!response.ok) {
      const errorData = await response.json();
      logError("Claude API错误响应", errorData);
      throw new Error(`Claude API错误: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    logInfo("Claude API调用成功", {
      status: response.status,
      model: data.model,
      tokenUsage: data.usage
    });
    
    const contentString = data.choices[0].message.content;
    logInfo("Claude原始响应内容", { rawContent: contentString });
    
    // 解析JSON响应
    try {
      logInfo("尝试解析JSON响应");
      const contentObj = JSON.parse(contentString);
      
      // 验证返回的对象是否包含所需的字段
      if (!contentObj.html) {
        logError("返回的JSON缺少html字段", contentObj);
        throw new Error('返回的JSON缺少html字段');
      }
      
      logInfo("成功解析JSON响应", {
        hasHtml: !!contentObj.html,
        htmlLength: contentObj.html?.length || 0,
        hasImagePrompt: !!contentObj.imagePrompt,
        imagePromptLength: contentObj.imagePrompt?.length || 0
      });
      
      const result = {
        html: contentObj.html,
        imagePrompt: contentObj.imagePrompt || null
      };
      
      logInfo("HTML生成完成", { 
        imagePromptSample: result.imagePrompt ? result.imagePrompt.substring(0, 100) + "..." : null
      });
      
      return result;
    } catch (e) {
      logError('JSON解析失败', e);
      console.error('Failed to parse Claude response as JSON:', e);
      console.log('Original response:', contentString);
      
      // 创建一个简单的错误HTML，告知用户问题
      return {
        html: `<div style="font-family: Arial, sans-serif; color: #ff0000; padding: 20px; border: 1px solid #ffcccc; border-radius: 5px; background-color: #fff5f5">
                <h2>生成卡片时出错</h2>
                <p>AI无法正确处理您的请求，请尝试重新提交或修改您的内容。</p>
                <p>错误详情: 无法解析AI返回的数据</p>
              </div>`,
        imagePrompt: null
      };
    }
  } catch (error) {
    logError('HTML生成过程中发生错误', error);
    console.error('Error in generateCardHtml:', error);
    throw new Error('HTML生成服务暂时不可用，请稍后重试');
  }
}

/**
 * 调用AI Hub Mix的图像生成API
 */
export async function generateCardImage(prompt: string): Promise<string> {
  logInfo("开始生成卡片图像", { promptLength: prompt.length });
  logInfo("图像生成提示词", { prompt });
  
  try {
    if (!prompt) {
      logError("图像提示词为空", "图像提示词不能为空");
      throw new Error('图像提示词不能为空');
    }

    if (!AIHUBMIX_API_KEY) {
      logError("API密钥未配置", "AIHUBMIX API密钥未配置");
      throw new Error("AIHUBMIX API密钥未配置");
    }

    // 直接使用原始提示词，不进行处理
    const finalPrompt = prompt;
    logInfo("使用原始图像生成提示", { finalPrompt });

    // 调用AI Hub Mix的图像生成API
    const apiBase = "https://aihubmix.com/v1";
    const imageModel = "gpt-4o-image-vip";
    const imageGenerationUrl = `${apiBase}/images/generations`;

    const headers = {
      'Authorization': `Bearer ${AIHUBMIX_API_KEY}`,
      'Content-Type': 'application/json',
    };

    const payload = {
      model: imageModel,
      prompt: finalPrompt,
      n: 1,
      size: "1024x1024",
    };

    logInfo("准备发送图像生成API请求", {
      model: imageModel,
      size: "1024x1024",
      promptLength: finalPrompt.length
    });

    const startTime = Date.now();
    const response = await fetch(imageGenerationUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
    });
    const apiTime = Date.now() - startTime;
    logInfo(`图像生成API响应时间: ${apiTime}ms`);

    const responseData = await response.json();

    if (!response.ok) {
      logError("图像生成API错误响应", responseData);
      throw new Error(`图像生成API错误: ${response.status} ${response.statusText}`);
    }

    // 处理响应数据
    if (responseData.data && Array.isArray(responseData.data) && responseData.data.length > 0 && responseData.data[0].url) {
      const imageUrl = responseData.data[0].url;
      logInfo("成功生成图像", { 
        url: imageUrl.substring(0, 50) + "...", 
        status: "成功"
      });
      return imageUrl;
    } else {
      logError("图像生成API返回的数据格式不正确", responseData);
      throw new Error('图像生成API返回的数据格式不正确');
    }
  } catch (error) {
    logError('图像生成过程中发生错误', error);
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
  hasImageGeneration: boolean; // 添加标志指示是否需要生成图像
}> {
  logInfo("开始完整卡片生成流程", { studentInput: params.studentInput, templateType: params.templateType });
  const startTime = Date.now();
  
  try {
    // 第一步：生成HTML和潜在的图像提示
    logInfo("步骤1: 生成HTML和图像提示");
    const { html, imagePrompt } = await generateCardHtml(params);
    logInfo("HTML生成成功", { 
      htmlLength: html.length,
      hasImagePrompt: !!imagePrompt
    });
    
    // 第二步：如果需要，生成图像
    let imageUrl: string | null = null;
    const hasImageGeneration = !!imagePrompt; // 是否需要生成图像的标志
    
    if (imagePrompt) {
      logInfo("步骤2: Claude决定需要生成图像", { imagePromptLength: imagePrompt.length });
      try {
        // 直接使用Claude返回的imagePrompt，不做额外处理
        imageUrl = await generateCardImage(imagePrompt);
        logInfo("图像生成成功", { imageUrl: imageUrl?.substring(0, 50) + "..." });
      } catch (imageError) {
        logError('图像生成失败', imageError);
        // 即使图像生成失败，我们仍然返回HTML，只是没有图像
        logInfo("尽管图像生成失败，继续处理HTML");
      }
    } else {
      logInfo("步骤2: Claude决定不需要生成图像，跳过图像生成步骤");
    }
    
    // 第三步：如果生成了图像，替换HTML中的占位符
    logInfo("步骤3: 处理HTML");
    let finalHtml = html;
    if (imageUrl) {
      logInfo("替换HTML中的图像占位符");
      finalHtml = html.replace('__IMAGE_PLACEHOLDER__', imageUrl);
    } else {
      logInfo("无需替换图像占位符，保持原HTML不变");
    }
    
    const totalTime = Date.now() - startTime;
    logInfo(`完整卡片生成完成，总耗时: ${totalTime}ms`, {
      htmlLength: finalHtml.length,
      hasImage: !!imageUrl,
      needsImageGeneration: hasImageGeneration
    });
    
    return {
      html: finalHtml,
      imageUrl,
      hasImageGeneration // 返回是否需要图像生成的标志
    };
  } catch (error) {
    logError('完整卡片生成过程中发生错误', error);
    console.error('Error in complete card generation:', error);
    throw error; // 重新抛出错误，让调用方处理
  }
} 