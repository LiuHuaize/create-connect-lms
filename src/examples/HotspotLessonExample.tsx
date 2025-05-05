import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Hotspot, HotspotLessonContent, Lesson, LessonType } from '@/types/course';
import { courseService } from '@/services/courseService';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

/**
 * 热点课程保存示例
 * 这个组件展示了如何创建和保存热点类型的课程内容
 */
const HotspotLessonExample: React.FC<{ moduleId: string }> = ({ moduleId }) => {
  const [isSaving, setIsSaving] = useState(false);

  // 创建一个示例热点课程
  const createSampleHotspotLesson = async () => {
    if (!moduleId) {
      toast.error('请先创建或选择一个模块');
      return;
    }

    setIsSaving(true);
    try {
      // 创建示例热点
      const hotspots: Hotspot[] = [
        {
          id: `hotspot-${uuidv4()}`,
          x: 20,
          y: 30,
          title: '示例热点 1',
          description: '这是第一个热点的详细描述。您可以在这里添加文本内容。'
        },
        {
          id: `hotspot-${uuidv4()}`,
          x: 60,
          y: 40,
          title: '示例热点 2',
          description: '这是第二个热点的详细描述。您可以在这里添加文本内容。'
        },
        {
          id: `hotspot-${uuidv4()}`,
          x: 40,
          y: 70,
          title: '示例热点 3',
          description: '这是第三个热点的详细描述。您可以在这里添加文本内容。'
        }
      ];

      // 创建热点课程内容
      const hotspotContent: HotspotLessonContent = {
        backgroundImage: 'https://images.unsplash.com/photo-1696906589486-0bfa73644b93',
        introduction: '这是一个交互式热点课程示例。点击图片上的标记点查看详细内容。',
        hotspots: hotspots
      };

      // 创建课程对象
      const lessonData: Omit<Lesson, 'created_at' | 'updated_at'> = {
        id: uuidv4(),
        module_id: moduleId,
        title: '交互式热点课程示例',
        type: 'hotspot' as LessonType,
        content: hotspotContent,
        order_index: 0 // 默认位置，实际使用时应该获取正确的顺序
      };

      // 保存到数据库
      const savedLesson = await courseService.addLesson(lessonData);
      
      toast.success('热点课程创建成功');
      console.log('保存的热点课程:', savedLesson);
      
      return savedLesson;
    } catch (error) {
      console.error('创建热点课程失败:', error);
      toast.error('创建热点课程失败');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 border rounded-md">
      <h2 className="text-xl font-bold mb-4">热点课程创建示例</h2>
      <p className="mb-4">点击下面的按钮创建一个示例热点课程：</p>
      <Button 
        onClick={createSampleHotspotLesson} 
        disabled={isSaving}
      >
        {isSaving ? '保存中...' : '创建示例热点课程'}
      </Button>
    </div>
  );
};

export default HotspotLessonExample; 