import React from 'react';
import { Card } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FlowChartProps {
  productCanvas: {
    title: string;
    problem: string;
    solution: string;
    uniqueValue: string;
    userGroups: string;
    keyFeatures: string;
  };
}

const FlowChart: React.FC<FlowChartProps> = ({ productCanvas }) => {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-indigo-800">流程图设计</h2>
          <Button variant="outline" className="gap-2">
            <Sparkles size={16} />
            生成流程图建议
          </Button>
        </div>
        
        <p className="text-sm text-gray-600 mb-6">
          根据您的产品"{productCanvas.title || '未命名产品'}"，请绘制用户使用流程图，帮助您理清产品逻辑。
        </p>
        
        <div className="relative border rounded-md p-4 flex items-center justify-center bg-white">
          <div className="text-center py-16">
            <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Sparkles className="text-indigo-400" size={24} />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">绘制流程图</h3>
            <p className="text-sm text-gray-600 max-w-md mx-auto mb-4">
              使用Excalidraw绘制产品流程图，可以包括用户注册、登录、主要功能操作等流程。
            </p>
            <Button variant="default">
              打开Excalidraw
            </Button>
          </div>
        </div>
      </Card>
      
      <Card className="p-6">
        <h2 className="text-xl font-bold text-indigo-800 mb-4">流程图示例</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-md p-4">
            <h3 className="text-md font-medium mb-3">用户注册流程</h3>
            <div className="bg-gray-50 p-4 rounded-md min-h-[200px] flex items-center justify-center">
              <p className="text-gray-400 text-sm">用户注册流程图示例将显示在这里</p>
            </div>
          </div>
          
          <div className="border rounded-md p-4">
            <h3 className="text-md font-medium mb-3">主要功能流程</h3>
            <div className="bg-gray-50 p-4 rounded-md min-h-[200px] flex items-center justify-center">
              <p className="text-gray-400 text-sm">主要功能流程图示例将显示在这里</p>
            </div>
          </div>
          
          <div className="border rounded-md p-4">
            <h3 className="text-md font-medium mb-3">用户交互流程</h3>
            <div className="bg-gray-50 p-4 rounded-md min-h-[200px] flex items-center justify-center">
              <p className="text-gray-400 text-sm">用户交互流程图示例将显示在这里</p>
            </div>
          </div>
          
          <div className="border rounded-md p-4">
            <h3 className="text-md font-medium mb-3">数据流程</h3>
            <div className="bg-gray-50 p-4 rounded-md min-h-[200px] flex items-center justify-center">
              <p className="text-gray-400 text-sm">数据流程图示例将显示在这里</p>
            </div>
          </div>
        </div>
      </Card>
      
      <Card className="p-6">
        <h2 className="text-xl font-bold text-indigo-800 mb-4">流程图设计指南</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-md font-medium mb-2">1. 确定主要用户场景</h3>
            <p className="text-sm text-gray-600">
              根据"{productCanvas.title || '未命名产品'}"的需求和功能，确定需要绘制哪些关键用户场景。
            </p>
          </div>
          
          <div>
            <h3 className="text-md font-medium mb-2">2. 使用标准符号</h3>
            <p className="text-sm text-gray-600">
              使用矩形表示步骤，菱形表示决策点，箭头表示流程方向。保持符号一致性。
            </p>
          </div>
          
          <div>
            <h3 className="text-md font-medium mb-2">3. 从用户视角出发</h3>
            <p className="text-sm text-gray-600">
              以用户为中心，描述用户如何与产品交互，而不是系统内部处理流程。
            </p>
          </div>
          
          <div>
            <h3 className="text-md font-medium mb-2">4. 保持简洁</h3>
            <p className="text-sm text-gray-600">
              每个流程图专注于一个特定功能或场景，避免过于复杂的图表。
            </p>
          </div>
          
          <div>
            <h3 className="text-md font-medium mb-2">5. 考虑异常情况</h3>
            <p className="text-sm text-gray-600">
              不仅描述理想路径，也要考虑可能的错误情况和用户如何从中恢复。
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FlowChart; 