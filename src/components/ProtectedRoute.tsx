import React from 'react';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Lock, ArrowRight } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback,
  redirectTo = '/auth/telegram'
}) => {
  const { isAuthenticated, loading, user } = useTelegramAuth();

  // Показываем загрузку
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Проверка авторизации...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Если пользователь не авторизован
  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <Lock className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Требуется авторизация</CardTitle>
            <CardDescription>
              Для доступа к этой странице необходимо войти в систему
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => window.location.href = redirectTo}
              className="w-full"
            >
              Войти через Telegram
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            
            <div className="text-center">
              <Button 
                variant="link" 
                onClick={() => window.history.back()}
                className="text-sm"
              >
                Назад
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Если пользователь авторизован, показываем содержимое
  return <>{children}</>;
};

export default ProtectedRoute;
