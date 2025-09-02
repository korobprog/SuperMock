import React, { useEffect, useRef } from 'react';
import { TelegramUser } from '@/lib/telegram-auth';
import { getTelegramWebApp, isRunningInTelegram } from '@/lib/utils';
import { env, getEnvVar } from '@/lib/env';

// Объявляем глобальную функцию для Telegram Auth
declare global {
  interface Window {
    onTelegramAuth: (user: TelegramUser) => void;
  }
}

// Интерфейс для Telegram Login Widget
interface TelegramLoginWidget {
  onAuth: (user: TelegramUser) => void;
}

interface TelegramLoginProps {
  botName: string;
  onAuth: (user: TelegramUser) => void;
  className?: string;
  children?: React.ReactNode;
}

export function TelegramLogin({
  botName,
  onAuth,
  className = '',
  children,
}: TelegramLoginProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('TelegramLogin: Initializing with botName:', botName);
    console.log(
      'TelegramLogin: VITE_TELEGRAM_BOT_ID:',
      import.meta.env.VITE_TELEGRAM_BOT_ID
    );
    console.log(
      'TelegramLogin: VITE_TELEGRAM_BOT_NAME:',
      import.meta.env.VITE_TELEGRAM_BOT_NAME
    );

    // Проверяем, есть ли данные авторизации в URL (callback от Telegram OAuth)
    const urlParams = new URLSearchParams(window.location.search);
    const telegramAuthData = urlParams.get('tgAuth');

    if (telegramAuthData) {
      try {
        console.log('TelegramLogin: Found auth data in URL, processing...');
        const userData = JSON.parse(decodeURIComponent(telegramAuthData));
        console.log('TelegramLogin: Parsed user data:', userData);
        onAuth(userData);
        return;
      } catch (error) {
        console.error('TelegramLogin: Error parsing auth data:', error);
      }
    }

    // Проверяем, находимся ли мы в Telegram Mini Apps
    const isTelegramMiniApps =
      window.Telegram?.WebApp &&
      (window.Telegram.WebApp.initData ||
        window.Telegram.WebApp.initDataUnsafe?.user);

    if (isTelegramMiniApps) {
      console.log('TelegramLogin: Detected Telegram Mini Apps environment');
      const tg = window.Telegram.WebApp;

      // Если пользователь уже авторизован в Mini Apps
      if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        console.log(
          'TelegramLogin: User already authenticated in Mini Apps:',
          tg.initDataUnsafe.user
        );
        const user = tg.initDataUnsafe.user;
        onAuth({
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name || '',
          username: user.username || '',
          photo_url: user.photo_url || '',
          auth_date: Math.floor(Date.now() / 1000),
          hash: 'telegram_mini_apps_hash',
        });
        return;
      }

      // Если пользователь не авторизован в Mini Apps, показываем сообщение
      console.log('TelegramLogin: User not authenticated in Mini Apps');
      if (ref.current) {
        ref.current.innerHTML = `
          <div class="flex items-center justify-center w-full h-12 border border-gray-300 rounded-lg bg-gray-50">
            <span class="text-sm text-gray-600">Авторизация через Telegram Mini Apps</span>
          </div>
        `;
      }
      return;
    }

    // Для обычного браузера создаем официальный Telegram Login Widget
    console.log('TelegramLogin: Creating official Telegram Login Widget');

    if (ref.current) {
      const botId = import.meta.env.VITE_TELEGRAM_BOT_ID || '8464088869';
      const currentOrigin = window.location.origin;

      console.log(
        'TelegramLogin: Creating widget with botId:',
        botId,
        'origin:',
        currentOrigin
      );

      // Добавляем глобальную функцию для callback'а ПЕРЕД созданием виджета
      window.onTelegramAuth = (user: TelegramUser) => {
        console.log('TelegramLogin: Received auth data from widget:', user);
        onAuth(user);
      };

      // Создаем официальный Telegram Login Widget с правильными параметрами
      const widgetHtml = `
        <script 
          async 
          src="https://telegram.org/js/telegram-widget.js?22" 
          data-telegram-login="${botName}" 
          data-size="large" 
          data-auth-url="${currentOrigin}" 
          data-request-access="write"
          data-lang="ru"
          data-onauth="onTelegramAuth"
        ></script>
      `;

      ref.current.innerHTML = widgetHtml;

      console.log('TelegramLogin: Official widget created successfully');
      console.log('TelegramLogin: Widget HTML:', widgetHtml);
      console.log('TelegramLogin: Current origin:', currentOrigin);
      console.log('TelegramLogin: Bot name:', botName);
      console.log('TelegramLogin: Bot ID:', botId);
    }
  }, [botName, onAuth]);

  return <div ref={ref} className={className} />;
}

