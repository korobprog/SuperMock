import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/lib/store';
import {
  getDevTestAccounts,
  getActiveDevTestAccount,
  applyDevTestAccount,
  clearDevTestAccount,
  isDevTestAccountsEnabled,
  generateRandomDevTestAccount,
  type DevTestAccount,
} from '@/lib/dev-test-account';
import { devLog } from '@/lib/dev-utils';

export function DevTestAccounts() {
  const [activeAccount, setActiveAccount] = useState<DevTestAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { 
    setTelegramUser, 
    setUserId, 
    setRole, 
    setProfession, 
    setLanguage,
    telegramUser,
    userId,
    role,
    profession,
    language
  } = useAppStore();

  const testAccounts = getDevTestAccounts();

  useEffect(() => {
    if (isDevTestAccountsEnabled()) {
      const current = getActiveDevTestAccount();
      setActiveAccount(current);
      devLog('Current active test account:', current);
    }
  }, []);

  const handleApplyAccount = async (account: DevTestAccount) => {
    if (!isDevTestAccountsEnabled()) {
      return;
    }

    setIsLoading(true);
    try {
      // Применяем тестовый аккаунт
      applyDevTestAccount(account);
      
      // Обновляем состояние приложения
      setTelegramUser(account.telegramUser);
      setUserId(account.userId);
      setRole(account.role);
      setProfession(account.profession);
      setLanguage(account.language);
      
      setActiveAccount(account);
      
      devLog('Test account applied:', account);
    } catch (error) {
      devLog('Error applying test account:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAccount = () => {
    if (!isDevTestAccountsEnabled()) {
      return;
    }

    setIsLoading(true);
    try {
      clearDevTestAccount();
      
      // Очищаем состояние приложения
      setTelegramUser(null);
      setUserId(0);
      setRole(null);
      setProfession(null);
      setLanguage('ru');
      
      setActiveAccount(null);
      
      devLog('Test account cleared');
    } catch (error) {
      devLog('Error clearing test account:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateRandom = () => {
    if (!isDevTestAccountsEnabled()) {
      return;
    }

    const randomAccount = generateRandomDevTestAccount();
    handleApplyAccount(randomAccount);
  };

  if (!isDevTestAccountsEnabled()) {
    return null;
  }

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          🧪 Тестовые аккаунты
          <Badge variant="secondary" className="text-xs">
            DEV ONLY
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Текущий статус:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-blue-700">Активный аккаунт:</span>
              <Badge variant={activeAccount ? "default" : "secondary"} className="text-xs">
                {activeAccount ? `${activeAccount.telegramUser.first_name} ${activeAccount.telegramUser.last_name}` : 'Нет'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-blue-700">Роль:</span>
              <Badge variant={role ? "default" : "secondary"} className="text-xs">
                {role || 'Не выбрана'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-blue-700">User ID:</span>
              <Badge variant={userId ? "default" : "secondary"} className="text-xs">
                {userId || 'Не установлен'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-blue-700">Профессия:</span>
              <Badge variant={profession ? "default" : "secondary"} className="text-xs">
                {profession || 'Не выбрана'}
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Predefined Accounts */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Предустановленные аккаунты:</h4>
          <div className="grid grid-cols-1 gap-2">
            {testAccounts.map((account) => (
              <div
                key={account.userId}
                className={`p-3 rounded border ${
                  activeAccount?.userId === account.userId
                    ? 'bg-blue-100 border-blue-300'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {account.telegramUser.first_name} {account.telegramUser.last_name}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        @{account.telegramUser.username}
                      </Badge>
                      <Badge 
                        variant={account.role === 'candidate' ? 'default' : 'secondary'} 
                        className="text-xs"
                      >
                        {account.role === 'candidate' ? 'Кандидат' : 'Интервьюер'}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-600">
                      {account.profession} • ID: {account.userId}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={activeAccount?.userId === account.userId ? "secondary" : "outline"}
                    onClick={() => handleApplyAccount(account)}
                    disabled={isLoading}
                    className="ml-2"
                  >
                    {activeAccount?.userId === account.userId ? 'Активен' : 'Применить'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Действия:</h4>
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={handleGenerateRandom}
              disabled={isLoading}
              className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
            >
              🎲 Случайный аккаунт
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleClearAccount}
              disabled={isLoading || !activeAccount}
            >
              🗑️ Очистить
            </Button>
          </div>
        </div>

        {/* Debug Info */}
        {activeAccount && (
          <div className="mt-4">
            <h4 className="font-medium text-sm mb-2">Debug Info:</h4>
            <pre className="text-xs p-2 bg-white rounded border overflow-auto max-h-32">
              {JSON.stringify(activeAccount, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
