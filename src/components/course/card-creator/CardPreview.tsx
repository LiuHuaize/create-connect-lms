import React from 'react';

interface CardPreviewProps {
  imageUrl: string;
  className?: string;
}

/**
 * 卡片预览组件
 * 显示生成的卡片图像，提供下载和分享功能
 */
export function CardPreview({ imageUrl, className = '' }: CardPreviewProps) {
  return (
    <div className={`card-preview ${className}`}>
      <div className="relative aspect-video w-full rounded-md overflow-hidden border border-gray-200 shadow-sm">
        <img
          src={imageUrl}
          alt="生成的卡片"
          className="object-contain w-full h-full"
        />
      </div>
    </div>
  );
} 