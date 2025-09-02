import React, { useState, useEffect } from 'react';
import { TelegramUser } from '@/lib/telegram-auth';
import { getTelegramWebApp } from '@/lib/utils';
import { useAppStore } from '@/lib/store';

interface TelegramProductionTestProps {
  botName: string;
  onAuth: (user: TelegramUser) => void;
  className?: string;
}

export function TelegramProductionTest({
  botName,
  onAuth,
  className = '',
}: TelegramProductionTestProps) {
  const [telegramStatus, setTelegramStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');
  const [webAppData, setWebAppData] = useState<any>(null);
  const [authStep, setAuthStep] = useState<'initial' | 'authing' | 'success'>('initial');
  const { telegramUser, userId } = useAppStore();

  useEffect(() => {
    console.log('🔧 TelegramProductionTest: Checking Telegram WebApp availability...');
    
    const checkTelegramWebApp = () => {
      const tg = getTelegramWebApp();
      
      if (tg) {
        console.log('✅ Telegram WebApp detected');
        console.log('🔧 initData:', tg.initData);
        console.log('🔧 initDataUnsafe:', tg.initDataUnsafe);
        console.log('🔧 version:', tg.version);
        console.log('🔧 platform:', tg.platform);
        console.log('🔧 colorScheme:', tg.colorScheme);
        
        setWebAppData({
          initData: tg.initData,
          initDataUnsafe: tg.initDataUnsafe,
          version: tg.version,
          platform: tg.platform,
          colorScheme: tg.colorScheme,
        });
        
        setTelegramStatus('available');
        
        // Если пользователь уже авторизован
        if (tg.initDataUnsafe?.user) {
          console.log('✅ User already authenticated:', tg.initDataUnsafe.user);
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
          setAuthStep('success');
        }
      } else {
        console.log('❌ Telegram WebApp not available');
        setTelegramStatus('unavailable');
      }
    };

    // Проверяем сразу
    checkTelegramWebApp();
    
    // Проверяем через небольшую задержку (на случай если WebApp загружается)
    const timeoutId = setTimeout(checkTelegramWebApp, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [onAuth]);

  // Если пользователь уже авторизован, не показываем компонент
  if (telegramUser || (userId && userId > 0)) {
    return null;
  }

  const handleStartAuth = () => {
    setAuthStep('authing');
    console.log('🚀 Starting production auth process...');
    
    try {
      const tg = getTelegramWebApp();
      
      if (!tg) {
        console.log('❌ Telegram WebApp not available');
        setTelegramStatus('unavailable');
        return;
      }

      // Получаем initDataRaw согласно документации Telegram Mini Apps
      const initDataRaw = tg.initData;
      console.log('🔑 initDataRaw:', initDataRaw);
      
      if (!initDataRaw) {
        console.log('⚠️ initData отсутствует, запрашиваем доступ к данным...');
        
        // Запрашиваем доступ к данным пользователя
        if ((tg as any).requestWriteAccess) {
          console.log('✅ Запрашиваем доступ через requestWriteAccess');
          (tg as any).requestWriteAccess();
        } else {
          console.log('⚠️ requestWriteAccess недоступен, открываем бота');
          if (tg.openTelegramLink) {
            tg.openTelegramLink(`https://t.me/${botName}?start=auth`);
          } else {
            window.open(`https://t.me/${botName}?start=auth`, '_blank');
          }
        }
        
        // Показываем инструкции пользователю
        alert(`Пожалуйста, разрешите доступ к данным в Telegram и вернитесь в приложение`);
        
        // Проверяем авторизацию через интервалы
        const checkAuth = setInterval(() => {
          const tg = getTelegramWebApp();
          if (tg?.initData) {
            console.log('✅ initData получен после запроса доступа:', tg.initData);
            clearInterval(checkAuth);
            // Повторно вызываем авторизацию с полученными данными
            handleStartAuth();
          }
        }, 2000);
        
        // Останавливаем проверку через 30 секунд
        setTimeout(() => {
          clearInterval(checkAuth);
          if (authStep === 'authing') {
            console.log('⏰ Auth timeout, resetting to initial state');
            setAuthStep('initial');
          }
        }, 30000);
        
        return;
      }

      // Отправляем initDataRaw на сервер согласно документации
      console.log('📤 Отправляем initDataRaw на сервер для авторизации...');
      
      fetch('/api/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `tma ${initDataRaw}` // Правильный заголовок согласно документации
        },
        body: JSON.stringify({
          language: 'ru',
          initData: initDataRaw
        })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('✅ Сервер успешно авторизовал пользователя:', data);
        
        if (data.user) {
          // Используем данные от сервера
          onAuth({
            id: data.user.id,
            first_name: data.user.first_name,
            last_name: data.user.last_name || '',
            username: data.user.username || '',
            photo_url: data.user.photo_url || '',
            auth_date: Math.floor(Date.now() / 1000),
            hash: data.user.hash || 'telegram_mini_apps_hash',
          });
        } else if (tg.initDataUnsafe?.user) {
          // Fallback на данные из WebApp
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
        }
        
        setAuthStep('success');
      })
      .catch(error => {
        console.error('❌ Ошибка авторизации на сервере:', error);
        
        // Fallback: используем данные из WebApp если сервер недоступен
        if (tg.initDataUnsafe?.user) {
          console.log('🔄 Используем fallback авторизацию через WebApp');
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
          setAuthStep('success');
        } else {
          console.log('❌ Fallback авторизация не удалась');
          setAuthStep('initial');
        }
      });
      
    } catch (error) {
      console.error('❌ Error during auth:', error);
      setAuthStep('initial');
    }
  };

  if (authStep === 'success') {
    return (
      <div className={`text-center ${className}`}>
        <div className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium">Авторизация успешна!</span>
        </div>
      </div>
    );
  }

  if (telegramStatus === 'checking') {
    return (
      <div className={`text-center ${className}`}>
        <div className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm">Проверка Telegram...</span>
        </div>
      </div>
    );
  }

  if (telegramStatus === 'unavailable') {
    return (
      <div className={`text-center ${className}`}>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800 mb-3">
            Telegram WebApp недоступен. Возможно, вы открыли приложение в обычном браузере.
          </p>
          <button
            onClick={() => window.open(`https://t.me/${botName}?start=auth`, '_blank')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#0088cc] hover:bg-[#006fa0] text-white rounded-lg font-medium text-sm transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 240 240" fill="currentColor" className="flex-shrink-0">
              <circle cx="120" cy="120" r="120" fill="#fff" />
              <path d="m98 175c-3.888 0-3.227-1.468-4.568-5.17L82 132.207 170 80" fill="#c8daea" />
              <path d="m98 175c3 0 4.325-1.372 6-3l16-15.558-19.958-12.035" fill="#a9c9dd" />
              <path d="m100 144-15.958-12.035L170 80" fill="#f6fbfe" />
            </svg>
            Открыть в Telegram
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`text-center ${className}`}>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Telegram WebApp обнаружен
        </h3>
        <div className="text-left text-sm text-blue-700 space-y-1">
          <p><strong>Версия:</strong> {webAppData?.version || 'Неизвестно'}</p>
          <p><strong>Платформа:</strong> {webAppData?.platform || 'Неизвестно'}</p>
          <p><strong>initData:</strong> {webAppData?.initData ? 'Присутствует' : 'Отсутствует'}</p>
          <p><strong>Пользователь:</strong> {webAppData?.initDataUnsafe?.user ? 'Авторизован' : 'Не авторизован'}</p>
        </div>
      </div>
      
      {webAppData?.initDataUnsafe?.user ? (
        <div className="text-green-700 text-sm">
          ✅ Пользователь уже авторизован в Telegram WebApp
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-600 mb-3">
            Для продолжения необходимо авторизоваться в Telegram
          </p>
          <button
            onClick={handleStartAuth}
            disabled={authStep === 'authing'}
            className={`
              inline-flex items-center justify-center gap-2 px-4 py-2 
              bg-[#0088cc] hover:bg-[#006fa0] disabled:bg-gray-400
              text-white rounded-lg font-medium text-sm transition-colors w-full h-12
              ${authStep === 'authing' ? 'cursor-not-allowed' : ''}
            `}
          >
            {authStep === 'authing' ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Авторизация...</span>
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 240 240" fill="currentColor" className="flex-shrink-0">
                  <circle cx="120" cy="120" r="120" fill="#fff" />
                  <path d="m98 175c-3.888 0-3.227-1.468-4.568-5.17L82 132.207 170 80" fill="#c8daea" />
                  <path d="m98 175c3 0 4.325-1.372 6-3l16-15.558-19.958-12.035" fill="#a9c9dd" />
                  <path d="m100 144-15.958-12.035L170 80" fill="#f6fbfe" />
                </svg>
                <span>Авторизоваться в Telegram</span>
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}

// Простой компонент для быстрого тестирования в продакшене
export function TelegramQuickTest({
  botName,
  onAuth,
  className = '',
}: {
  botName: string;
  onAuth: (user: TelegramUser) => void;
  className?: string;
}) {
  const [testStep, setTestStep] = useState<'initial' | 'testing' | 'success'>('initial');
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const runQuickTest = async () => {
    setTestStep('testing');
    setTestResults([]);
    
    addTestResult('🚀 Начинаем быстрый тест...');
    
    try {
      // Тест 1: Проверка переменных окружения
      addTestResult('📋 Проверяем переменные окружения...');
      const botNameEnv = import.meta.env.VITE_TELEGRAM_BOT_NAME;
      const botIdEnv = import.meta.env.VITE_TELEGRAM_BOT_ID;
      
      if (!botNameEnv) {
        addTestResult('❌ VITE_TELEGRAM_BOT_NAME не настроен');
        return;
      }
      if (!botIdEnv) {
        addTestResult('❌ VITE_TELEGRAM_BOT_ID не настроен');
        return;
      }
      addTestResult(`✅ Переменные окружения: бот "${botNameEnv}", ID ${botIdEnv}`);

      // Тест 2: Проверка Telegram WebApp
      addTestResult('📱 Проверяем Telegram WebApp...');
      const tg = window.Telegram?.WebApp;
      if (tg) {
        addTestResult(`✅ Telegram WebApp обнаружен (версия ${tg.version || 'неизвестна'})`);
        addTestResult(`📊 initData: ${tg.initData ? 'присутствует' : 'отсутствует'}`);
        addTestResult(`👤 Пользователь: ${tg.initDataUnsafe?.user ? 'авторизован' : 'не авторизован'}`);
      } else {
        addTestResult('❌ Telegram WebApp не обнаружен');
      }

      // Тест 3: Проверка API бота
      addTestResult('🤖 Проверяем API бота...');
      try {
        const response = await fetch(`https://api.telegram.org/bot${botIdEnv}/getMe`);
        const data = await response.json();
        
        if (data.ok) {
          addTestResult(`✅ Бот доступен: ${data.result.first_name} (@${data.result.username})`);
        } else {
          addTestResult(`❌ Ошибка API бота: ${data.description}`);
        }
      } catch (error) {
        addTestResult(`❌ Ошибка проверки API: ${error}`);
      }

      // Тест 4: Проверка домена
      addTestResult('🌐 Проверяем текущий домен...');
      const currentDomain = window.location.hostname;
      addTestResult(`📍 Текущий домен: ${currentDomain}`);
      
      if (currentDomain === 'localhost' || currentDomain === '127.0.0.1') {
        addTestResult('⚠️ Локальная разработка - некоторые функции могут не работать');
      } else {
        addTestResult('✅ Продакшн домен');
      }

      addTestResult('✅ Тест завершен!');
      setTestStep('success');
      
    } catch (error) {
      addTestResult(`❌ Ошибка теста: ${error}`);
      setTestStep('initial');
    }
  };

  const resetTest = () => {
    setTestStep('initial');
    setTestResults([]);
  };

  if (testStep === 'success') {
    return (
      <div className={`text-center ${className}`}>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-900 mb-2">✅ Тест завершен</h3>
          <p className="text-sm text-green-700 mb-3">
            Проверьте результаты ниже и убедитесь, что все настроено корректно
          </p>
          <button
            onClick={resetTest}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
          >
            Запустить тест заново
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          🧪 Быстрый тест Telegram окружения
        </h3>
        <p className="text-sm text-blue-700 mb-3">
          Этот тест проверит основные настройки и поможет выявить проблемы
        </p>
        <button
          onClick={runQuickTest}
          disabled={testStep === 'testing'}
          className={`
            px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400
            text-white rounded-lg text-sm font-medium
            ${testStep === 'testing' ? 'cursor-not-allowed' : ''}
          `}
        >
          {testStep === 'testing' ? 'Тестируем...' : 'Запустить тест'}
        </button>
      </div>

      {/* Результаты тестов */}
      {testResults.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Результаты тестов:</h4>
          <div className="bg-white border border-gray-200 rounded p-3 max-h-64 overflow-y-auto">
            {testResults.map((result, index) => (
              <div key={index} className="text-xs text-gray-700 mb-1 font-mono">
                {result}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Информация о боте */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
        <h4 className="text-sm font-medium text-yellow-900 mb-2">ℹ️ Информация:</h4>
        <div className="text-xs text-yellow-800 space-y-1">
          <div>• Бот: {botName}</div>
          <div>• Домен: {window.location.hostname}</div>
          <div>• Режим: {import.meta.env.PROD ? 'Продакшн' : 'Разработка'}</div>
        </div>
      </div>
    </div>
  );
}

// Компонент для быстрого тестирования авторизации в продакшн версии
export function TelegramProductionAuthTest({
  botName,
  onAuth,
  className = '',
}: {
  botName: string;
  onAuth: (user: TelegramUser) => void;
  className?: string;
}) {
  const { telegramUser, userId } = useAppStore();
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<string>('');
  const [authStep, setAuthStep] = useState<'initial' | 'authing' | 'success'>('initial');

  const checkAuthStatus = () => {
    setIsChecking(true);
    setCheckResult('Проверяем статус авторизации...');
    
    setTimeout(() => {
      const tg = window.Telegram?.WebApp;
      let result = '';
      
      if (tg) {
        result += `✅ Telegram WebApp обнаружен\n`;
        result += `📱 Версия: ${tg.version || 'неизвестна'}\n`;
        result += `🔧 initData: ${tg.initData ? 'присутствует' : 'отсутствует'}\n`;
        result += `👤 Пользователь: ${tg.initDataUnsafe?.user ? 'авторизован' : 'не авторизован'}\n`;
        
        if (tg.initDataUnsafe?.user) {
          result += `\n🎯 Данные пользователя:\n`;
          result += `ID: ${tg.initDataUnsafe.user.id}\n`;
          result += `Имя: ${tg.initDataUnsafe.user.first_name}\n`;
          result += `Username: ${tg.initDataUnsafe.user.username || 'не указан'}\n`;
        }
      } else {
        result += `❌ Telegram WebApp не обнаружен\n`;
      }
      
      result += `\n📊 Store состояние:\n`;
      result += `telegramUser: ${telegramUser ? 'установлен' : 'не установлен'}\n`;
      result += `userId: ${userId || 'не установлен'}\n`;
      
      if (telegramUser) {
        result += `\n👤 Данные из store:\n`;
        result += `ID: ${telegramUser.id}\n`;
        result += `Имя: ${telegramUser.first_name}\n`;
        result += `Username: ${telegramUser.username || 'не указан'}\n`;
      }
      
      setCheckResult(result);
      setIsChecking(false);
    }, 1000);
  };

  const handleTelegramAuth = () => {
    setAuthStep('authing');
    setCheckResult('Начинаем авторизацию через Telegram...');
    
    try {
      const tg = window.Telegram?.WebApp;
      
      if (tg?.openTelegramLink) {
        console.log('✅ Using WebApp API to open Telegram link');
        tg.openTelegramLink(`https://t.me/${botName}?start=auth`);
      } else {
        console.log('⚠️ WebApp API not available, using fallback');
        window.open(`https://t.me/${botName}?start=auth`, '_blank');
      }
      
      // Запрашиваем доступ к данным пользователя
      if ((tg as any).requestWriteAccess) {
        console.log('✅ Запрашиваем доступ через requestWriteAccess');
        (tg as any).requestWriteAccess();
      } else {
        console.log('⚠️ requestWriteAccess недоступен, открываем бота');
        if (tg.openTelegramLink) {
          tg.openTelegramLink(`https://t.me/${botName}?start=auth`);
        } else {
          window.open(`https://t.me/${botName}?start=auth`, '_blank');
        }
      }
      
      // Показываем инструкции пользователю
      setCheckResult('Пожалуйста, разрешите доступ к данным в Telegram и вернитесь в приложение');
      
      // Проверяем авторизацию через интервалы
      const checkAuth = setInterval(() => {
        const currentTg = window.Telegram?.WebApp;
        if (currentTg?.initDataUnsafe?.user) {
          console.log('✅ User authenticated after write access:', currentTg.initDataUnsafe.user);
          clearInterval(checkAuth);
          
          const user = currentTg.initDataUnsafe.user;
          const telegramUser: TelegramUser = {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name || '',
            username: user.username || '',
            photo_url: user.photo_url || '',
            auth_date: Math.floor(Date.now() / 1000),
            hash: 'telegram_mini_apps_hash',
          };
          
          setCheckResult('✅ Авторизация успешна! Пользователь: ' + user.first_name);
          setAuthStep('success');
          onAuth(telegramUser);
        }
      }, 1000);
      
      // Останавливаем проверку через 30 секунд
      setTimeout(() => {
        clearInterval(checkAuth);
        if (authStep === 'authing') {
          console.log('⏰ Auth timeout, resetting to initial state');
          setAuthStep('initial');
          setCheckResult('⏰ Таймаут авторизации. Попробуйте еще раз.');
        }
      }, 30000);
      
    } catch (error) {
      console.error('❌ Error during auth:', error);
      setAuthStep('initial');
      setCheckResult('❌ Ошибка при авторизации: ' + error);
    }
  };

  const forceAuth = () => {
    if (telegramUser) {
      onAuth(telegramUser);
      setCheckResult('✅ Принудительная авторизация выполнена');
    } else {
      setCheckResult('❌ Нет данных пользователя для авторизации');
    }
  };

  // Если пользователь уже авторизован, не показываем компонент
  if (telegramUser || (userId && userId > 0)) {
    return (
      <div className={`text-center ${className}`}>
        <div className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium">Пользователь уже авторизован</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          🔐 Авторизация в Telegram
        </h3>
        <p className="text-sm text-blue-700 mb-3">
          Для доступа к платформе необходимо авторизоваться через Telegram бота
        </p>
        
        <div className="space-y-3">
          <button
            onClick={handleTelegramAuth}
            disabled={authStep === 'authing'}
            className="w-full px-4 py-2 bg-[#0088cc] hover:bg-[#006fa0] disabled:bg-gray-400 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
          >
            {authStep === 'authing' ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Авторизация...</span>
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 240 240" fill="currentColor">
                  <circle cx="120" cy="120" r="120" fill="#fff" />
                  <path d="m98 175c-3.888 0-3.227-1.468-4.568-5.17L82 132.207 170 80" fill="#c8daea" />
                  <path d="m98 175c3 0 4.325-1.372 6-3l16-15.558-19.958-12.035" fill="#a9c9dd" />
                  <path d="m100 144-15.958-12.035L170 80" fill="#f6fbfe" />
                </svg>
                <span>Авторизоваться через Telegram</span>
              </>
            )}
          </button>
          
          <button
            onClick={checkAuthStatus}
            disabled={isChecking}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium"
          >
            {isChecking ? 'Проверяем...' : 'Проверить статус авторизации'}
          </button>
        </div>
      </div>

      {/* Результаты проверки */}
      {checkResult && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Результаты:</h4>
          <div className="bg-white border border-gray-200 rounded p-3 max-h-64 overflow-y-auto">
            <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
              {checkResult}
            </pre>
          </div>
        </div>
      )}

      {/* Информация о боте */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
        <h4 className="text-sm font-medium text-yellow-900 mb-2">ℹ️ Информация:</h4>
        <div className="text-xs text-yellow-800 space-y-1">
          <div>• Бот: {botName}</div>
          <div>• Домен: {window.location.hostname}</div>
          <div>• Режим: {import.meta.env.PROD ? 'Продакшн' : 'Разработка'}</div>
          <div>• Telegram WebApp: {window.Telegram?.WebApp ? 'Доступен' : 'Недоступен'}</div>
        </div>
      </div>
    </div>
  );
}
