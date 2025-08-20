import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className = '', size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-auto',
    md: 'h-8 w-auto',
    lg: 'h-12 w-auto',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img
        src="/logo_main.png"
        alt="MockMate"
        className={`${sizeClasses[size]} object-contain`}
        onError={(e) => {
          console.error('Failed to load logo:', e);
          // Fallback to text if image fails to load
          e.currentTarget.style.display = 'none';
          e.currentTarget.nextElementSibling?.classList.remove('hidden');
        }}
      />
      <span className={`${sizeClasses[size]} font-bold text-primary hidden`}>
        MockMate
      </span>
    </div>
  );
}
