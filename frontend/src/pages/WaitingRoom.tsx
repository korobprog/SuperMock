import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { apiGetSession } from '@/lib/api';

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

export function WaitingRoom() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { userId } = useAppStore();

  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeUntilStart, setTimeUntilStart] = useState<number>(0);
  const [canJoin, setCanJoin] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Проверяем авторизацию пользователя для этой сессии
  useEffect(() => {
    if (!sessionId || !userId) {
      setError('Недостаточно данных для доступа к сессии');
      setLoading(false);
      return;
    }

    const checkAuthorization = async () => {
      try {
        const sessionData = await apiGetSession(sessionId, userId?.toString());
        setSession(sessionData);

        // Проверяем, является ли пользователь участником сессии
        if (
          sessionData.interviewerUserId === userId?.toString() ||
          sessionData.candidateUserId === userId?.toString()
        ) {
          setIsAuthorized(true);
        } else {
          setError('У вас нет доступа к этой сессии');
        }
      } catch (err) {
        setError('Ошибка загрузки сессии');
        console.error('Error loading session:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAuthorization();
  }, [sessionId, userId]);

  // Таймер до начала интервью
  useEffect(() => {
    if (!session?.slotUtc) return;

    const updateTimer = () => {
      const now = new Date();
      const startTime = new Date(session.slotUtc);
      const timeDiff = startTime.getTime() - now.getTime();

      setTimeUntilStart(Math.max(0, timeDiff));

      // Можно войти за 5 минут до начала
      const canJoinTime = startTime.getTime() - 5 * 60 * 1000;
      setCanJoin(now.getTime() >= canJoinTime);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [session]);

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
      <div className="min-h-screen bg-gradient-to-b from-background to-telegram-light-gray flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка сессии...</p>
        </div>
      </div>
    );
  }

  if (error || !isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-telegram-light-gray flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle size={20} />
              Ошибка доступа
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate('/')} className="w-full">
              Вернуться на главную
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-telegram-light-gray flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle size={20} />
              Сессия не найдена
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Запрашиваемая сессия не существует или была удалена.
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              Вернуться на главную
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isInterviewer = session.interviewerUserId === userId?.toString();
  const role = isInterviewer ? 'Интервьюер' : 'Кандидат';

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-telegram-light-gray p-4">
      <div className="max-w-2xl mx-auto pt-16 sm:pt-20">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>

        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Users size={24} />
              Комната ожидания
            </CardTitle>
            <p className="text-muted-foreground">
              Ожидание начала мокового собеседования
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Информация о сессии */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-muted-foreground" />
                  <span className="text-sm font-medium">Время начала:</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatStartTime(session.slotUtc)}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-muted-foreground" />
                  <span className="text-sm font-medium">Ваша роль:</span>
                </div>
                <Badge variant={isInterviewer ? 'default' : 'secondary'}>
                  {role}
                </Badge>
              </div>
            </div>

            {/* Профессия и язык */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-sm font-medium">Профессия:</span>
                <p className="text-sm text-muted-foreground">
                  {session.profession || 'Не указана'}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">Язык:</span>
                <p className="text-sm text-muted-foreground">
                  {session.language || 'Не указан'}
                </p>
              </div>
            </div>

            {/* Таймер */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Clock size={20} className="text-muted-foreground" />
                <span className="text-lg font-medium">
                  {timeUntilStart > 0 ? 'До начала:' : 'Можно войти!'}
                </span>
              </div>

              {timeUntilStart > 0 && (
                <div className="text-3xl font-mono font-bold text-blue-600">
                  {formatTime(timeUntilStart)}
                </div>
              )}

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
                    Прогресс до возможности входа
                  </p>
                </div>
              )}
            </div>

            {/* Кнопки действий */}
            <div className="space-y-3">
              {canJoin ? (
                <Button
                  onClick={handleJoinInterview}
                  className="w-full h-12 text-lg"
                  size="lg"
                >
                  <Play size={20} className="mr-2" />
                  Войти в интервью
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
                    Войти досрочно (тест)
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Обычно вход возможен за 5 минут до начала
                  </p>
                </div>
              )}

              <Button
                onClick={() => navigate('/')}
                variant="ghost"
                className="w-full"
              >
                Вернуться на главную
              </Button>
            </div>

            {/* Статус сессии */}
            <div className="flex items-center justify-center gap-2">
              <CheckCircle size={16} className="text-green-500" />
              <span className="text-sm text-muted-foreground">
                Сессия активна и готова к началу
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
