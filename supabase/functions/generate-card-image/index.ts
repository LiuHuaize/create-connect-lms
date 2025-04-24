// 导入 Deno 所需的依赖
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

// 类型定义
interface RequestBody {
  prompt: string;
  size?: string;
}

interface ImageGenerationResponse {
  imageUrl?: string;
  error?: string;
}

serve(async (req) => {
  // 处理 CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 获取环境变量
    const aihubmixApiKey = Deno.env.get("AIHUBMIX_API_KEY");
    
    if (!aihubmixApiKey) {
      throw new Error("AIHUBMIX_API_KEY not configured");
    }

    // 解析请求数据
    const requestData: RequestBody = await req.json();
    const { prompt, size = "1024x1024" } = requestData;

    // 验证请求数据
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // 调用AI Hub Mix的图像生成API
    const apiBase = "https://aihubmix.com/v1";
    const imageModel = "gpt-4o-image-vip";
    const imageGenerationUrl = `${apiBase}/images/generations`;

    const headers = {
      'Authorization': `Bearer ${aihubmixApiKey}`,
      'Content-Type': 'application/json',
    };

    const payload = {
      model: imageModel,
      prompt: prompt,
      n: 1,
      size: size,
    };

    const response = await fetch(imageGenerationUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("AI Hub Mix API Error:", responseData);
      return new Response(
        JSON.stringify({ 
          error: `API Error: ${response.status} ${response.statusText}`,
          details: responseData
        }),
        { 
          status: 502, // Bad Gateway
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // 处理响应数据
    if (responseData.data && Array.isArray(responseData.data) && responseData.data.length > 0 && responseData.data[0].url) {
      return new Response(
        JSON.stringify({ imageUrl: responseData.data[0].url }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    } else {
      console.error("Unexpected response structure:", responseData);
      return new Response(
        JSON.stringify({ 
          error: "Unexpected response structure from AI Hub Mix API",
          details: responseData
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