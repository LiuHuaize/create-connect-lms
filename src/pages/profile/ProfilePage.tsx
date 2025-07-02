import React from 'react';
import { UserProfile } from '@/components/gamification/UserProfile';

export const ProfilePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-ghibli-deepTeal mb-2">我的档案</h1>
          <p className="text-gray-600">查看您的学习进度和成就</p>
        </div>
        
        <UserProfile />
      </div>
    </div>
  );
};
