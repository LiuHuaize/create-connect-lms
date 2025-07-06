#!/bin/bash

# 简单的API连接测试
echo "🚀 测试4.1mini API连接..."

curl -X POST "https://api.gptapi.us/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-LVuSMVbv6rcXN9BF555dC39001Ad46D28610D76b62285595" \
  -d '{
    "model": "gpt-4.1-mini",
    "messages": [{"role": "user", "content": "Hello! Test."}],
    "temperature": 0.7,
    "max_tokens": 50
  }'

echo ""
echo "🏁 测试完成"
