
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const LoadingSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="flex justify-center">
          <div className="w-full max-w-4xl">
            <Skeleton className="h-8 sm:h-12 w-3/4 mb-2 sm:mb-4" />
            <Skeleton className="h-4 sm:h-6 w-1/2 mb-4 sm:mb-8" />
            <Skeleton className="h-64 sm:h-96 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;
