import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <div className="relative w-full h-full">
        {/* Main spinner */}
        <div className="w-full h-full border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        
        {/* Glow effect */}
        <div className="absolute inset-0 w-full h-full border-2 border-transparent border-t-primary/60 rounded-full animate-spin-slow blur-sm"></div>
        
        {/* Pulse effect */}
        <div className="absolute inset-0 w-full h-full border-2 border-transparent border-t-secondary/40 rounded-full animate-pulse-glow"></div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
