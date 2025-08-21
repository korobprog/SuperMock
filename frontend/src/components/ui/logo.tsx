import React from 'react';
import { useNavigate } from 'react-router-dom';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  clickable?: boolean;
  onClick?: () => void;
}

export function Logo({ className = '', size = 'md', clickable = false, onClick }: LogoProps) {
  const navigate = useNavigate();
  
  const sizeClasses = {
    sm: 'h-6 w-auto',
    md: 'h-8 w-auto',
    lg: 'h-12 w-auto',
  };

  const handleClick = () => {
    if (clickable) {
      if (onClick) {
        onClick();
      } else {
        navigate('/');
      }
    }
  };

  const logoContent = (
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

  if (clickable) {
    return (
      <button
        onClick={handleClick}
        className="hover:opacity-80 transition-opacity focus:outline-none focus:ring-0"
        title="Перейти на главную страницу"
      >
        {logoContent}
      </button>
    );
  }

  return logoContent;
}
