import { TelegramUser } from './telegram-auth';
import { devLog } from './dev-utils';
import { env } from './env';

/**
 * Development-only test account system
 * Provides a mock user for testing purposes
 */

export interface DevTestAccount {
  telegramUser: TelegramUser;
  userId: number;
  role: 'candidate' | 'interviewer';
  profession: string;
  language: string;
}

// Тестовые аккаунты для разработки
const DEV_TEST_ACCOUNTS: DevTestAccount[] = [
  {
    telegramUser: {
      id: 123456789,
      first_name: 'Test',
      last_name: 'Candidate',
      username: 'test_candidate',
      photo_url: 'https://t.me/i/userpic/320/test_candidate.jpg',
      auth_date: Math.floor(Date.now() / 1000),
      hash: 'dev_test_candidate_hash',
    },
    userId: 123456789,
    role: 'candidate',
    profession: 'Frontend Developer',
    language: 'ru',
  },
  {
    telegramUser: {
      id: 987654321,
      first_name: 'Test',
      last_name: 'Interviewer',
      username: 'test_interviewer',
      photo_url: 'https://t.me/i/userpic/320/test_interviewer.jpg',
      auth_date: Math.floor(Date.now() / 1000),
      hash: 'dev_test_interviewer_hash',
    },
    userId: 987654321,
    role: 'interviewer',
    profession: 'Senior Developer',
    language: 'ru',
  },
  {
    telegramUser: {
      id: 555666777,
      first_name: 'Demo',
      last_name: 'User',
      username: 'demo_user',
      photo_url: 'https://t.me/i/userpic/320/demo_user.jpg',
      auth_date: Math.floor(Date.now() / 1000),
      hash: 'dev_demo_user_hash',
    },
    userId: 555666777,
    role: 'candidate',
    profession: 'Full Stack Developer',
    language: 'en',
  },
];

/**
 * Check if development test accounts are enabled
 */
export const isDevTestAccountsEnabled = (): boolean => {
  // В dev режиме всегда включаем тестовые аккаунты, даже если переменная не установлена
  return env.DEV && (env.ENABLE_DEV_TEST_ACCOUNTS || import.meta.env.DEV);
};

/**
 * Get available test accounts
 */
export const getDevTestAccounts = (): DevTestAccount[] => {
  if (!isDevTestAccountsEnabled()) {
    return [];
  }
  return DEV_TEST_ACCOUNTS;
};

/**
 * Get a specific test account by role
 */
export const getDevTestAccountByRole = (role: 'candidate' | 'interviewer'): DevTestAccount | null => {
  if (!isDevTestAccountsEnabled()) {
    return null;
  }
  return DEV_TEST_ACCOUNTS.find(account => account.role === role) || null;
};

/**
 * Get a specific test account by ID
 */
export const getDevTestAccountById = (id: number): DevTestAccount | null => {
  if (!isDevTestAccountsEnabled()) {
    return null;
  }
  return DEV_TEST_ACCOUNTS.find(account => account.userId === id) || null;
};

/**
 * Apply test account to the application
 */
export const applyDevTestAccount = (account: DevTestAccount) => {
  if (!isDevTestAccountsEnabled()) {
    devLog('Dev test accounts are disabled');
    return;
  }

  devLog('Applying dev test account:', account);
  
  // Сохраняем в localStorage для восстановления при перезагрузке
  localStorage.setItem('dev_test_account', JSON.stringify(account));
  localStorage.setItem('dev_test_account_timestamp', Date.now().toString());
  
  // Устанавливаем флаг активного тестового аккаунта
  sessionStorage.setItem('dev_test_account_active', 'true');
  
  devLog('Dev test account applied successfully');
};

/**
 * Clear test account
 */
export const clearDevTestAccount = () => {
  if (!isDevTestAccountsEnabled()) {
    return;
  }

  devLog('Clearing dev test account');
  
  localStorage.removeItem('dev_test_account');
  localStorage.removeItem('dev_test_account_timestamp');
  sessionStorage.removeItem('dev_test_account_active');
  
  devLog('Dev test account cleared');
};

/**
 * Check if a test account is currently active
 */
export const isDevTestAccountActive = (): boolean => {
  if (!isDevTestAccountsEnabled()) {
    return false;
  }
  
  const active = sessionStorage.getItem('dev_test_account_active');
  const account = localStorage.getItem('dev_test_account');
  
  return active === 'true' && account !== null;
};

/**
 * Get currently active test account
 */
export const getActiveDevTestAccount = (): DevTestAccount | null => {
  if (!isDevTestAccountsEnabled() || !isDevTestAccountActive()) {
    return null;
  }
  
  try {
    const accountData = localStorage.getItem('dev_test_account');
    if (!accountData) {
      return null;
    }
    
    const account = JSON.parse(accountData) as DevTestAccount;
    
    // Проверяем, что аккаунт не устарел (24 часа)
    const timestamp = localStorage.getItem('dev_test_account_timestamp');
    if (timestamp) {
      const age = Date.now() - parseInt(timestamp);
      const maxAge = 24 * 60 * 60 * 1000; // 24 часа
      
      if (age > maxAge) {
        devLog('Dev test account expired, clearing');
        clearDevTestAccount();
        return null;
      }
    }
    
    return account;
  } catch (error) {
    devLog('Error parsing dev test account:', error);
    clearDevTestAccount();
    return null;
  }
};

/**
 * Generate a random test account
 */
export const generateRandomDevTestAccount = (): DevTestAccount => {
  const roles: ('candidate' | 'interviewer')[] = ['candidate', 'interviewer'];
  const professions = [
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'DevOps Engineer',
    'QA Engineer',
    'Product Manager',
    'UI/UX Designer',
  ];
  
  const randomId = Math.floor(Math.random() * 900000000) + 100000000;
  const randomRole = roles[Math.floor(Math.random() * roles.length)];
  const randomProfession = professions[Math.floor(Math.random() * professions.length)];
  
  return {
    telegramUser: {
      id: randomId,
      first_name: 'Random',
      last_name: 'User',
      username: `random_${randomId}`,
      photo_url: `https://t.me/i/userpic/320/random_${randomId}.jpg`,
      auth_date: Math.floor(Date.now() / 1000),
      hash: `dev_random_${randomId}_hash`,
    },
    userId: randomId,
    role: randomRole,
    profession: randomProfession,
    language: Math.random() > 0.5 ? 'ru' : 'en',
  };
};
