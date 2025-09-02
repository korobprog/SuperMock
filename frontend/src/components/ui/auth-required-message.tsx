import React from 'react';
import { useAppTranslation } from '@/lib/i18n';
import { TelegramAuthButton } from './telegram-login';
import { env } from '@/lib/env';
import { TelegramUser } from '@/lib/telegram-auth';

interface AuthRequiredMessageProps {
  onAuth: (user: TelegramUser) => void;
  className?: string;
}

export function AuthRequiredMessage({ onAuth, className = '' }: AuthRequiredMessageProps) {
  const { t } = useAppTranslation();

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-6 text-center ${className}`}>
      <div className="mb-4">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Требуется авторизация
        </h3>
        <p className="text-blue-700 mb-4">
          Для доступа к платформе необходимо войти через Telegram
        </p>
      </div>
      
      {env.TELEGRAM_BOT_NAME ? (
        <TelegramAuthButton
          botName={env.TELEGRAM_BOT_NAME}
          onAuth={onAuth}
          className="w-full"
        />
      ) : (
        <div className="text-sm text-red-500 p-3 bg-red-50 rounded border">
          Ошибка: VITE_TELEGRAM_BOT_NAME не настроен в переменных окружения
        </div>
      )}
      
      <p className="text-xs text-blue-600 mt-3">
        Авторизация через Telegram обеспечивает безопасный доступ к вашим данным
      </p>
    </div>
  );
}
