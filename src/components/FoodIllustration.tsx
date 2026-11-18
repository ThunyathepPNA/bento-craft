import React, { useState } from 'react';
import type { FoodItem, MeatChoice } from '../types/bento';

interface FoodIllustrationProps {
  item: FoodItem;
  selectedMeat?: MeatChoice;
  size?: 'sm' | 'md' | 'lg' | 'fill';
  className?: string;
}

export const FoodIllustration: React.FC<FoodIllustrationProps> = ({
  item,
  selectedMeat,
  size = 'md',
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  const activeCropSrc =
    (selectedMeat && item.meatPhotoMap?.[selectedMeat]?.cropImage) ||
    item.cropImage;

  // Circular plate thumbnail for the left menu drawer
  if (size === 'sm') {
    if (item.hasRealPhoto && activeCropSrc && !imgError) {
      return (
        <div
          className={`relative w-14 h-14 rounded-full bg-white border-2 border-zinc-200 shadow-sm overflow-hidden select-none shrink-0 ${className}`}
        >
          <img
            src={activeCropSrc}
            alt={item.nameTh}
            loading="lazy"
            draggable={false}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-center transition-transform duration-200 group-hover:scale-110"
          />
        </div>
      );
    }

    return (
      <div
        className={`relative w-14 h-14 rounded-full bg-amber-50 text-amber-900 border-2 border-dashed border-amber-300 flex items-center justify-center text-center p-1 select-none shrink-0 ${className}`}
      >
        <span className="text-xs font-bold leading-none">รอรูป</span>
      </div>
    );
  }

  // Full-bleed edge-to-edge compartment fill
  const sizeClass =
    size === 'lg'
      ? 'w-28 h-28 sm:w-32 sm:h-32 rounded-xl'
      : size === 'fill'
      ? 'w-full h-full rounded-none'
      : 'w-16 h-16 rounded-xl';

  if (item.hasRealPhoto && activeCropSrc && !imgError) {
    return (
      <div
        className={`relative overflow-hidden bg-zinc-100 select-none ${sizeClass} ${className}`}
      >
        <img
          src={activeCropSrc}
          alt={item.nameTh}
          loading="lazy"
          draggable={false}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative flex flex-col items-center justify-center bg-amber-50/80 text-zinc-900 border-2 border-dashed border-amber-300 p-4 text-center select-none ${sizeClass} ${className}`}
    >
      <span className="text-sm font-bold text-zinc-900 leading-tight line-clamp-2 px-1">
        {item.nameTh}
        {selectedMeat ? ` (${selectedMeat})` : ''}
      </span>
      <span className="text-xs font-semibold text-amber-800 mt-1 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
        รอถ่ายรูปอาหารจริง
      </span>
    </div>
  );
};
