import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ProfileHeader } from '@/components/ui/profile-header';
import { MainMenu } from '@/components/ui/main-menu';
import { MobileBottomMenu } from '@/components/ui/mobile-bottom-menu';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
import { useAppTranslation } from '@/lib/i18n';
import { Logo } from '@/components/ui/logo';
import { StyledSubtitle } from '@/components/ui/styled-subtitle';
import {
  detectUserLanguage,
  saveAndApplyLanguage,
} from '@/lib/language-detection';
import {
  loadTelegramUser,
  clearTelegramUser,
  forceLogoutFromTelegram,
  saveTelegramUser,
} from '@/lib/telegram-auth';
import { useTelegramFullscreen } from '@/hooks/use-telegram-fullscreen';

const Index = () => {
  const navigate = useNavigate();
  const [isLanguageDetected, setIsLanguageDetected] = useState(false);
  const { t } = useAppTranslation();
  const { i18n } = useTranslation();
  const { userId, setUserId, setLanguage, setTelegramUser, telegramUser } =
    useAppStore();

  // Настройка полноэкранного режима в Telegram Mini Apps
  useTelegramFullscreen();

  // Автоматическое определение языка и загрузка пользователя Telegram при загрузке страницы
  useEffect(() => {
    async function initializeApp() {
      try {
        // Определяем язык
        const detectedLanguage = await detectUserLanguage();
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
          // Загружаем сохраненного пользователя Telegram из localStorage
          const savedTelegramUser = loadTelegramUser();
          if (savedTelegramUser) {
            setTelegramUser(savedTelegramUser);
          }

          // Проверяем Telegram Mini Apps только если не выходили
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
          }
        } else {
          // Очищаем флаги выхода
          sessionStorage.removeItem('just_logged_out');
          sessionStorage.removeItem('logout_timestamp');
          console.log('User recently logged out, not loading Telegram data');

          // Принудительно очищаем данные пользователя из store
          setTelegramUser(null);
          setUserId(0);
        }

        setIsLanguageDetected(true);
      } catch (error) {
        // Fallback на русский
        saveAndApplyLanguage('ru', i18n, setLanguage);
        setIsLanguageDetected(true);
      }
    }

    initializeApp();
  }, [i18n, setLanguage, setTelegramUser, setUserId]);

  const handleLogout = () => {
    // Очищаем данные Telegram при выходе
    if (telegramUser) {
      clearTelegramUser();
      setTelegramUser(null);
    }
    setUserId(0);

    // Принудительный выход из Telegram Mini Apps
    forceLogoutFromTelegram();
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

        {/* Dev Test Link */}
        {import.meta.env.DEV && (
          <div className="mt-6 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dev-test')}
            >
              Dev тестовая страница
            </Button>
          </div>
        )}

        {/* Auth Dialog */}
        {/* Удалено */}
      </div>

      {/* Mobile Bottom Menu */}
      <MobileBottomMenu />
    </div>
  );
};

export default Index;
