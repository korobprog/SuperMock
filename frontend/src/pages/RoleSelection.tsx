import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { RoleCard } from '@/components/ui/role-card';
import { Card, CardContent } from '@/components/ui/card';
import { UserCheck, Users, History, Zap, ArrowRight } from 'lucide-react';
import { useAppTranslation } from '@/lib/i18n';
import { apiSaveProfile } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import {
  detectUserLanguage,
  saveAndApplyLanguage,
} from '@/lib/language-detection';

export function RoleSelection() {
  const [selectedRole, setSelectedRole] = useState<
    'interviewer' | 'candidate' | null
  >(null);
  const [isLanguageDetected, setIsLanguageDetected] = useState(false);
  const setRole = useAppStore((s) => s.setRole);
  const userId = useAppStore((s) => s.userId);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const userSettings = useAppStore((s) => s.userSettings);
  const navigate = useNavigate();
  const { t } = useAppTranslation();
  const { i18n } = useTranslation();

  const hasApiKey = !!userSettings.openRouterApiKey;

  // Автоматическое определение языка при загрузке страницы
  useEffect(() => {
    async function initializeLanguage() {
      try {
        const detectedLanguage = await detectUserLanguage();
        saveAndApplyLanguage(detectedLanguage, i18n, setLanguage);
        setIsLanguageDetected(true);
      } catch (error) {
        console.error('Failed to detect language:', error);
        // Fallback на русский
        saveAndApplyLanguage('ru', i18n, setLanguage);
        setIsLanguageDetected(true);
      }
    }

    initializeLanguage();
  }, [i18n, setLanguage]);

  const handleNext = async () => {
    if (selectedRole) {
      setRole(selectedRole);
      // Пытаемся сохранить роль в профиле, если есть userId
      if (userId) {
        try {
          await apiSaveProfile({ userId, role: selectedRole });
        } catch (e) {
          console.warn('Failed to save role to profile:', e);
        }
      }
      navigate('/profession');
    }
  };

  // Показываем загрузку, пока определяется язык
  if (!isLanguageDetected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-telegram-light-gray p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {t('common.detectingLanguage')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-telegram-light-gray p-4">
      <div className="max-w-md mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {t('role.selectRole')}
          </h1>
          <p className="text-muted-foreground">{t('role.roleSubtitle')}</p>
        </div>

        {/* AI Tip Card */}
        {!hasApiKey && (
          <Card className="mb-6 border-2 border-dashed border-yellow-300 bg-yellow-50/50 dark:bg-yellow-950/20">
            <CardContent className="pt-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <Zap className="text-yellow-500 mt-1" size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    {t('home.aiTipTitle')}
                  </h3>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                    {t('home.aiTipDesc')}
                  </p>
                </div>
                <ArrowRight
                  className="flex-shrink-0 text-yellow-600 dark:text-yellow-400"
                  size={16}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Role Cards */}
        <div className="space-y-4 mb-8">
          <RoleCard
            title={t('role.interviewer')}
            description={t('role.interviewerDesc')}
            icon={UserCheck}
            selected={selectedRole === 'interviewer'}
            onClick={() => setSelectedRole('interviewer')}
          />

          <RoleCard
            title={t('role.candidate')}
            description={t('role.candidateDesc')}
            icon={Users}
            selected={selectedRole === 'candidate'}
            onClick={() => setSelectedRole('candidate')}
          />
        </div>

        {/* Next Button */}
        <Button
          onClick={handleNext}
          disabled={!selectedRole}
          className="w-full h-12 text-base font-medium bg-gradient-to-r from-primary to-primary hover:shadow-[0_4px_20px_hsl(var(--primary)/30%)] transition-all duration-300 mb-3"
        >
          {t('navigation.next')}
        </Button>

        {/* Navigation Button */}
        <Button
          onClick={() => navigate('/history')}
          variant="outline"
          className="w-full h-12 text-base font-medium"
        >
          <History className="mr-2 h-4 w-4" />
          {t('history.title')}
        </Button>
      </div>
    </div>
  );
}
