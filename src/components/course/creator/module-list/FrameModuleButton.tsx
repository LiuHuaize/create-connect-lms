import React from 'react';
import { Button } from '@/components/ui/button';
import { Frame } from 'lucide-react';
import { LessonType } from '@/types/course';

interface FrameModuleButtonProps {
  onAddFrameModule: () => void;
}

/**
 * 添加框架模块的按钮组件
 * 
 * 框架模块是一种特殊的模块，可以包含多个课时，但在课程导航中作为一个整体显示
 */
const FrameModuleButton: React.FC<FrameModuleButtonProps> = ({ onAddFrameModule }) => {
  return (
    <Button 
      onClick={onAddFrameModule} 
      variant="outline" 
      className="flex items-center bg-gray-50 hover:bg-gray-100 border-dashed"
    >
      <Frame size={16} className="mr-2 text-ghibli-indigo" />
      添加框架模块
    </Button>
  );
};

export default FrameModuleButton; 