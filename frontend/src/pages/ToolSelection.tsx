import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ToolSelector } from '@/components/ui/tool-selector';
import { PopularCombinations } from '@/components/ui/popular-combinations';
import { Logo } from '@/components/ui/logo';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { useAppTranslation } from '@/lib/i18n';
import { apiSaveUserTools } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import {
  getProfessionTools,
  getPopularCombinations,
  PROFESSIONS_DATA,
} from '@/lib/professions-data';
import {
  detectUserLanguage,
  saveAndApplyLanguage,
} from '@/lib/language-detection';

export function ToolSelection() {
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [isLanguageDetected, setIsLanguageDetected] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const setSelectedToolsStore = useAppStore((s) => s.setSelectedTools);
  const setProfession = useAppStore((s) => s.setProfession);
  const setUserId = useAppStore((s) => s.setUserId);
  const userId = useAppStore((s) => s.userId);
  const profession = useAppStore((s) => s.profession);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const currentLanguage = useAppStore((s) => s.language);

  const navigate = useNavigate();
  const { t } = useAppTranslation();

  // Проверяем и обновляем язык при загрузке страницы
  useEffect(() => {
    async function ensureLanguageIsSet() {
      try {
        if (currentLanguage) {
          setIsLanguageDetected(true);
          return;
        }

        const detectedLanguage = await detectUserLanguage();
        saveAndApplyLanguage(detectedLanguage, null, setLanguage);
        setIsLanguageDetected(true);
      } catch (error) {
        console.error('Failed to detect language:', error);
        saveAndApplyLanguage('ru', null, setLanguage);
        setIsLanguageDetected(true);
      }
    }

    ensureLanguageIsSet();
  }, [setLanguage, currentLanguage]);

  // Если профессия не выбрана, перенаправляем на выбор профессии
  useEffect(() => {
    if (isLanguageDetected && !profession) {
      navigate('/profession');
    }
  }, [profession, isLanguageDetected, navigate]);

  const professionData = profession ? PROFESSIONS_DATA[profession] : null;
  const availableTools = professionData?.tools || [];
  const popularCombinations = professionData
    ? getPopularCombinations(profession)
    : [];

  const handleNext = async () => {
    if (selectedTools.length < 2) return;

    setIsSaving(true);

    try {
      // Сохраняем в store
      setSelectedToolsStore(selectedTools);

      // В dev режиме создаем локальный userId если его нет
      let currentUserId = userId;
      if (!currentUserId && import.meta.env.DEV) {
        const localId = Math.floor(Math.random() * 1000000) + 1000000;
        setUserId(localId);
        currentUserId = localId;
        console.log('🎭 Generated local userId for dev mode:', localId);
      }

      // Сохраняем в базу данных
      if (currentUserId && profession) {
        try {
          await apiSaveUserTools({
            userId: currentUserId,
            profession,
            tools: selectedTools,
          });
        } catch (e) {
          console.warn('Failed to save tools to database:', e);
        }
      }

      navigate('/time');
    } catch (error) {
      console.error('Failed to save tools:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    navigate('/profession');
  };

  const handleSelectCombination = (toolIds: string[]) => {
    setSelectedTools(toolIds);
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

  // Если профессия не выбрана, показываем загрузку
  if (!profession || !professionData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-telegram-light-gray p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('tools.loading')}</p>
        </div>
      </div>
    );
  }

  const isSelectionValid = selectedTools.length >= 2;
  const isMaxReached = selectedTools.length >= 7;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-telegram-light-gray p-4">
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
              {t('tools.selectTools')}
            </h1>
          </div>
          {selectedTools.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTools([])}
              className="ml-2 p-2 text-muted-foreground hover:text-foreground"
            >
              {t('tools.reset')}
            </Button>
          )}
        </div>

        {/* Profession Info */}
        <div className="mb-6 p-4 bg-muted/50 rounded-lg">
          <h2 className="font-semibold text-foreground mb-1">
            {t(professionData.titleKey)}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t(professionData.descriptionKey)}
          </p>
        </div>

        <p className="text-center text-muted-foreground mb-6">
          {t('tools.subtitle')}
        </p>

        {/* Popular Combinations */}
        {popularCombinations.length > 0 && (
          <div className="mb-6">
            <PopularCombinations
              combinations={popularCombinations}
              selectedTools={selectedTools}
              onSelectCombination={handleSelectCombination}
              maxSelection={7}
            />
          </div>
        )}

        {/* Reset Button */}
        {selectedTools.length > 0 && (
          <div className="mb-4 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedTools([])}
              className="text-muted-foreground hover:text-foreground"
            >
              {t('tools.resetSelection')} ({selectedTools.length})
            </Button>
          </div>
        )}

        {/* Tool Selector */}
        <div className="mb-6">
          <ToolSelector
            tools={availableTools}
            selectedTools={selectedTools}
            onToolsChange={setSelectedTools}
            maxSelection={7}
            minSelection={2}
            showSearch={true}
            showCategories={true}
          />
        </div>

        {/* Validation Message */}
        {!isSelectionValid && selectedTools.length > 0 && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">
              {t('tools.minSelection')}
            </p>
          </div>
        )}

        {/* Next Button */}
        <div className="sticky bottom-4 z-[60]">
          <Button
            onClick={handleNext}
            disabled={!isSelectionValid || isSaving}
            className="w-full h-12 text-base font-medium bg-gradient-to-r from-primary to-primary hover:shadow-[0_4px_20px_hsl(var(--primary)/30%)] transition-all duration-300"
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {t('tools.saving')}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {isSelectionValid && <CheckCircle className="h-4 w-4" />}
                {t('navigation.next')}
                <ArrowRight className="h-4 w-4" />
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
