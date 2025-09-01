import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Settings,
  Key,
  Zap,
  Save,
  TestTube,
  Eye,
  EyeOff,
  Info,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/ui/logo';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAppStore } from '@/lib/store';
import { useAppTranslation } from '@/lib/i18n';
import { useTelegramFullscreen } from '@/hooks/use-telegram-fullscreen';
import {
  OpenRouterAPI,
  RECOMMENDED_MODELS,
  validateApiKey,
  formatModelPrice,
} from '@/lib/openrouter-api';
import { StackBlitzInfoModal } from '@/components/ui/stackblitz-info-modal';
import { OpenRouterInfoModal } from '@/components/ui/openrouter-info-modal';
import { MobileBottomMenu } from '@/components/ui/mobile-bottom-menu';
import { LanguageSelector } from '@/components/ui/language-selector';
import { MediaTest } from '@/components/ui/media-test';
import { UserToolsDisplay } from '@/components/ui/user-tools-display';
import {
  apiSaveUserSettings,
  apiGetProfile,
  apiSaveProfile,
} from '@/lib/api';
import { toast } from 'sonner';

export function Profile() {
  const navigate = useNavigate();
  const { t } = useAppTranslation();
  const {
    userSettings,
    setUserSettings,
    userId,
    telegramUser,
    selectedTools,
  } = useAppStore();

  const [apiKey, setApiKey] = useState(userSettings.openRouterApiKey || '');
  const [stackblitzKey, setStackblitzKey] = useState(
    userSettings.stackblitzApiKey || ''
  );
  const [showApiKey, setShowApiKey] = useState(false);
  const [isApiKeyMasked, setIsApiKeyMasked] = useState(false);
  const [preferredModel, setPreferredModel] = useState(
    userSettings.preferredModel
  );
  const [questionsLevel, setQuestionsLevel] = useState(
    userSettings.questionsLevel
  );
  const [useAiGeneration, setUseAiGeneration] = useState(
    userSettings.useAiGeneration
  );
  const [questionsCount, setQuestionsCount] = useState(
    userSettings.questionsCount
  );
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showStackBlitzInfo, setShowStackBlitzInfo] = useState(false);
  const [showOpenRouterInfo, setShowOpenRouterInfo] = useState(false);
  const [showMediaSettings, setShowMediaSettings] = useState(false);

  // Обновляем отображение API ключа при переключении глазка
  useEffect(() => {
    if (!isApiKeyMasked) return;
    const MASKED =
      '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••';
    if (showApiKey) {
      setApiKey(userSettings.openRouterApiKey || '');
    } else {
      setApiKey(MASKED);
    }
  }, [showApiKey, isApiKeyMasked, userSettings.openRouterApiKey]);

  // Обработчик переключения видимости API ключа
  const handleToggleApiKeyVisibility = () => {
    if (isApiKeyMasked) {
      setShowApiKey(!showApiKey);
    } else {
      // Если ключ не замаскирован (пользователь вводит новый), просто переключаем тип поля
      setShowApiKey(!showApiKey);
    }
  };

  // Профиль: язык и профессия
  const languages = [
    { id: 'ru', name: 'Русский' },
    { id: 'en', name: 'English' },
    { id: 'es', name: 'Español' },
    { id: 'de', name: 'Deutsch' },
    { id: 'fr', name: 'Français' },
    { id: 'zh', name: '中文' },
  ];
  const professions = [
    { id: 'frontend', name: t('profession.frontend') },
    { id: 'backend', name: t('profession.backend') },
    { id: 'fullstack', name: t('profession.fullstack') },
    { id: 'mobile', name: t('profession.mobile') },
    { id: 'devops', name: t('profession.devops') },
    { id: 'qa', name: t('profession.qa') },
    { id: 'designer', name: t('profession.designer') },
    { id: 'analyst', name: t('profession.analyst') },
    { id: 'scientist', name: t('profession.scientist') },
    { id: 'pm', name: t('profession.pm') },
  ];
  const [profileLanguage, setProfileLanguage] = useState<string>('ru');
  const [profileProfession, setProfileProfession] =
    useState<string>('frontend');
  
  // Получаем профессию из store
  const { profession: storeProfession, setProfession } = useAppStore();

  // Настройка полноэкранного режима в Telegram Mini Apps
  useTelegramFullscreen();

  // Синхронизируем состояние компонента с настройками из store
  useEffect(() => {
    const savedApiKey = userSettings.openRouterApiKey || '';
    if (savedApiKey) {
      // Если есть сохраненный ключ, показываем точки
      setApiKey('••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••');
      setIsApiKeyMasked(true);
      setShowApiKey(false); // Скрываем ключ по умолчанию
    } else {
      setApiKey('');
      setIsApiKeyMasked(false);
      setShowApiKey(false);
    }
    setStackblitzKey(userSettings.stackblitzApiKey || '');
    setPreferredModel(userSettings.preferredModel);
    setQuestionsLevel(userSettings.questionsLevel);
            setUseAiGeneration(userSettings.useAiGeneration);
    setQuestionsCount(userSettings.questionsCount);
    
    // Устанавливаем профессию из store, если она есть
    if (storeProfession && !profileProfession) {
      setProfileProfession(storeProfession);
    }
    
    setIsLoading(false);
  }, [userSettings, storeProfession, profileProfession]);

  // Загрузка профиля (язык, профессия)
  useEffect(() => {
    async function loadProfile() {
      try {
        if (!userId) return;
        const data = await apiGetProfile(userId);
        // Проверяем, что значения не пустые перед установкой
        if (data?.user?.language && data.user.language.trim() !== '') {
          setProfileLanguage(data.user.language);
        }
        if (data?.preference?.profession && data.preference.profession.trim() !== '') {
          setProfileProfession(data.preference.profession);
        }
      } catch (e) {
        // игнорируем, используем значения по умолчанию
      }
    }
    loadProfile();
  }, [userId]);

  // Синхронизируем с store
  useEffect(() => {
    if (storeProfession && storeProfession !== profileProfession) {
      setProfileProfession(storeProfession);
    }
  }, [storeProfession, profileProfession]);

  const handleSaveSettings = async () => {
    setIsSaving(true);

    try {
      console.log('Saving user settings:', {
        userId,
        hasApiKey: !!apiKey,
        apiKeyLength: apiKey.length,
        apiKeyPrefix: apiKey.substring(0, 10) + '...',
        useAiGeneration,
        preferredModel,
        questionsLevel,
        questionsCount,
      });

      // В dev режиме сохраняем локально без вызова API
      if (import.meta.env.DEV) {
        console.log('🔧 Dev mode: saving settings locally');
        
        setUserSettings({
          openRouterApiKey: apiKey || null,
          stackblitzApiKey: stackblitzKey || null,
          preferredModel,
          questionsLevel: questionsLevel as 'junior' | 'middle' | 'senior',
          useAIGeneration,
          questionsCount,
        });

        toast.success(t('profile.settingsSaved'));
        return;
      }

      const response = await apiSaveUserSettings({
        userId: userId || 0,
        openRouterApiKey: apiKey || null,
        stackblitzApiKey: stackblitzKey || null,
        preferredModel,
        questionsLevel: questionsLevel as 'junior' | 'middle' | 'senior',
        useAIGeneration,
        questionsCount,
      });

      console.log('Settings saved successfully:', response);

      setUserSettings({
        openRouterApiKey: apiKey || null,
        stackblitzApiKey: stackblitzKey || null,
        preferredModel,
        questionsLevel: questionsLevel as 'junior' | 'middle' | 'senior',
        useAIGeneration,
        questionsCount,
      });

      toast.success(t('profile.settingsSaved'));
    } catch (error) {
      console.error('Error saving settings:', error);
      
      // В dev режиме все равно сохраняем локально при ошибке
      if (import.meta.env.DEV) {
        console.log('🔧 Dev mode: saving settings locally (fallback)');
        setUserSettings({
          openRouterApiKey: apiKey || null,
          stackblitzApiKey: stackblitzKey || null,
          preferredModel,
          questionsLevel: questionsLevel as 'junior' | 'middle' | 'senior',
          useAIGeneration,
          questionsCount,
        });
        toast.success(t('profile.settingsSaved'));
      } else {
        toast.error(t('profile.saveError'));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfessionChange = async (newProfession: string) => {
    setProfileProfession(newProfession);
    
    // Обновляем профессию в store
    setProfession(newProfession);
    
    // Сохраняем профессию в профиль пользователя
    // В dev режиме сохраняем локально без вызова API
    if (import.meta.env.DEV) {
      console.log('🔧 Dev mode: saving profession locally');
      return;
    }
    
    try {
      await apiSaveProfile({
        userId: userId || 0,
        profession: newProfession,
      });
      // Остаемся на странице профиля, обновим инструменты автоматически
    } catch (error) {
      console.error('Error saving profession:', error);
      // Остаемся на странице, чтобы показать ошибку/повторить попытку
    }
  };

  const handleTestConnection = async () => {
    // Определяем реальное значение API ключа для тестирования
    const realApiKey =
      isApiKeyMasked && apiKey.includes('••••')
        ? userSettings.openRouterApiKey // Используем сохраненный ключ
        : apiKey; // Используем введенный ключ

    if (!realApiKey) {
      toast.error(t('profile.enterApiKey'));
      return;
    }

    if (!validateApiKey(realApiKey)) {
      toast.error(t('profile.invalidApiKey'));
      return;
    }

    setIsTestingConnection(true);
    setConnectionStatus('idle');

    try {
      const api = new OpenRouterAPI(realApiKey);
      const success = await api.testConnection();

      if (success) {
        setConnectionStatus('success');
        toast.success(t('profile.connectionSuccess'));
      } else {
        setConnectionStatus('error');
        toast.error(t('profile.connectionError'));
      }
    } catch (error) {
      setConnectionStatus('error');
      toast.error(t('profile.connectionTestError'));
    }

    setIsTestingConnection(false);
  };

  // Используем «эффективный» ключ: сохраненный (когда поле замаскировано) или введенный пользователем
  const effectiveApiKey =
    (isApiKeyMasked ? userSettings.openRouterApiKey || '' : apiKey) || '';
  const hasValidApiKey = !!effectiveApiKey && validateApiKey(effectiveApiKey);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('profile.loadingSettings')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-24 md:pb-4">
      <div className="max-w-2xl mx-auto pt-16 sm:pt-20">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo size="lg" clickable={true} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="mr-3"
            >
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                <Settings className="mr-2" size={24} />
                {t('profile.title')}
              </h1>
              <p className="text-muted-foreground text-sm">
                {t('profile.subtitle')}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Информация о статусе авторизации */}
          {!telegramUser && (
            <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
              <CardContent className="pt-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      {t('profile.projectMode')}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-300">
                      {t('profile.projectModeDesc')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Профиль пользователя Telegram */}
          {telegramUser && (
            <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
              <CardContent className="pt-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex items-center space-x-3 flex-1">
                    {telegramUser.photo_url ? (
                      <img
                        src={telegramUser.photo_url}
                        alt="Profile"
                        className="w-8 h-8 rounded-full border-2 border-green-200"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center">
                        <span className="text-green-700 text-sm font-medium">
                          {telegramUser.first_name?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        {telegramUser.first_name}
                        {telegramUser.last_name && ` ${telegramUser.last_name}`}
                      </p>
                      {telegramUser.username && (
                        <p className="text-xs text-green-600 dark:text-green-300">
                          @{telegramUser.username}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-300">
                    {t('profile.online')}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Профиль: язык и профессия */}
          <Card>
            <CardHeader>
              <CardTitle>{t('language.selectLanguage')}</CardTitle>
              <CardDescription>{t('profile.profileSettings')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                       {/* Язык интерфейса */}
                       <div className="space-y-2">
                <Label>{t('profile.interfaceLanguage')}</Label>
                <div className="flex items-center space-x-2">
                  <LanguageSelector />
                  <span className="text-xs text-muted-foreground">
                    {t('profile.interfaceLanguageDesc')}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('profile.interviewLanguage')}</Label>
                  <Select
                    value={profileLanguage}
                    onValueChange={setProfileLanguage}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages
                        .filter((l) => l.id && l.id.trim() !== '')
                        .map((l) => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('profile.profession')}</Label>
                  <Select
                    value={profileProfession}
                    onValueChange={handleProfessionChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {professions
                        .filter((p) => p.id && p.id.trim() !== '')
                        .map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {profileLanguage && profileProfession && (
                <Button
                  onClick={() => {
                    if (!selectedTools || selectedTools.length === 0) {
                      toast.error(
                        t('tools.selectToolsFirst')
                      );
                      return;
                    }
                    navigate('/time');
                  }}
                  variant="secondary"
                  className="w-full"
                >
                  {t('profile.goToInterview')}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Инструменты пользователя */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                {t('tools.selectTools')}
                {profileProfession && (
                  <span className="text-sm font-normal text-muted-foreground">
                    ({professions.find(p => p.id === profileProfession)?.name || profileProfession})
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                {t('tools.selectToolsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userId && profileProfession ? (
                <UserToolsDisplay
                  userId={userId}
                  profession={profileProfession}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">
                    {!profileProfession 
                      ? t('tools.selectProfessionFirst')
                      : t('tools.loadingTools')
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Model Selection */}
          {hasValidApiKey && (
            <Card>
              <CardHeader>
                <CardTitle>{t('profile.modelSettings')}</CardTitle>
                <CardDescription>
                  {t('profile.modelDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('profile.preferredModel')}</Label>
                  <Select
                    value={preferredModel}
                    onValueChange={setPreferredModel}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RECOMMENDED_MODELS
                        .filter((model) => model.id && model.id.trim() !== '')
                        .map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            <div className="flex items-center justify-between w-full">
                              <div>
                                <div className="font-medium">{model.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {model.description}
                                </div>
                              </div>
                              <Badge variant="secondary" className="ml-2">
                                {formatModelPrice(model)}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('profile.questionsLevel')}</Label>
                    <Select
                      value={questionsLevel}
                      onValueChange={(value: 'junior' | 'middle' | 'senior') =>
                        setQuestionsLevel(value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="junior">
                          {t('profile.junior')}
                        </SelectItem>
                        <SelectItem value="middle">
                          {t('profile.middle')}
                        </SelectItem>
                        <SelectItem value="senior">
                          {t('profile.senior')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('profile.questionsCount')}</Label>
                    <Select
                      value={questionsCount.toString()}
                      onValueChange={(value) =>
                        setQuestionsCount(parseInt(value))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">
                          5 {t('profile.questions')}
                        </SelectItem>
                        <SelectItem value="10">
                          10 {t('profile.questions')}
                        </SelectItem>
                        <SelectItem value="15">
                          15 {t('profile.questions')}
                        </SelectItem>
                        <SelectItem value="20">
                          20 {t('profile.questions')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}


          {/* API Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="mr-2" size={20} />
                {t('profile.apiSettings')}
              </CardTitle>
              <CardDescription>
                {t('profile.apiDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* AI Benefits - компактная версия */}
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Zap className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" size={16} />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                      {t('profile.aiBenefitsTitle')}
                    </h4>
                    <div className="space-y-1">
                      <div className="flex items-center text-xs text-blue-700 dark:text-blue-300">
                        <span className="text-blue-600 dark:text-blue-400 mr-1">✓</span>
                        {t('profile.aiBenefit1')}
                      </div>
                      <div className="flex items-center text-xs text-blue-700 dark:text-blue-300">
                        <span className="text-blue-600 dark:text-blue-400 mr-1">✓</span>
                        {t('profile.aiBenefit2')}
                      </div>
                      <div className="flex items-center text-xs text-blue-700 dark:text-blue-300">
                        <span className="text-blue-600 dark:text-blue-400 mr-1">✓</span>
                        {t('profile.aiBenefit3')}
                      </div>
                    </div>
                  </div>
                </div>
                            </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="api-key">{t('profile.apiKey')}</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowOpenRouterInfo(true)}
                      className="h-6 w-6 shrink-0"
                      title={t('profile.learnMoreOpenRouter')}
                    >
                      <Info size={14} />
                    </Button>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <Input
                      id="api-key"
                      type={showApiKey ? 'text' : 'password'}
                      placeholder="sk-or-..."
                      value={apiKey}
                      onChange={(e) => {
                        setApiKey(e.target.value);
                        // Если пользователь начинает вводить, снимаем маскировку
                        if (isApiKeyMasked) {
                          setIsApiKeyMasked(false);
                        }
                      }}
                      onFocus={() => {
                        // При фокусе на замаскированном поле очищаем его для ввода нового ключа
                        if (isApiKeyMasked && !showApiKey) {
                          setApiKey('');
                          setIsApiKeyMasked(false);
                          setShowApiKey(false);
                        }
                      }}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={handleToggleApiKeyVisibility}
                    >
                      {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </div>
                  <Button
                    onClick={handleTestConnection}
                    disabled={!apiKey || isTestingConnection}
                    variant="outline"
                    className="flex items-center"
                  >
                    <TestTube size={16} className="mr-2" />
                    {isTestingConnection
                      ? t('profile.testing')
                      : t('profile.test')}
                  </Button>
                </div>
                {connectionStatus === 'success' && (
                  <p className="text-green-600 text-sm flex items-center">
                    ✓ {t('profile.connectionSuccess')}
                  </p>
                )}
                {connectionStatus === 'error' && (
                  <p className="text-red-600 text-sm flex items-center">
                    ✗ {t('profile.connectionError')}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  <a
                    href="https://openrouter.ai/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {t('profile.getFreeKey')}
                  </a>{' '}
                  {t('profile.getFreeKeyDesc')}
                </p>
              </div>
{
  hasValidApiKey && (
    <>
        {/* AI Generation Toggle */}
    <div className="flex items-center justify-between p-4 border rounded-lg">
    <div className="flex items-center space-x-3">
      <Zap className="text-yellow-500" size={20} />
      <div>
        <Label
          htmlFor="ai-generation"
          className="text-base font-medium"
        >
          {t('profile.aiGeneration')}
        </Label>
        <p className="text-sm text-muted-foreground">
          {t('profile.aiGenerationDesc')}
        </p>
      </div>
    </div>
    <Switch
      id="ai-generation"
      checked={useAIGeneration && hasValidApiKey}
      onCheckedChange={setUseAIGeneration}
      disabled={!hasValidApiKey}
    />
  </div>
    </>
  )
}



              {/* StackBlitz API Key */}
              <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="stackblitz-key">{t('profile.stackblitzApiKey')}</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowStackBlitzInfo(true)}
                        className="h-6 w-6 shrink-0"
                        title={t('profile.learnMoreStackBlitz')}
                      >
                      <Info size={14} />
                    </Button>
                  </div>
                </div>
                <Input
                  id="stackblitz-key"
                  type="password"
                  placeholder="sbk_..."
                  value={stackblitzKey}
                  onChange={(e) => setStackblitzKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  <a
                    href="https://stackblitz.com/docs/guides/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {t('profile.getStackBlitzKey')}
                  </a>{' '}
                  {t('profile.getStackBlitzKeyDesc')}
                </p>
              </div>

              
            </CardContent>
          </Card>

          {/* Media Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="mr-2" size={20} />
                Настройки камеры и звука
              </CardTitle>
              <CardDescription>
                Проверьте и настройте ваши устройства перед собеседованием
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setShowMediaSettings(!showMediaSettings)}
                variant="outline"
                className="w-full"
              >
                <Settings size={16} className="mr-2" />
                {showMediaSettings ? 'Скрыть настройки' : 'Открыть настройки камеры и звука'}
              </Button>
              
              {showMediaSettings && (
                <div className="mt-4">
                  <MediaTest />
                </div>
              )}
            </CardContent>
          </Card>

          

          {/* Save Button */}
          <Button
            onClick={handleSaveSettings}
            disabled={isSaving || isLoading}
            className="w-full"
            size="lg"
          >
            <Save className="mr-2" size={20} />
            {isSaving ? t('profile.saving') : t('profile.save')}
          </Button>
        </div>
      </div>

      {/* StackBlitz Info Modal */}
      <StackBlitzInfoModal
        isOpen={showStackBlitzInfo}
        onClose={() => setShowStackBlitzInfo(false)}
      />

      {/* OpenRouter Info Modal */}
      <OpenRouterInfoModal
        isOpen={showOpenRouterInfo}
        onClose={() => setShowOpenRouterInfo(false)}
      />

      {/* Mobile Bottom Menu */}
      <MobileBottomMenu />
    </div>
  );
}