// Простая кнопка-заглушка для демонстрации (если нет настоящего бота)
export function TelegramLoginDemo({
  onAuth,
  className = '',
}: {
  onAuth: (user: TelegramUser) => void;
  className?: string;
}) {
  const handleDemoLogin = () => {
    console.log('TelegramLoginDemo: Demo login clicked');
    // Создаем демо-пользователя
    const demoUser: TelegramUser = {
      id: 12345678,
      first_name: 'Иван',
      last_name: 'Петров',
      username: 'ivan_petrov',
      photo_url:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      auth_date: Math.floor(Date.now() / 1000),
      hash: 'demo_hash_12345',
    };

    console.log('TelegramLoginDemo: Calling onAuth with demo user:', demoUser);
    onAuth(demoUser);
  };

  return (
    <button
      onClick={handleDemoLogin}
      className={`
        inline-flex items-center justify-center gap-2 px-4 py-2 
        bg-[#0088cc] hover:bg-[#006fa0] text-white rounded-lg
        font-medium text-sm transition-colors
        ${className}
      `}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 240 240"
        fill="currentColor"
        className="flex-shrink-0"
      >
        <circle cx="120" cy="120" r="120" fill="#fff" />
        <path
          d="m98 175c-3.888 0-3.227-1.468-4.568-5.17L82 132.207 170 80"
          fill="#c8daea"
        />
        <path
          d="m98 175c3 0 4.325-1.372 6-3l16-15.558-19.958-12.035"
          fill="#a9c9dd"
        />
        <path
          d="M100.04 144.41l48.36 35.729c5.519 3.045 9.501 1.468 10.876-5.123l19.685-92.763c2.015-8.08-3.08-11.746-8.36-9.349l-115.59 44.571c-7.89 3.165-7.843 7.567-1.438 9.528l29.663 9.259 68.673-43.325c3.242-1.966 6.218-.91 3.776 1.258"
          fill="#007acc"
        />
      </svg>
      Войти через Telegram (Демо)
    </button>
  );
}

// Компонент для работы с официальным виджетом как раньше
export function TelegramOfficialWidget({
  botName,
  onAuth,
  className = '',
}: {
  botName: string;
  onAuth: (user: TelegramUser) => void;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('TelegramOfficialWidget: Initializing with botName:', botName);
    console.log(
      'TelegramOfficialWidget: Current origin:',
      window.location.origin
    );
    console.log('TelegramOfficialWidget: Environment variables:', {
      VITE_TELEGRAM_BOT_NAME: import.meta.env.VITE_TELEGRAM_BOT_NAME,
      VITE_TELEGRAM_BOT_ID: import.meta.env.VITE_TELEGRAM_BOT_ID,
    });

    if (ref.current) {
      // Добавляем глобальную функцию для callback'а
      window.onTelegramAuth = (user: TelegramUser) => {
        console.log('TelegramOfficialWidget: Received auth data:', user);
        onAuth(user);
      };

      // Создаем официальный виджет с правильными параметрами
      const widgetHtml = `
        <script 
          async 
          src="https://telegram.org/js/telegram-widget.js?22" 
          data-telegram-login="${botName}" 
          data-size="large" 
          data-auth-url="${window.location.origin}" 
          data-request-access="write"
          data-lang="ru"
          data-onauth="onTelegramAuth"
        ></script>
      `;

      ref.current.innerHTML = widgetHtml;
      console.log(
        'TelegramOfficialWidget: Widget created with HTML:',
        widgetHtml
      );

      // Проверяем, загрузился ли виджет через 2 секунды
      setTimeout(() => {
        const iframe = ref.current?.querySelector('iframe');
        const script = ref.current?.querySelector('script');
        console.log(
          'TelegramOfficialWidget: After 2s - iframe:',
          iframe,
          'script:',
          script
        );
      }, 2000);
    }
  }, [botName, onAuth]);

  return <div ref={ref} className={className} />;
}

