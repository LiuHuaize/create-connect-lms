import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Course } from '@/types/course';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface CourseDetailsFormProps {
  course: Course;
  setCourse: React.Dispatch<React.SetStateAction<Course>>;
}

const DEFAULT_CATEGORIES = [
  { value: 'business_planning', label: '商业规划' },
  { value: 'game_design', label: '游戏设计' },
  { value: 'product_development', label: '产品开发' },
  { value: 'marketing', label: '市场营销' },
  { value: 'project_management', label: '项目管理' },
  { value: 'custom', label: '自定义分类...' }
];

// 难度级别选项
const DIFFICULTY_LEVELS = [
  { value: 'beginner', label: '初级' },
  { value: 'intermediate', label: '中级' },
  { value: 'advanced', label: '高级' }
];

const CourseDetailsForm: React.FC<CourseDetailsFormProps> = ({ course, setCourse }) => {
  const [customCategoryOpen, setCustomCategoryOpen] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [selectedCategoryDisplay, setSelectedCategoryDisplay] = useState<string>('');
  const [courseCategories, setCourseCategories] = useState(DEFAULT_CATEGORIES);

  // 更新分类显示值
  useEffect(() => {
    if (!course.category) {
      setSelectedCategoryDisplay('business_planning');
      return;
    }
    
    // 如果是预设分类，显示预设值，否则直接显示自定义分类值
    const categoryItem = courseCategories.find(cat => cat.value === course.category);
    if (categoryItem) {
      setSelectedCategoryDisplay(categoryItem.value);
    } else {
      // 这是自定义分类，检查是否需要添加到分类列表
      const categoryExists = courseCategories.some(cat => cat.value === course.category);
      if (!categoryExists && course.category !== 'custom') {
        // 添加自定义分类到列表
        setCourseCategories(prev => [
          ...prev.filter(cat => cat.value !== 'custom'),
          { value: course.category, label: course.category },
          { value: 'custom', label: '自定义分类...' }
        ]);
      }
      // 设置显示值
      setSelectedCategoryDisplay(course.category);
    }
  }, [course.category, courseCategories]);

  const handleCategoryChange = (value: string) => {
    try {
      if (value === 'custom') {
        setCustomCategoryOpen(true);
      } else {
        setCourse(prev => ({ ...prev, category: value }));
      }
    } catch (error) {
      console.error('处理分类变更时出错:', error);
    }
  };

  const handleCustomCategorySubmit = () => {
    try {
      if (customCategory.trim()) {
        const trimmedCategory = customCategory.trim();
        console.log('提交自定义分类:', trimmedCategory);
        
        // 添加自定义分类到下拉列表
        setCourseCategories(prev => [
          ...prev.filter(cat => cat.value !== 'custom' && cat.value !== trimmedCategory),
          { value: trimmedCategory, label: trimmedCategory },
          { value: 'custom', label: '自定义分类...' }
        ]);
        
        setCourse(prev => {
          const updatedCourse = { ...prev, category: trimmedCategory };
          console.log('更新后的课程对象:', updatedCourse);
          return updatedCourse;
        });
        
        // 关闭对话框并重置输入
        setCustomCategoryOpen(false);
        setCustomCategory('');
      }
    } catch (error) {
      console.error('提交自定义分类时出错:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">课程基本信息</h2>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="course-title" className="text-sm font-medium text-gray-700 mb-2">课程标题</Label>
          <Input 
            id="course-title"
            placeholder="例如：全面的商业计划创建" 
            value={course.title}
            onChange={(e) => setCourse(prev => ({ ...prev, title: e.target.value }))}
            className="placeholder:text-gray-400 focus:ring-2 focus:ring-connect-blue/20"
          />
        </div>
        
        <div>
          <Label htmlFor="short-desc" className="text-sm font-medium text-gray-700 mb-2">简短描述</Label>
          <Input 
            id="short-desc"
            placeholder="简短描述（1-2句话）" 
            value={course.short_description || ''}
            onChange={(e) => setCourse(prev => ({ ...prev, short_description: e.target.value }))}
            className="placeholder:text-gray-400 focus:ring-2 focus:ring-connect-blue/20"
          />
        </div>
        
        <div>
          <Label htmlFor="description" className="text-sm font-medium text-gray-700 mb-2">详细描述</Label>
          <Textarea 
            id="description"
            placeholder="关于课程内容和目标的详细描述" 
            className="min-h-32 placeholder:text-gray-400 focus:ring-2 focus:ring-connect-blue/20" 
            value={course.description || ''}
            onChange={(e) => setCourse(prev => ({ ...prev, description: e.target.value }))}
          />
        </div>
        
        <div>
          <Label htmlFor="preparation-materials" className="text-sm font-medium text-gray-700 mb-2">课前准备</Label>
          <Textarea 
            id="preparation-materials"
            placeholder="列出学生需要准备的材料和工具，例如：笔记本、彩笔、纸张等" 
            className="min-h-32 placeholder:text-gray-400 focus:ring-2 focus:ring-connect-blue/20" 
            value={course.preparation_materials || ''}
            onChange={(e) => setCourse(prev => ({ ...prev, preparation_materials: e.target.value }))}
          />
        </div>
        
        <div>
          <Label htmlFor="duration-minutes" className="text-sm font-medium text-gray-700 mb-2">课程时长(分钟)</Label>
          <Input 
            id="duration-minutes"
            type="number"
            min="1"
            placeholder="例如：30, 60, 90" 
            className="placeholder:text-gray-400 focus:ring-2 focus:ring-connect-blue/20" 
            value={course.duration_minutes || ''}
            onChange={(e) => setCourse(prev => ({ 
              ...prev, 
              duration_minutes: e.target.value ? parseInt(e.target.value) : null 
            }))}
          />
        </div>
        
        <div>
          <Label htmlFor="category" className="text-sm font-medium text-gray-700 mb-2">分类</Label>
          <Select
            value={selectedCategoryDisplay}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger id="category" className="focus:ring-2 focus:ring-connect-blue/20">
              <SelectValue placeholder="选择课程分类" />
            </SelectTrigger>
            <SelectContent>
              {courseCategories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2">适用年级范围</Label>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="grade-min" className="text-xs text-gray-500 mb-1">最小年级</Label>
              <Input 
                id="grade-min"
                type="number" 
                min="1"
                placeholder="1" 
                value={course.grade_range_min || ''}
                onChange={(e) => setCourse(prev => ({ 
                  ...prev, 
                  grade_range_min: e.target.value ? parseInt(e.target.value) : null 
                }))}
                className="placeholder:text-gray-400 focus:ring-2 focus:ring-connect-blue/20"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="grade-max" className="text-xs text-gray-500 mb-1">最大年级</Label>
              <Input 
                id="grade-max"
                type="number" 
                min="1"
                placeholder="12" 
                value={course.grade_range_max || ''}
                onChange={(e) => setCourse(prev => ({ 
                  ...prev, 
                  grade_range_max: e.target.value ? parseInt(e.target.value) : null 
                }))}
                className="placeholder:text-gray-400 focus:ring-2 focus:ring-connect-blue/20"
              />
            </div>
          </div>
        </div>
        
        <div>
          <Label htmlFor="primary-subject" className="text-sm font-medium text-gray-700 mb-2">主学科</Label>
          <Input 
            id="primary-subject"
            placeholder="例如：数学、语文、科学等" 
            value={course.primary_subject || ''}
            onChange={(e) => setCourse(prev => ({ ...prev, primary_subject: e.target.value }))}
            className="placeholder:text-gray-400 focus:ring-2 focus:ring-connect-blue/20"
          />
        </div>
        
        <div>
          <Label htmlFor="secondary-subject" className="text-sm font-medium text-gray-700 mb-2">第二跨学科</Label>
          <Input 
            id="secondary-subject"
            placeholder="例如：编程、历史、艺术等" 
            value={course.secondary_subject || ''}
            onChange={(e) => setCourse(prev => ({ ...prev, secondary_subject: e.target.value }))}
            className="placeholder:text-gray-400 focus:ring-2 focus:ring-connect-blue/20"
          />
        </div>
        
        <div>
          <Label htmlFor="difficulty" className="text-sm font-medium text-gray-700 mb-2">难度级别</Label>
          <Select
            value={course.difficulty || 'beginner'}
            onValueChange={(value) => setCourse(prev => ({ ...prev, difficulty: value }))}
          >
            <SelectTrigger id="difficulty" className="focus:ring-2 focus:ring-connect-blue/20">
              <SelectValue placeholder="选择难度级别" />
            </SelectTrigger>
            <SelectContent>
              {DIFFICULTY_LEVELS.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Dialog open={customCategoryOpen} onOpenChange={setCustomCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加自定义分类</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="输入新分类名称"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              className="w-full"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCustomCategorySubmit();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomCategoryOpen(false)}>取消</Button>
            <Button onClick={handleCustomCategorySubmit}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseDetailsForm;
