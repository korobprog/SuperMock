import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Logo } from '@/components/ui/logo';
import {
  Clock,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle,
  Play,
  User,
  Star,
  Trophy,
  Target,
  Globe,
  Heart,
  Settings,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { apiGetSession } from '@/lib/api';
import { MediaTest } from '@/components/ui/media-test';
import { CompactChat } from '@/components/ui/compact-chat';
import { CompactLanguageSelector } from '@/components/ui/compact-language-selector';

interface SessionData {
  id: string;
  interviewerUserId: string;
  candidateUserId: string;
  profession: string;
  language: string;
  slotUtc: string;
  status: string;
  jitsiRoom: string;
}

interface Participant {
  id: string;
  name: string;
  photo_url?: string;
  role: 'interviewer' | 'candidate';
  profession: string;
  language: string;
  interviewsCompleted?: number;
  rating?: number;
  isOnline: boolean;
  waitingSince: string;
  telegramUser?: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
  };
}

export function DevWaitingRoom() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { userId } = useAppStore();

  const [session, setSession] = useState<SessionData | null>(null);
  const [timeUntilStart, setTimeUntilStart] = useState<number>(0);
  const [canJoin, setCanJoin] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMediaSettings, setShowMediaSettings] = useState(false);

  // Загружаем данные сессии и участников
  useEffect(() => {
    const loadSessionData = async () => {
      try {
        if (import.meta.env.DEV && !sessionId) {
          // DEV режим без sessionId - моковые данные
          const mockSession: SessionData = {
            id: 'dev-session-123',
            interviewerUserId: '123',
            candidateUserId: '456',
            profession: 'frontend',
            language: 'ru',
            slotUtc: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
            status: 'waiting',
            jitsiRoom: 'dev-room-123',
          };
          setSession(mockSession);

          // Моковые данные участников (только 2 - интервьюер и кандидат)
          const mockParticipants: Participant[] = [
            {
              id: '123',
              name: 'Алексей Петров',
              photo_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&backgroundColor=b6e3f4',
              role: 'interviewer',
              profession: 'frontend',
              language: 'ru',
              interviewsCompleted: 47,
              rating: 4.8,
              isOnline: true,
              waitingSince: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            },
            {
              id: '456',
              name: 'Мария Сидорова',
              photo_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria&backgroundColor=ffdfbf',
              role: 'candidate',
              profession: 'frontend',
              language: 'ru',
              interviewsCompleted: 12,
              rating: 4.2,
              isOnline: true,
              waitingSince: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
            },
          ];
          setParticipants(mockParticipants);
        } else if (sessionId && userId) {
          // PRODUCTION режим или DEV с sessionId - реальные данные из API
          const sessionData = await apiGetSession(sessionId, userId.toString());
          setSession(sessionData);

          // Создаём участников из данных сессии
          const realParticipants: Participant[] = [];
          
          if (sessionData.interviewerUserId && sessionData.interviewerUser) {
            const interviewerName = sessionData.interviewerUser.first_name || 'Интервьюер';
            const interviewerFullName = sessionData.interviewerUser.last_name 
              ? `${interviewerName} ${sessionData.interviewerUser.last_name}`
              : interviewerName;
            
            realParticipants.push({
              id: sessionData.interviewerUserId,
              name: interviewerFullName,
              photo_url: sessionData.interviewerUser.photo_url || undefined,
              role: 'interviewer',
              profession: sessionData.profession,
              language: sessionData.language,
              isOnline: true,
              waitingSince: sessionData.createdAt || new Date().toISOString(),
              telegramUser: sessionData.interviewerUser,
            });
          }

          if (sessionData.candidateUserId && sessionData.candidateUser) {
            const candidateName = sessionData.candidateUser.first_name || 'Кандидат';
            const candidateFullName = sessionData.candidateUser.last_name 
              ? `${candidateName} ${sessionData.candidateUser.last_name}`
              : candidateName;
            
            realParticipants.push({
              id: sessionData.candidateUserId,
              name: candidateFullName,
              photo_url: sessionData.candidateUser.photo_url || undefined,
              role: 'candidate',
              profession: sessionData.profession,
              language: sessionData.language,
              isOnline: true,
              waitingSince: sessionData.createdAt || new Date().toISOString(),
              telegramUser: sessionData.candidateUser,
            });
          }

          setParticipants(realParticipants);
        } else {
          // Нет sessionId или userId
          setError(t('waiting.errors.insufficientData'));
        }
      } catch (error) {
        console.error('Error loading session data:', error);
        setError(t('waiting.errors.loadError'));
      } finally {
        setLoading(false);
      }
    };

    loadSessionData();
  }, [sessionId, userId]);

  // Таймер до начала интервью
  useEffect(() => {
    if (!session?.slotUtc) return;

    const updateTimer = () => {
      const now = new Date();
      const startTime = new Date(session.slotUtc);
      const timeDiff = startTime.getTime() - now.getTime();

      // Показываем разницу времени (может быть отрицательной)
      setTimeUntilStart(timeDiff);

      // Можно войти за 5 минут до начала
      const canJoinTime = startTime.getTime() - 5 * 60 * 1000;
      setCanJoin(now.getTime() >= canJoinTime);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [session]);

  const formatTime = (ms: number) => {
    const isNegative = ms < 0;
    const absMs = Math.abs(ms);
    const hours = Math.floor(absMs / (1000 * 60 * 60));
    const minutes = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((absMs % (1000 * 60)) / 1000);

    const timeString = `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    return isNegative ? `-${timeString}` : timeString;
  };

  const formatStartTime = (slotUtc: string) => {
    return new Date(slotUtc).toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Moscow',
    });
  };

  const formatWaitingTime = (waitingSince: string) => {
    const now = new Date();
    const waitingTime = new Date(waitingSince);
    const diffMs = now.getTime() - waitingTime.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return t('notifications.justNow');
    if (diffMinutes < 60) return t('notifications.minutesAgo', { count: diffMinutes });
    
    const diffHours = Math.floor(diffMinutes / 60);
    return t('notifications.hoursAgo', { count: diffHours });
  };

  const formatRating = (rating: number) => {
    return rating.toFixed(1);
  };

  const getRoleLabel = (role: string) => {
    return role === 'interviewer' ? t('waiting.participants.interviewer') : t('waiting.participants.candidate');
  };

  const getRoleColor = (role: string) => {
    return role === 'interviewer' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';
  };

  const handleJoinInterview = () => {
    if (session) {
      navigate(`/interview?sessionId=${session.id}`);
    }
  };

  const handleJoinEarly = () => {
    if (session) {
      navigate(`/interview?sessionId=${session.id}&early=true`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-telegram-light-gray p-2 sm:p-4">
        <div className="max-w-2xl mx-auto pt-12 sm:pt-16 lg:pt-20">
          {/* Header with Logo and Language Selector */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex-1"></div>
            <Logo size="lg" clickable={true} />
            <div className="flex-1 flex justify-end">
              <CompactLanguageSelector />
            </div>
          </div>
          
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-muted-foreground">
                {import.meta.env.DEV ? t('waiting.loading.mockData') : t('waiting.loading.sessionData')}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-telegram-light-gray p-2 sm:p-4">
        <div className="max-w-2xl mx-auto pt-12 sm:pt-16 lg:pt-20">
          {/* Header with Logo and Language Selector */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex-1"></div>
            <Logo size="lg" clickable={true} />
            <div className="flex-1 flex justify-end">
              <CompactLanguageSelector />
            </div>
          </div>
          
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-red-500 mb-4">
                <AlertCircle size={48} className="mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-red-600 mb-2">{t('waiting.errors.title')}</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => navigate('/dev-test')} variant="outline">
                {t('waiting.actions.backToDevTest')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-telegram-light-gray p-2 sm:p-4">
        <div className="max-w-2xl mx-auto pt-12 sm:pt-16 lg:pt-20">
          {/* Header with Logo and Language Selector */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex-1"></div>
            <Logo size="lg" clickable={true} />
            <div className="flex-1 flex justify-end">
              <CompactLanguageSelector />
            </div>
          </div>
          
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-gray-500 mb-4">
                <AlertCircle size={48} className="mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">{t('waiting.errors.sessionNotFound')}</h3>
              <p className="text-muted-foreground mb-4">
                {t('waiting.errors.loadFailed')}
              </p>
              <Button onClick={() => navigate('/dev-test')} variant="outline">
                {t('waiting.actions.backToDevTest')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isInterviewer = session.interviewerUserId === userId?.toString();
  const role = isInterviewer ? t('waiting.participants.interviewer') : t('waiting.participants.candidate');

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-telegram-light-gray p-2 sm:p-4">
      <div className="max-w-2xl mx-auto pt-12 sm:pt-16 lg:pt-20">
        {/* Header with Logo and Language Selector */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex-1"></div>
          <Logo size="lg" clickable={true} />
          <div className="flex-1 flex justify-end">
            <CompactLanguageSelector />
          </div>
        </div>

        {/* Dev Badge */}
        <div className="flex justify-center mb-4">
          <Badge variant="destructive" className="text-xs">
            🧪 {t('waiting.devMode')}
          </Badge>
        </div>

        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Users size={24} />
              {t('waiting.waitingRoom')}
            </CardTitle>
            <p className="text-muted-foreground">
              {t('waiting.waitingForMock')}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Информация о сессии - компактная версия */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800/30">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                {/* Время и роль */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-blue-600" />
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">{t('waiting.sessionInfo.startTime')}</span>
                      <span className="text-sm font-medium text-foreground">
                        {formatStartTime(session.slotUtc)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-purple-600" />
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">{t('waiting.sessionInfo.yourRole')}</span>
                      <Badge variant={isInterviewer ? 'default' : 'secondary'} className="w-fit text-xs">
                        {role}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Профессия и язык */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                  <div className="flex items-center gap-2">
                    <Target size={16} className="text-green-600" />
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">{t('waiting.sessionInfo.profession')}</span>
                      <span className="text-sm font-medium text-foreground capitalize">
                        {session.profession || t('waiting.sessionInfo.notSpecified')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Globe size={16} className="text-orange-600" />
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">{t('waiting.sessionInfo.language')}</span>
                      <span className="text-sm font-medium text-foreground uppercase">
                        {session.language || t('waiting.sessionInfo.notSpecifiedLang')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Участники ожидания */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Users size={20} className="text-blue-600" />
                  {t('waiting.participants.title')}
                </h3>
                <Badge variant="outline" className="text-xs">
                  {participants.length}/2
                </Badge>
              </div>

              <div className="grid gap-3">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200"
                  >
                    {/* Аватарка */}
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white dark:border-gray-700 shadow-sm">
                        {participant.photo_url ? (
                          <img
                            src={participant.photo_url}
                            alt={participant.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                            onLoad={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.nextElementSibling?.classList.add('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-900 ${participant.photo_url ? 'hidden' : ''}`}>
                          <span className="text-lg font-semibold text-blue-600 dark:text-blue-300">
                            {participant.name && participant.name !== 'null' ? participant.name.charAt(0).toUpperCase() : 
                             participant.role === 'interviewer' ? 'И' : 'К'}
                          </span>
                        </div>
                      </div>
                      {/* Индикатор онлайн */}
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-700 ${
                        participant.isOnline ? 'bg-green-500' : 'bg-gray-400'
                      }`}></div>
                    </div>

                    {/* Информация о участнике */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">
                          {participant.name && participant.name !== 'null' ? participant.name : 
                           participant.role === 'interviewer' ? 'Интервьюер' : 'Кандидат'}
                        </h4>
                        <Badge className={`text-xs px-2 py-0.5 ${getRoleColor(participant.role)}`}>
                          {getRoleLabel(participant.role)}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Target size={12} />
                          {participant.profession}
                        </span>
                        {participant.interviewsCompleted && (
                          <span className="flex items-center gap-1">
                            <Trophy size={12} />
                            {participant.interviewsCompleted} {t('waiting.participants.interviews')}
                          </span>
                        )}
                        {participant.rating && (
                          <span className="flex items-center gap-1">
                            <Star size={12} className="text-yellow-500" />
                            {formatRating(participant.rating)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Время ожидания - скрыто на мобильных */}
                    <div className="hidden sm:block text-right">
                      <div className="text-xs text-muted-foreground">
                        {t('waiting.participants.waiting')}
                      </div>
                      <div className="text-xs font-medium">
                        {formatWaitingTime(participant.waitingSince)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Компактная статистика участников */}
              <div className="flex items-center justify-center gap-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    {participants.filter(p => p.role === 'interviewer').length} Интервьюер
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {participants.filter(p => p.role === 'candidate').length} Кандидат
                  </span>
                </div>
              </div>
            </div>

            {/* Таймер */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Clock size={20} className={timeUntilStart < 0 ? "text-red-500" : "text-muted-foreground"} />
                <span className={`text-lg font-medium ${timeUntilStart < 0 ? "text-red-600" : ""}`}>
                  {timeUntilStart > 0 ? t('waiting.timer.untilStart') : timeUntilStart < 0 ? t('waiting.timer.late') : t('waiting.timer.canEnter')}
                </span>
              </div>

              <div className={`text-3xl font-mono font-bold ${
                timeUntilStart > 0 ? 'text-blue-600' : 
                timeUntilStart < 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {formatTime(timeUntilStart)}
              </div>

              {/* Прогресс-бар */}
              {timeUntilStart > 0 && (
                <div className="space-y-2">
                  <Progress
                    value={Math.max(
                      0,
                      100 - (timeUntilStart / (5 * 60 * 1000)) * 100
                    )}
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('waiting.timer.progress')}
                  </p>
                </div>
              )}

              {/* Сообщение об опоздании */}
              {timeUntilStart < 0 && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {t('waiting.timer.lateWarning')}
                  </p>
                </div>
              )}
            </div>

            {/* Чат участников */}
            {(() => {
              const chatParticipants = participants.map(p => ({
                id: p.id,
                name: p.name,
                role: p.role,
              }));
              const chatCurrentUserId = userId?.toString() || participants[0]?.id || '123';
              
              console.log('🔍 Chat Debug Info:');
              console.log('📋 participants:', chatParticipants);
              console.log('🆔 currentUserId:', chatCurrentUserId);
              console.log('🆔 userId from store:', userId);
              console.log('🆔 first participant id:', participants[0]?.id);
              
              return (
                <CompactChat
                  sessionId={session.id}
                  participants={chatParticipants}
                  currentUserId={chatCurrentUserId}
                />
              );
            })()}

            {/* Правила уважения и этикета */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800/30">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                    <Heart size={16} className="text-amber-600" />
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                      {t('waiting.rules.title')}
                    </h4>
                    <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">
                      {t('waiting.rules.important')}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span className="text-amber-700 dark:text-amber-300">
                        {t('waiting.rules.bePolite')}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span className="text-amber-700 dark:text-amber-300">
                        {t('waiting.rules.dontInterrupt')}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span className="text-amber-700 dark:text-amber-300">
                        {t('waiting.rules.askQuestions')}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span className="text-amber-700 dark:text-amber-300">
                        {t('waiting.rules.giveFeedback')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-amber-200 dark:border-amber-800/30">
                    <p className="text-xs text-amber-600 dark:text-amber-400 italic">
                      💡 {t('waiting.rules.goal')}
                    </p>
                    
                    {/* Советы для конкретной роли */}
                    <div className="mt-2 p-2 bg-amber-100/50 dark:bg-amber-900/20 rounded-md">
                      <p className="text-xs font-medium text-amber-800 dark:text-amber-200 mb-1">
                        {isInterviewer ? `💼 ${t('waiting.rules.interviewerTips')}` : `👤 ${t('waiting.rules.candidateTips')}`}
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        {isInterviewer 
                          ? t('waiting.rules.interviewerAdvice')
                          : t('waiting.rules.candidateAdvice')
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Кнопки действий */}
            <div className="space-y-3">
              {/* Кнопка настроек медиа */}
              <Button
                onClick={() => setShowMediaSettings(!showMediaSettings)}
                variant="outline"
                className="w-full"
              >
                <Settings size={16} className="mr-2" />
                {showMediaSettings ? t('waiting.actions.hideSettings') : t('waiting.actions.mediaSettings')}
              </Button>

              {/* Настройки медиа */}
              {showMediaSettings && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                  <MediaTest />
                </div>
              )}

              {canJoin ? (
                <Button
                  onClick={handleJoinInterview}
                  className={`w-full h-12 text-lg ${
                    timeUntilStart < 0 ? 'bg-red-600 hover:bg-red-700' : ''
                  }`}
                  size="lg"
                >
                  <Play size={20} className="mr-2" />
                  {timeUntilStart < 0 ? t('waiting.actions.joinLate') : t('waiting.actions.joinInterview')}
                </Button>
              ) : (
                <div className="space-y-2">
                  <Button
                    onClick={handleJoinEarly}
                    className="w-full h-12 text-lg"
                    size="lg"
                    variant="outline"
                  >
                    <Play size={20} className="mr-2" />
                    {t('waiting.actions.enterEarly')}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    {timeUntilStart < 0 
                      ? t('waiting.actions.lateInfo') 
                      : t('waiting.actions.earlyInfo')
                    }
                  </p>
                </div>
              )}

              <Button
                onClick={() => navigate('/dev-test')}
                variant="ghost"
                className="w-full"
              >
                {t('waiting.actions.backToDevTest')}
              </Button>
            </div>

            {/* Статус сессии */}
            <div className="flex items-center justify-center gap-2">
              <CheckCircle size={16} className="text-green-500" />
              <span className="text-sm text-muted-foreground">
                {t('waiting.status.active')}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