// Специальный компонент для десктопной версии
export function TelegramDesktopLogin({
  botName,
  onAuth,
  className = '',
}: {
  botName: string;
  onAuth: (user: TelegramUser) => void;
  className?: string;
}) {
  const handleDesktopLogin = () => {
    // Проверяем, находимся ли мы в Telegram Mini Apps
    if (window.Telegram && window.Telegram.WebApp) {
      console.log(
        'TelegramDesktopLogin: Detected Telegram Mini Apps environment'
      );
      const tg = window.Telegram.WebApp;

      // Если пользователь уже авторизован в Mini Apps
      if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        console.log(
          'TelegramDesktopLogin: User already authenticated in Mini Apps:',
          tg.initDataUnsafe.user
        );
        const user = tg.initDataUnsafe.user;
        onAuth({
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name || '',
          username: user.username || '',
          photo_url: user.photo_url || '',
          auth_date: Math.floor(Date.now() / 1000),
          hash: 'telegram_mini_apps_hash',
        });
      } else {
        // Если пользователь не авторизован, показываем сообщение
        console.log(
          'TelegramDesktopLogin: User not authenticated in Mini Apps'
        );
        // В Mini Apps не открываем ссылки в браузере
        alert('Для продолжения необходимо авторизоваться в Telegram Mini Apps');
      }
    } else {
      // Если мы не в Telegram Mini Apps, открываем в Telegram
      console.log('TelegramDesktopLogin: Opening in Telegram');
      const telegramUrl = `https://t.me/${botName}?start=auth`;

      // Пытаемся открыть в Telegram Desktop
      try {
        window.location.href = `tg://resolve?domain=${botName}&start=auth`;
      } catch (error) {
        // Если не получилось, открываем в браузере
        window.location.href = telegramUrl;
      }
    }
  };

  return (
    <button
      onClick={handleDesktopLogin}
      className={`
        inline-flex items-center justify-center gap-2 px-4 py-2 
        bg-[#0088cc] hover:bg-[#006fa0] text-white rounded-lg
        font-medium text-sm transition-colors w-full max-w-xs
        ${className}
      `}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 240 240"
        fill="currentColor"
        className="flex-shrink-0"
      >
        <circle cx="120" cy="120" r="120" fill="#fff" />
        <path
          d="m98 175c-3.888 0-3.227-1.468-4.568-5.17L82 132.207 170 80"
          fill="#c8daea"
        />
        <path
          d="m98 175c3 0 4.325-1.372 6-3l16-15.558-19.958-12.035"
          fill="#a9c9dd"
        />
        <path
          d="M100.04 144.41l48.36 35.729c5.519 3.045 9.501 1.468 10.876-5.123l19.685-92.763c2.015-8.08-3.08-11.746-8.36-9.349l-115.59 44.571c-7.89 3.165-7.843 7.567-1.438 9.528l29.663 9.259 68.673-43.325c3.242-1.966 6.218-.91 3.776 1.258"
          fill="#007acc"
        />
      </svg>
      Войти через Telegram
    </button>
  );
}

