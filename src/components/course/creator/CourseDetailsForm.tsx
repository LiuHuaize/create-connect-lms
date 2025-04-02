
import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Course } from '@/types/course';

interface CourseDetailsFormProps {
  course: Course;
  setCourse: React.Dispatch<React.SetStateAction<Course>>;
}

const CourseDetailsForm: React.FC<CourseDetailsFormProps> = ({ course, setCourse }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-lg font-bold mb-4">基本信息</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">课程标题</label>
          <Input 
            placeholder="例如：全面的商业计划创建" 
            value={course.title}
            onChange={(e) => setCourse(prev => ({ ...prev, title: e.target.value }))}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">简短描述</label>
          <Input 
            placeholder="简短描述（1-2句话）" 
            value={course.short_description || ''}
            onChange={(e) => setCourse(prev => ({ ...prev, short_description: e.target.value }))}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">详细描述</label>
          <Textarea 
            placeholder="关于课程内容和目标的详细描述" 
            className="min-h-32" 
            value={course.description || ''}
            onChange={(e) => setCourse(prev => ({ ...prev, description: e.target.value }))}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
          <select className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-connect-blue/20 focus:border-connect-blue">
            <option>商业规划</option>
            <option>游戏设计</option>
            <option>产品开发</option>
            <option>市场营销</option>
            <option>项目管理</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">难度</label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input 
                type="radio" 
                name="level" 
                className="mr-2" 
                defaultChecked={false}
              />
              <span>初级</span>
            </label>
            <label className="flex items-center">
              <input 
                type="radio" 
                name="level" 
                className="mr-2" 
                defaultChecked={true}
              />
              <span>中级</span>
            </label>
            <label className="flex items-center">
              <input 
                type="radio" 
                name="level" 
                className="mr-2" 
                defaultChecked={false}
              />
              <span>高级</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailsForm;
