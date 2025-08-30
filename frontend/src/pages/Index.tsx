import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ProfileHeader } from '@/components/ui/profile-header';
import { MainMenu } from '@/components/ui/main-menu';
import { MobileBottomMenu } from '@/components/ui/mobile-bottom-menu';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
import { useAppTranslation } from '@/lib/i18n';
import { Logo } from '@/components/ui/logo';
import { StyledSubtitle } from '@/components/ui/styled-subtitle';
import {
  detectUserLanguage,
  saveAndApplyLanguage,
  SupportedLanguage,
} from '@/lib/language-detection';
import {
  loadTelegramUser,
  clearTelegramUser,
  forceLogoutFromTelegram,
  saveTelegramUser,
} from '@/lib/telegram-auth';
import { useTelegramFullscreen } from '@/hooks/use-telegram-fullscreen';
import { DevBanner } from '@/components/ui/dev-banner';
import { 
  getActiveDevTestAccount, 
  isDevTestAccountsEnabled, 
  getDevTestAccounts,
  applyDevTestAccount,
  clearDevTestAccount
} from '@/lib/dev-test-account';

const Index = () => {
  const [isLanguageDetected, setIsLanguageDetected] = useState(false);
  const [demoUserState, setDemoUserState] = useState(getActiveDevTestAccount() ? 'enabled' : 'disabled');
  const { t } = useAppTranslation();
  const { i18n } = useTranslation();
  const { setUserId, setLanguage, setTelegramUser, telegramUser, setRole, setProfession } =
    useAppStore();

  // Настройка полноэкранного режима в Telegram Mini Apps
  useTelegramFullscreen();

  // Автоматическое определение языка и загрузка пользователя Telegram при загрузке страницы
  useEffect(() => {
    async function initializeApp() {
      try {
        console.log('🚀 Starting app initialization...');
        
        // Определяем язык
        let detectedLanguage: SupportedLanguage;
        
        if (import.meta.env.DEV) {
          // В dev режиме используем мгновенный fallback
          console.log('🔧 Dev mode: using instant language fallback');
          detectedLanguage = 'ru';
        } else {
          // В production используем полное определение языка с таймаутом
          const languagePromise = detectUserLanguage();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Language detection timeout')), 10000)
          );
          
          detectedLanguage = await Promise.race([languagePromise, timeoutPromise]) as SupportedLanguage;
        }
        
        saveAndApplyLanguage(detectedLanguage, i18n, setLanguage);

        // Проверяем, не выходил ли пользователь только что
        const justLoggedOut = sessionStorage.getItem('just_logged_out');
        const logoutTimestamp = sessionStorage.getItem('logout_timestamp');

        // Проверяем, не прошло ли больше часа с момента выхода
        const isRecentlyLoggedOut =
          justLoggedOut &&
          logoutTimestamp &&
          Date.now() - parseInt(logoutTimestamp) < 60 * 60 * 1000; // 1 час

        if (!isRecentlyLoggedOut) {
          // Проверяем Telegram Mini Apps в первую очередь (более приоритетно)
          if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
            const tgUser = window.Telegram.WebApp.initDataUnsafe.user;
            console.log('Telegram Mini Apps user detected:', tgUser);

            // Создаем объект пользователя из Telegram Mini Apps
            const telegramUser = {
              id: tgUser.id,
              first_name: tgUser.first_name,
              last_name: tgUser.last_name || '',
              username: tgUser.username || '',
              photo_url: tgUser.photo_url || '',
              auth_date: Math.floor(Date.now() / 1000),
              hash: 'telegram_mini_apps_hash',
            };

            // Сохраняем и устанавливаем пользователя
            saveTelegramUser(telegramUser);
            setTelegramUser(telegramUser);
            // Явно устанавливаем userId для немедленного использования
            // Используем setTimeout для избежания race condition
            setTimeout(() => {
              setUserId(telegramUser.id);
            }, 0);
          } else {
            // Проверяем тестовый аккаунт в development режиме
            if (isDevTestAccountsEnabled()) {
              const testAccount = getActiveDevTestAccount();
              if (testAccount) {
                              console.log('Dev test account detected:', testAccount);
              setTelegramUser(testAccount.telegramUser);
              // Используем setTimeout для избежания race condition
              setTimeout(() => {
                setUserId(testAccount.userId);
                setRole(testAccount.role);
                setProfession(testAccount.profession);
                setLanguage(testAccount.language);
              }, 0);
                return; // Не загружаем сохраненного пользователя если есть тестовый аккаунт
              }
            }
            
            // Загружаем сохраненного пользователя Telegram из localStorage только если нет Telegram WebApp и тестового аккаунта
            const savedTelegramUser = loadTelegramUser();
            if (savedTelegramUser) {
              console.log('Загружен сохраненный пользователь Telegram:', savedTelegramUser);
              setTelegramUser(savedTelegramUser);
              // Явно устанавливаем userId для немедленного использования
              // Используем setTimeout для избежания race condition
              setTimeout(() => {
                setUserId(savedTelegramUser.id);
              }, 0);
            } else {
              console.log('Нет сохраненного пользователя Telegram');
              // Очищаем userId если нет авторизации
              setUserId(0);
            }
          }
        } else {
          // Очищаем флаги выхода
          sessionStorage.removeItem('just_logged_out');
          sessionStorage.removeItem('logout_timestamp');
          console.log('User recently logged out, not loading Telegram data');

          // Принудительно очищаем данные пользователя из store и localStorage
          setTelegramUser(null);
          setUserId(0);
          localStorage.removeItem('Super Mock-storage');
          localStorage.removeItem('telegram_user');
        }

        setIsLanguageDetected(true);
      } catch (error) {
        console.error('App initialization error:', error);
        // Fallback на русский
        saveAndApplyLanguage('ru', i18n, setLanguage);
        setIsLanguageDetected(true);
      }
    }

    initializeApp();
  }, [i18n, setLanguage]);

  const handleLogout = () => {
    // Очищаем данные Telegram при выходе
    if (telegramUser) {
      clearTelegramUser();
      setTelegramUser(null);
    }
    setUserId(0);

    // Очищаем все данные из localStorage
    localStorage.removeItem('Super Mock-storage');
    localStorage.removeItem('telegram_user');
    
    // Устанавливаем флаги выхода
    sessionStorage.setItem('just_logged_out', 'true');
    sessionStorage.setItem('logout_timestamp', Date.now().toString());

    // Принудительный выход из Telegram Mini Apps
    forceLogoutFromTelegram();
    
    // Принудительно перезагружаем страницу для полной очистки состояния
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  // Показываем загрузку, пока определяется язык
  if (!isLanguageDetected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-telegram-light-gray p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {t('common.detectingLanguage')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-telegram-light-gray p-3 sm:p-5 pb-24 md:pb-5">
      <div className="max-w-4xl mx-auto pt-16 sm:pt-20">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <Logo size="lg" className="mb-1" clickable={true} />
          </div>
          <StyledSubtitle variant="tech" size="sm">
            {t('common.platformSubtitle')}
          </StyledSubtitle>
        </div>

        {/* Profile Header */}
        <ProfileHeader />

        {/* Main Menu */}
        <MainMenu />
        {
          import.meta.env.DEV && (
            <div className="mt-6">
              <DevBanner />
              {/* Quick Demo User Toggle */}
                             <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                 <h3 className="text-sm font-medium text-blue-800 mb-2">🧪 Быстрое включение демо пользователя</h3>
                                    <div className="mb-2 text-xs text-blue-600">
                     Статус: {demoUserState === 'enabled' ? '✅ Демо включен' : '❌ Демо выключен'}
                   </div>
                 <div className="flex gap-2">
                                     <button
                     onClick={() => {
                       const testAccount = getDevTestAccounts()[0];
                       if (testAccount) {
                         console.log('🧪 Enabling demo user:', testAccount);
                         applyDevTestAccount(testAccount);
                         setTelegramUser(testAccount.telegramUser);
                         setUserId(testAccount.userId);
                         setRole(testAccount.role);
                         setProfession(testAccount.profession);
                         setLanguage(testAccount.language);
                         setDemoUserState('enabled');
                         // Не перезагружаем страницу - просто обновляем состояние
                         console.log('✅ Demo user enabled successfully');
                       }
                     }}
                     className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                   >
                     Включить демо
                   </button>
                   <button
                     onClick={() => {
                       console.log('🧪 Clearing demo user');
                       clearDevTestAccount();
                       setTelegramUser(null);
                       setUserId(0);
                       setRole(null);
                       setProfession(null);
                       setLanguage('ru');
                       setDemoUserState('disabled');
                       // Не перезагружаем страницу - просто обновляем состояние
                       console.log('✅ Demo user cleared successfully');
                     }}
                     className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                   >
                                          Очистить демо
                   </button>
                   {demoUserState === 'enabled' && (
                     <button
                       onClick={() => {
                         console.log('🧪 Testing smart navigation');
                         // Переходим на главную страницу для тестирования умной навигации
                         window.location.href = '/';
                       }}
                       className="px-3 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600"
                     >
                       Тест навигации
                     </button>
                   )}
                 </div>
               </div>
            </div>
          )
        }
        {/* Удалено */}
      </div>

      {/* Mobile Bottom Menu */}
      <MobileBottomMenu />
    </div>
  );
};

export default Index;
