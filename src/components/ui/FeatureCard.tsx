import React, { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  className?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, className }) => {
  return (
    <div className={`border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow hover:border-gray-300 ${className}`}>
      <div className="flex items-start">
        <div className="mr-4 p-3 bg-gray-100 rounded-lg">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-2">{title}</h3>
          <p className="text-gray-600 text-sm mb-4">{description}</p>
          <button className="inline-flex items-center text-connect-blue text-sm font-medium">
            了解更多
            <ChevronRight size={16} className="ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeatureCard;
