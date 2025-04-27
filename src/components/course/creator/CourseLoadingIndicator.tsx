import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

interface CourseLoadingIndicatorProps {
  isLoading: boolean;
  loadingProgress: number;
  loadingMessage: string;
}

const CourseLoadingIndicator: React.FC<CourseLoadingIndicatorProps> = ({
  isLoading,
  loadingProgress,
  loadingMessage
}) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-[350px] max-w-[90vw] rounded-lg border bg-card p-6 shadow-lg">
        <div className="flex flex-col items-center space-y-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          
          <div className="w-full space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">加载进度</span>
              <span className="text-sm text-muted-foreground">
                {loadingProgress}%
              </span>
            </div>
            <Progress value={loadingProgress} className="h-2 w-full" />
          </div>
          
          <p className="text-center text-sm text-muted-foreground">
            {loadingMessage}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CourseLoadingIndicator; 