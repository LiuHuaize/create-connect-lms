
import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Course } from '@/types/course';
import { Label } from '@/components/ui/label';

interface CourseDetailsFormProps {
  course: Course;
  setCourse: React.Dispatch<React.SetStateAction<Course>>;
}

const COURSE_CATEGORIES = [
  { value: 'business_planning', label: '商业规划' },
  { value: 'game_design', label: '游戏设计' },
  { value: 'product_development', label: '产品开发' },
  { value: 'marketing', label: '市场营销' },
  { value: 'project_management', label: '项目管理' }
];

const DIFFICULTY_LEVELS = [
  { value: 'initial', label: '初级' },
  { value: 'intermediate', label: '中级' },
  { value: 'advanced', label: '高级' }
];

const CourseDetailsForm: React.FC<CourseDetailsFormProps> = ({ course, setCourse }) => {
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
          <Label htmlFor="category" className="text-sm font-medium text-gray-700 mb-2">分类</Label>
          <Select
            value={course.category || 'business_planning'}
            onValueChange={(value) => setCourse(prev => ({ ...prev, category: value }))}
          >
            <SelectTrigger id="category" className="focus:ring-2 focus:ring-connect-blue/20">
              <SelectValue placeholder="选择课程分类" />
            </SelectTrigger>
            <SelectContent>
              {COURSE_CATEGORIES.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2">难度</Label>
          <div className="flex flex-wrap gap-4">
            {DIFFICULTY_LEVELS.map((level) => (
              <label key={level.value} className="flex items-center cursor-pointer hover:bg-gray-50 px-3 py-2 rounded-md transition-colors">
                <input 
                  type="radio" 
                  name="level" 
                  value={level.value}
                  checked={course.difficulty === level.value}
                  onChange={() => setCourse(prev => ({ ...prev, difficulty: level.value as 'initial' | 'intermediate' | 'advanced' }))}
                  className="mr-2 text-connect-blue focus:ring-connect-blue h-4 w-4"
                />
                <span className="text-gray-700">{level.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailsForm;
