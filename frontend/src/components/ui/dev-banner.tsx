import { useAppStore } from '@/lib/store';
import { Badge } from './badge';
import { Button } from './button';
import { useNavigate } from 'react-router-dom';
import { 
  isDevTestAccountsEnabled, 
  getActiveDevTestAccount, 
  getDevTestAccounts,
  applyDevTestAccount,
  clearDevTestAccount
} from '@/lib/dev-test-account';

interface DevBannerProps {
  showDebugInfo?: boolean;
  className?: string;
}

export function DevBanner({ showDebugInfo = true, className = '' }: DevBannerProps) {
  const navigate = useNavigate();
  const { telegramUser, userId, demoMode, setDemoMode, setTelegramUser, setUserId, setRole, setProfession, setLanguage } = useAppStore();
  
  // Check for active test account
  const activeTestAccount = isDevTestAccountsEnabled() ? getActiveDevTestAccount() : null;
  
  // Get available test accounts
  const testAccounts = getDevTestAccounts();

  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <div className={`bg-orange-50 border border-orange-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-orange-800 font-medium">🚧 Development Mode</span>
          <Badge variant="secondary" className="text-xs">
            DEV ONLY
          </Badge>
        </div>
                    <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('/dev-test')}
                className="text-xs border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                🐛 Debug Page
              </Button>
              {activeTestAccount && (
                <Badge variant="default" className="text-xs bg-blue-500">
                  🧪 Test Account
                </Badge>
              )}
              {testAccounts.length > 0 && !activeTestAccount && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const firstAccount = testAccounts[0];
                    applyDevTestAccount(firstAccount);
                    setTelegramUser(firstAccount.telegramUser);
                    setUserId(firstAccount.userId);
                    setRole(firstAccount.role);
                    setProfession(firstAccount.profession);
                    setLanguage(firstAccount.language);
                  }}
                  className="text-xs border-green-300 text-green-700 hover:bg-green-100"
                >
                  🧪 Enable Demo
                </Button>
              )}
              {activeTestAccount && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    clearDevTestAccount();
                    setTelegramUser(null);
                    setUserId(0);
                    setRole(null);
                    setProfession(null);
                    setLanguage('ru');
                  }}
                  className="text-xs border-red-300 text-red-700 hover:bg-red-100"
                >
                  🗑️ Clear Demo
                </Button>
              )}
            </div>
      </div>

      {showDebugInfo && (
        <div className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-orange-700">User ID:</span>
              <Badge variant={userId ? "default" : "secondary"} className="text-xs">
                {userId || 'Not set'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-orange-700">Demo Mode:</span>
              <div className="flex items-center gap-1">
                <Badge variant={demoMode ? "destructive" : "default"} className="text-xs">
                  {demoMode ? '1' : '0'}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDemoMode(!demoMode)}
                  className="text-xs h-6 px-2"
                >
                  {demoMode ? 'Off' : 'On'}
                </Button>
              </div>
            </div>
          </div>
          
          {telegramUser && (
            <div className="mt-2">
              <span className="text-orange-700 text-xs">Telegram: </span>
              <span className="text-orange-800 text-xs">
                {telegramUser.first_name} {telegramUser.last_name} (@{telegramUser.username})
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
