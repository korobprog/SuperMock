import React from 'react';

interface NavLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export function NavLogo({
  className = '',
  showText = true,
  size = 'md',
}: NavLogoProps) {
  const sizeClasses = {
    xs: 'h-6 w-6 sm:h-8 sm:w-8',
    sm: 'h-8 w-8 sm:h-10 sm:w-10',
    md: 'h-10 w-10 sm:h-12 sm:w-12',
    lg: 'h-12 w-12 sm:h-16 sm:w-16',
  };

  const textSizes = {
    xs: 'text-sm sm:text-base',
    sm: 'text-base sm:text-lg',
    md: 'text-lg sm:text-xl',
    lg: 'text-xl sm:text-2xl',
  };

  if (showText) {
    return (
      <div className={`flex items-center space-x-2 sm:space-x-3 ${className}`}>
        <img
          src="/logo_main.png"
          alt="Super Mock"
          className={`${sizeClasses[size]} logo-image rounded-sm object-cover`}
          loading="eager"
          decoding="async"
          onError={(e) => {
            console.error('Failed to load nav logo:', e);
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
        <span className={`${sizeClasses[size]} font-bold text-primary hidden`}>
          SM
        </span>
        <span
          className={`font-bold text-foreground ${textSizes[size]} hidden sm:block`}
        >
          Super Mock
        </span>
      </div>
    );
  }

  return (
    <div className="relative">
      <img
        src="/logo_main.png"
        alt="Super Mock"
        className={`${sizeClasses[size]} logo-image rounded-sm object-cover ${className}`}
        loading="eager"
        decoding="async"
        onError={(e) => {
          console.error('Failed to load nav logo:', e);
          e.currentTarget.style.display = 'none';
          e.currentTarget.nextElementSibling?.classList.remove('hidden');
        }}
      />
      <span
        className={`${sizeClasses[size]} font-bold text-primary hidden absolute inset-0 flex items-center justify-center`}
      >
        SM
      </span>
    </div>
  );
}
