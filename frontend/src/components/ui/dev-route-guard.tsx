import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

interface DevRouteGuardProps {
  children: ReactNode;
  fallbackPath?: string;
}

export function DevRouteGuard({ children, fallbackPath = '/' }: DevRouteGuardProps) {
  // В production режиме перенаправляем на главную страницу
  if (!import.meta.env.DEV) {
    return <Navigate to={fallbackPath} replace />;
  }

  // В development режиме показываем содержимое
  return <>{children}</>;
}
