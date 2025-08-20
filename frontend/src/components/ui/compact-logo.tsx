import React from 'react';

interface CompactLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'xs' | 'sm' | 'md';
}

export function CompactLogo({
  className = '',
  showText = false,
  size = 'md',
}: CompactLogoProps) {
  const sizeClasses = {
    xs: 'h-6 w-6',
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
  };

  const textSizes = {
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-lg',
  };

  if (showText) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <img
          src="/logo_main.png"
          alt="Super Mock"
          className={`${sizeClasses[size]} logo-image rounded-sm`}
          loading="eager"
          decoding="async"
          onError={(e) => {
            console.error('Failed to load compact logo:', e);
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
        <span className={`${sizeClasses[size]} font-bold text-primary hidden`}>
          SM
        </span>
        <span className={`font-bold text-foreground ${textSizes[size]}`}>
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
        className={`${sizeClasses[size]} logo-image rounded-sm ${className}`}
        loading="eager"
        decoding="async"
        onError={(e) => {
          console.error('Failed to load compact logo:', e);
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
