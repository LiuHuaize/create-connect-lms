import React from 'react';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface HotspotSaveButtonProps {
  onSave: () => Promise<void | string | undefined>;
  isSaving?: boolean;
}

/**
 * HotspotSaveButton - 热点图编辑器中的保存按钮组件
 * 
 * 用于在热点图编辑器中添加专门的保存按钮，直接调用保存课程功能
 */
const HotspotSaveButton: React.FC<HotspotSaveButtonProps> = ({
  onSave,
  isSaving = false,
}) => {
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      await onSave();
      toast({
        title: "保存成功",
        description: "热点图课程内容已成功保存",
        variant: "default",
      });
    } catch (error) {
      console.error('保存热点图失败:', error);
      toast({
        title: "保存失败",
        description: "保存热点图时发生错误，请重试",
        variant: "destructive",
      });
    }
  };

  return (
    <Button 
      onClick={handleSave} 
      disabled={isSaving}
      className="w-full md:w-auto"
    >
      <Save className="h-4 w-4 mr-2" />
      {isSaving ? '保存中...' : '保存热点图'}
    </Button>
  );
};

export default HotspotSaveButton; 