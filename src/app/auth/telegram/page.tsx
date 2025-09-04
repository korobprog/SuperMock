'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TelegramAuth from '@/components/TelegramAuth';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageSquare } from 'lucide-react';

export default function TelegramAuthPage() {
  const router = useRouter();
  const { isAuthenticated, login, onError } = useTelegramAuth();

  // Редирект, если пользователь уже авторизован
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleAuthSuccess = (token: string, user: any) => {
    login(token, user);
    // Редирект будет выполнен автоматически через useEffect
  };

  const handleAuthError = (error: string) => {
    onError(error);
  };

  const handleBackToHome = () => {
    router.push('/');
  };

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p>Перенаправление...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Заголовок */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <MessageSquare className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Вход в SuperMock
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Авторизация через Telegram
          </p>
        </div>

        {/* Кнопка "Назад" */}
        <div className="flex justify-start">
          <Button
            variant="ghost"
            onClick={handleBackToHome}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Назад на главную
          </Button>
        </div>

        {/* Компонент авторизации */}
        <TelegramAuth
          onSuccess={handleAuthSuccess}
          onError={handleAuthError}
        />

        {/* Информация о боте */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Как это работает?</CardTitle>
            <CardDescription>
              Пошаговая инструкция по авторизации
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-semibold text-blue-600">1</span>
              </div>
              <div>
                <p className="text-sm font-medium">Найдите бота SuperMock</p>
                <p className="text-xs text-gray-500">
                  Найдите @supermock_bot в Telegram и начните диалог
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-semibold text-blue-600">2</span>
              </div>
              <div>
                <p className="text-sm font-medium">Введите номер телефона</p>
                <p className="text-xs text-gray-500">
                  Введите ваш номер телефона в поле выше
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-semibold text-blue-600">3</span>
              </div>
              <div>
                <p className="text-sm font-medium">Получите код</p>
                <p className="text-xs text-gray-500">
                  Код верификации придет в чат с ботом
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-semibold text-blue-600">4</span>
              </div>
              <div>
                <p className="text-sm font-medium">Введите код</p>
                <p className="text-xs text-gray-500">
                  Введите полученный код для завершения авторизации
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Дополнительная информация */}
        <div className="text-center text-xs text-gray-500">
          <p>
            Не нашли бота? Проверьте правильность написания: 
            <span className="font-mono bg-gray-100 px-1 rounded">@supermock_bot</span>
          </p>
        </div>
      </div>
    </div>
  );
}
