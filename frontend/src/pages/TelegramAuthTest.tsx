import React from 'react';
import { TelegramLoginSimple, TelegramUser } from '@/components/ui/telegram-login-simple';
import { TelegramAuthForm } from '@/components/ui/telegram-auth-form';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Info } from 'lucide-react';

export default function TelegramAuthTest() {
  const { telegramUser, setTelegramUser } = useAppStore();

  const handleAuth = (user: TelegramUser) => {
    console.log('Auth callback received:', user);
    setTelegramUser(user);
  };

  const handleLogout = () => {
    console.log('Logout callback received');
    setTelegramUser(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Тест Telegram Авторизации
          </h1>
          <p className="text-gray-600">
            Проверка работы системы авторизации через Telegram
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Компонент авторизации */}
          <div>
            <TelegramLoginSimple
              onAuth={handleAuth}
              onLogout={handleLogout}
            />
          </div>

          {/* Форма для тестирования */}
          <div>
            <TelegramAuthForm />
          </div>

          {/* Информация о состоянии */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Состояние авторизации</CardTitle>
                <CardDescription>
                  Текущий статус пользователя в системе
                </CardDescription>
              </CardHeader>
              <CardContent>
                {telegramUser ? (
                  <div className="space-y-4">
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Пользователь авторизован в системе
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-2 text-sm">
                      <p><strong>ID:</strong> {telegramUser.id}</p>
                      <p><strong>Имя:</strong> {telegramUser.first_name}</p>
                      {telegramUser.last_name && (
                        <p><strong>Фамилия:</strong> {telegramUser.last_name}</p>
                      )}
                      {telegramUser.username && (
                        <p><strong>Username:</strong> @{telegramUser.username}</p>
                      )}
                      <p><strong>Дата авторизации:</strong> {new Date(telegramUser.auth_date * 1000).toLocaleString('ru-RU')}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Пользователь не авторизован</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Информация о системе</CardTitle>
                <CardDescription>
                  Детали конфигурации и настройки
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <strong>Бот:</strong> @{import.meta.env.VITE_TELEGRAM_BOT_NAME || 'не настроен'}
                  </div>
                  <div>
                    <strong>Bot ID:</strong> {import.meta.env.VITE_TELEGRAM_BOT_ID || 'не настроен'}
                  </div>
                  <div>
                    <strong>API URL:</strong> {import.meta.env.VITE_API_URL || 'не настроен'}
                  </div>
                  <div>
                    <strong>Frontend URL:</strong> {import.meta.env.VITE_FRONTEND_URL || 'не настроен'}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Тестирование API</CardTitle>
                <CardDescription>
                  Проверка доступности backend endpoints
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/telegram-test');
                        const data = await response.json();
                        alert(`API Test: ${JSON.stringify(data, null, 2)}`);
                      } catch (error) {
                        alert(`API Test Error: ${error}`);
                      }
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Тест /api/telegram-test
                  </Button>
                  
                  <Button
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/telegram-bot-check');
                        const data = await response.json();
                        alert(`Bot Check: ${JSON.stringify(data, null, 2)}`);
                      } catch (error) {
                        alert(`Bot Check Error: ${error}`);
                      }
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Проверить бота
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Важно:</strong> Убедитесь, что домен {window.location.hostname} добавлен в BotFather 
                через команду /setdomain для корректной работы виджета.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    </div>
  );
}