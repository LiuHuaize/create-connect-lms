import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import { UseFormReturn } from 'react-hook-form';
import { Brain, Lightbulb, Target, Clock, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AIGradingSettingsProps {
  form: UseFormReturn<any>;
}

const AIGradingSettings: React.FC<AIGradingSettingsProps> = ({ form }) => {
  // 预设的AI评分提示模板
  const promptTemplates = [
    {
      name: '综合评价模板',
      prompt: '请根据以下标准对学生的系列问答进行评分：\n1. 内容完整性和准确性\n2. 逻辑思维和条理性\n3. 创新思维和独特见解\n4. 语言表达和文字质量\n\n请为每个问题提供具体反馈，并给出总体评价和改进建议。'
    },
    {
      name: '反思性学习模板',
      prompt: '请评估学生的反思深度和学习成果：\n1. 对知识点的理解程度\n2. 自我反思的深度和诚实度\n3. 学习过程中的收获和感悟\n4. 对未来学习的规划和思考\n\n重点关注学生的思考过程和自我认知能力。'
    },
    {
      name: '创新思维模板',
      prompt: '请从创新思维角度评价学生的回答：\n1. 思维的独创性和新颖性\n2. 问题分析的多角度思考\n3. 解决方案的创新性\n4. 跨领域知识的运用能力\n\n鼓励学生的创新想法，并提供进一步发展的建议。'
    }
  ];

  // 预设的评分标准模板
  const criteriaTemplates = [
    {
      name: '标准评分标准',
      criteria: '优秀(90-100分)：回答完整准确，逻辑清晰，有独特见解\n良好(80-89分)：回答较为完整，逻辑基本清晰，表达流畅\n中等(70-79分)：回答基本完整，逻辑一般，表达尚可\n及格(60-69分)：回答不够完整，逻辑不够清晰\n不及格(0-59分)：回答严重不完整或错误'
    },
    {
      name: '能力导向标准',
      criteria: '批判思维(25%)：分析问题的深度和逻辑性\n创新思维(25%)：想法的新颖性和创造性\n沟通表达(25%)：语言的准确性和表达的清晰度\n知识运用(25%)：相关知识的正确运用和整合'
    },
    {
      name: '过程性评价标准',
      criteria: '思考过程(40%)：思维过程的完整性和逻辑性\n内容质量(30%)：回答内容的准确性和深度\n表达能力(20%)：语言表达的清晰度和流畅性\n创新性(10%)：观点的独特性和创新性'
    }
  ];

  const applyTemplate = (type: 'prompt' | 'criteria', template: string) => {
    if (type === 'prompt') {
      form.setValue('ai_grading_prompt', template);
    } else {
      form.setValue('ai_grading_criteria', template);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            AI评分设置
          </CardTitle>
          <p className="text-sm text-gray-600">
            配置AI自动评分的标准和提示，帮助AI更准确地评价学生的回答
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 基础设置 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="max_score"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    最高分数
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="100" 
                      min="1"
                      max="1000"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormDescription>
                    设置此系列问答的最高得分
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="time_limit_minutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    时间限制（分钟）
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="60" 
                      min="1"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormDescription>
                    留空表示无时间限制
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>

          {/* AI评分提示 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <FormLabel className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                AI评分提示
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>告诉AI如何评价学生的回答，包括评分重点和方式</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </FormLabel>
              <div className="flex gap-2">
                {promptTemplates.map((template, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyTemplate('prompt', template.prompt)}
                  >
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>

            <FormField
              control={form.control}
              name="ai_grading_prompt"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea 
                      placeholder="请输入AI评分提示，例如：请根据学生回答的完整性、准确性和创新性进行评分..."
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    详细描述AI应该如何评价学生的回答，包括评分维度和重点
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>

          {/* AI评分标准 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <FormLabel className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                评分标准
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>具体的评分标准和分数区间，帮助AI更准确地打分</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </FormLabel>
              <div className="flex gap-2">
                {criteriaTemplates.map((template, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyTemplate('criteria', template.criteria)}
                  >
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>

            <FormField
              control={form.control}
              name="ai_grading_criteria"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea 
                      placeholder="请输入具体的评分标准，例如：优秀(90-100分)：回答完整准确，逻辑清晰..."
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    定义不同分数段的具体标准，帮助AI进行准确评分
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>

          {/* 其他设置 */}
          <FormField
            control={form.control}
            name="allow_save_draft"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>允许保存草稿</FormLabel>
                  <FormDescription>
                    学生可以保存未完成的回答，稍后继续编辑
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value ?? true}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* 提示信息 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Brain className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">AI评分说明：</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• AI会根据您设置的提示和标准对学生回答进行评分</li>
                  <li>• 建议提供具体、明确的评分标准，避免模糊表述</li>
                  <li>• 您可以在学生提交后查看并调整AI评分结果</li>
                  <li>• 评分结果将包含总分和针对每个问题的详细反馈</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIGradingSettings;
