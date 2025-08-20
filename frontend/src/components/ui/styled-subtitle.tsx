import React from 'react';

interface StyledSubtitleProps {
  children: React.ReactNode;
  variant?: 'default' | 'gradient' | 'mono' | 'tech' | 'elegant';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function StyledSubtitle({
  children,
  variant = 'gradient',
  size = 'md',
  className = '',
}: StyledSubtitleProps) {
  const variantClasses = {
    default: 'subtitle-styled',
    gradient: 'subtitle-styled-gradient',
    mono: 'subtitle-styled-mono',
    tech: 'subtitle-styled-tech',
    elegant: 'subtitle-styled-elegant',
  };

  const sizeClasses = {
    sm: 'subtitle-size-sm',
    md: 'subtitle-size-md',
    lg: 'subtitle-size-lg',
    xl: 'subtitle-size-xl',
  };

  return (
    <p
      className={`${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </p>
  );
}
