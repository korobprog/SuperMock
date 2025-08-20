import { useAppStore } from '@/lib/store';
import { loadTelegramUser, clearTelegramUser } from '@/lib/telegram-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AuthTest() {
  const { telegramUser, setTelegramUser, userId } = useAppStore();

  const handleTestLoad = () => {
    const savedUser = loadTelegramUser();
    console.log('Manual load test:', savedUser);
    if (savedUser) {
      setTelegramUser(savedUser);
    }
  };

  const handleTestClear = () => {
    clearTelegramUser();
    setTelegramUser(null);
    console.log('Cleared telegram user');
  };

  const handleCreateTestUser = () => {
    const testUser = {
      id: 999999999,
      first_name: 'Test',
      last_name: 'User',
      username: 'testuser',
      photo_url: '',
      auth_date: Math.floor(Date.now() / 1000),
      hash: 'test_hash_123',
    };
    
    localStorage.setItem('telegram_user', JSON.stringify(testUser));
    setTelegramUser(testUser);
    console.log('Created test user:', testUser);
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-sm">Auth Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-xs space-y-1">
          <p>userId: {userId || 'null'}</p>
          <p>telegramUser: {telegramUser ? JSON.stringify(telegramUser, null, 2) : 'null'}</p>
          <p>localStorage telegram_user: {localStorage.getItem('telegram_user') || 'null'}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" onClick={handleTestLoad}>
            Load from LS
          </Button>
          <Button size="sm" onClick={handleTestClear} variant="outline">
            Clear
          </Button>
          <Button size="sm" onClick={handleCreateTestUser} variant="secondary">
            Create Test User
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}