// Добавьте новую функцию
export function TelegramDirectLogin({
  botName,
  onAuth,
  className = '',
}: {
  botName: string;
  onAuth: (user: TelegramUser) => void;
  className?: string;
}) {
  const handleDirectLogin = () => {
    // Для десктопной версии используем прямой URL к Telegram
    const telegramUrl = `https://t.me/${botName}`;

    // Проверяем, установлен ли Telegram Desktop
    const isTelegramInstalled =
      navigator.userAgent.includes('Telegram') ||
      window.location.protocol === 'tg:';

    if (isTelegramInstalled) {
      // Если Telegram установлен, открываем напрямую
      window.location.href = `tg://resolve?domain=${botName}`;
    } else {
      // Иначе открываем в браузере
      window.location.href = telegramUrl;
    }
  };

  return (
    <button
      onClick={handleDirectLogin}
      className={`
        inline-flex items-center justify-center gap-2 px-4 py-2 
        bg-[#0088cc] hover:bg-[#006fa0] text-white rounded-lg
        font-medium text-sm transition-colors
        ${className}
      `}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 240 240"
        fill="currentColor"
        className="flex-shrink-0"
      >
        <circle cx="120" cy="120" r="120" fill="#fff" />
        <path
          d="m98 175c-3.888 0-3.227-1.468-4.568-5.17L82 132.207 170 80"
          fill="#c8daea"
        />
        <path
          d="m98 175c3 0 4.325-1.372 6-3l16-15.558-19.958-12.035"
          fill="#a9c9dd"
        />
        <path
          d="M100.04 144.41l48.36 35.729c5.519 3.045 9.501 1.468 10.876-5.123l19.685-92.763c2.015-8.08-3.08-11.746-8.36-9.349l-115.59 44.571c-7.89 3.165-7.843 7.567-1.438 9.528l29.663 9.259 68.673-43.325c3.242-1.966 6.218-.91 3.776 1.258"
          fill="#007acc"
        />
      </svg>
      Открыть в Telegram
    </button>
  );
}

// Простая кнопка для веб-версии с авторизацией
export function TelegramSimpleLogin({
  botName,
  onAuth,
  className = '',
}: {
  botName: string;
  onAuth: (user: TelegramUser) => void;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('TelegramSimpleLogin: Initializing with botName:', botName);

    if (ref.current) {
      // Добавляем глобальную функцию для callback'а
      window.onTelegramAuth = (user: TelegramUser) => {
        console.log('TelegramSimpleLogin: Received auth data:', user);
        onAuth(user);
      };

      // Создаем официальный виджет
      const widgetHtml = `
        <script 
          async 
          src="https://telegram.org/js/telegram-widget.js?22" 
          data-telegram-login="${botName}" 
          data-size="large" 
          data-auth-url="${window.location.origin}" 
          data-request-access="write"
          data-lang="ru"
          data-onauth="onTelegramAuth"
        ></script>
      `;

      ref.current.innerHTML = widgetHtml;
    }
  }, [botName, onAuth]);

  return <div ref={ref} className={className} />;
}

// Константы для Telegram OAuth
const TELEGRAM_OAUTH_URL = 'https://oauth.telegram.org/auth';
const TELEGRAM_OAUTH_ORIGIN = 'https://oauth.telegram.org';

