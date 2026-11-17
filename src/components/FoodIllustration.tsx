import React, { useState } from 'react';

interface FoodIllustrationProps {
  foodId: string;
  nameTh?: string;
  emoji?: string;
  size?: 'sm' | 'md' | 'lg' | 'fill';
  className?: string;
}

export const FoodIllustration: React.FC<FoodIllustrationProps> = ({
  foodId,
  nameTh = '',
  emoji = '🍱',
  size = 'md',
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeClass =
    size === 'sm'
      ? 'w-14 h-14 rounded-2xl'
      : size === 'lg'
      ? 'w-32 h-32 sm:w-36 sm:h-36 rounded-3xl'
      : size === 'fill'
      ? 'w-full h-full rounded-[16px]'
      : 'w-20 h-20 rounded-2xl';

  if (imgError) {
    return (
      <div
        className={`${sizeClass} bg-gradient-to-br from-amber-50 to-stone-100 border border-stone-200 flex items-center justify-center text-3xl shadow-inner ${className}`}
      >
        {emoji}
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden bg-stone-900/5 shadow-md ring-1 ring-black/10 ${sizeClass} ${className}`}
    >
      <img
        src={`./images/foods/${foodId}.jpg`}
        alt={nameTh || foodId}
        loading="lazy"
        onError={() => setImgError(true)}
        className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
      />
      {/* Subtle studio lighting highlight overlay */}
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/25 bg-gradient-to-tr from-black/10 via-transparent to-white/10" />
    </div>
  );
};
