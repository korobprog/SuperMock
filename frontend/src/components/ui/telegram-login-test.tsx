import React, { useEffect, useRef } from 'react';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface TelegramLoginTestProps {
  onAuth: (user: TelegramUser) => void;
  className?: string;
}

export function TelegramLoginTest({ onAuth, className = '' }: TelegramLoginTestProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('🔧 TelegramLoginTest: Starting...');
    console.log('🔧 Current domain:', window.location.origin);
    console.log('🔧 Current protocol:', window.location.protocol);
    console.log('🔧 Bot name: SuperMock_bot');

    if (ref.current) {
      // Очищаем предыдущий контент
      ref.current.innerHTML = '';

      // Глобальная функция для callback'а
      (window as any).onTelegramAuth = (user: TelegramUser) => {
        console.log('🔧 TelegramLoginTest: Auth callback received:', user);
        onAuth(user);
      };

      // Создаем script элемент
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.setAttribute('data-telegram-login', 'SuperMock_bot');
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-auth-url', `${window.location.origin}/telegram-auth-callback`);
      script.setAttribute('data-request-access', 'write');
      script.setAttribute('data-lang', 'ru');
      script.setAttribute('data-onauth', 'onTelegramAuth');

      // Добавляем в DOM
      ref.current.appendChild(script);
      console.log('🔧 TelegramLoginTest: Script added to DOM');

      // Проверяем загрузку через 3 секунды
      setTimeout(() => {
        const iframe = ref.current?.querySelector('iframe');
        const button = ref.current?.querySelector('button');
        
        console.log('🔧 TelegramLoginTest: After 3s check:');
        console.log('  - iframe:', iframe);
        console.log('  - button:', button);
        
        if (iframe) {
          console.log('✅ TelegramLoginTest: Widget loaded successfully!');
          console.log('  - iframe src:', iframe.getAttribute('src'));
          console.log('  - iframe id:', iframe.getAttribute('id'));
        } else {
          console.warn('⚠️ TelegramLoginTest: Widget not loaded, showing fallback');
          if (ref.current) {
            ref.current.innerHTML = `
              <div class="text-center p-4 border border-red-200 bg-red-50 rounded-lg">
                <p class="text-sm text-red-600 mb-3">Telegram виджет не загрузился</p>
                <p class="text-xs text-red-500 mb-3">Возможные причины:</p>
                <ul class="text-xs text-red-500 text-left mb-3">
                  <li>• Домен не настроен в @BotFather (/setdomain)</li>
                  <li>• Неправильный протокол (нужен HTTPS)</li>
                  <li>• Блокировка браузером</li>
                </ul>
                <button 
                  onclick="window.open('https://t.me/SuperMock_bot?start=auth', '_blank')"
                  class="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#0088cc] hover:bg-[#006fa0] text-white rounded-lg font-medium text-sm transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 240 240" fill="currentColor" class="flex-shrink-0">
                    <circle cx="120" cy="120" r="120" fill="#fff" />
                    <path d="m98 175c-3.888 0-3.227-1.468-4.568-5.17L82 132.207 170 80" fill="#c8daea" />
                    <path d="m98 175c3 0 4.325-1.372 6-3l16-15.558-19.958-12.035" fill="#a9c9dd" />
                    <path d="m100 144-15.958-12.035L170 80" fill="#f6fbfe" />
                  </svg>
                  Открыть в Telegram
                </button>
              </div>
            `;
          }
        }
      }, 3000);
    }
  }, [onAuth]);

  return (
    <div className={className}>
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">🔧 Тест Telegram Login Widget</h4>
        <p className="text-xs text-blue-700">
          Домен: {window.location.origin}<br/>
          Протокол: {window.location.protocol}<br/>
          Бот: SuperMock_bot
        </p>
      </div>
      <div ref={ref} />
    </div>
  );
}
