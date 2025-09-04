import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, Smartphone, MessageSquare, CheckCircle, XCircle } from 'lucide-react';

interface TelegramAuthProps {
  onSuccess: (token: string, user: any) => void;
  onError: (error: string) => void;
}

interface AuthState {
  step: 'phone' | 'code' | 'success' | 'error';
  phoneNumber: string;
  code: string;
  codeId: string;
  loading: boolean;
  error: string;
  success: string;
  countdown: number;
  attempts: number;
}

const TelegramAuth: React.FC<TelegramAuthProps> = ({ onSuccess, onError }) => {
  const [state, setState] = useState<AuthState>({
    step: 'phone',
    phoneNumber: '',
    code: '',
    codeId: '',
    loading: false,
    error: '',
    success: '',
    countdown: 0,
    attempts: 0
  });

  // Таймер обратного отсчета
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (state.countdown > 0) {
      interval = setInterval(() => {
        setState(prev => ({ ...prev, countdown: prev.countdown - 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [state.countdown]);

  // Валидация номера телефона
  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  // Отправка кода верификации
  const sendVerificationCode = async () => {
    if (!validatePhoneNumber(state.phoneNumber)) {
      setState(prev => ({ 
        ...prev, 
        error: 'Неверный формат номера телефона',
        success: ''
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: '', success: '' }));

    try {
      const response = await fetch('/api/telegram-auth/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: state.phoneNumber,
          // В реальном приложении telegramUserId должен быть получен от пользователя
          // или через Telegram Web App API
          telegramUserId: 'demo_user_id' // Заглушка для демонстрации
        }),
      });

      const data = await response.json();

      if (data.success) {
        setState(prev => ({
          ...prev,
          step: 'code',
          codeId: data.codeId,
          loading: false,
          success: data.message,
          countdown: Math.floor(data.expiresIn / 1000) || 300,
          error: ''
        }));
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: data.message || 'Ошибка при отправке кода',
          success: ''
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Ошибка сети. Проверьте подключение к интернету.',
        success: ''
      }));
    }
  };

  // Проверка кода верификации
  const verifyCode = async () => {
    if (state.code.length !== 6) {
      setState(prev => ({ 
        ...prev, 
        error: 'Код должен содержать 6 цифр',
        success: ''
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: '', success: '' }));

    try {
      const response = await fetch('/api/telegram-auth/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          codeId: state.codeId,
          code: state.code,
          userInfo: {
            firstName: 'Пользователь', // В реальном приложении получать от пользователя
            lastName: '',
            username: ''
          }
        }),
      });

      const data = await response.json();

      if (data.success) {
        setState(prev => ({
          ...prev,
          step: 'success',
          loading: false,
          success: data.message,
          error: ''
        }));
        
        // Вызываем callback успешной авторизации
        onSuccess(data.token, data.user);
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: data.message || 'Неверный код',
          success: '',
          attempts: prev.attempts + 1
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Ошибка сети. Проверьте подключение к интернету.',
        success: ''
      }));
    }
  };

  // Повторная отправка кода
  const resendCode = async () => {
    if (state.countdown > 0) return;
    
    setState(prev => ({ ...prev, step: 'phone', code: '', error: '', success: '' }));
    await sendVerificationCode();
  };

  // Сброс формы
  const resetForm = () => {
    setState({
      step: 'phone',
      phoneNumber: '',
      code: '',
      codeId: '',
      loading: false,
      error: '',
      success: '',
      countdown: 0,
      attempts: 0
    });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <MessageSquare className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Вход через Telegram</CardTitle>
          <CardDescription>
            {state.step === 'phone' 
              ? 'Введите номер телефона для получения кода верификации'
              : 'Введите код, который пришел в Telegram'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Шаг 1: Ввод номера телефона */}
          {state.step === 'phone' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="phone">Номер телефона</Label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+7 (999) 123-45-67"
                    value={state.phoneNumber}
                    onChange={(e) => setState(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    className="pl-10"
                    disabled={state.loading}
                  />
                </div>
              </div>
              
              <Button 
                onClick={sendVerificationCode}
                disabled={state.loading || !state.phoneNumber}
                className="w-full"
              >
                {state.loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Отправка кода...
                  </>
                ) : (
                  'Получить код'
                )}
              </Button>
            </>
          )}

          {/* Шаг 2: Ввод кода верификации */}
          {state.step === 'code' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="code">Код верификации</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="123456"
                  value={state.code}
                  onChange={(e) => setState(prev => ({ ...prev, code: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                  className="text-center text-lg tracking-widest"
                  disabled={state.loading}
                  maxLength={6}
                />
                <p className="text-sm text-gray-500 text-center">
                  Код отправлен на номер {state.phoneNumber}
                </p>
              </div>
              
              <Button 
                onClick={verifyCode}
                disabled={state.loading || state.code.length !== 6}
                className="w-full"
              >
                {state.loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Проверка кода...
                  </>
                ) : (
                  'Войти'
                )}
              </Button>
              
              <div className="text-center">
                {state.countdown > 0 ? (
                  <p className="text-sm text-gray-500">
                    Повторная отправка через {Math.floor(state.countdown / 60)}:{(state.countdown % 60).toString().padStart(2, '0')}
                  </p>
                ) : (
                  <Button 
                    variant="link" 
                    onClick={resendCode}
                    className="text-sm"
                  >
                    Отправить код повторно
                  </Button>
                )}
              </div>
              
              <Button 
                variant="outline" 
                onClick={resetForm}
                className="w-full"
              >
                Изменить номер
              </Button>
            </>
          )}

          {/* Шаг 3: Успешная авторизация */}
          {state.step === 'success' && (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-800">Авторизация успешна!</h3>
                <p className="text-sm text-green-600">Добро пожаловать в SuperMock</p>
              </div>
            </div>
          )}

          {/* Отображение ошибок */}
          {state.error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          {/* Отображение успешных сообщений */}
          {state.success && state.step !== 'success' && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{state.success}</AlertDescription>
            </Alert>
          )}

          {/* Информация о попытках */}
          {state.attempts > 0 && state.attempts < 3 && (
            <Alert>
              <AlertDescription>
                Неверный код. Осталось попыток: {3 - state.attempts}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      {/* Инструкции для пользователя */}
      <div className="mt-6 text-center text-sm text-gray-600">
        <p>Убедитесь, что вы начали диалог с ботом SuperMock в Telegram</p>
        <p>Код придет в чат с ботом</p>
      </div>
    </div>
  );
};

export default TelegramAuth;
