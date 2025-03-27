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
    <div className={`border border-gray-200 rounded-xl p-4 sm:p-6 hover:shadow-md transition-shadow hover:border-gray-300 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-start">
        <div className="mx-auto sm:mx-0 sm:mr-4 p-3 bg-gray-100 rounded-lg w-fit mb-3 sm:mb-0">
          {icon}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">{title}</h3>
          <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4">{description}</p>
          <button className="inline-flex items-center justify-center text-connect-blue text-sm font-medium mx-auto sm:mx-0">
            了解更多
            <ChevronRight size={16} className="ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeatureCard;
