import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useAppTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, ArrowLeft, CheckCircle } from 'lucide-react';
import { TelegramPageWrapper } from '@/components/ui/telegram-page-wrapper';
import { useTelegramNavigation } from '@/hooks/useTelegramNavigation';
import { createApiUrl } from '@/lib/config';

export function PhoneInputPage() {
  const { t } = useAppTranslation();
  const { navigateTo } = useTelegramNavigation();
  const { userId } = useAppStore();
  
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone.trim()) {
      setError('Пожалуйста, введите номер телефона');
      return;
    }

    // Простая валидация номера телефона
    const phoneRegex = /^(\+7|7|8)?[\s\-]?\(?[489][0-9]{2}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      setError('Пожалуйста, введите корректный номер телефона');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Отправляем номер телефона на сервер
      const response = await fetch(createApiUrl(`/api/user/${userId}/phone`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: phone.trim() }),
      });

      if (response.ok) {
        setIsSuccess(true);
        // Через 2 секунды перенаправляем на профиль
        setTimeout(() => {
          navigateTo('/profile');
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Ошибка при сохранении номера телефона');
      }
    } catch (error) {
      console.error('Error saving phone:', error);
      setError('Ошибка сети. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhone = (value: string) => {
    // Убираем все кроме цифр
    const numbers = value.replace(/\D/g, '');
    
    // Форматируем номер в виде +7 (999) 123-45-67
    if (numbers.length === 0) return '';
    if (numbers.length <= 1) return `+${numbers}`;
    if (numbers.length <= 4) return `+${numbers.slice(0, 1)} (${numbers.slice(1)}`;
    if (numbers.length <= 7) return `+${numbers.slice(0, 1)} (${numbers.slice(1, 4)}) ${numbers.slice(4)}`;
    if (numbers.length <= 9) return `+${numbers.slice(0, 1)} (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)}-${numbers.slice(7)}`;
    return `+${numbers.slice(0, 1)} (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)}-${numbers.slice(7, 9)}-${numbers.slice(9, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
  };

  if (isSuccess) {
    return (
      <TelegramPageWrapper title="Телефон сохранен">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Номер телефона успешно сохранен!
            </h2>
            <p className="text-gray-600">
              Перенаправление на профиль...
            </p>
          </div>
        </div>
      </TelegramPageWrapper>
    );
  }

  return (
    <TelegramPageWrapper title="Введите телефон" showBackButton={true}>
      <div className="p-4">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Phone className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-xl">Введите номер телефона</CardTitle>
            <CardDescription>
              Мы используем ваш номер для связи и уведомлений
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="phone">Номер телефона</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="+7 (999) 123-45-67"
                  className="text-lg"
                  autoFocus
                />
                <p className="text-sm text-gray-500 mt-1">
                  Формат: +7 (999) 123-45-67
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Button 
                type="submit" 
                disabled={isLoading || !phone.trim()} 
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Сохранение...
                  </>
                ) : (
                  'Сохранить номер'
                )}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-center">
                <p className="text-sm text-blue-800 mb-2">
                  🔒 Ваши данные защищены
                </p>
                <p className="text-xs text-blue-600">
                  Номер телефона используется только для связи и не передается третьим лицам
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TelegramPageWrapper>
  );
}
