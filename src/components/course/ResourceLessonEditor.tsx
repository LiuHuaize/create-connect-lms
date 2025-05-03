import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';
import { Lesson } from '@/types/course';
import ResourceManager from './creator/ResourceManager';

interface ResourceLessonEditorProps {
  lesson: Lesson;
  onChange: (updatedLesson: Lesson) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
  courseId: string;
}

export function ResourceLessonEditor({
  lesson,
  onChange,
  onSave,
  isSaving,
  courseId
}: ResourceLessonEditorProps) {
  const [description, setDescription] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('details');
  
  // 初始化编辑器状态
  useEffect(() => {
    // 如果课时内容中存在description，则加载它
    if (lesson.content && 'description' in lesson.content) {
      setDescription(lesson.content.description || '');
    }
  }, [lesson]);
  
  // 更新课时描述
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDescription = e.target.value;
    setDescription(newDescription);
    
    // 更新课时内容
    const updatedLesson = {
      ...lesson,
      content: {
        ...lesson.content,
        description: newDescription
      }
    };
    
    onChange(updatedLesson);
  };
  
  // 切换标签页
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>编辑资源模块</CardTitle>
            <CardDescription>
              管理可下载资源和描述
            </CardDescription>
          </div>
          <Button
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                保存
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-4">
            <TabsTrigger value="details">模块描述</TabsTrigger>
            <TabsTrigger value="resources">资源管理</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resource-description">模块描述</Label>
                <Textarea
                  id="resource-description"
                  placeholder="添加对此资源模块的描述，例如解释这些资源的用途、如何使用它们等。"
                  rows={6}
                  value={description}
                  onChange={handleDescriptionChange}
                />
                <p className="text-sm text-gray-500">
                  描述会显示在资源列表上方，帮助学生理解这些资源的用途和重要性。
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="resources">
            {lesson.module_id ? (
              <ResourceManager
                moduleId={lesson.module_id}
                courseId={courseId}
              />
            ) : (
              <div className="text-center py-8 text-red-500">
                <p>请先保存课时，才能管理资源文件。</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default ResourceLessonEditor; 