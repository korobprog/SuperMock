import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ProfessionCard } from '@/components/ui/profession-card';
import { Logo } from '@/components/ui/logo';
import { ArrowLeft } from 'lucide-react';
import { useAppTranslation } from '@/lib/i18n';
import { apiSaveProfile } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import {
  detectUserLanguage,
  saveAndApplyLanguage,
} from '@/lib/language-detection';

export function ProfessionSelection() {
  const [selectedProfession, setSelectedProfession] = useState<string | null>(
    null
  );
  const [isLanguageDetected, setIsLanguageDetected] = useState(false);
  const setProfession = useAppStore((s) => s.setProfession);
  const setUserId = useAppStore((s) => s.setUserId);
  const userId = useAppStore((s) => s.userId);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const currentLanguage = useAppStore((s) => s.language);
  const navigate = useNavigate();
  const { t } = useAppTranslation();
  const { i18n } = useTranslation();

  // Проверяем и обновляем язык при загрузке страницы
  useEffect(() => {
    async function ensureLanguageIsSet() {
      try {
        // Если язык уже определен в store и совпадает с i18n, ничего не делаем
        if (currentLanguage && i18n.language === currentLanguage) {
          setIsLanguageDetected(true);
          return;
        }

        // Иначе определяем язык заново
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

    ensureLanguageIsSet();
  }, [i18n, setLanguage, currentLanguage]);

  const professions = [
    {
      id: 'frontend',
      title: t('profession.frontend'),
      description: t('profession.frontendDesc'),
      tags: [
        t('tags.react'),
        t('tags.vue'),
        t('tags.angular'),
        t('tags.typescript'),
      ],
    },
    {
      id: 'backend',
      title: t('profession.backend'),
      description: t('profession.backendDesc'),
      tags: [
        t('tags.nodejs'),
        t('tags.python'),
        t('tags.java'),
        t('tags.dotnet'),
      ],
    },
    {
      id: 'fullstack',
      title: t('profession.fullstack'),
      description: t('profession.fullstackDesc'),
      tags: [
        t('tags.javascript'),
        t('tags.typescript'),
        t('tags.nodejs'),
        t('tags.react'),
      ],
    },
    {
      id: 'mobile',
      title: t('profession.mobile'),
      description: t('profession.mobileDesc'),
      tags: [
        t('tags.ios'),
        t('tags.android'),
        t('tags.flutter'),
        t('tags.react'),
      ],
    },
    {
      id: 'devops',
      title: t('profession.devops'),
      description: t('profession.devopsDesc'),
      tags: [
        t('tags.docker'),
        t('tags.kubernetes'),
        t('tags.aws'),
        t('tags.automation'),
      ],
    },
    {
      id: 'qa',
      title: t('profession.qa'),
      description: t('profession.qaDesc'),
      tags: [
        t('tags.automation'),
        t('tags.testing'),
        t('tags.python'),
        t('tags.java'),
      ],
    },
    {
      id: 'designer',
      title: t('profession.designer'),
      description: t('profession.designerDesc'),
      tags: [
        t('tags.figma'),
        t('tags.research'),
        'Prototyping',
        'User Research',
      ],
    },
    {
      id: 'analyst',
      title: t('profession.analyst'),
      description: t('profession.analystDesc'),
      tags: [t('tags.sql'), t('tags.python'), 'Excel', 'Tableau'],
    },
    {
      id: 'scientist',
      title: t('profession.scientist'),
      description: t('profession.scientistDesc'),
      tags: [t('tags.python'), t('tags.ml'), t('tags.ai'), t('tags.research')],
    },
    {
      id: 'pm',
      title: t('profession.pm'),
      description: t('profession.pmDesc'),
      tags: [t('tags.agile'), t('tags.strategy'), 'Analytics', 'Roadmap'],
    },
  ];

  const handleNext = async () => {
    if (selectedProfession) {
      setProfession(selectedProfession);

      // В dev режиме создаем локальный userId если его нет
      let currentUserId = userId;
      if (!currentUserId && import.meta.env.DEV) {
        const localId = Math.floor(Math.random() * 1000000) + 1000000; // Генерируем ID от 1000000
        setUserId(localId);
        currentUserId = localId;
        console.log('🎭 Generated local userId for dev mode:', localId);
      }

      if (currentUserId) {
        try {
          await apiSaveProfile({
            userId: currentUserId,
            profession: selectedProfession,
          });
        } catch (e) {
          console.warn('Failed to save profession to profile:', e);
        }
      }

      // Перенаправляем на выбор инструментов вместо языка
      navigate('/tools');
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  // Показываем загрузку, пока определяется язык
  if (!isLanguageDetected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-telegram-light-gray p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-telegram-light-gray p-4">
      <div className="max-w-md mx-auto pt-16 sm:pt-20">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
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
              {t('profession.selectProfession')}
            </h1>
          </div>
        </div>

        <p className="text-center text-muted-foreground mb-6">
          {t('profession.professionSubtitle')}
        </p>

        {/* Profession Cards */}
        <div className="space-y-3">
          {professions.map((profession) => (
            <div key={profession.id}>
              <ProfessionCard
                title={profession.title}
                description={profession.description}
                tags={profession.tags}
                selected={selectedProfession === profession.id}
                onClick={() => setSelectedProfession(profession.id)}
              />

              {/* Next Button appears under selected card */}
              {selectedProfession === profession.id && (
                <div className="mt-4 mb-6">
                  <Button
                    onClick={handleNext}
                    className="w-full h-12 text-base font-medium bg-gradient-to-r from-primary to-primary hover:shadow-[0_4px_20px_hsl(var(--primary)/30%)] transition-all duration-300"
                  >
                    {t('navigation.next')}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
