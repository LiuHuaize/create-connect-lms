import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const SavedCourses: React.FC = () => {
  return (
    <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <p className="text-gray-500 mb-4">您尚未保存任何课程</p>
      <Button asChild>
        <Link to="/explore-courses">浏览课程</Link>
      </Button>
    </div>
  );
};

export default SavedCourses; 