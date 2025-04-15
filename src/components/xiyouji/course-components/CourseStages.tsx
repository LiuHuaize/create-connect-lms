import React from 'react';
import { CheckCircle2 } from 'lucide-react';

// 定义课程阶段
export const courseStages = [
  { id: 'character-analysis', title: '人物分析', description: '分析师徒四人的特点、优缺点和需求' },
  { id: 'product-canvas', title: '产品画布', description: '头脑风暴，确定最适合的产品创意' },
  { id: 'flow-chart', title: '流程图', description: '使用Excalidraw绘制产品流程图' },
  { id: 'website-creation', title: '网站制作', description: '构建产品原型网站' }
];

interface CourseStagesProps {
  currentStage: number;
  onStageChange: (index: number) => void;
}

const CourseStages: React.FC<CourseStagesProps> = ({ 
  currentStage, 
  onStageChange 
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
      {courseStages.map((stage, index) => (
        <button
          key={stage.id}
          onClick={() => onStageChange(index)}
          className={`flex flex-col items-center p-4 rounded-lg text-center border transition-all ${
            currentStage === index
              ? 'border-indigo-500 bg-indigo-50 shadow-sm'
              : 'border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/30'
          } ${
            index < currentStage ? 'text-indigo-600' : 'text-gray-600'
          }`}
          disabled={index > currentStage}
        >
          <div className="flex items-center justify-center w-8 h-8 mb-2 rounded-full bg-white border">
            {index < currentStage ? (
              <CheckCircle2 size={18} className="text-green-500" />
            ) : (
              <span className={`text-sm font-medium ${
                currentStage === index ? 'text-indigo-600' : 'text-gray-500'
              }`}>
                {index + 1}
              </span>
            )}
          </div>
          <h3 className="text-sm font-medium mb-1">{stage.title}</h3>
          <p className="text-xs opacity-70 hidden sm:block">{stage.description}</p>
        </button>
      ))}
    </div>
  );
};

export default CourseStages; 