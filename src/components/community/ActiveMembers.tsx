
import React from 'react';
import { cn } from '@/lib/utils';

interface Member {
  initials: string;
  name: string;
  role: string;
  color: string;
}

const members: Member[] = [
  {
    initials: 'TK',
    name: '汤姆·凯勒',
    role: '游戏设计师',
    color: 'bg-blue-100 text-blue-700'
  },
  {
    initials: 'JD',
    name: '简·多伊',
    role: '创业者',
    color: 'bg-purple-100 text-purple-700'
  },
  {
    initials: 'MS',
    name: '迈克·史密斯',
    role: '产品经理',
    color: 'bg-green-100 text-green-700'
  }
];

const ActiveMembers: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-6">
      <h3 className="font-bold mb-4">活跃成员</h3>
      <div className="space-y-4">
        {members.map((member, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium",
              member.color
            )}>
              {member.initials}
            </div>
            <div>
              <p className="font-medium text-sm">{member.name}</p>
              <p className="text-xs text-gray-500">{member.role}</p>
            </div>
          </div>
        ))}
      </div>
      
      <button className="w-full text-center mt-4 text-connect-blue text-sm hover:underline">
        查看所有成员
      </button>
    </div>
  );
};

export default ActiveMembers;
