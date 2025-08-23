import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { InfoPanel } from '@/components/ui/info-panel';
import { InfoCarousel } from '@/components/ui/info-carousel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Logo } from '@/components/ui/logo';
import { CompactLanguageSelector } from '@/components/ui/compact-language-selector';

import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Clock,
  AlarmClock,
  HelpCircle,
  Info,
  Star,
  Target,
  Users,
  MapPin,
} from 'lucide-react';
import { useAppTranslation } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';

// Функция для сокращения названий ролей в карточках слотов
const getShortRoleName = (role: string, t: any) => {
  switch (role) {
    case 'interviewer':
      return t('role.interviewerShort');
    case 'candidate':
      return t('role.candidateShort');
    default:
      return role;
  }
};

// Функция для получения оптимального названия роли в зависимости от доступного места
const getOptimalRoleName = (role: string, t: any, isMobile: boolean = false) => {
  if (isMobile) {
    // На мобильных устройствах всегда используем короткие версии
    return getShortRoleName(role, t);
  }
  
  // На десктопе используем короткие версии для экономии места в карточках
  return getShortRoleName(role, t);
};
import { useHapticFeedback } from '@/lib/haptic-feedback';
import {
  apiSavePreferences,
  apiJoinSlot,
  apiGetEnhancedSlots,
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
  localTime?: string; // Локальное время для отображения
  utcTime?: string; // UTC время для отображения
}

// Интерфейс для информации о часовом поясе
interface TimezoneInfo {
  name: string;
  offset: string;
  currentTime: string;
  utcTime: string;
}

