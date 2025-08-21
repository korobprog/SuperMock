import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { RoleCard } from '@/components/ui/role-card';
import { Logo } from '@/components/ui/logo';
import { ArrowLeft } from 'lucide-react';
import { useAppTranslation } from '@/lib/i18n';
import { useTranslation } from 'react-i18next';
import { getTelegramWebApp } from '@/lib/utils';
import { useTelegramFullscreen } from '@/hooks/use-telegram-fullscreen';
import { apiInit, apiSaveProfile } from '@/lib/api';
import { useAppStore } from '@/lib/store';

const languages = [
  { id: 'ru', name: 'Русский', flag: '🇷🇺' },
  { id: 'en', name: 'English', flag: '🇺🇸' },
  { id: 'es', name: 'Español', flag: '🇪🇸' },
  { id: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { id: 'fr', name: 'Français', flag: '🇫🇷' },
  { id: 'zh', name: '中文', flag: '🇨🇳' },
];

export function LanguageSelection() {
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const setUserId = useAppStore((s) => s.setUserId);
  const role = useAppStore((s) => s.role);
  const profession = useAppStore((s) => s.profession);
  const navigate = useNavigate();
  const { t } = useAppTranslation();
  const { i18n } = useTranslation();

  // Настройка полноэкранного режима в Telegram Mini Apps
  useTelegramFullscreen();

  useEffect(() => {
    const tg = getTelegramWebApp();

    // Автоопределение языка из Telegram
    if (tg?.initDataUnsafe?.user?.language_code) {
      const telegramLang = tg.initDataUnsafe.user.language_code;
      // Сопоставляем коды языков Telegram с нашими
      const langMapping: { [key: string]: string } = {
        ru: 'ru',
        en: 'en',
        es: 'es',
        de: 'de',
        fr: 'fr',
        zh: 'zh',
        'zh-cn': 'zh',
        'zh-tw': 'zh',
      };

      const detectedLang = langMapping[telegramLang.toLowerCase()] || 'ru';
      setSelectedLanguage(detectedLang);
      i18n.changeLanguage(detectedLang);
    }
  }, [i18n]);

  const handleNext = async () => {
    if (selectedLanguage) {
      setLanguage(selectedLanguage);
      // Изменяем язык интерфейса
      i18n.changeLanguage(selectedLanguage);

      const tg = getTelegramWebApp();
      let user = tg?.initDataUnsafe?.user || null;
      let initData = tg?.initData || null;

      // Check if user is authenticated via Telegram Login Widget
      const telegramUser = useAppStore.getState().telegramUser;

      // Debug information
      console.log('🔍 Debug info:', {
        isDev: import.meta.env.DEV,
        hasTg: !!tg,
        hasUser: !!user,
        hasInitData: !!initData,
        hasTelegramUser: !!telegramUser,
        tg: tg,
        user: user,
        telegramUser: telegramUser,
      });

      // Handle different scenarios - prioritize Telegram Login Widget user
      if (telegramUser) {
        // Use Telegram Login Widget user if available (highest priority)
        console.log(
          '✅ Using authenticated Telegram user from store:',
          telegramUser
        );
        user = {
          id: telegramUser.id,
          first_name: telegramUser.first_name,
          username: telegramUser.username,
          language_code: selectedLanguage,
        };
        initData = 'present';
      } else if (tg && user) {
        // Use Telegram WebApp user if available
        console.log('✅ Using Telegram WebApp user:', user);
        // Keep existing user and initData
      } else if (import.meta.env.DEV) {
        // Demo mode only in development when no Telegram user is available
        console.log('🎭 Using demo mode');
        user = {
          id: 12345678,
          first_name: 'Demo User',
          username: 'demo_user',
          language_code: selectedLanguage,
        };
        initData = 'demo_hash_12345';
      } else {
        // In production, redirect to profile if no authentication
        console.warn(
          'No authentication available in production; redirecting to profile.'
        );
        navigate('/profile');
        return;
      }

      // Если все еще нет пользователя, показываем сообщение об ошибке
      if (!user) {
        console.error('❌ No user data available for initialization');
        // Можно показать toast или alert пользователю
        alert('Пожалуйста, войдите через Telegram для продолжения');
        navigate('/profile');
        return;
      }

      console.log('📡 Calling apiInit with:', {
        tg: user,
        language: selectedLanguage,
        initData,
      });

      try {
        const data = await apiInit({
          tg: user,
          language: selectedLanguage,
          initData: initData,
        });
        setUserId(data.user.id);
        try {
          await apiSaveProfile({
            userId: data.user.id,
            language: selectedLanguage,
          });
        } catch (e) {
          console.warn('Failed to save language in profile:', e);
        }
        // Перенаправляем на выбор инструментов
        navigate('/tools');
      } catch (error) {
        console.error('❌ Failed to initialize user:', error);
        alert(`Ошибка инициализации: ${error.message}`);
        // Перенаправляем на профиль для повторной аутентификации
        navigate('/profile');
      }
    }
  };

  const handleBack = () => {
    navigate('/profession');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-telegram-light-gray p-4">
      <div className="max-w-md mx-auto pt-16 sm:pt-20">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo size="lg" clickable={true} />
        </div>

        {/* Header */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="mr-2 p-2"
          >
            <ArrowLeft size={20} />
          </Button>
          <div className="flex-1 text-center">
            <h1 className="text-xl font-bold text-foreground">
              {t('language.selectLanguage')}
            </h1>
          </div>
        </div>

        <p className="text-center text-muted-foreground mb-6">
          {t('language.languageSubtitle')}
        </p>

        {/* Language Cards */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {languages.map((language) => (
            <div
              key={language.id}
              onClick={() => {
                setSelectedLanguage(language.id);
                i18n.changeLanguage(language.id);
              }}
              className={`
                relative p-4 rounded-xl cursor-pointer transition-all duration-300
                border hover:scale-105 active:scale-95 text-center
                ${
                  selectedLanguage === language.id
                    ? 'border-primary bg-gradient-to-br from-primary/5 to-primary/10 shadow-[0_4px_16px_hsl(var(--primary)/15%)]'
                    : 'border-border hover:border-primary/30 bg-card shadow-[0_2px_8px_hsl(var(--border))]'
                }
              `}
            >
              <div className="space-y-2">
                <div className="text-2xl">{language.flag}</div>
                <div className="text-sm font-medium text-foreground">
                  {language.name}
                </div>
              </div>
              {selectedLanguage === language.id && (
                <div className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Debug Info */}
        {import.meta.env.DEV && (
          <div className="mb-4 p-3 bg-gray-100 rounded-lg text-xs">
            <p>
              <strong>Debug Info:</strong>
            </p>
            <p>
              Telegram User:{' '}
              {JSON.stringify(useAppStore.getState().telegramUser)}
            </p>
            <p>User ID: {useAppStore.getState().userId}</p>
            <p>Demo Mode: {import.meta.env.VITE_ENABLE_DEMO_MODE}</p>
          </div>
        )}

        {/* Next Button */}
        <Button
          onClick={handleNext}
          disabled={!selectedLanguage}
          className="w-full h-12 text-base font-medium bg-gradient-to-r from-primary to-primary hover:shadow-[0_4px_20px_hsl(var(--primary)/30%)] transition-all duration-300"
        >
          {t('navigation.next')}
        </Button>
      </div>
    </div>
  );
}
