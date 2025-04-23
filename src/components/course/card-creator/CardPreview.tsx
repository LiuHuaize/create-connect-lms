import React from 'react';

interface CardPreviewProps {
  imageUrl: string;
  className?: string;
}

export function CardPreview({ imageUrl, className = '' }: CardPreviewProps) {
  return (
    <div className={`card-preview flex justify-center ${className}`}>
      <div className="relative max-w-md overflow-hidden rounded-lg border border-gray-200 shadow-sm">
        <img 
          src={imageUrl} 
          alt="Generated card" 
          className="w-full h-auto object-contain"
        />
      </div>
    </div>
  );
} 