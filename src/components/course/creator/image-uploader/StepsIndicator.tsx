
import React from 'react';

interface StepsIndicatorProps {
  currentStep: 'edit' | 'crop' | 'preview' | 'upload';
}

const StepsIndicator: React.FC<StepsIndicatorProps> = ({ currentStep }) => {
  return (
    <div className="w-full flex items-center justify-center mb-4">
      <div className="w-full max-w-md flex items-center justify-between">
        <div className={`flex flex-col items-center ${currentStep === 'edit' ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'edit' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
            1
          </div>
          <span className="text-xs mt-1">移动</span>
        </div>
        
        <div className="w-16 h-0.5 bg-gray-200"></div>
        
        <div className={`flex flex-col items-center ${currentStep === 'crop' ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'crop' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
            2
          </div>
          <span className="text-xs mt-1">裁剪</span>
        </div>
        
        <div className="w-16 h-0.5 bg-gray-200"></div>
        
        <div className={`flex flex-col items-center ${currentStep === 'preview' ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'preview' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
            3
          </div>
          <span className="text-xs mt-1">预览</span>
        </div>
      </div>
    </div>
  );
};

export default StepsIndicator;
