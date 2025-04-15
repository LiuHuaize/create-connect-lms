import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const API_KEY = 'sk-ysF0SA6kJ7C1I2wG2f901fD6Fe8443Df8f75C92a0aF1Ce2b';

export default function ModelTestComponent() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setError('');
    setResponse('');

    try {
      const result = await fetch('https://aihubmix.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          messages: [
            {
              role: "user",
              content: input
            }
          ]
        }),
      });

      if (!result.ok) {
        const errorData = await result.json();
        throw new Error(errorData.error?.message || '请求失败');
      }

      const data = await result.json();
      setResponse(data.choices[0].message.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
      console.error('API调用失败:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">GPT-4.1-Mini 模型测试</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="输入你的问题..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="w-full"
            />
          </div>
          <Button 
            type="submit" 
            disabled={loading || !input.trim()} 
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                处理中...
              </>
            ) : '发送请求'}
          </Button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            错误: {error}
          </div>
        )}

        {response && (
          <div className="mt-4 p-4 bg-slate-50 rounded-md border border-slate-200">
            <h3 className="font-medium text-sm text-slate-500 mb-2">模型响应:</h3>
            <div className="text-sm whitespace-pre-wrap">{response}</div>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-xs text-slate-500 justify-center">
        使用 aihubmix.com API 与 gpt-4.1-mini 模型通信
      </CardFooter>
    </Card>
  );
} 