import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/ui/logo';
import { ArrowLeft, Key, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
import { CompactLanguageSelector } from '@/components/ui/compact-language-selector';
import { useAppTranslation } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { MobileBottomMenu } from '@/components/ui/mobile-bottom-menu';
import { apiSaveUserSettings } from '@/lib/api';
import { validateApiKey } from '@/lib/openrouter-api';
import { toast } from 'sonner';
import { getActiveDevTestAccount } from '@/lib/dev-test-account';

export function ApiKeySetup() {
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  
  const navigate = useNavigate();
  const { t } = useAppTranslation();
  
  const userId = useAppStore((s) => s.userId);
  const setUserSettings = useAppStore((s) => s.setUserSettings);
  const userSettings = useAppStore((s) => s.userSettings);

  // Проверяем, есть ли уже API ключ
  useEffect(() => {
    if (userSettings.openRouterApiKey) {
      setApiKey('••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••');
      setIsValid(true);
    }
  }, [userSettings.openRouterApiKey]);

  const handleValidateApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error(t('profile.apiKeyRequired'));
      return;
    }

    setIsValidating(true);
    try {
      const isValidKey = await validateApiKey(apiKey);
      setIsValid(isValidKey);
      
      if (isValidKey) {
        toast.success(t('profile.connectionSuccess'));
      } else {
        toast.error(t('profile.connectionError'));
      }
    } catch (error) {
      console.error('API key validation error:', error);
      toast.error(t('profile.connectionError'));
      setIsValid(false);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSkip = () => {
    console.log('⏭️ Skipping API key setup');
    navigate('/');
  };

  const handleContinue = async () => {
    if (!isValid && apiKey.trim()) {
      toast.error(t('profile.pleaseValidateApiKey'));
      return;
    }

    setIsSaving(true);
    try {
      // Проверяем демо аккаунт
      const demoAccount = getActiveDevTestAccount();
      
      // В dev режиме или с демо аккаунтом создаем локальный userId если его нет
      let currentUserId = userId;
      if ((!currentUserId || currentUserId === 0) && (import.meta.env.DEV || demoAccount)) {
        const localId = demoAccount ? demoAccount.userId : Math.floor(Math.random() * 1000000) + 1000000;
        currentUserId = localId;
        console.log('🎭 Using local userId for dev/demo mode:', localId);
      }

      if (currentUserId) {
        try {
          console.log('💾 Saving API key to database...');
          
          // Добавляем таймаут для API вызова
          const savePromise = apiSaveUserSettings({
            userId: currentUserId,
            openRouterApiKey: apiKey.trim() || null,
          });
          
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Save settings timeout')), 3000)
          );
          
          await Promise.race([savePromise, timeoutPromise]);
          console.log('✅ API key saved successfully to database');
        } catch (e) {
          console.warn('⚠️ Failed to save API key to database:', e);
          console.log('💾 Continuing with local save only');
        }
      }

      // Сохраняем локально
      setUserSettings({
        openRouterApiKey: apiKey.trim() || null,
      });

      toast.success(t('profile.settingsSaved'));
      
      // Перенаправляем на главную страницу
      console.log('🚀 Onboarding completed, navigating to /');
      setTimeout(() => {
        navigate('/');
      }, 100);
    } catch (error) {
      console.error('Failed to save API key:', error);
      toast.error(t('profile.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    navigate('/tools');
  };

  const openOpenRouterWebsite = () => {
    window.open('https://openrouter.ai/keys', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-telegram-light-gray p-4 pb-24 md:pb-4">
      <div className="max-w-md mx-auto pt-16 sm:pt-20">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo size="lg" clickable={true} />
        </div>

        {/* Header */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="mr-2 p-2"
          >
            <ArrowLeft size={20} />
          </Button>
          <div className="flex-1 text-center">
            <h1 className="text-xl font-bold text-foreground">
              {t('profile.apiSettings')}
            </h1>
          </div>
          <CompactLanguageSelector />
        </div>

        {/* Main Content */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              {t('profile.apiKey')}
            </CardTitle>
            <CardDescription>
              {t('profile.apiDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">{t('profile.apiKey')}</Label>
              <div className="relative">
                <Input
                  id="api-key"
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-or-v1-..."
                  className="pr-20"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  {showApiKey ? '🙈' : '👁️'}
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleValidateApiKey}
                disabled={isValidating || !apiKey.trim()}
                className="flex-1"
              >
                {isValidating ? t('profile.testing') : t('profile.test')}
              </Button>
              <Button
                variant="outline"
                onClick={openOpenRouterWebsite}
                className="flex items-center gap-2"
              >
                <ExternalLink size={16} />
                {t('profile.getApiKey')}
              </Button>
            </div>

            {/* Validation Status */}
            {isValid && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle size={16} />
                <span className="text-sm">{t('profile.connectionSuccess')}</span>
              </div>
            )}

            {/* Benefits */}
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                {t('profile.aiBenefitsTitle')}
              </h3>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• {t('profile.aiBenefit1')}</li>
                <li>• {t('profile.aiBenefit2')}</li>
                <li>• {t('profile.aiBenefit3')}</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleContinue}
            disabled={isSaving}
            className="w-full h-12 text-base font-medium bg-gradient-to-r from-primary to-primary hover:shadow-[0_4px_20px_hsl(var(--primary)/30%)] transition-all duration-300"
          >
            {isSaving ? t('common.saving') : t('navigation.continue')}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleSkip}
            className="w-full"
          >
            {t('navigation.skip')}
          </Button>
        </div>

        {/* Info */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            {t('profile.getFreeKeyDesc')}{' '}
            <button
              onClick={openOpenRouterWebsite}
              className="text-primary hover:underline"
            >
              {t('profile.getFreeKey')}
            </button>
          </p>
        </div>
      </div>

      {/* Mobile Bottom Menu */}
      <MobileBottomMenu />
    </div>
  );
}