// Улучшенный React компонент для авторизации в Telegram с обработкой callback
export function TelegramAuthButton({
  botName,
  onAuth,
  className = '',
}: {
  botName: string;
  onAuth: (user: TelegramUser) => void;
  className?: string;
}) {
  const handleTelegramAuth = () => {
    console.log('TelegramAuthButton: Starting auth for bot:', botName);

    try {
      // Получаем данные из переменных окружения с проверкой
      const botId = import.meta.env.VITE_TELEGRAM_BOT_ID;
      const origin = window.location.origin;
      const returnTo = encodeURIComponent(origin);
      const requestAccess = 'write';

      // Проверяем наличие имени бота
      if (!botName) {
        throw new Error('botName is required');
      }

      const authUrl = `${TELEGRAM_OAUTH_URL}?bot_id=${botId}&origin=${encodeURIComponent(
        origin
      )}&request_access=${requestAccess}&return_to=${returnTo}`;

      console.log('TelegramAuthButton: Opening auth URL:', authUrl);

      // Открываем popup для авторизации
      const popup = window.open(
        authUrl,
        'telegram_auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        throw new Error('Failed to open popup - popup blocked');
      }

      // Слушаем сообщения от popup
      const handleMessage = (event: MessageEvent) => {
        console.log('TelegramAuthButton: Received message:', {
          origin: event.origin,
          expectedOrigin: TELEGRAM_OAUTH_ORIGIN,
          data: event.data,
        });

        // Проверяем, что сообщение от Telegram OAuth
        if (event.origin !== TELEGRAM_OAUTH_ORIGIN) {
          console.log('TelegramAuthButton: Origin mismatch, ignoring message');
          return;
        }

        console.log(
          'TelegramAuthButton: Received message from popup:',
          event.data
        );

        // Обрабатываем данные авторизации
        let authData = event.data;

        // Если данные приходят как строка, парсим их
        if (typeof authData === 'string') {
          try {
            authData = JSON.parse(authData);
            console.log('TelegramAuthButton: Parsed string data:', authData);
          } catch (error) {
            console.error(
              'TelegramAuthButton: Failed to parse data string:',
              error
            );
            return;
          }
        }

        if (authData && authData.event === 'auth_result' && authData.result) {
          const userData = authData.result;
          console.log('TelegramAuthButton: Auth successful:', userData);

          // Преобразуем данные в нужный формат
          const telegramUser: TelegramUser = {
            id: userData.id,
            first_name: userData.first_name,
            last_name: userData.last_name || '',
            username: userData.username || '',
            photo_url: userData.photo_url || '',
            auth_date: userData.auth_date,
            hash: userData.hash,
          };

          // Закрываем popup
          popup.close();

          // Удаляем обработчик сообщений
          window.removeEventListener('message', handleMessage);

          // Вызываем callback
          console.log(
            'TelegramAuthButton: Calling onAuth with user:',
            telegramUser
          );
          onAuth(telegramUser);
          return; // Важно: выходим после успешной авторизации
        }

        // Дополнительная проверка для других форматов данных
        if (
          authData &&
          authData.type === 'TELEGRAM_OAUTH_SUCCESS' &&
          authData.user
        ) {
          const userData = authData.user;
          console.log(
            'TelegramAuthButton: Auth successful (alternative format):',
            userData
          );

          const telegramUser: TelegramUser = {
            id: userData.id,
            first_name: userData.first_name,
            last_name: userData.last_name || '',
            username: userData.username || '',
            photo_url: userData.photo_url || '',
            auth_date: userData.auth_date,
            hash: userData.hash,
          };

          // Закрываем popup
          popup.close();

          // Удаляем обработчик сообщений
          window.removeEventListener('message', handleMessage);

          // Вызываем callback
          console.log(
            'TelegramAuthButton: Calling onAuth with user (alternative):',
            telegramUser
          );
          onAuth(telegramUser);
          return;
        }
      };

      window.addEventListener('message', handleMessage);

      // Проверяем, закрылся ли popup
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          console.log('TelegramAuthButton: Popup closed without auth');
        }
      }, 2000); // Увеличиваем интервал до 2 секунд
    } catch (error) {
      console.error('TelegramAuthButton: Error during auth:', error);

      if (error instanceof Error) {
        if (error.message.includes('VITE_TELEGRAM_BOT_ID')) {
          alert(
            'Ошибка конфигурации: ID бота не найден в переменных окружения'
          );
        } else if (error.message.includes('popup blocked')) {
          alert('Пожалуйста, разрешите всплывающие окна для этого сайта');
        } else {
          alert(`Ошибка авторизации: ${error.message}`);
        }
      } else {
        alert('Неизвестная ошибка при авторизации');
      }
    }
  };

  return (
    <button
      onClick={handleTelegramAuth}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#0088cc] hover:bg-[#006fa0] text-white rounded-lg font-medium text-sm transition-colors w-full h-12 ${className}`}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 240 240"
        fill="currentColor"
        className="flex-shrink-0"
      >
        <circle cx="120" cy="120" r="120" fill="#fff" />
        <path
          d="m98 175c-3.888 0-3.227-1.468-4.568-5.17L82 132.207 170 80"
          fill="#c8daea"
        />
        <path
          d="m98 175c3 0 4.325-1.372 6-3l16-15.558-19.958-12.035"
          fill="#a9c9dd"
        />
        <path d="m100 144-15.958-12.035L170 80" fill="#f6fbfe" />
      </svg>
      Войти через Telegram
    </button>
  );
}

