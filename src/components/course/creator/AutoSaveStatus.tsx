import React from 'react';
import { Tooltip } from '@/components/ui/tooltip';
import { TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface AutoSaveStatusProps {
  autoSaveEnabled: boolean;
  setAutoSaveEnabled: (enabled: boolean) => void;
  isAutoSaving: boolean;
  lastSaved: Date | null;
  autoSaveStatus: 'idle' | 'saving' | 'success' | 'error' | 'retry';
  retryCount: number;
  timeUntilNextSave: number | null;
}

const AutoSaveStatus: React.FC<AutoSaveStatusProps> = ({
  autoSaveEnabled,
  setAutoSaveEnabled,
  isAutoSaving,
  lastSaved,
  autoSaveStatus,
  retryCount,
  timeUntilNextSave
}) => {
  const getStatusText = () => {
    if (!autoSaveEnabled) {
      return '自动保存已禁用';
    }

    switch (autoSaveStatus) {
      case 'saving':
        return '正在自动保存...';
      case 'success':
        return lastSaved 
          ? `上次保存于 ${formatDistanceToNow(lastSaved, { locale: zhCN, addSuffix: true })}` 
          : '已启用自动保存';
      case 'error':
        return '自动保存失败';
      case 'retry':
        return timeUntilNextSave 
          ? `${timeUntilNextSave} 秒后重试自动保存` 
          : '即将重试自动保存';
      default:
        return lastSaved 
          ? `上次保存于 ${formatDistanceToNow(lastSaved, { locale: zhCN, addSuffix: true })}` 
          : '已启用自动保存';
    }
  };

  const getStatusIcon = () => {
    if (!autoSaveEnabled) {
      return null;
    }

    switch (autoSaveStatus) {
      case 'saving':
        return <RefreshCw className="size-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="size-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="size-4 text-red-500" />;
      case 'retry':
        return <Clock className="size-4 text-amber-500" />;
      default:
        return lastSaved ? <CheckCircle className="size-4 text-green-500" /> : null;
    }
  };

  const getStatusClass = () => {
    if (!autoSaveEnabled) {
      return 'text-muted-foreground';
    }

    switch (autoSaveStatus) {
      case 'saving':
        return 'text-blue-500';
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      case 'retry':
        return 'text-amber-500';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center space-x-2">
        <Switch
          checked={autoSaveEnabled}
          onCheckedChange={setAutoSaveEnabled}
          id="auto-save-switch"
        />
        <Label htmlFor="auto-save-switch">自动保存</Label>
      </div>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-1 ${getStatusClass()}`}>
              {getStatusIcon()}
              <span>{getStatusText()}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs">
              {autoSaveEnabled ? (
                <>
                  <p>自动保存已启用</p>
                  {lastSaved && (
                    <p>上次保存时间: {lastSaved.toLocaleString()}</p>
                  )}
                  {retryCount > 0 && (
                    <p>重试次数: {retryCount}</p>
                  )}
                </>
              ) : (
                <p>自动保存已禁用，请记得手动保存您的更改</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default AutoSaveStatus; 