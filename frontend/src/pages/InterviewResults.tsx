import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/lib/store';
import { apiGetSession } from '@/lib/api';
import { InterviewResults } from '@/components/ui/interview-results';
import { ArrowLeft, Home } from 'lucide-react';

export function InterviewResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('sessionId');
  const userId = useAppStore((s) => s.userId);
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId || !userId) {
      setError('Отсутствуют необходимые параметры');
      setLoading(false);
      return;
    }

    loadSessionData();
  }, [sessionId, userId]);

  const loadSessionData = async () => {
    try {
      const data = await apiGetSession(sessionId!, userId!.toString());
      
      // Проверяем авторизацию пользователя
      if (
        data.interviewerUserId === userId?.toString() ||
        data.candidateUserId === userId?.toString()
      ) {
        setSessionData(data);
      } else {
        setError('У вас нет доступа к этой сессии');
      }
    } catch (error) {
      console.error('Error loading session data:', error);
      setError('Ошибка загрузки данных сессии');
    } finally {
      setLoading(false);
    }
  };

  const determineRole = () => {
    if (!sessionData || !userId) return 'candidate';
    return sessionData.interviewerUserId === userId.toString() ? 'interviewer' : 'candidate';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка результатов...</p>
        </div>
      </div>
    );
  }

  if (error || !sessionData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-destructive">
              Ошибка
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              {error || 'Не удалось загрузить данные сессии'}
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => navigate('/')} variant="outline">
                <Home className="w-4 h-4 mr-2" />
                На главную
              </Button>
              <Button onClick={() => navigate(-1)} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Назад
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const role = determineRole();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/')}
                variant="ghost"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                На главную
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Результаты интервью</h1>
                <p className="text-sm text-muted-foreground">
                  Сессия #{sessionData.id.slice(0, 8)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Ваша роль:
              </span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                role === 'interviewer' 
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              }`}>
                {role === 'interviewer' ? 'Интервьюер' : 'Кандидат'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <InterviewResults
            sessionId={sessionId!}
            role={role}
          />
        </div>
      </div>
    </div>
  );
}
