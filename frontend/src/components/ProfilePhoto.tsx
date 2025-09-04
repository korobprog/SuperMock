import React, { useState, useEffect } from 'react';
import PhotoPlaceholder from './PhotoPlaceholder';
import LoadingSpinner from './LoadingSpinner';

interface ProfilePhotoProps {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const ProfilePhoto: React.FC<ProfilePhotoProps> = ({ 
  src, 
  alt, 
  size = 'xl', 
  className = '' 
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(true);

  useEffect(() => {
    // Simulate loading delay for better UX
    const timer = setTimeout(() => {
      setShowPlaceholder(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setShowPlaceholder(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setShowPlaceholder(false);
  };

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-64 h-64'
  };

  if (imageError) {
    return (
      <div className={`relative ${sizeClasses[size]} ${className}`}>
        <div className="w-full h-full rounded-full bg-gradient-to-br from-destructive/20 to-destructive/10 flex items-center justify-center">
          <div className="text-center">
            <svg 
              className="w-8 h-8 text-destructive mx-auto mb-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
            <p className="text-xs text-destructive/80">Ошибка загрузки</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Outer glow effect */}
      <div className="absolute inset-0 w-full h-full rounded-full bg-gradient-to-br from-primary/30 via-secondary/20 to-accent/30 blur-xl animate-pulse"></div>
      
      {/* Main frame */}
      <div className="relative w-full h-full rounded-full p-2 bg-gradient-to-br from-primary/40 via-secondary/30 to-accent/40 shadow-2xl">
        {/* Inner frame */}
        <div className="w-full h-full rounded-full p-1 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm">
          {/* Photo container */}
          <div className="w-full h-full rounded-full overflow-hidden shadow-inner relative">
            {/* Show placeholder while loading */}
            {showPlaceholder && (
              <div className="absolute inset-0 z-10">
                <PhotoPlaceholder size={size} />
              </div>
            )}
            
            {/* Actual image */}
            <img 
              src={src} 
              alt={alt} 
              className={`w-full h-full object-cover transition-all duration-700 ${
                imageLoaded ? 'opacity-100 animate-photo-appear' : 'opacity-0'
              }`}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
            
            {/* Loading overlay */}
            {!imageLoaded && !showPlaceholder && (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/15 to-accent/20 flex items-center justify-center">
                <LoadingSpinner size="lg" />
              </div>
            )}
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

export default ProfilePhoto;
