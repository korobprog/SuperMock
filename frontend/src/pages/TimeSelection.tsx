import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { InfoPanel } from '@/components/ui/info-panel';
import { InfoCarousel } from '@/components/ui/info-carousel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Logo } from '@/components/ui/logo';
import {
  ArrowLeft,
  Clock,
  AlarmClock,
  HelpCircle,
  Info,
  Star,
  Target,
  Users,
} from 'lucide-react';
import { useAppTranslation } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { useHapticFeedback } from '@/lib/haptic-feedback';
import {
  apiSavePreferences,
  apiJoinSlot,
  apiGetSlots,
  apiSaveUserTools,
} from '@/lib/api';
import { DateTime } from 'luxon';

// Генерируем слоты для 24 часов (00:00 - 23:00)
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 0; hour < 24; hour++) {
    const timeString = `${hour.toString().padStart(2, '0')}:00`;
    slots.push({
      id: timeString,
      time: timeString,
      available: true, // Все слоты доступны по умолчанию
    });
  }
  return slots;
};

// Типы для анализа данных
interface SlotAnalysis {
  time: string;
  candidateCount: number;
  interviewerCount: number;
  load: number;
  recommendation: 'high' | 'medium' | 'low';
}

export function TimeSelection() {
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const userId = useAppStore((s) => s.userId);
  const role = useAppStore((s) => s.role);
  const [mode, setMode] = useState<'candidate' | 'interviewer'>(
    (role || 'candidate') as 'candidate' | 'interviewer'
  );
  const profession = useAppStore((s) => s.profession);
  const language = useAppStore((s) => s.language);
  const selectedTools = useAppStore((s) => s.selectedTools);
  const setSession = useAppStore((s) => s.setSession);
  const navigate = useNavigate();
  const { t } = useAppTranslation();
  const { light, success, warning, error } = useHapticFeedback();
  const [slotCounts, setSlotCounts] = useState<Record<string, number>>({});
  const [candidateCounts, setCandidateCounts] = useState<
    Record<string, number>
  >({});
  const [interviewerCounts, setInterviewerCounts] = useState<
    Record<string, number>
  >({});
  const [showInfo, setShowInfo] = useState(() => {
    // Проверяем localStorage при инициализации
    return localStorage.getItem('timeSelectionInfoClosed') !== 'true';
  });
  const [showInfoCarousel, setShowInfoCarousel] = useState(() => {
    // Проверяем localStorage при инициализации - используем правильный ключ для попапа обучения
    return localStorage.getItem('timeSelectionHelpClosed') !== 'true';
  });
  const [isInfoCollapsed, setIsInfoCollapsed] = useState(() => {
    // Проверяем localStorage при инициализации
    return localStorage.getItem('timeSelectionInfoCollapsed') === 'true';
  });
  const [timeUpdateTrigger, setTimeUpdateTrigger] = useState(0);
  const [hasSeenIntro, setHasSeenIntro] = useState(false);

  // Memoize timezone to prevent re-renders
  const timezone = useMemo(() => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }, []);

  // Функции конвертации локального времени в UTC с использованием luxon
  const convertLocalToUTC = (localTime: string) => {
    const [hours, minutes] = localTime.split(':').map(Number);
    
    // Создаем дату в локальном времени пользователя
    const localDate = DateTime.now().setZone(timezone);
    const slotDate = localDate.set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });
    
    // Конвертируем в UTC
    const utcDate = slotDate.toUTC();
    
    return utcDate.toFormat('HH:mm');
  };

  const getUTCTimeForSlot = (localTime: string) => {
    return convertLocalToUTC(localTime);
  };

  // Функция для конвертации UTC времени обратно в локальное для отображения
  const convertUTCToLocal = (utcTime: string) => {
    const [hours, minutes] = utcTime.split(':').map(Number);
    
    // Создаем дату в UTC
    const utcDate = DateTime.utc().set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });
    
    // Конвертируем в локальное время пользователя
    const localDate = utcDate.setZone(timezone);
    
    return localDate.toFormat('HH:mm');
  };

  // Функция для создания правильного UTC слота из локального времени
  const createUTCSlotFromLocal = (localTime: string) => {
    const [hours, minutes] = localTime.split(':').map(Number);
    
    // Создаем дату в локальном времени пользователя
    const localDate = DateTime.now().setZone(timezone);
    const slotDate = localDate.set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });
    
    // Конвертируем в UTC и возвращаем ISO строку
    const utcDate = slotDate.toUTC();
    
    return utcDate.toISO();
  };

  // Генерируем слоты и фильтруем прошедшее время
  const timeSlots = useMemo(() => {
    const allSlots = generateTimeSlots();
    const now = new Date();
    
    // Используем локальное время для фильтрации, чтобы пользователи видели актуальные слоты
    const currentHour = now.getHours();
    
    // Фильтруем слоты, которые еще не прошли по локальному времени
    return allSlots.filter((slot) => {
      const slotHour = parseInt(slot.time.split(':')[0]);
      return slotHour > currentHour;
    });
  }, []);

  // Анализ слотов и рекомендации
  const slotAnalysis = useMemo((): SlotAnalysis[] => {
    return timeSlots.map((slot) => {
      const candidateCount = candidateCounts[slot.time] || 0;
      const interviewerCount = interviewerCounts[slot.time] || 0;

      // Определяем загрузку слота
      const totalUsers = candidateCount + interviewerCount;
      const load = totalUsers === 0 ? 0 : Math.round((totalUsers / 10) * 100); // Предполагаем макс 10 пользователей

      // Определяем рекомендацию на основе баланса и времени
      let recommendation: 'high' | 'medium' | 'low' = 'medium';

      if (mode === 'candidate') {
        // Для кандидатов ищем слоты с большим количеством int.
        if (interviewerCount >= 2 && candidateCount <= 1) {
          recommendation = 'high';
        } else if (interviewerCount === 0 || candidateCount >= 3) {
          recommendation = 'low';
        }
      } else {
        // Для int. ищем слоты с большим количеством кандидатов
        if (candidateCount >= 2 && interviewerCount <= 1) {
          recommendation = 'high';
        } else if (candidateCount === 0 || interviewerCount >= 3) {
          recommendation = 'low';
        }
      }

      return {
        time: slot.time,
        candidateCount,
        interviewerCount,
        load,
        recommendation,
      };
    });
  }, [timeSlots, candidateCounts, interviewerCounts, mode]);

  // Улучшенная логика выбора рекомендуемого слота
  const recommendedSlot = useMemo(() => {
    if (slotAnalysis.length === 0) return null;

    const now = new Date();
    const currentHour = now.getHours(); // Используем локальное время

    // Определяем оптимальные временные окна для разных ролей
    const getOptimalTimeWindows = () => {
      if (mode === 'candidate') {
        // Кандидаты предпочитают утренние и дневные часы
        return [
          { start: 9, end: 12, weight: 1.5 }, // Утро - высокий приоритет
          { start: 13, end: 17, weight: 1.2 }, // День - средний приоритет
          { start: 18, end: 21, weight: 1.0 }, // Вечер - обычный приоритет
        ];
      } else {
        // int. более гибкие, но предпочитают рабочие часы
        return [
          { start: 10, end: 16, weight: 1.3 }, // Рабочие часы - высокий приоритет
          { start: 9, end: 10, weight: 1.1 }, // Раннее утро
          { start: 16, end: 20, weight: 1.0 }, // Поздний день
        ];
      }
    };

    const optimalWindows = getOptimalTimeWindows();

    // Фильтруем слоты по времени суток и рекомендациям
    const highRecommendations = slotAnalysis.filter(
      (s) => s.recommendation === 'high'
    );

    const mediumRecommendations = slotAnalysis.filter(
      (s) => s.recommendation === 'medium'
    );

    // Функция для расчета приоритета слота
    const calculateSlotPriority = (slot: SlotAnalysis) => {
      const slotHour = parseInt(slot.time.split(':')[0]);

      // Базовый приоритет по рекомендации
      let priority =
        slot.recommendation === 'high'
          ? 100
          : slot.recommendation === 'medium'
          ? 50
          : 10;

      // Бонус за оптимальное время
      for (const window of optimalWindows) {
        if (slotHour >= window.start && slotHour <= window.end) {
          priority *= window.weight;
          break;
        }
      }

      // Бонус за близость к текущему времени (но не слишком близко)
      const timeDiff = Math.abs(slotHour - currentHour);
      if (timeDiff >= 1 && timeDiff <= 3) {
        priority *= 1.2; // Бонус за ближайшие 1-3 часа
      } else if (timeDiff === 0) {
        priority *= 0.5; // Штраф за текущий час
      }

      // Бонус за количество доступных партнеров
      if (mode === 'candidate') {
        priority += slot.interviewerCount * 10;
      } else {
        priority += slot.candidateCount * 10;
      }

      return priority;
    };

    // Приоритет 1: Высокие рекомендации в ближайшие 2 часа
    const nearHighSlots = highRecommendations.filter((s) => {
      const slotHour = parseInt(s.time.split(':')[0]);
      return slotHour >= currentHour && slotHour <= currentHour + 2;
    });

    if (nearHighSlots.length > 0) {
      return nearHighSlots.sort(
        (a, b) => calculateSlotPriority(b) - calculateSlotPriority(a)
      )[0];
    }

    // Приоритет 2: Любые высокие рекомендации
    if (highRecommendations.length > 0) {
      return highRecommendations.sort(
        (a, b) => calculateSlotPriority(b) - calculateSlotPriority(a)
      )[0];
    }

    // Приоритет 3: Средние рекомендации в ближайшие 3 часа
    const nearMediumSlots = mediumRecommendations.filter((s) => {
      const slotHour = parseInt(s.time.split(':')[0]);
      return slotHour >= currentHour && slotHour <= currentHour + 3;
    });

    if (nearMediumSlots.length > 0) {
      return nearMediumSlots.sort(
        (a, b) => calculateSlotPriority(b) - calculateSlotPriority(a)
      )[0];
    }

    // Приоритет 4: Любые средние рекомендации
    if (mediumRecommendations.length > 0) {
      return mediumRecommendations.sort(
        (a, b) => calculateSlotPriority(b) - calculateSlotPriority(a)
      )[0];
    }

    // Приоритет 5: Первый доступный слот в ближайшее время
    const nearSlots = slotAnalysis.filter((s) => {
      const slotHour = parseInt(s.time.split(':')[0]);
      return slotHour >= currentHour && slotHour <= currentHour + 4;
    });

    if (nearSlots.length > 0) {
      return nearSlots.sort(
        (a, b) => calculateSlotPriority(b) - calculateSlotPriority(a)
      )[0];
    }

    return slotAnalysis[0]; // Возвращаем первый доступный слот
  }, [slotAnalysis, mode]);

  // Автоматически показываем информационное окно при первом посещении для конкретного пользователя
  useEffect(() => {
    const storageKey = userId
      ? `timeSelectionIntroSeen:${userId}`
      : 'timeSelectionIntroSeen:guest';
    const alreadySeen = localStorage.getItem(storageKey) === 'true';
    if (!alreadySeen && !hasSeenIntro) {
      const timer = setTimeout(() => {
        setShowInfoCarousel(true);
        setHasSeenIntro(true);
        localStorage.setItem(storageKey, 'true');
        success(); // Haptic feedback для приветствия
      }, 1000); // Задержка 1 секунда после загрузки страницы

      return () => clearTimeout(timer);
    }
  }, [hasSeenIntro, userId]);

  // Автоматически выбираем рекомендуемый слот при загрузке или изменении режима
  useEffect(() => {
    if (recommendedSlot && selectedSlots.length === 0) {
      setSelectedSlots([recommendedSlot.time]);
      success(); // Вибрация успеха при автоматическом выборе
    }
  }, [recommendedSlot, selectedSlots.length]);

  // Автоматическое обновление времени до матчинга каждую минуту
  useEffect(() => {
    if (selectedSlots.length > 0) {
      const interval = setInterval(() => {
        setTimeUpdateTrigger((prev) => prev + 1);
      }, 60000); // Обновляем каждую минуту

      return () => clearInterval(interval);
    }
  }, [selectedSlots.length]);

  // Load slot counts by role
  const loadCounts = useCallback(async () => {
    // Создаем дату в локальном времени пользователя для правильного определения дня
    const localDate = DateTime.now().setZone(timezone).toFormat('yyyy-MM-dd');

    try {
      // Загружаем данные для кандидатов
      const candidateRes = await apiGetSlots({
        role: 'candidate',
        profession: profession || undefined,
        language: language || undefined,
        timezone,
        date: localDate,
      });

      // Загружаем данные для int.
      const interviewerRes = await apiGetSlots({
        role: 'interviewer',
        profession: profession || undefined,
        language: language || undefined,
        timezone,
        date: localDate,
      });

      const candidateMap: Record<string, number> = {};
      const interviewerMap: Record<string, number> = {};

      // Конвертируем UTC времена обратно в локальное время для отображения
      for (const s of candidateRes.slots) {
        const localTime = convertUTCToLocal(s.time);
        candidateMap[localTime] = s.count;
      }
      
      for (const s of interviewerRes.slots) {
        const localTime = convertUTCToLocal(s.time);
        interviewerMap[localTime] = s.count;
      }

      setCandidateCounts(candidateMap);
      setInterviewerCounts(interviewerMap);

      // Устанавливаем данные для текущего режима
      if (mode === 'candidate') {
        setSlotCounts(interviewerMap);
      } else {
        setSlotCounts(candidateMap);
      }
    } catch (error) {
      console.error('Failed to load slot counts:', error);
    }
  }, [mode, profession, language, timezone, convertUTCToLocal]);

  // reload on mode/profession/language/timezone changes
  useEffect(() => {
    loadCounts().catch(() => {});
  }, [loadCounts]);

  const handleSlotToggle = (slotId: string) => {
    light(); // Легкая вибрация при выборе слота
    setSelectedSlots([slotId]); // Выбираем только один слот
  };

  const handleNext = async () => {
    if (!userId) {
      error(); // Вибрация ошибки
      return;
    }
    if (selectedSlots.length === 0) {
      warning(); // Вибрация предупреждения
      return;
    }

    const slotsUtc = selectedSlots.map((s) => {
      // Используем правильную функцию конвертации локального времени в UTC
      return createUTCSlotFromLocal(s);
    });

    try {
      const effectiveRole = (mode || 'candidate') as
        | 'interviewer'
        | 'candidate';
      const effectiveProfession = profession || 'frontend';

      // Сохраняем предпочтения
      await apiSavePreferences({
        userId,
        role: effectiveRole,
        profession: effectiveProfession,
        language: language || 'ru',
        slotsUtc,
      });

      // Сохраняем инструменты, если они выбраны
      if (selectedTools.length > 0 && profession) {
        try {
          await apiSaveUserTools({
            userId,
            profession,
            tools: selectedTools,
          });
        } catch (toolsError) {
          console.warn('Failed to save tools:', toolsError);
          // Не прерываем процесс, если сохранение инструментов не удалось
        }
      }

      // Join first selected slot queue immediately; server will attempt auto-match
      const join = await apiJoinSlot({
        userId,
        role: effectiveRole,
        profession: effectiveProfession,
        language: language || 'ru',
        slotUtc: slotsUtc[0],
        tools: selectedTools.length > 0 ? selectedTools : undefined,
      });
      if (join.matched && join.session) {
        success(); // Вибрация успеха при успешном матчинге
        setSession({
          sessionId: join.session.id,
          jitsiRoom: join.session.jitsiRoom,
        });
        navigate('/interview');
      } else {
        light(); // Легкая вибрация при переходе в очередь
        // Stay in queue and show notifications page so user can see status
        navigate('/notifications');
      }
    } catch (err) {
      error(); // Вибрация ошибки при проблемах
      console.error('Failed to proceed from time selection:', err);
      alert(t('common.error') || 'Произошла ошибка. Попробуйте еще раз.');
    }
  };

  const handleBack = () => {
    light(); // Легкая вибрация при возврате
    // Если выбраны инструменты, возвращаемся к их выбору
    if (selectedTools.length > 0) {
      navigate('/tools');
    } else {
      navigate('/language');
    }
  };

  const handleRoleToggle = (newMode: 'candidate' | 'interviewer') => {
    light(); // Легкая вибрация при переключении роли
    setMode(newMode);
  };

  // Функция для сброса состояния введения (для тестирования)
  const resetIntro = () => {
    localStorage.removeItem('timeSelectionIntroSeen');
    localStorage.removeItem('timeSelectionInfoClosed');
    localStorage.removeItem('timeSelectionInfoCollapsed');
    localStorage.removeItem('timeSelectionHelpClosed');
    setHasSeenIntro(false);
    setShowInfo(true);
    setIsInfoCollapsed(false);
    setShowInfoCarousel(true);
  };

  // Функция для отладки конвертации времени
  const debugTimeConversion = () => {
    if (selectedSlots.length === 0) return;
    
    const localTime = selectedSlots[0];
    const utcTime = getUTCTimeForSlot(localTime);
    const utcSlot = createUTCSlotFromLocal(localTime);
    const backToLocal = convertUTCToLocal(utcTime);
    
    console.log('🔍 Time Conversion Debug:');
    console.log('Local time:', localTime);
    console.log('UTC time:', utcTime);
    console.log('UTC slot ISO:', utcSlot);
    console.log('Back to local:', backToLocal);
    console.log('Timezone:', timezone);
    console.log('Current timezone offset:', DateTime.now().setZone(timezone).offset / 60, 'hours');
    console.log('Current local time:', DateTime.now().setZone(timezone).toFormat('HH:mm'));
    console.log('Current UTC time:', DateTime.now().toUTC().toFormat('HH:mm'));
  };

  // Функция для расчета времени до выбранного матчинга
  const getTimeUntilMatch = () => {
    if (selectedSlots.length === 0) return null;

    // Используем trigger для принудительного пересчета
    const _ = timeUpdateTrigger; // Принудительно используем переменную

    const selectedTime = selectedSlots[0];
    const [hours, minutes] = selectedTime.split(':').map(Number);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const matchTime = new Date(
      today.getTime() + hours * 60 * 60 * 1000 + minutes * 60 * 1000
    );

    // Если время уже прошло сегодня, считаем на завтра
    if (matchTime <= now) {
      matchTime.setDate(matchTime.getDate() + 1);
    }

    const diffMs = matchTime.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 24) {
      const days = Math.floor(diffHours / 24);
      const remainingHours = diffHours % 24;
      return `${days}д ${remainingHours}ч ${diffMinutes}м`;
    } else if (diffHours > 0) {
      return `${diffHours}ч ${diffMinutes}м`;
    } else {
      return `${diffMinutes}м`;
    }
  };

  const currentDate = new Date().toISOString().slice(0, 10);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-telegram-light-gray p-4 pb-32">
      <div className="max-w-md mx-auto pt-16 sm:pt-20">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo size="lg" clickable={true} />
        </div>

        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="mr-3 p-2"
          >
            <ArrowLeft size={22} />
          </Button>
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold text-foreground">
              {t('time.header.title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('time.header.subtitle')}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowInfoCarousel(true)}
            className="ml-3 p-2"
          >
            <HelpCircle size={22} />
          </Button>
          {process.env.NODE_ENV === 'development' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={debugTimeConversion}
              className="ml-2 p-2"
              title="Debug time conversion"
            >
              <Info size={22} />
            </Button>
          )}
        </div>

        <p className="text-center text-muted-foreground mb-6">
          {t('time.timeSubtitle')}
        </p>

        {/* Timezone Info */}
        <div className="flex items-center justify-center mb-6 p-3 bg-telegram-light-gray rounded-lg">
          <Clock size={16} className="mr-2 text-telegram-gray" />
          <span className="text-sm text-telegram-gray">
            {t('time.timezone')}: {timezone}
          </span>
          {selectedSlots.length > 0 && (
            <div className="ml-4 text-xs text-telegram-gray">
              UTC: {getUTCTimeForSlot(selectedSlots[0])}
            </div>
          )}
        </div>

        {/* Role Toggle */}
        <div className="mb-8 flex items-center justify-between">
          <div className="text-sm font-medium">{t('time.header.role')}</div>
          <div className="flex gap-3">
            <button
              className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                mode === 'candidate'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border hover:bg-accent'
              }`}
              onClick={() => handleRoleToggle('candidate')}
            >
              {t('role.candidateShort')}
            </button>
            <button
              className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                mode === 'interviewer'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border hover:bg-accent'
              }`}
              onClick={() => handleRoleToggle('interviewer')}
            >
              {t('role.interviewerShort')}
            </button>
          </div>
        </div>

        {/* Информационное окно */}
        {showInfo && (
          <div className="mb-8">
            <InfoPanel
              mode={mode}
              candidateCounts={candidateCounts}
              interviewerCounts={interviewerCounts}
              recommendedSlot={recommendedSlot}
              onClose={() => {
                setShowInfo(false);
                // Сохраняем состояние закрытия и сворачивания
                localStorage.setItem('timeSelectionInfoClosed', 'true');
                localStorage.setItem(
                  'timeSelectionInfoCollapsed',
                  isInfoCollapsed.toString()
                );
              }}
              isCollapsed={isInfoCollapsed}
              onToggleCollapse={() => {
                const newCollapsedState = !isInfoCollapsed;
                setIsInfoCollapsed(newCollapsedState);
                localStorage.setItem(
                  'timeSelectionInfoCollapsed',
                  newCollapsedState.toString()
                );
                light(); // Haptic feedback при сворачивании/разворачивании
              }}
              timeUntilMatch={getTimeUntilMatch()}
              selectedSlots={selectedSlots}
              getUTCTimeForSlot={getUTCTimeForSlot}
            />
          </div>
        )}

        {/* Tabs for different views */}
        <Tabs
          defaultValue={selectedTools.length > 0 ? 'smart' : 'all'}
          className="mb-8"
        >
          <TabsList className="grid w-full grid-cols-2 p-1 mb-6">
            <TabsTrigger value="smart" className="flex items-center gap-2 py-3">
              <Target className="h-5 w-5" />{t('time.tabs.withTools')}
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2 py-3">
              <Users className="h-5 w-5" />
              {t('time.tabs.allSlots')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="smart" className="space-y-6 pt-4">
            {selectedTools.length > 0 ? (
              <div>
                <h3 className="text-sm font-medium text-foreground mb-4">
                  {mode === 'candidate'
                    ? t('time.slots.availableSlotsInterviewers')
                    : t('time.slots.availableSlotsCandidates')}
                </h3>
                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                  {timeSlots.map((slot) => {
                    const count = slotCounts[slot.time] || 0;
                    const isSelected = selectedSlots.includes(slot.time);
                    const isRecommended = recommendedSlot?.time === slot.time;

                    return (
                      <button
                        key={slot.id}
                        onClick={() => handleSlotToggle(slot.id)}
                        className={`p-3 sm:p-4 lg:p-5 rounded-xl border-2 transition-all duration-200 group min-h-[70px] sm:min-h-[80px] lg:min-h-[90px] hover:scale-105 active:scale-95 ${
                          isSelected
                            ? 'bg-primary text-primary-foreground border-primary shadow-lg'
                            : isRecommended
                            ? 'bg-green-50 border-green-300 hover:bg-green-100 shadow-md'
                            : 'bg-card border-border hover:bg-accent shadow-sm'
                        } ${isRecommended ? 'ring-2 ring-green-200' : ''}`}
                      >
                        <div className="text-center flex flex-col justify-center h-full space-y-1 sm:space-y-2">
                          <div className="text-sm sm:text-base lg:text-lg xl:text-xl font-semibold group-hover:text-black">
                            {slot.time}
                          </div>
                          <div
                            className={`text-xs sm:text-sm lg:text-base ${
                              isSelected
                                ? 'text-black'
                                : 'text-muted-foreground group-hover:text-black'
                            }`}
                          >
                            {count}{' '}
                            <span className="hidden sm:inline">
                              {mode === 'candidate'
                                ? t('role.interviewer')
                                : t('role.candidate')}
                            </span>
                            <span className="sm:hidden">
                              {mode === 'candidate'
                                ? t('time.slots.interviewersShort')
                                : t('time.slots.candidatesShort')}
                            </span>
                          </div>
                          {isRecommended && (
                            <div className="mt-1 sm:mt-2 flex justify-center">
                              <div className="flex items-center gap-1 text-xs bg-green-100 text-green-800 border border-green-300 rounded-lg px-2 py-1">
                                <Star size={10} className="fill-green-600" />
                                <span className="hidden sm:inline">
                                  {t('time.slots.recommended')}
                                </span>
                                <span className="sm:hidden">{t('time.slots.recommendedShort')}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">
                  {t('time.toolsRequired.title')}
                </h3>
                <p className="text-sm">
                  {t('time.toolsRequired.description')}
                </p>
                <Button
                  onClick={() => navigate('/tools')}
                  className="mt-4"
                  variant="outline"
                >
                  {t('time.toolsRequired.selectTools')}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-6 pt-4">
            {/* Информация о фильтрации */}
            {selectedTools.length > 0 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-8">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-2">
                      {t('tools.allSlotsToolsSaved')}
                    </p>
                    <p>
                      {t('time.allSlotsDescription')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Все слоты - используем старую логику */}
            <div className="mt-8">
              <h3 className="text-sm font-medium text-foreground mb-4">
                {mode === 'candidate'
                  ? t('time.slots.availableSlotsInterviewers')
                  : t('time.slots.availableSlotsCandidates')}
              </h3>
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                {timeSlots.map((slot) => {
                  const count = slotCounts[slot.time] || 0;
                  const isSelected = selectedSlots.includes(slot.time);
                  const isRecommended = recommendedSlot?.time === slot.time;

                  return (
                    <button
                      key={slot.id}
                      onClick={() => handleSlotToggle(slot.id)}
                      className={`p-3 sm:p-4 lg:p-5 rounded-xl border-2 transition-all duration-200 group min-h-[70px] sm:min-h-[80px] lg:min-h-[90px] hover:scale-105 active:scale-95 ${
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary shadow-lg'
                          : isRecommended
                          ? 'bg-green-50 border-green-300 hover:bg-green-100 shadow-md'
                          : 'bg-card border-border hover:bg-accent shadow-sm'
                      } ${isRecommended ? 'ring-2 ring-green-200' : ''}`}
                    >
                      <div className="text-center flex flex-col justify-center h-full space-y-1 sm:space-y-2">
                        <div className="text-sm sm:text-base lg:text-lg xl:text-xl font-semibold group-hover:text-black">
                          {slot.time}
                        </div>
                        <div
                          className={`text-xs sm:text-sm lg:text-base ${
                            isSelected
                              ? 'text-black'
                              : 'text-muted-foreground group-hover:text-black'
                          }`}
                        >
                          {count}{' '}
                          <span className="hidden sm:inline">
                            {mode === 'candidate'
                              ? t('role.interviewer')
                              : t('role.candidate')}
                          </span>
                          <span className="sm:hidden">
                            {mode === 'candidate'
                              ? t('time.slots.interviewersShort')
                              : t('time.slots.candidatesShort')}
                          </span>
                        </div>
                        {isRecommended && (
                          <div className="mt-1 sm:mt-2 flex justify-center">
                            <div className="flex items-center gap-1 text-xs bg-green-100 text-green-800 border border-green-300 rounded-lg px-2 py-1">
                              <Star size={10} className="fill-green-600" />
                                                              <span className="hidden sm:inline">
                                  {t('time.slots.recommended')}
                                </span>
                                <span className="sm:hidden">{t('time.slots.recommendedShort')}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Selected Slot Info with Tools */}
        {/* The selectedSlotWithTools state and its related UI are removed as per the edit hint. */}

        {/* Next Button - Fixed at bottom */}
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 z-50">
          <div className="flex flex-col sm:flex-row gap-4 max-w-4xl mx-auto">
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1 py-3"
            >
              <ArrowLeft size={18} className="mr-2" />
              {t('time.buttons.back')}
            </Button>
            <Button
              onClick={handleNext}
              disabled={selectedSlots.length === 0}
              className="flex-1 py-3"
            >
              {selectedSlots.length > 0 ? (
                <>
                  <span className="hidden sm:inline">
                    {t('time.buttons.continueAt')} {selectedSlots[0]}
                  </span>
                  <span className="sm:hidden">
                    {t('time.buttons.continue')} {selectedSlots[0]}
                  </span>
                  <AlarmClock size={18} className="ml-2" />
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">
                    {t('time.buttons.selectTime')}
                  </span>
                  <span className="sm:hidden">{t('time.buttons.selectTime')}</span>
                  <Clock size={18} className="ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
      <InfoCarousel
        isOpen={showInfoCarousel}
        onClose={() => {
          setShowInfoCarousel(false);
          localStorage.setItem('timeSelectionHelpClosed', 'true');
        }}
        mode={mode}
      />
    </div>
  );
}