export function TimeSelection() {
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const userId = useAppStore((s) => s.userId);
  const role = useAppStore((s) => s.role);
  const lastRole = useAppStore((s) => s.lastRole);
  const telegramUser = useAppStore((s) => s.telegramUser);
  
  // Отладочная информация для lastRole
  useEffect(() => {
    console.log('TimeSelection - Current role:', role);
    console.log('TimeSelection - Last role:', lastRole);
  }, [role, lastRole]);
  const setRole = useAppStore((s) => s.setRole);
  // Используем role из store напрямую, а не локальное состояние
  const mode = (role || 'candidate') as 'candidate' | 'interviewer';
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

  const [showAllTools, setShowAllTools] = useState(false);
  const [isSessionInfoCollapsed, setIsSessionInfoCollapsed] = useState(() => {
    // По умолчанию свернуто
    return localStorage.getItem('timeSelectionSessionInfoCollapsed') !== 'false';
  });

  // Сбрасываем состояние показа всех инструментов при изменении списка инструментов
  useEffect(() => {
    setShowAllTools(false);
  }, [selectedTools]);

  // Memoize timezone to prevent re-renders
  const timezone = useMemo(() => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }, []);

  // Информация о часовом поясе пользователя
  const timezoneInfo = useMemo((): TimezoneInfo => {
    const now = DateTime.now();
    const localTime = now.setZone(timezone);
    const utcTime = now.toUTC();
    
    const offsetHours = localTime.offset / 60;
    const offsetString = offsetHours >= 0 
      ? `+${offsetHours.toString().padStart(2, '0')}:00`
      : `${offsetHours.toString().padStart(3, '0')}:00`;

    return {
      name: timezone,
      offset: offsetString,
      currentTime: localTime.toFormat('HH:mm'),
      utcTime: utcTime.toFormat('HH:mm'),
    };
  }, [timezone]);

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

  // Функция для отображения инструментов с многоточием
  const renderToolsWithEllipsis = () => {
    if (selectedTools.length === 0) {
      return t('tools.toolsNotSelected');
    }
    
    if (selectedTools.length <= 3) {
      return selectedTools.join(', ');
    }
    
    if (showAllTools) {
      return (
        <span>
          {selectedTools.join(', ')}
          <button
            onClick={() => setShowAllTools(false)}
            className="text-blue-600 hover:text-blue-800 ml-1 cursor-pointer"
            title={t('time.sessionInfo.collapseTools')}
          >
            ({t('time.sessionInfo.collapse')})
          </button>
        </span>
      );
    }
    
    const firstThree = selectedTools.slice(0, 3).join(', ');
    return (
      <span>
        {firstThree}
        <button
          onClick={() => setShowAllTools(true)}
          className="text-blue-600 hover:text-blue-800 ml-1 cursor-pointer"
                      title={t('time.sessionInfo.showAllTools')}
        >
          ...
        </button>
      </span>
    );
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
    
    // Используем локальное время для фильтрации, чтобы пользователь видел актуальные слоты
    const now = DateTime.now().setZone(timezone);
    const currentLocalHour = now.hour;
    
    // Фильтруем слоты, которые еще не прошли по локальному времени пользователя
    return allSlots.filter((slot) => {
      const slotHour = parseInt(slot.time.split(':')[0]);
      return slotHour > currentLocalHour;
    });
  }, [timezone]);

  // Анализ слотов и рекомендации с добавлением информации о времени
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

      // Добавляем информацию о времени
      const localTime = slot.time;
      const utcTime = convertLocalToUTC(slot.time);

      return {
        time: slot.time,
        candidateCount,
        interviewerCount,
        load,
        recommendation,
        localTime,
        utcTime,
      };
    });
  }, [timeSlots, candidateCounts, interviewerCounts, mode, convertLocalToUTC]);

  // Улучшенная логика выбора рекомендуемого слота
  const recommendedSlot = useMemo(() => {
    if (slotAnalysis.length === 0) return null;

    // Используем локальное время для консистентности
    const now = DateTime.now().setZone(timezone);
    const currentHour = now.hour;

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
  }, [slotAnalysis, mode, timezone]);

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
    console.log(`🔄 Загрузка данных для режима: ${mode}`);
    console.log(`🌍 Текущий часовой пояс: ${timezone}`);
    console.log(`🕐 Текущее время в ${timezone}: ${DateTime.now().setZone(timezone).toFormat('yyyy-MM-dd HH:mm:ss')}`);
    console.log(`🕐 Текущее время UTC: ${DateTime.now().toUTC().toFormat('yyyy-MM-dd HH:mm:ss')}`);
    
    // Создаем дату в локальном времени пользователя для правильного определения дня
    const localDate = DateTime.now().setZone(timezone).toFormat('yyyy-MM-dd');

    try {
      // Загружаем данные для кандидатов
      console.log(`🔍 Запрос для кандидатов:`, {
        role: 'candidate',
        profession: profession || undefined,
        language: language || undefined,
        timezone,
        date: localDate,
      });
      
      const candidateRes = await apiGetEnhancedSlots({
        role: 'candidate',
        profession: profession || undefined,
        language: language || undefined,
        timezone,
        date: localDate,
      });

      console.log(`🔍 Запрос для интервьюеров:`, {
        role: 'interviewer',
        profession: profession || undefined,
        language: language || undefined,
        timezone,
        date: localDate,
      });
      
      // Загружаем данные для интервьюеров
      const interviewerRes = await apiGetEnhancedSlots({
        role: 'interviewer',
        profession: profession || undefined,
        language: language || undefined,
        timezone,
        date: localDate,
      });

      const candidateMap: Record<string, number> = {};
      const interviewerMap: Record<string, number> = {};

      // Enhanced API уже возвращает локальное время
      console.log(`📡 API ответ для кандидатов:`, candidateRes.slots);
      console.log(`📡 API ответ для интервьюеров:`, interviewerRes.slots);
      console.log(`📊 Количество слотов кандидатов:`, candidateRes.slots.length);
      console.log(`📊 Количество слотов интервьюеров:`, interviewerRes.slots.length);
      
      for (const s of candidateRes.slots) {
        candidateMap[s.time] = s.count;
        console.log(`📊 Кандидат слот ${s.time}: ${s.count}`);
      }
      
      for (const s of interviewerRes.slots) {
        interviewerMap[s.time] = s.count;
        console.log(`📊 Интервьюер слот ${s.time}: ${s.count}`);
      }
      
      console.log(`📋 Итоговый candidateMap:`, candidateMap);
      console.log(`📋 Итоговый interviewerMap:`, interviewerMap);

      setCandidateCounts(candidateMap);
      setInterviewerCounts(interviewerMap);

      // Устанавливаем данные для текущего режима
      if (mode === 'candidate') {
        console.log(`📊 Устанавливаем данные для кандидата: показываем ${Object.keys(interviewerMap).length} слотов с интервьюерами`);
        console.log(`📋 Детали слотов для кандидата:`, interviewerMap);
        setSlotCounts(interviewerMap);
      } else {
        console.log(`📊 Устанавливаем данные для интервьюера: показываем ${Object.keys(candidateMap).length} слотов с кандидатами`);
        console.log(`📋 Детали слотов для интервьюера:`, candidateMap);
        setSlotCounts(candidateMap);
      }
    } catch (error) {
      console.error('Failed to load slot counts:', error);
    }
  }, [mode, profession, language, timezone]);

  // reload on mode/profession/language/timezone changes
  useEffect(() => {
    loadCounts().catch(() => {});
  }, [mode, profession, language, timezone]);

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

      // Показываем плейсхолдер поиска только для интервьюеров
      if (effectiveRole === 'interviewer') {
        setIsSearching(true);
      }

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
      
      // Всегда сохраняем информацию о сессии, если она есть
      if (join.session) {
        setSession({
          sessionId: join.session.id,
          jitsiRoom: join.session.jitsiRoom,
        });
      }
      
      // Ждём 3 секунды только для интервьюеров, чтобы показать красивый плейсхолдер
      if (effectiveRole === 'interviewer') {
        await new Promise(resolve => setTimeout(resolve, 3000));
        setIsSearching(false);
      }
      
      // Перенаправляем на страницу уведомлений
      light(); // Легкая вибрация при переходе в очередь
      navigate('/notifications');
    } catch (err) {
      // Скрываем плейсхолдер в случае ошибки
      setIsSearching(false);
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
    console.log(`🔄 Переключение роли: ${mode} -> ${newMode}`);
    setRole(newMode); // Обновляем глобальное состояние
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
    if (selectedSlots.length === 0) {
      alert('Выберите слот времени для отладки конвертации');
      return;
    }
    
    const localTime = selectedSlots[0];
    const utcTime = getUTCTimeForSlot(localTime);
    const utcSlot = createUTCSlotFromLocal(localTime);
    const backToLocal = convertUTCToLocal(utcTime);
    
    const debugInfo = `
🔍 Отладка конвертации времени:

📍 Ваш часовой пояс: ${timezoneInfo.name} (${timezoneInfo.offset})
🕐 Текущее время: ${timezoneInfo.currentTime} (локальное) / ${timezoneInfo.utcTime} (UTC)

🎯 Выбранный слот:
   • Локальное время: ${localTime}
   • UTC время: ${utcTime}
   • UTC слот (ISO): ${utcSlot}
   • Обратная конвертация: ${backToLocal}

🌍 Примеры для других часовых поясов:
   • Москва (UTC+3): ${convertUTCToLocal(utcTime)}
   • Владивосток (UTC+10): ${DateTime.utc().set({ hour: parseInt(utcTime.split(':')[0]), minute: parseInt(utcTime.split(':')[1]) }).setZone('Asia/Vladivostok').toFormat('HH:mm')}
   • Нью-Йорк (UTC-5): ${DateTime.utc().set({ hour: parseInt(utcTime.split(':')[0]), minute: parseInt(utcTime.split(':')[1]) }).setZone('America/New_York').toFormat('HH:mm')}
   • Лондон (UTC+0): ${utcTime}
    `;
    
    console.log(debugInfo);
    alert(debugInfo);
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

  // Компонент поиска участника
  const SearchParticipantOverlay = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl">
        <div className="text-center space-y-6">
          {/* Анимированные точки */}
          <div className="flex justify-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          
          {/* Иконка поиска */}
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-ping">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            </div>
          </div>
          
          {/* Текст */}
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              {t('time.searching.title')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {t('time.searching.subtitle')}
            </p>
          </div>
          
          {/* Прогресс бар */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-telegram-light-gray p-4 pb-32">
      {/* Показываем оверлей поиска, если isSearching = true */}
      {isSearching && <SearchParticipantOverlay />}
      <div className="max-w-md mx-auto pt-16 sm:pt-20">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo size="lg" clickable={true} />
        </div>

        {/* Header */}
        <div className="flex items-center mb-8">
          {/* Показываем кнопку "Назад" только если нет сохранённых инструментов */}
          {selectedTools.length === 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="mr-3 p-2"
            >
              <ArrowLeft size={22} />
            </Button>
          )}
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold text-foreground">
              {t('time.header.title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('time.header.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <CompactLanguageSelector />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInfoCarousel(true)}
              className="p-2"
            >
              <HelpCircle size={22} />
            </Button>
          </div>
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



        {/* Session Info */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
            {/* Header with collapse button */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Clock size={14} className="text-blue-600" />
                </div>
                <h3 className="text-sm font-semibold text-blue-700">{t('time.sessionInfo.title')}</h3>
              </div>
              <button
                onClick={() => {
                  const newCollapsedState = !isSessionInfoCollapsed;
                  setIsSessionInfoCollapsed(newCollapsedState);
                  localStorage.setItem('timeSelectionSessionInfoCollapsed', newCollapsedState.toString());
                }}
                className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                title={isSessionInfoCollapsed ? t('time.sessionInfo.expand') : t('time.sessionInfo.collapse')}
              >
                {isSessionInfoCollapsed ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronUp size={16} />
                )}
              </button>
            </div>

            {/* Collapsed state - minimal info */}
            {isSessionInfoCollapsed ? (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-blue-100 rounded flex items-center justify-center">
                      <Clock size={10} className="text-blue-600" />
                    </div>
                    <span className="text-blue-800">
                      {language === 'ru' ? 'Русский' : language === 'en' ? 'English' : language === 'de' ? 'Deutsch' : language === 'fr' ? 'Français' : language === 'es' ? 'Español' : language === 'zh' ? '中文' : language}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-green-100 rounded flex items-center justify-center">
                      <Target size={10} className="text-green-600" />
                    </div>
                    <span className="text-green-800">
                      {selectedTools.length > 0 
                        ? t('time.sessionInfo.toolsCount', { count: selectedTools.length })
                        : t('time.sessionInfo.toolsNotSelected')
                      }
                    </span>
                  </div>
                  {lastRole && (
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 bg-purple-100 rounded flex items-center justify-center">
                        <Users size={10} className="text-purple-600" />
                      </div>
                      <span className="text-purple-800">
                        {lastRole === 'candidate' ? t('role.candidateShort') : t('role.interviewerShort')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Expanded state - full info */
              <div className="grid grid-cols-1 gap-3">
                {/* Language */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center hover:bg-blue-200 transition-colors duration-200">
                    <Clock size={16} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-blue-600 font-medium">Язык собеседования</div>
                    <div className="text-sm font-semibold text-gray-800">
                      {language === 'ru' ? 'Русский' : language === 'en' ? 'English' : language === 'de' ? 'Deutsch' : language === 'fr' ? 'Français' : language === 'es' ? 'Español' : language === 'zh' ? '中文' : language}
                    </div>
                  </div>
                </div>

                {/* Tools */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center hover:bg-green-200 transition-colors duration-200">
                    <Target size={16} className="text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-green-600 font-medium">Ваши инструменты</div>
                    <div className="text-sm font-semibold text-gray-800">
                      {renderToolsWithEllipsis()}
                    </div>
                  </div>
                </div>

                {/* Role */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center hover:bg-purple-200 transition-colors duration-200">
                    <Users size={16} className="text-purple-600" />
                  </div>
                  <div className="flex-1">
                    {lastRole ? (
                      <>
                        <div className="text-xs text-purple-600 font-medium">Прошлая роль</div>
                        <div className="text-sm font-semibold text-gray-800">
                          {lastRole === 'candidate' ? t('role.candidateShort') : t('role.interviewerShort')}
                        </div>
                        <div className="mt-1">
                          <div className="text-xs text-blue-600 font-medium">Рекомендация</div>
                          <div className="text-sm font-semibold text-blue-700">
                            {lastRole === 'candidate' ? t('role.interviewerShort') : t('role.candidateShort')}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-xs text-purple-600 font-medium">Выберите роль</div>
                        <div className="text-sm font-semibold text-gray-800">
                          {mode === 'candidate' ? t('role.candidateShort') : t('role.interviewerShort')}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
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

        {/* Time Selection Question */}
        <div className="mb-8">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {t('time.timeSubtitle')}
            </h2>
            <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
          </div>
        </div>

        {/* Role Toggle */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4 shadow-sm">
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users size={14} className="text-purple-600" />
                </div>
                <h3 className="text-sm font-semibold text-purple-700">{t('time.header.role')}</h3>
              </div>
              <p className="text-xs text-purple-600">{t('time.roleSelection.subtitle')}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                className={`relative p-4 rounded-xl border-2 transition-all duration-200 group hover:scale-105 active:scale-95 ${
                  mode === 'candidate'
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-500 shadow-lg'
                    : 'bg-white border-purple-200 hover:border-purple-300 hover:bg-purple-50 shadow-sm'
                }`}
                onClick={() => handleRoleToggle('candidate')}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden ${
                    mode === 'candidate' ? 'bg-blue-400' : 'bg-blue-100'
                  }`}>
                    {telegramUser?.photo_url ? (
                      <img 
                        src={telegramUser.photo_url} 
                        alt="User avatar" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Если изображение не загрузилось, показываем иконку по умолчанию
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <Users 
                      size={18} 
                      className={`${mode === 'candidate' ? 'text-white' : 'text-blue-600'} ${
                        telegramUser?.photo_url ? 'hidden' : ''
                      }`} 
                    />
                  </div>
                  <div className="text-center">
                    <div className={`font-semibold text-sm ${
                      mode === 'candidate' ? 'text-white' : 'text-gray-800'
                    }`}>
                      {t('role.candidate')}
                    </div>
                    <div className={`text-xs mt-1 ${
                      mode === 'candidate' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {t('role.candidateAction')}
                    </div>
                  </div>
                </div>
                {mode === 'candidate' && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
              
              <button
                className={`relative p-4 rounded-xl border-2 transition-all duration-200 group hover:scale-105 active:scale-95 ${
                  mode === 'interviewer'
                    ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white border-purple-500 shadow-lg'
                    : 'bg-white border-purple-200 hover:border-purple-300 hover:bg-purple-50 shadow-sm'
                }`}
                onClick={() => handleRoleToggle('interviewer')}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    mode === 'interviewer' ? 'bg-purple-400' : 'bg-purple-100'
                  }`}>
                    <Users size={18} className={mode === 'interviewer' ? 'text-white' : 'text-purple-600'} />
                  </div>
                  <div className="text-center">
                    <div className={`font-semibold text-sm ${
                      mode === 'interviewer' ? 'text-white' : 'text-gray-800'
                    }`}>
                      {t('role.interviewer')}
                    </div>
                    <div className={`text-xs mt-1 ${
                      mode === 'interviewer' ? 'text-purple-100' : 'text-gray-500'
                    }`}>
                      {t('role.interviewerAction')}
                    </div>
                  </div>
                </div>
                {mode === 'interviewer' && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

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
                                ? getOptimalRoleName('interviewer', t)
                                : getOptimalRoleName('candidate', t)}
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
                  
                  // Отладочная информация для всех слотов
                  console.log(`🔍 Отладка слота ${slot.time}:`, {
                    slotTime: slot.time,
                    slotCounts: slotCounts,
                    count: count,
                    mode: mode,
                    interviewerCounts: interviewerCounts,
                    candidateCounts: candidateCounts,
                    allSlotTimes: Object.keys(slotCounts),
                    interviewerSlotTimes: Object.keys(interviewerCounts),
                    candidateSlotTimes: Object.keys(candidateCounts)
                  });

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
                            ? getOptimalRoleName('interviewer', t)
                            : getOptimalRoleName('candidate', t)}
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
        <div className="fixed bottom-0 left-0 right-0 bg-background/30 backdrop-blur-sm border-t border-border p-4 z-50">
          <div className={`flex flex-col sm:flex-row gap-4 max-w-4xl mx-auto ${selectedTools.length > 0 ? 'justify-center' : ''}`}>
            {/* Показываем кнопку "Назад" только если нет сохранённых инструментов */}
            {selectedTools.length === 0 && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1 py-3"
              >
                <ArrowLeft size={18} className="mr-2" />
                {t('time.buttons.back')}
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={selectedSlots.length === 0}
              className={`py-3 ${selectedTools.length > 0 ? 'flex-1' : 'flex-1'}`}
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
