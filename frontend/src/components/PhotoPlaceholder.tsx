import React from 'react';

interface PhotoPlaceholderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const PhotoPlaceholder: React.FC<PhotoPlaceholderProps> = ({ 
  size = 'lg', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-64 h-64'
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Outer glow effect */}
      <div className="absolute inset-0 w-full h-full rounded-full bg-gradient-to-br from-primary/30 via-secondary/20 to-accent/30 blur-xl animate-pulse"></div>
      
      {/* Main frame */}
      <div className="relative w-full h-full rounded-full p-2 bg-gradient-to-br from-primary/40 via-secondary/30 to-accent/40 shadow-2xl">
        {/* Inner frame */}
        <div className="w-full h-full rounded-full p-1 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm">
          {/* Animated placeholder content */}
          <div className="w-full h-full rounded-full overflow-hidden shadow-inner bg-gradient-to-br from-muted/20 to-muted/10 relative">
            
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/15 to-accent/20 animate-pulse"></div>
            
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
            
            {/* Central icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/60 to-secondary/60 flex items-center justify-center animate-bounce">
                <svg 
                  className="w-6 h-6 text-white animate-pulse" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                  />
                </svg>
              </div>
            </div>
            
            {/* Floating particles */}
            <div className="absolute top-4 left-4 w-2 h-2 bg-primary/60 rounded-full animate-float-slow"></div>
            <div className="absolute top-8 right-6 w-1.5 h-1.5 bg-secondary/60 rounded-full animate-float-slower"></div>
            <div className="absolute bottom-6 left-8 w-1 h-1 bg-accent/60 rounded-full animate-float-slowest"></div>
            
            {/* Rotating border */}
            <div className="absolute inset-0 rounded-full border-2 border-transparent bg-gradient-to-r from-primary via-secondary to-accent bg-clip-border animate-spin-slow"></div>
          </div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-gradient-to-br from-primary to-secondary animate-float-decorative"></div>
      <div className="absolute -bottom-2 -left-2 w-3 h-3 rounded-full bg-gradient-to-br from-secondary to-accent animate-float-decorative delay-300"></div>
      <div className="absolute top-1/2 -right-1 w-2 h-2 rounded-full bg-accent/80 animate-pulse-scale delay-500"></div>
      <div className="absolute top-1/2 -left-1 w-2 h-2 rounded-full bg-primary/80 animate-pulse-scale delay-700"></div>
    </div>
  );
};

export default PhotoPlaceholder;
