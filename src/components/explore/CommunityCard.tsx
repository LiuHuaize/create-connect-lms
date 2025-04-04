
import React from 'react';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';

const CommunityCard: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 text-center shadow-sm border border-blue-100">
      <div className="inline-flex items-center justify-center p-2 bg-blue-100 rounded-full mb-4">
        <Users className="h-6 w-6 text-blue-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">想要获取更多学习资源？</h2>
      <p className="text-gray-600 mb-6">加入我们的学习社区，与其他学习者交流分享</p>
      <Button asChild size="lg" className="bg-connect-blue hover:bg-blue-600">
        <a href="/community">查看社区</a>
      </Button>
    </div>
  );
};

export default CommunityCard;
