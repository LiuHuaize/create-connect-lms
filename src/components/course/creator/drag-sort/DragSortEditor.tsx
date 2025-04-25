import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DragSortCategory, DragSortContent, DragSortItem, DragSortMapping, Lesson } from '@/types/course';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Plus, ExternalLink } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import DragSortExercise from '../../components/drag-sort/DragSortExercise';

interface DragSortEditorProps {
  lesson: Lesson;
  onSave: (content: DragSortContent) => void;
}

const DragSortEditor: React.FC<DragSortEditorProps> = ({ lesson, onSave }) => {
  // 从课时中加载内容，如果是新创建的则使用默认值
  const [content, setContent] = useState<DragSortContent>(() => {
    const defaultContent: DragSortContent = {
      introduction: '',
      items: [],
      categories: [],
      correctMappings: []
    };
    
    try {
      const existingContent = lesson.content as any;
      return {
        introduction: existingContent.introduction || defaultContent.introduction,
        items: existingContent.items || defaultContent.items,
        categories: existingContent.categories || defaultContent.categories,
        correctMappings: existingContent.correctMappings || defaultContent.correctMappings
      };
    } catch (e) {
      return defaultContent;
    }
  });
  
  // 添加新项目
  const addItem = () => {
    const newItem: DragSortItem = {
      id: uuidv4(),
      text: '',
      description: ''
    };
    
    setContent(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };
  
  // 添加新分类
  const addCategory = () => {
    const newCategory: DragSortCategory = {
      id: uuidv4(),
      title: '',
      description: ''
    };
    
    setContent(prev => ({
      ...prev,
      categories: [...prev.categories, newCategory]
    }));
  };
  
  // 更新项目
  const updateItem = (id: string, field: keyof DragSortItem, value: string) => {
    setContent(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };
  
  // 更新分类
  const updateCategory = (id: string, field: keyof DragSortCategory, value: string) => {
    setContent(prev => ({
      ...prev,
      categories: prev.categories.map(category => 
        category.id === id ? { ...category, [field]: value } : category
      )
    }));
  };
  
  // 删除项目
  const deleteItem = (id: string) => {
    setContent(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id),
      // 同时删除相关的映射关系
      correctMappings: prev.correctMappings.filter(mapping => mapping.itemId !== id)
    }));
  };
  
  // 删除分类
  const deleteCategory = (id: string) => {
    setContent(prev => ({
      ...prev,
      categories: prev.categories.filter(category => category.id !== id),
      // 同时删除相关的映射关系
      correctMappings: prev.correctMappings.filter(mapping => mapping.categoryId !== id)
    }));
  };
  
  // 更新映射关系
  const updateMapping = (itemId: string, categoryId: string, isChecked: boolean) => {
    setContent(prev => {
      if (isChecked) {
        // 添加新映射
        const newMapping: DragSortMapping = { itemId, categoryId };
        return {
          ...prev,
          correctMappings: [...prev.correctMappings.filter(m => m.itemId !== itemId), newMapping]
        };
      } else {
        // 移除映射
        return {
          ...prev,
          correctMappings: prev.correctMappings.filter(
            m => !(m.itemId === itemId && m.categoryId === categoryId)
          )
        };
      }
    });
  };
  
  // 保存内容
  const handleSave = () => {
    // 验证必要字段
    if (!content.introduction) {
      alert('请填写介绍文字');
      return;
    }
    
    if (content.items.length === 0) {
      alert('请添加至少一个项目');
      return;
    }
    
    if (content.categories.length === 0) {
      alert('请添加至少一个分类');
      return;
    }
    
    if (content.correctMappings.length === 0) {
      alert('请设置正确的分类映射关系');
      return;
    }
    
    // 调用保存回调
    onSave(content);
  };
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="content">内容编辑</TabsTrigger>
          <TabsTrigger value="preview">预览效果</TabsTrigger>
        </TabsList>
        
        <TabsContent value="content" className="space-y-6 pt-4">
          {/* 介绍文字 */}
          <Card>
            <CardHeader>
              <CardTitle>介绍文字</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea 
                value={content.introduction}
                onChange={e => setContent(prev => ({ ...prev, introduction: e.target.value }))}
                placeholder="请输入练习的介绍和指导文字..."
                className="min-h-[100px]"
              />
            </CardContent>
          </Card>
          
          {/* 可拖拽项目 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>可拖拽项目</CardTitle>
              <Button type="button" size="sm" onClick={addItem}>
                <Plus size={16} className="mr-1" /> 添加项目
              </Button>
            </CardHeader>
            <CardContent>
              {content.items.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  暂无项目，请点击"添加项目"按钮创建
                </div>
              ) : (
                <div className="space-y-4">
                  {content.items.map(item => (
                    <div key={item.id} className="border rounded-md p-4 relative">
                      <div className="absolute top-3 right-3">
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="icon" 
                          onClick={() => deleteItem(item.id)}
                          className="h-8 w-8 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                      
                      <div className="grid gap-3">
                        <div>
                          <Label htmlFor={`item-text-${item.id}`}>项目文本</Label>
                          <Input 
                            id={`item-text-${item.id}`}
                            value={item.text}
                            onChange={e => updateItem(item.id, 'text', e.target.value)}
                            placeholder="请输入项目文本"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`item-desc-${item.id}`}>项目描述 (可选)</Label>
                          <Textarea 
                            id={`item-desc-${item.id}`}
                            value={item.description || ''}
                            onChange={e => updateItem(item.id, 'description', e.target.value)}
                            placeholder="请输入项目描述"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* 分类区域 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>分类区域</CardTitle>
              <Button type="button" size="sm" onClick={addCategory}>
                <Plus size={16} className="mr-1" /> 添加分类
              </Button>
            </CardHeader>
            <CardContent>
              {content.categories.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  暂无分类，请点击"添加分类"按钮创建
                </div>
              ) : (
                <div className="space-y-4">
                  {content.categories.map(category => (
                    <div key={category.id} className="border rounded-md p-4 relative">
                      <div className="absolute top-3 right-3">
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="icon" 
                          onClick={() => deleteCategory(category.id)}
                          className="h-8 w-8 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                      
                      <div className="grid gap-3">
                        <div>
                          <Label htmlFor={`category-title-${category.id}`}>分类标题</Label>
                          <Input 
                            id={`category-title-${category.id}`}
                            value={category.title}
                            onChange={e => updateCategory(category.id, 'title', e.target.value)}
                            placeholder="请输入分类标题"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`category-desc-${category.id}`}>分类描述 (可选)</Label>
                          <Textarea 
                            id={`category-desc-${category.id}`}
                            value={category.description || ''}
                            onChange={e => updateCategory(category.id, 'description', e.target.value)}
                            placeholder="请输入分类描述"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* 正确映射关系 */}
          {content.items.length > 0 && content.categories.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>设置正确的分类关系</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-3 text-left font-medium text-sm">项目</th>
                        {content.categories.map(category => (
                          <th key={category.id} className="p-3 text-center font-medium text-sm">
                            {category.title || '未命名分类'}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {content.items.map(item => (
                        <tr key={item.id} className="border-t">
                          <td className="p-3 border-r">
                            {item.text || '未命名项目'}
                          </td>
                          {content.categories.map(category => {
                            const isChecked = content.correctMappings.some(
                              mapping => mapping.itemId === item.id && mapping.categoryId === category.id
                            );
                            
                            return (
                              <td key={category.id} className="p-3 text-center border-r">
                                <input 
                                  type="checkbox"
                                  className="w-5 h-5"
                                  checked={isChecked}
                                  onChange={e => updateMapping(item.id, category.id, e.target.checked)}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  为每个项目选择一个正确的分类。一个项目必须且只能归属于一个分类。
                </p>
              </CardContent>
            </Card>
          )}
          
          <div className="flex justify-end">
            <Button type="button" onClick={handleSave}>保存练习</Button>
          </div>
        </TabsContent>
        
        <TabsContent value="preview" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>预览效果</span>
                <Button type="button" variant="ghost" size="sm">
                  <ExternalLink size={16} className="mr-1" /> 全屏预览
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md p-4">
                {(content.items.length > 0 && content.categories.length > 0) ? (
                  <DragSortExercise 
                    lesson={{ ...lesson, content: content as any }} 
                    isPreview={true}
                  />
                ) : (
                  <div className="text-center py-10 text-gray-500">
                    请先添加项目和分类，以查看预览效果
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DragSortEditor; 