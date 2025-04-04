
import React from 'react';
import { Card } from '@/components/ui/card';

const LoadingCourses: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((item) => (
        <Card key={item} className="p-6 h-60 animate-pulse">
          <div className="bg-gray-200 h-4 w-1/3 mb-4 rounded"></div>
          <div className="bg-gray-200 h-6 w-3/4 mb-4 rounded"></div>
          <div className="bg-gray-200 h-4 w-full mb-6 rounded"></div>
          <div className="flex space-x-2 mb-4">
            <div className="bg-gray-200 h-4 w-16 rounded"></div>
            <div className="bg-gray-200 h-4 w-20 rounded"></div>
          </div>
          <div className="bg-gray-200 h-8 w-28 rounded mt-auto"></div>
        </Card>
      ))}
    </div>
  );
};

export default LoadingCourses;
