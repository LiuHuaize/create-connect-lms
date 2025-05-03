import React from 'react';
import { Course } from '@/types/course';

interface InfoTabProps {
  course: Course;
}

const InfoTab: React.FC<InfoTabProps> = ({ course }) => {
  return (
    <div className="bg-white p-6 rounded-lg border">
      <h2 className="text-xl font-bold mb-4">课程详情</h2>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">课程描述</h3>
          <p className="text-gray-700 whitespace-pre-line">
            {course.description || '暂无课程描述'}
          </p>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-2">适用年级与学科</h3>
          <div className="space-y-2">
            <p className="text-gray-700">
              <span className="font-medium">适用年级：</span>
              {course.grade_range_min && course.grade_range_max 
                ? `${course.grade_range_min} - ${course.grade_range_max}年级` 
                : course.grade_range_min 
                ? `${course.grade_range_min}年级及以上` 
                : course.grade_range_max 
                ? `${course.grade_range_max}年级及以下` 
                : '所有年级'}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">主要学科：</span>
              {course.primary_subject || '暂无指定'}
            </p>
            {course.secondary_subject && (
              <p className="text-gray-700">
                <span className="font-medium">跨学科领域：</span>
                {course.secondary_subject}
              </p>
            )}
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-2">学习目标</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li>完成本课程后，您将掌握相关领域的核心概念</li>
            <li>能够应用所学知识解决实际问题</li>
            <li>获得实践经验和技能</li>
          </ul>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-2">适合人群</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li>对该领域感兴趣的初学者</li>
            <li>希望提升相关技能的学习者</li>
            <li>寻求专业知识拓展的从业人员</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default InfoTab;
