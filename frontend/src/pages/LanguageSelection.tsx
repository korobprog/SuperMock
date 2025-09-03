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
import { 
  getActiveDevTestAccount, 
  isDevTestAccountsEnabled 
} from '@/lib/dev-test-account';

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
  const navigate = useNavigate();
  const { t } = useAppTranslation();
  const { i18n } = useTranslation();
  const userId = useAppStore.getState().userId;

  // Настройка полноэкранного режима в Telegram Mini Apps
  useTelegramFullscreen();

  // Проверяем наличие параметра profession в URL
  useEffect(() => {
    const professionFromUrl = new URLSearchParams(window.location.search).get('profession');
    if (!professionFromUrl) {
      console.log('❌ No profession parameter in URL, redirecting to /profession');
      navigate('/profession');
      return;
    }
  }, [navigate]);

  useEffect(() => {
    // В dev режиме пропускаем автоопределение языка
    if (import.meta.env.DEV) {
      console.log('🔧 Dev mode: skipping auto language detection');
      return;
    }

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
      console.log('🌍 Language selected:', selectedLanguage);
      
      // Сразу сохраняем язык в store
      setLanguage(selectedLanguage);
      i18n.changeLanguage(selectedLanguage);

      // Проверяем демо аккаунт
      const demoAccount = getActiveDevTestAccount();
      
      // Создаем локальный userId если его нет (для всех новых пользователей)
      let currentUserId = userId;
      if (!currentUserId || currentUserId === 0) {
        const localId = demoAccount ? demoAccount.userId : Math.floor(Math.random() * 1000000) + 1000000;
        setUserId(localId);
        currentUserId = localId;
        console.log('🎭 Generated local userId for new user:', localId);
      }

      // Пытаемся инициализировать пользователя через API, но не блокируем навигацию
      if (currentUserId) {
        try {
          console.log('📡 Attempting to initialize user via API...');
          
          const tg = getTelegramWebApp();
          let user = tg?.initDataUnsafe?.user || null;
          let initData = tg?.initData || null;

          // Handle different scenarios
          if (demoAccount) {
            user = {
              id: demoAccount.userId,
              first_name: demoAccount.telegramUser.first_name,
              username: demoAccount.telegramUser.username,
              language_code: selectedLanguage,
            };
            initData = 'demo_hash_12345';
          } else if (useAppStore.getState().telegramUser) {
            const telegramUser = useAppStore.getState().telegramUser;
            user = {
              id: telegramUser.id,
              first_name: telegramUser.first_name,
              username: telegramUser.username,
              language_code: selectedLanguage,
            };
            initData = 'present';
          }

          if (user) {
            const data = await apiInit({
              tg: user,
              language: selectedLanguage,
              initData: initData || '',
            });
            setUserId(data.user.id);
            
            // Пытаемся сохранить профиль, но не блокируем при ошибке
            try {
              await apiSaveProfile({
                userId: data.user.id,
                language: selectedLanguage,
              });
            } catch (e) {
              console.warn('Failed to save language in profile:', e);
            }
          }
        } catch (error) {
          console.warn('⚠️ Failed to initialize user via API:', error);
          console.log('💾 Continuing with local initialization');
        }
      }

      // Всегда перенаправляем на выбор инструментов
      console.log('🚀 Navigating to /tools');
      const currentProfession = useAppStore.getState().profession;
      if (currentProfession) {
        navigate(`/tools?profession=${currentProfession}`);
      } else {
        navigate('/tools');
      }
    } else {
      console.warn('❌ No language selected');
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
