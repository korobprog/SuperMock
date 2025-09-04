'use client';

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Phone, 
  Calendar, 
  LogOut, 
  Settings,
  MessageSquare,
  Shield
} from 'lucide-react';

export default function DashboardPage() {
  const { user, logout } = useTelegramAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600">Добро пожаловать в SuperMock</p>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Авторизован
                </Badge>
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Выйти
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* User Profile Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Профиль пользователя
                  </CardTitle>
                  <CardDescription>
                    Информация о вашем аккаунте
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Номер телефона</p>
                      <p className="text-sm text-gray-600">{user?.phoneNumber}</p>
                    </div>
                  </div>
                  
                  {user?.firstName && (
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Имя</p>
                        <p className="text-sm text-gray-600">
                          {user.firstName} {user.lastName || ''}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {user?.username && (
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Telegram</p>
                        <p className="text-sm text-gray-600">@{user.username}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Дата регистрации</p>
                      <p className="text-sm text-gray-600">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ru-RU') : 'Неизвестно'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Быстрые действия</CardTitle>
                  <CardDescription>
                    Основные функции приложения
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Начать собеседование
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Calendar className="h-4 w-4 mr-2" />
                    Мои сессии
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Настройки
                  </Button>
                </CardContent>
              </Card>

              {/* Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>Статистика</CardTitle>
                  <CardDescription>
                    Ваша активность в приложении
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Всего сессий</span>
                    <span className="text-lg font-semibold">0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Завершенных</span>
                    <span className="text-lg font-semibold">0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Средняя оценка</span>
                    <span className="text-lg font-semibold">-</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>Последняя активность</CardTitle>
                  <CardDescription>
                    Ваши недавние действия в приложении
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Пока нет активности</p>
                    <p className="text-sm">Начните свое первое собеседование!</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
