#!/bin/bash

# AI评分服务curl测试脚本
# 直接测试4.1mini API的连接和响应

echo "🚀 开始测试4.1mini API连接..."

# API配置
API_KEY="sk-LVuSMVbv6rcXN9BF555dC39001Ad46D28610D76b62285595"
API_URL="https://api.gptapi.us/v1/chat/completions"
MODEL_NAME="gpt-4.1-mini"

# 测试用的简单提示词
PROMPT="请对以下学生答案进行评分：问题：什么是软件工程？学生答案：软件工程是一门应用计算机科学、数学及管理科学等原理，开发软件的工程学科。请以JSON格式返回评分结果：{\"score\": 分数(0-100), \"feedback\": \"评价反馈\"}"

# 构建请求数据
REQUEST_DATA='{
  "model": "'$MODEL_NAME'",
  "messages": [
    {
      "role": "system",
      "content": "你是一位专业的教育评估专家，擅长对学生的问答进行客观、公正、建设性的评分和反馈。"
    },
    {
      "role": "user",
      "content": "'$PROMPT'"
    }
  ],
  "temperature": 0.3,
  "max_tokens": 500
}'

echo "📝 发送请求到: $API_URL"
echo "🤖 使用模型: $MODEL_NAME"
echo ""

# 发送curl请求
echo "⏳ 正在调用API..."

response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "$REQUEST_DATA")

# 分离响应体和状态码
http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
response_body=$(echo "$response" | grep -v "HTTP_CODE:")

echo "✅ 请求完成"
echo "📊 HTTP状态码: $http_code"
echo ""

# 检查响应状态
if [ "$http_code" -eq 200 ]; then
    echo "🎉 API调用成功！"
    echo ""
    echo "📄 响应内容:"
    echo "$response_body" | jq '.' 2>/dev/null || echo "$response_body"
    echo ""
    
    # 尝试提取AI回复内容
    ai_content=$(echo "$response_body" | jq -r '.choices[0].message.content' 2>/dev/null)
    if [ "$ai_content" != "null" ] && [ "$ai_content" != "" ]; then
        echo "🤖 AI评分结果:"
        echo "$ai_content"
        echo ""
        
        # 尝试解析JSON格式的评分结果
        echo "🔍 尝试解析评分JSON..."
        echo "$ai_content" | jq '.' 2>/dev/null && echo "✅ JSON格式有效" || echo "⚠️  非标准JSON格式"
    fi
    
    # 显示token使用情况
    usage=$(echo "$response_body" | jq '.usage' 2>/dev/null)
    if [ "$usage" != "null" ]; then
        echo "📈 Token使用情况:"
        echo "$usage"
    fi
    
else
    echo "❌ API调用失败！"
    echo "错误响应:"
    echo "$response_body"
fi

echo ""
echo "🏁 测试完成"
