import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Logo } from '@/components/ui/logo';
import { useNavigate } from 'react-router-dom';
import { apiDevSeed, apiDevCleanup, apiDevStatus } from '@/lib/api';

type DevStatus = {
  ok: boolean;
  candidateId: number;
  interviewerId: number;
  candidateQueues: unknown[];
  interviewerQueues: unknown[];
  sessions: unknown[];
  notifications: unknown[];
  error?: string;
};

export default function DevTest() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<DevStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const s = await apiDevStatus();
      setStatus(s);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Status failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const seedBoth = async () => {
    setLoading(true);
    setError(null);
    try {
      await apiDevSeed({ time: '09:00', join: 'both' });
      await refresh();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Seed failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const seedCandidateOnly = async () => {
    setLoading(true);
    setError(null);
    try {
      await apiDevSeed({ time: '09:00', join: 'candidate' });
      await refresh();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Seed failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const seedInterviewerOnly = async () => {
    setLoading(true);
    setError(null);
    try {
      await apiDevSeed({ time: '09:00', join: 'interviewer' });
      await refresh();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Seed failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const cleanup = async () => {
    setLoading(true);
    setError(null);
    try {
      await apiDevCleanup();
      await refresh();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Cleanup failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-telegram-light-gray p-4">
      <div className="max-w-4xl mx-auto pt-16 sm:pt-20 space-y-4">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo size="lg" clickable={true} />
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Dev тестирование</h1>
          <Button variant="outline" size="sm" onClick={() => navigate('/')}>
            Назад
          </Button>
        </div>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={refresh}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                Обновить статус
              </Button>
              <Button onClick={seedBoth} disabled={loading} size="sm">
                Сид: оба в очереди
              </Button>
              <Button
                onClick={seedCandidateOnly}
                disabled={loading}
                size="sm"
                variant="secondary"
              >
                Сид: только кандидат
              </Button>
              <Button
                onClick={seedInterviewerOnly}
                disabled={loading}
                size="sm"
                variant="secondary"
              >
                Сид: только int.
              </Button>
              <Button
                onClick={cleanup}
                disabled={loading}
                size="sm"
                variant="destructive"
              >
                Очистить
              </Button>
            </div>

            {/* Кнопки для тестирования страниц */}
            <div className="flex gap-2 flex-wrap pt-2 border-t">
              <Button
                onClick={() => navigate('/dev-waiting')}
                size="sm"
                variant="outline"
                className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
              >
                🕐 Редактировать страницу ожидания
              </Button>
              <Button
                onClick={() => navigate('/notifications')}
                size="sm"
                variant="outline"
                className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
              >
                🔔 Тестировать уведомления
              </Button>
              <Button
                onClick={() => navigate('/time')}
                size="sm"
                variant="outline"
                className="bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700"
              >
                ⏰ Тестировать выбор времени
              </Button>
            </div>

            {error && (
              <div className="text-sm text-red-600">Ошибка: {error}</div>
            )}
            {status && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Сессии</h3>
                  <pre className="text-xs p-2 bg-card rounded border overflow-auto max-h-64">
                    {JSON.stringify(status.sessions, null, 2)}
                  </pre>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Очереди</h3>
                  <pre className="text-xs p-2 bg-card rounded border overflow-auto max-h-64">
                    {JSON.stringify(
                      {
                        candidate: status.candidateQueues,
                        interviewer: status.interviewerQueues,
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
                <div className="md:col-span-2">
                  <h3 className="font-medium mb-2">Уведомления</h3>
                  <pre className="text-xs p-2 bg-card rounded border overflow-auto max-h-64">
                    {JSON.stringify(status.notifications, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
