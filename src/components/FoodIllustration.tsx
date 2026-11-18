import React, { useState } from 'react';
import type { FoodItem } from '../types/bento';

interface FoodIllustrationProps {
  item: FoodItem;
  size?: 'sm' | 'md' | 'lg' | 'fill';
  className?: string;
}

export const FoodIllustration: React.FC<FoodIllustrationProps> = ({
  item,
  size = 'md',
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeClass =
    size === 'sm'
      ? 'w-14 h-14 rounded-lg'
      : size === 'lg'
      ? 'w-28 h-28 sm:w-32 sm:h-32 rounded-xl'
      : size === 'fill'
      ? 'w-full h-full rounded-none'
      : 'w-16 h-16 rounded-xl';

  if (item.hasRealPhoto && item.cropImage && !imgError) {
    return (
      <div
        className={`relative overflow-hidden bg-zinc-900 select-none ${sizeClass} ${className}`}
      >
        <img
          src={item.cropImage}
          alt={item.nameTh}
          loading="lazy"
          draggable={false}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/15" />
      </div>
    );
  }

  // Honest non-AI placeholder for menus awaiting real photography from Dad's kitchen
  return (
    <div
      className={`relative flex flex-col items-center justify-center bg-zinc-900 text-zinc-100 border border-dashed border-zinc-600 p-2 text-center select-none ${sizeClass} ${className}`}
    >
      <svg
        className={size === 'sm' ? 'w-5 h-5 text-lime-400' : 'w-8 h-8 text-lime-400 mb-1.5'}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
        />
        <circle cx="12" cy="13" r="3" />
      </svg>
      {size !== 'sm' && (
        <>
          <span className="text-xs font-bold text-white leading-tight line-clamp-2 px-1">
            {item.nameTh}
          </span>
          <span className="text-xs text-amber-300 mt-1 font-medium">
            รอถ่ายรูปอาหารจริง
          </span>
        </>
      )}
    </div>
  );
};
