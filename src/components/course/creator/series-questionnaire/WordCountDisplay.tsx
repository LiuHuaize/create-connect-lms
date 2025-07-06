import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { createWordCountResult } from '@/utils/wordCount';

interface WordCountDisplayProps {
  text: string;
  minWords?: number;
  maxWords?: number;
  showProgress?: boolean;
  showEstimatedTime?: boolean;
  className?: string;
}

const WordCountDisplay: React.FC<WordCountDisplayProps> = ({
  text,
  minWords,
  maxWords,
  showProgress = false,
  showEstimatedTime = false,
  className = ''
}) => {
  const result = createWordCountResult(text, minWords, maxWords);

  // 计算进度百分比
  const getProgressPercentage = (): number => {
    if (!minWords && !maxWords) return 0;
    
    if (minWords && maxWords) {
      // 有最小和最大限制
      if (result.wordCount < minWords) {
        return (result.wordCount / minWords) * 50; // 0-50% 表示未达到最小要求
      } else {
        return 50 + ((result.wordCount - minWords) / (maxWords - minWords)) * 50; // 50-100% 表示在合理范围内
      }
    } else if (minWords) {
      // 只有最小限制
      return Math.min((result.wordCount / minWords) * 100, 100);
    } else if (maxWords) {
      // 只有最大限制
      return (result.wordCount / maxWords) * 100;
    }
    
    return 0;
  };

  // 获取进度条颜色
  const getProgressColor = (): string => {
    switch (result.status) {
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      default:
        return 'bg-green-500';
    }
  };

  // 获取状态图标
  const getStatusIcon = () => {
    switch (result.status) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  // 获取状态徽章
  const getStatusBadge = () => {
    const variant = result.status === 'error' ? 'destructive' : 
                   result.status === 'warning' ? 'secondary' : 'default';
    
    return (
      <Badge variant={variant} className="text-xs">
        {result.wordCount} 字
      </Badge>
    );
  };

  // 估算写作时间
  const estimateWritingTime = (): string => {
    if (!minWords) return '';
    const remainingWords = Math.max(0, minWords - result.wordCount);
    if (remainingWords === 0) return '已完成';
    
    const estimatedMinutes = Math.ceil(remainingWords / 30); // 假设每分钟写30字
    if (estimatedMinutes < 1) return '不到1分钟';
    if (estimatedMinutes < 60) return `约${estimatedMinutes}分钟`;
    
    const hours = Math.floor(estimatedMinutes / 60);
    const minutes = estimatedMinutes % 60;
    return `约${hours}小时${minutes > 0 ? `${minutes}分钟` : ''}`;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* 基本字数显示 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm font-medium">
            {result.formattedCount}
          </span>
          {getStatusBadge()}
        </div>
        
        {showEstimatedTime && minWords && result.wordCount < minWords && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>{estimateWritingTime()}</span>
          </div>
        )}
      </div>

      {/* 错误或警告消息 */}
      {result.message && (
        <div className={`text-xs ${
          result.status === 'error' ? 'text-red-600' : 'text-yellow-600'
        }`}>
          {result.message}
        </div>
      )}

      {/* 进度条 */}
      {showProgress && (minWords || maxWords) && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>进度</span>
            <span>{Math.round(getProgressPercentage())}%</span>
          </div>
          <div className="relative">
            <Progress 
              value={getProgressPercentage()} 
              className="h-2"
            />
            {/* 自定义进度条颜色 */}
            <div 
              className={`absolute top-0 left-0 h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
              style={{ width: `${Math.min(getProgressPercentage(), 100)}%` }}
            />
          </div>
          
          {/* 进度说明 */}
          {minWords && maxWords && (
            <div className="flex justify-between text-xs text-gray-400">
              <span>{minWords}</span>
              <span>目标范围</span>
              <span>{maxWords}</span>
            </div>
          )}
        </div>
      )}

      {/* 详细统计信息 */}
      <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
        <div>
          <span className="block">字数</span>
          <span className="font-medium text-gray-700">{result.wordCount}</span>
        </div>
        <div>
          <span className="block">字符</span>
          <span className="font-medium text-gray-700">{result.characterCount}</span>
        </div>
        <div>
          <span className="block">无空格</span>
          <span className="font-medium text-gray-700">{result.characterCountNoSpaces}</span>
        </div>
      </div>
    </div>
  );
};

export default WordCountDisplay;
