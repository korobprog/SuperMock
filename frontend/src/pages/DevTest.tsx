import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/ui/logo';
import { useNavigate } from 'react-router-dom';
import { apiDevSeed, apiDevCleanup, apiDevStatus } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getDevInfo, devLog } from '@/lib/dev-utils';
import { DevTestAccounts } from '@/components/ui/dev-test-accounts';

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
  
  // Get user data from store
  const { telegramUser, userId, demoMode, setDemoMode } = useAppStore();

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
    devLog('DevTest page loaded');
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
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Dev тестирование</h1>
            <p className="text-sm text-muted-foreground">Страница только для разработки</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/')}>
            Назад
          </Button>
        </div>

        {/* Test Accounts */}
        <DevTestAccounts />

        {/* Debug Info Card */}
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              🐛 Debug Info
              <Badge variant="secondary" className="text-xs">
                DEV ONLY
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Telegram User Info */}
            <div>
              <h4 className="font-medium text-sm mb-2">Telegram User:</h4>
              <pre className="text-xs p-3 bg-white rounded border overflow-auto max-h-32">
                {telegramUser ? JSON.stringify(telegramUser, null, 2) : 'null'}
              </pre>
            </div>
            
            <Separator />
            
            {/* User ID */}
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">User ID:</span>
              <Badge variant={userId ? "default" : "secondary"}>
                {userId || 'Not set'}
              </Badge>
            </div>
            
            {/* Demo Mode */}
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Demo Mode:</span>
              <div className="flex items-center gap-2">
                <Badge variant={demoMode ? "destructive" : "default"}>
                  {demoMode ? '1' : '0'}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDemoMode(!demoMode)}
                  className="text-xs"
                >
                  {demoMode ? 'Отключить' : 'Включить'}
                </Button>
              </div>
            </div>
            
            {/* Environment Info */}
            <Separator />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Environment:</span>
                <Badge variant="outline" className="ml-2">
                  {import.meta.env.MODE}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Base URL:</span>
                <span className="text-muted-foreground ml-2">
                  {import.meta.env.VITE_API_BASE_URL || 'Not set'}
                </span>
              </div>
            </div>
            
            {/* Additional Dev Info */}
            {getDevInfo() && (
              <div className="mt-2">
                <h4 className="font-medium text-sm mb-2">Additional Info:</h4>
                <pre className="text-xs p-2 bg-white rounded border overflow-auto max-h-24">
                  {JSON.stringify(getDevInfo(), null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Testing Controls */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">🧪 Тестирование</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Database Controls */}
            <div>
              <h4 className="font-medium text-sm mb-2">База данных:</h4>
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={refresh}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                >
                  🔄 Обновить статус
                </Button>
                <Button onClick={seedBoth} disabled={loading} size="sm">
                  🌱 Сид: оба в очереди
                </Button>
                <Button
                  onClick={seedCandidateOnly}
                  disabled={loading}
                  size="sm"
                  variant="secondary"
                >
                  👤 Сид: только кандидат
                </Button>
                <Button
                  onClick={seedInterviewerOnly}
                  disabled={loading}
                  size="sm"
                  variant="secondary"
                >
                  👨‍💼 Сид: только интервьюер
                </Button>
                <Button
                  onClick={cleanup}
                  disabled={loading}
                  size="sm"
                  variant="destructive"
                >
                  🗑️ Очистить
                </Button>
              </div>
            </div>

            <Separator />

            {/* Page Testing */}
            <div>
              <h4 className="font-medium text-sm mb-2">Тестирование страниц:</h4>
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => navigate('/dev-waiting')}
                  size="sm"
                  variant="outline"
                  className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                >
                  🕐 Страница ожидания
                </Button>
                <Button
                  onClick={() => navigate('/notifications')}
                  size="sm"
                  variant="outline"
                  className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
                >
                  🔔 Уведомления
                </Button>
                <Button
                  onClick={() => navigate('/time')}
                  size="sm"
                  variant="outline"
                  className="bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700"
                >
                  ⏰ Выбор времени
                </Button>
                <Button
                  onClick={() => navigate('/interview')}
                  size="sm"
                  variant="outline"
                  className="bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700"
                >
                  🎥 Интервью
                </Button>
                <Button
                  onClick={() => navigate('/profile')}
                  size="sm"
                  variant="outline"
                  className="bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700"
                >
                  👤 Профиль
                </Button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
                ❌ Ошибка: {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Display */}
        {status && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">📊 Статус системы</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
