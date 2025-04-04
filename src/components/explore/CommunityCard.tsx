
import React from 'react';
import { Button } from '@/components/ui/button';

const CommunityCard: React.FC = () => {
  return (
    <div className="bg-blue-50 rounded-xl p-8 text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-3">想要获取更多学习资源？</h2>
      <p className="text-gray-600 mb-6">加入我们的学习社区，与其他学习者交流分享</p>
      <Button asChild size="lg" className="bg-connect-blue hover:bg-blue-600">
        <a href="/community">查看社区</a>
      </Button>
    </div>
  );
};

export default CommunityCard;
