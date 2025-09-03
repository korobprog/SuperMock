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
import { TelegramLoginWidget } from '@/components/ui/telegram-login';
import { TelegramMiniAppsStatus } from '@/components/ui/telegram-mini-apps-status';
import { createApiUrl } from '@/lib/config';
import { TelegramUser } from '@/lib/telegram-auth';

const Index = () => {
  const [isLanguageDetected, setIsLanguageDetected] = useState(false);
  const { t } = useAppTranslation();
  const { i18n } = useTranslation();
  const { setUserId, setLanguage, setTelegramUser, setRole, setProfession, telegramUser, userId } =
    useAppStore();

  // Настройка полноэкранного режима в Telegram Mini Apps
  useTelegramFullscreen();

  // Автоматическое определение языка и загрузка пользователя Telegram при загрузке страницы
  useEffect(() => {
    async function initializeApp() {
      try {
        if (import.meta.env.DEV) {
          console.log('🚀 Starting app initialization...');
          console.log('🔍 Current store state:', {
            userId,
            telegramUser,
            hasTelegramUser: !!telegramUser
          });
        }
        
        // Определяем язык
        const detectedLanguage = await detectUserLanguage();
        setLanguage(detectedLanguage);
        if (import.meta.env.DEV) {
          console.log('🌍 Language detected:', detectedLanguage);
        }

        // Проверяем, не выходил ли пользователь только что
        const justLoggedOut = sessionStorage.getItem('just_logged_out');
        const logoutTimestamp = sessionStorage.getItem('logout_timestamp');

        // Проверяем, не прошло ли больше часа с момента выхода
        const isRecentlyLoggedOut =
          justLoggedOut &&
          logoutTimestamp &&
          Date.now() - parseInt(logoutTimestamp) < 60 * 60 * 1000; // 1 час

        // В продакшене всегда проверяем авторизацию, в development можно пропустить
        if (!isRecentlyLoggedOut || !import.meta.env.DEV) {
          // Проверяем Telegram Mini Apps в первую очередь (более приоритетно)
          const tg = window.Telegram?.WebApp;
          
          if (tg) {
            if (import.meta.env.DEV) {
              console.log('🔧 Telegram Mini Apps detected');
              console.log('🔧 initData:', tg.initData);
              console.log('🔧 initDataUnsafe:', tg.initDataUnsafe);
              console.log('🔧 initDataUnsafe.user:', tg.initDataUnsafe?.user);
              console.log('🔧 WebApp.ready:', tg.ready);
              console.log('🔧 WebApp.platform:', tg.platform);
              console.log('🔧 WebApp.version:', tg.version);
            }
            
            if (tg.initDataUnsafe?.user) {
              const tgUser = tg.initDataUnsafe.user;
              if (import.meta.env.DEV) {
                console.log('✅ Telegram Mini Apps user detected:', tgUser);
              }

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
              // Используем setTelegramUser который теперь сразу устанавливает userId
              setTelegramUser(telegramUser);
              // Явно устанавливаем userId для немедленного использования
              setUserId(telegramUser.id);
              if (import.meta.env.DEV) {
                console.log('🔧 Telegram Mini Apps: userId set to:', telegramUser.id);
              }
            } else if (tg.initData) {
              // Если есть initData, но нет пользователя, это может быть продакшн
              if (import.meta.env.DEV) {
                console.log('🔧 Production mode: initData present but no user data');
                console.log('🔧 This is normal in production Telegram WebApp');
              }
              
              // В продакшне проверяем, может быть пользователь уже авторизован в store
              const currentTelegramUser = useAppStore.getState().telegramUser;
              const currentUserId = useAppStore.getState().userId;
              
              if (currentTelegramUser || (currentUserId && currentUserId > 0)) {
                if (import.meta.env.DEV) {
                  console.log('✅ User already authenticated in store, skipping auth block');
                }
                // Пользователь уже авторизован, не показываем блок авторизации
              } else {
                if (import.meta.env.DEV) {
                  console.log('ℹ️ User needs to authenticate in production mode');
                }
                
                // В Telegram Mini Apps пользователь может быть уже авторизован в Telegram
                // Пытаемся получить данные пользователя через Telegram WebApp
                try {
                  // В продакшн версии НЕ создаем временного пользователя
                  // Показываем блок авторизации для неавторизованных пользователей
                  if (import.meta.env.DEV) {
                    console.log('🔧 Production mode: user in Telegram Mini Apps, not showing auth block');
                  } else {
                    // В продакшн версии показываем блок авторизации
                    console.log('🔧 Production mode: showing auth block for unauthorized users');
                  }
                } catch (error) {
                  if (import.meta.env.DEV) {
                    console.warn('⚠️ Failed to create temporary user:', error);
                  }
                  // Показываем блок авторизации только если не удалось создать временного пользователя
                }
              }
            } else {
              // Случай 3: Нет initData - это может быть тестовый режим или ошибка
              if (import.meta.env.DEV) {
                console.log('🔧 Telegram Mini Apps detected but no initData');
                console.log('🔧 This might be a test environment or error');
              }
              
              // Проверяем, может быть пользователь уже авторизован в store
              const currentTelegramUser = useAppStore.getState().telegramUser;
              const currentUserId = useAppStore.getState().userId;
              
              if (currentTelegramUser || (currentUserId && currentUserId > 0)) {
                if (import.meta.env.DEV) {
                  console.log('✅ User already authenticated in store, skipping auth block');
                }
              } else {
                if (import.meta.env.DEV) {
                  console.log('ℹ️ User needs to authenticate - no Telegram data available');
                }
                
                // В Telegram Mini Apps попробуем создать временного пользователя
                if (tg.ready && tg.platform !== 'unknown') {
                  if (import.meta.env.DEV) {
                    console.log('🔧 Telegram WebApp is ready, creating temporary user');
                    
                    const tempTelegramUser = {
                      id: Date.now(), // Временный ID
                      first_name: 'Telegram User',
                      last_name: '',
                      username: '',
                      photo_url: '',
                      auth_date: Math.floor(Date.now() / 1000),
                      hash: 'telegram_mini_apps_temp_hash',
                    };
                    
                    console.log('🔧 Temporary user created for no initData case:', tempTelegramUser);
                    setTelegramUser(tempTelegramUser);
                    setUserId(tempTelegramUser.id);
                    
                    // В Telegram Mini Apps не показываем блок авторизации
                    console.log('🔧 Telegram Mini Apps: user created, not showing auth block');
                  } else {
                    // В продакшн версии не создаем временного пользователя
                    console.log('🔧 Production mode: not creating temporary user, showing auth block');
                  }
                } else {
                  if (import.meta.env.DEV) {
                    console.log('🔧 Telegram WebApp not ready, showing auth block');
                  } else {
                    console.log('🔧 Production mode: Telegram WebApp not ready, showing auth block');
                  }
                  // Показываем блок авторизации
                }
              }
            }
          } else {
            if (import.meta.env.DEV) {
              console.log('🔧 No Telegram Mini Apps environment detected');
            }
            
            // Загружаем сохраненного пользователя Telegram из localStorage только если нет Telegram WebApp и тестового аккаунта
            const savedTelegramUser = loadTelegramUser();
            if (savedTelegramUser) {
              if (import.meta.env.DEV) {
                console.log('Загружен сохраненный пользователь Telegram:', savedTelegramUser);
              }
              // Используем setTelegramUser который автоматически установит userId
              setTelegramUser(savedTelegramUser);
              // Явно устанавливаем userId для немедленного использования
              setUserId(savedTelegramUser.id);
              if (import.meta.env.DEV) {
                console.log('🔧 Saved user: userId set to:', savedTelegramUser.id);
              }
            } else {
              if (import.meta.env.DEV) {
                console.log('Нет сохраненного пользователя Telegram');
              }
              // В продакшне не создаем локального пользователя
              if (import.meta.env.DEV) {
                // В development режиме можно создать локального пользователя для тестирования
                console.log('Development mode: можно создать локального пользователя');
              } else {
                if (import.meta.env.DEV) {
                  console.log('Production mode: не создаем локального пользователя');
                } else {
                  console.log('🔧 Production mode: не создаем локального пользователя, показываем блок авторизации');
                }
              }
              setUserId(0);
            }
          }
        } else {
          // Очищаем флаги выхода
          sessionStorage.removeItem('just_logged_out');
          sessionStorage.removeItem('logout_timestamp');
          if (import.meta.env.DEV) {
            console.log('User recently logged out, not loading Telegram data');
          }

          // Принудительно очищаем данные пользователя из store и localStorage
          setTelegramUser(null);
          setUserId(0);
          localStorage.removeItem('Super Mock-storage');
          localStorage.removeItem('telegram_user');
          
          // В продакшене не создаем локального пользователя
          if (!import.meta.env.DEV) {
            if (import.meta.env.DEV) {
              console.log('Production mode: очищаем все данные пользователя');
            }
            setRole(null);
            setProfession(null);
          }
        }

        setIsLanguageDetected(true);
              } catch (error) {
          if (import.meta.env.DEV) {
            console.error('App initialization error:', error);
          }
          // Fallback на русский
          saveAndApplyLanguage('ru', i18n, setLanguage);
          setIsLanguageDetected(true);
        }
    }

    initializeApp();
  }, [i18n, setLanguage]);

  // Отслеживаем изменения в store для отладки (только в development)
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🔍 Index: Store state changed:', {
        userId,
        telegramUser,
        hasTelegramUser: !!telegramUser,
        timestamp: new Date().toISOString()
      });
      
      // Если userId изменился на положительное значение, логируем это
      if (userId && userId > 0) {
        console.log('✅ Index: userId successfully set to:', userId);
      }
      
      // Если telegramUser изменился, логируем это
      if (telegramUser) {
        console.log('✅ Index: telegramUser updated:', {
          id: telegramUser.id,
          first_name: telegramUser.first_name,
          username: telegramUser.username
        });
      }
    }
  }, [userId, telegramUser]);

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
    
    // В продакшене не перезагружаем страницу, просто очищаем состояние
    if (import.meta.env.DEV) {
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
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

  // Отладочная информация при рендере (только в development)
  if (import.meta.env.DEV) {
    console.log('🔍 Index: Rendering with state:', {
      telegramUser,
      userId,
      isLanguageDetected
    });
  }

  // Отладочная информация для продакшн версии
  if (import.meta.env.PROD) {
    console.log('🔍 Index PRODUCTION: Rendering with state:', {
      telegramUser: telegramUser ? { id: telegramUser.id, first_name: telegramUser.first_name, hash: telegramUser.hash } : null,
      userId,
      isLanguageDetected,
      hasTelegramUser: !!telegramUser,
      isInTelegramMiniApps: !!window.Telegram?.WebApp
    });
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
        
        {/* Telegram Mini Apps Status - скрыт в продакшене */}
        {import.meta.env.DEV && <TelegramMiniAppsStatus />}
        
        {/* Блок авторизации теперь находится в ProfileHeader */}
      </div>

      {/* Mobile Bottom Menu */}
      <MobileBottomMenu />
    </div>
  );
};

export default Index;