// Компонент для обработки callback от Telegram OAuth
export function TelegramAuthCallback({
  onAuth,
}: {
  onAuth: (user: TelegramUser) => void;
}) {
  useEffect(() => {
    // Проверяем, есть ли данные авторизации в URL
    const urlParams = new URLSearchParams(window.location.search);
    const telegramAuthData = urlParams.get('tgAuth');

    if (telegramAuthData) {
      try {
        console.log('TelegramAuthCallback: Found auth data in URL');
        const userData = JSON.parse(decodeURIComponent(telegramAuthData));
        console.log('TelegramAuthCallback: Parsed user data:', userData);

        // Вызываем callback
        onAuth(userData);

        // Очищаем URL от параметров авторизации
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      } catch (error) {
        console.error('TelegramAuthCallback: Error parsing auth data:', error);
      }
    }
  }, [onAuth]);

  return null; // Этот компонент не рендерит ничего
}

// Правильный Telegram Login Widget согласно официальной документации
export function TelegramLoginWidget({
  botName,
  onAuth,
  className = '',
}: {
  botName: string;
  onAuth: (user: TelegramUser) => void;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('TelegramLoginWidget: Initializing with botName:', botName);
    console.log('TelegramLoginWidget: Current origin:', window.location.origin);
    console.log('TelegramLoginWidget: Current URL:', window.location.href);

    if (ref.current) {
      // Очищаем предыдущий контент
      ref.current.innerHTML = '';

      // Добавляем глобальную функцию для callback'а согласно документации
      window.onTelegramAuth = (user: TelegramUser) => {
        console.log('TelegramLoginWidget: Received auth data:', user);
        onAuth(user);
      };

      // Создаем script элемент через createElement
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.setAttribute('data-telegram-login', botName);
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-onauth', 'onTelegramAuth(user)');
      script.setAttribute('data-request-access', 'write');

      console.log(
        'TelegramLoginWidget: Created script element:',
        script.outerHTML
      );

      // Добавляем обработчики событий
      script.onload = () => {
        console.log('TelegramLoginWidget: Script loaded successfully');
      };

      script.onerror = () => {
        console.log('TelegramLoginWidget: Script failed to load');
      };

      // Добавляем скрипт в DOM
      ref.current.appendChild(script);

      // Проверяем загрузку через 3 секунды
      setTimeout(() => {
        const iframe = ref.current?.querySelector('iframe');
        const button = ref.current?.querySelector('button');
        const scriptElement = ref.current?.querySelector('script');

        console.log(
          'TelegramLoginWidget: After 3s - iframe:',
          iframe,
          'button:',
          button,
          'script:',
          scriptElement
        );

        if (iframe || button) {
          console.log('TelegramLoginWidget: Widget loaded successfully');
        }
      }, 3000);
    }
  }, [botName, onAuth]);

  return <div ref={ref} className={className} />;
}
