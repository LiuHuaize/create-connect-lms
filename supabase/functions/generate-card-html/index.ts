// 导入 Deno 所需的依赖
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

// 类型定义
interface RequestBody {
  teacherInstructions: string;
  templateType: 'image' | 'text';
  templateImageUrl?: string;
  templateDescription?: string;
  studentInput: string;
}

interface ClaudeResponse {
  html: string;
  imagePrompt: string | null;
}

serve(async (req) => {
  // 处理 CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 获取环境变量
    const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
    
    if (!openRouterApiKey) {
      throw new Error("OpenRouter API key not configured");
    }

    // 解析请求数据
    const requestData: RequestBody = await req.json();
    const { 
      teacherInstructions, 
      templateType, 
      templateImageUrl, 
      templateDescription, 
      studentInput 
    } = requestData;

    // 验证请求数据
    if (!teacherInstructions || !templateType || !studentInput) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    if (templateType === 'image' && !templateImageUrl) {
      return new Response(
        JSON.stringify({ error: "Template image URL is required for image template type" }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    if (templateType === 'text' && !templateDescription) {
      return new Response(
        JSON.stringify({ error: "Template description is required for text template type" }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // 构建用户提示
    const userPrompt = `
      任务说明: ${teacherInstructions}
      
      ${templateType === 'text' 
        ? `模板描述: ${templateDescription}` 
        : '请分析下面的模板图片，理解其布局和风格。'}
      
      学生输入: ${studentInput}
      
      请生成一个HTML卡片，模仿${templateType === 'image' ? '图片' : '文字'}模板的风格和布局。
      如果需要生成图片来匹配模板的风格，请提供详细的图片生成提示。
      
      你的回复必须是一个有效的JSON对象，包含两个字段:
      {
        "html": "完整的HTML代码，如果需要图片，使用__IMAGE_PLACEHOLDER__作为URL占位符",
        "imagePrompt": "如需生成图片的提示词，否则为null"
      }
      
      HTML代码应该是独立的，包含内联样式，并且能够正确显示为卡片。请设计一个美观的布局，使用适当的字体、颜色和间距。
      如果你决定需要图像，html中应使用<img src="__IMAGE_PLACEHOLDER__" />作为占位符。
    `;

    // 准备消息内容
    const messages = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: userPrompt
          }
        ]
      }
    ];
    
    // 如果提供了图片URL，添加到消息中
    if (templateType === 'image' && templateImageUrl) {
      messages[0].content.push({
        type: "image_url",
        image_url: {
          url: templateImageUrl
        }
      });
    }
    
    // 调用 Claude API (通过 OpenRouter)
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "anthropic/claude-3.7-sonnet",
        messages: messages,
        response_format: { type: "json_object" },
        max_tokens: 2500,
        temperature: 0.5
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Claude API error:", errorText);
      throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const contentString = data.choices[0].message.content;
    
    // 解析JSON响应
    try {
      const contentObj = JSON.parse(contentString);
      
      // 返回结果
      return new Response(
        JSON.stringify({
          html: contentObj.html,
          imagePrompt: contentObj.imagePrompt
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    } catch (e) {
      console.error('Failed to parse Claude response as JSON:', e);
      console.log('Original response:', contentString);
      
      // 如果解析失败，尝试直接使用返回的内容作为HTML
      return new Response(
        JSON.stringify({
          html: contentString,
          imagePrompt: null,
          parseError: "Response could not be parsed as JSON"
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
  } catch (error) {
    console.error('Error:', error.message);
    
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
}); 