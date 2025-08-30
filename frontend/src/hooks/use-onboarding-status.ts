import { useMemo } from 'react';
import { useAppStore } from '@/lib/store';

export interface OnboardingStatus {
  isComplete: boolean;
  completedSteps: string[];
  missingSteps: string[];
  progress: number;
}

export function useOnboardingStatus(): OnboardingStatus {
  const profession = useAppStore((s) => s.profession);
  const language = useAppStore((s) => s.language);
  const selectedTools = useAppStore((s) => s.selectedTools);
  const userSettings = useAppStore((s) => s.userSettings);

  const status = useMemo(() => {
    const steps = [
      { key: 'profession', label: 'Профессия', completed: !!profession },
      { key: 'language', label: 'Язык', completed: !!language },
      { key: 'tools', label: 'Инструменты', completed: selectedTools.length >= 2 },
      { key: 'apiKey', label: 'API ключ', completed: !!userSettings.openRouterApiKey },
    ];

    const completedSteps = steps
      .filter(step => step.completed)
      .map(step => step.key);

    const missingSteps = steps
      .filter(step => !step.completed)
      .map(step => step.key);

    const progress = Math.round((completedSteps.length / steps.length) * 100);
    const isComplete = completedSteps.length === steps.length;

    return {
      isComplete,
      completedSteps,
      missingSteps,
      progress,
    };
  }, [profession, language, selectedTools, userSettings.openRouterApiKey]);

  return status;
}

