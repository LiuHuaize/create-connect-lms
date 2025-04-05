
import React from 'react';
import { Button } from '@/components/ui/button';

const WeeklyDiscussionCard: React.FC = () => {
  return (
    <div className="bg-connect-cream rounded-xl p-5 shadow-sm">
      <h3 className="font-bold mb-2">加入我们的每周讨论</h3>
      <p className="text-sm text-gray-700 mb-4">每周四与专家和同行在实时讨论中交流。</p>
      <Button className="w-full bg-black hover:bg-gray-800 text-white">
        立即注册
      </Button>
    </div>
  );
};

export default WeeklyDiscussionCard;
