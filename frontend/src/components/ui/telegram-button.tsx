import React from 'react';
import { Button } from '@/components/ui/button';
import { ButtonProps } from '@/components/ui/button';
import { fixElement } from '@/lib/telegram-desktop-fixes';
import { useRef, useEffect } from 'react';

interface TelegramButtonProps extends ButtonProps {
  children: React.ReactNode;
}

export function TelegramButton({ 
  children, 
  className = '', 
  ...props 
}: TelegramButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (buttonRef.current) {
      fixElement(buttonRef.current);
    }
  }, []);

  return (
    <Button
      ref={buttonRef}
      className={`telegram-desktop-fix ${className}`}
      {...props}
    >
      {children}
    </Button>
  );
}

// Компонент для иконочных кнопок
export function TelegramIconButton({ 
  children, 
  className = '', 
  ...props 
}: TelegramButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (buttonRef.current) {
      fixElement(buttonRef.current);
    }
  }, []);

  return (
    <Button
      ref={buttonRef}
      className={`telegram-desktop-fix icon-button ${className}`}
      {...props}
    >
      {children}
    </Button>
  );
}

// Компонент для кнопок в хедере
export function TelegramHeaderButton({ 
  children, 
  className = '', 
  ...props 
}: TelegramButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (buttonRef.current) {
      fixElement(buttonRef.current);
    }
  }, []);

  return (
    <Button
      ref={buttonRef}
      className={`telegram-desktop-fix header-button ${className}`}
      {...props}
    >
      {children}
    </Button>
  );
}

// Компонент для кнопок уведомлений
export function TelegramNotificationButton({ 
  children, 
  className = '', 
  ...props 
}: TelegramButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (buttonRef.current) {
      fixElement(buttonRef.current);
    }
  }, []);

  return (
    <Button
      ref={buttonRef}
      className={`telegram-desktop-fix notification-button ${className}`}
      {...props}
    >
      {children}
    </Button>
  );
}

// Компонент для кнопок настроек
export function TelegramSettingsButton({ 
  children, 
  className = '', 
  ...props 
}: TelegramButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (buttonRef.current) {
      fixElement(buttonRef.current);
    }
  }, []);

  return (
    <Button
      ref={buttonRef}
      className={`telegram-desktop-fix settings-button ${className}`}
      {...props}
    >
      {children}
    </Button>
  );
}
