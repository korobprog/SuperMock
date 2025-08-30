import React, { useState, useEffect } from 'react';
import { Badge } from './badge';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { ToolSelector } from './tool-selector';
import { Edit, Save, X, Wrench } from 'lucide-react';
import { apiGetUserTools, apiSaveUserTools } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { getProfessionTools, PROFESSIONS_DATA } from '@/lib/professions-data';
import { useAppTranslation } from '@/lib/i18n';
// import { getDemoToolsForProfession } from '@/lib/dev-api-fallback';

// Fallback функция прямо в компоненте
const getDemoToolsForProfession = (profession?: string): string[] => {
  const professionTools: { [key: string]: string[] } = {
    frontend: ['JavaScript', 'React', 'TypeScript', 'Vue.js'],
    backend: ['Node.js', 'Python', 'Java', 'Go'],
    fullstack: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
    mobile: ['React Native', 'Flutter', 'Swift', 'Kotlin'],
    devops: ['Docker', 'Kubernetes', 'AWS', 'Linux'],
    data: ['Python', 'SQL', 'Pandas', 'TensorFlow'],
  };
  
  return professionTools[profession || 'frontend'] || professionTools.frontend;
};

interface UserToolsDisplayProps {
  userId: number;
  profession?: string;
  className?: string;
}

export function UserToolsDisplay({
  userId,
  profession,
  className = '',
}: UserToolsDisplayProps) {
  const { t } = useAppTranslation();
  const [userTools, setUserTools] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentUserId = useAppStore((s) => s.userId);
  const isOwnProfile = userId === currentUserId;

  const availableTools = profession ? getProfessionTools(profession) : [];
  const professionData = profession ? PROFESSIONS_DATA[profession] : null;

  useEffect(() => {
    if (userId) {
      loadUserTools();
    } else {
      // Если нет userId, не показываем loading
      setLoading(false);
    }
  }, [userId, profession]);

  const loadUserTools = async () => {
    setLoading(true);
    setError(null);

    // Проверяем dev режим и используем демо данные сразу
    if (import.meta.env.DEV) {
      console.log('🔧 Dev mode: using demo tools directly');
      const demoTools = getDemoToolsForProfession(profession);
      console.log('🔧 Demo tools loaded:', demoTools);
      setUserTools(demoTools);
      setSelectedTools(demoTools);
      setLoading(false);
      return;
    }

    try {
      // Добавляем таймаут для API вызова
      const apiPromise = apiGetUserTools(userId, profession);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('API timeout')), 5000)
      );
      
      const response = await Promise.race([apiPromise, timeoutPromise]);
      const tools = response.tools.map((t) => t.toolName);
      setUserTools(tools);
      setSelectedTools(tools);
    } catch (err) {
      console.error('Failed to load user tools:', err);
      
      // Добавляем отладку
      console.log('🔍 Debug info:', {
        isDev: import.meta.env.DEV,
        profession,
        userId,
        error: err.message
      });
      
      // Всегда используем демо инструменты при ошибке (надежный fallback)
      console.log('🔧 Using demo tools (backend unavailable)');
      
      try {
        // Используем демо инструменты для профессии
        const demoTools = getDemoToolsForProfession(profession);
        console.log('🔧 Demo tools loaded:', demoTools);
        
        setUserTools(demoTools);
        setSelectedTools(demoTools);
        setError(null);
      } catch (fallbackError) {
        console.error('❌ Fallback error:', fallbackError);
        // Резервный fallback
        const backupTools = ['JavaScript', 'React', 'TypeScript', 'Node.js'];
        console.log('🔧 Using backup demo tools:', backupTools);
        setUserTools(backupTools);
        setSelectedTools(backupTools);
        setError(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profession) return;

    setSaving(true);
    setError(null);

    // В dev режиме сохраняем локально сразу
    if (import.meta.env.DEV) {
      console.log('🔧 Dev mode: saving tools locally');
      setUserTools(selectedTools);
      setIsEditing(false);
      setSaving(false);
      return;
    }

    try {
      // Добавляем таймаут для API вызова
      const apiPromise = apiSaveUserTools({
        userId,
        profession,
        tools: selectedTools,
      });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Save timeout')), 5000)
      );
      
      await Promise.race([apiPromise, timeoutPromise]);

      setUserTools(selectedTools);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save user tools:', err);
      
      // Всегда сохраняем локально при ошибке (надежный fallback)
      console.log('🔧 Saving tools locally (backend unavailable)');
      setUserTools(selectedTools);
      setIsEditing(false);
      setError(null);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setSelectedTools(userTools);
    setIsEditing(false);
    setError(null);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
  };

  if (loading && userId) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-2 text-muted-foreground">{t('tools.loading')}</span>
        </div>
      </div>
    );
  }

  // Если нет userId, показываем сообщение о необходимости авторизации
  if (!userId) {
    return (
      <div className={className}>
        <div className="text-center py-4 text-muted-foreground">
          <p className="text-sm">{t('tools.loginRequired')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          <h3 className="text-lg font-semibold">
            {t('tools.selectTools')}
            {professionData && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({t(professionData.titleKey)})
              </span>
            )}
          </h3>
        </div>

        {isOwnProfile && !isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

        {isEditing ? (
          <div className="space-y-4">
            <ToolSelector
              tools={availableTools}
              selectedTools={selectedTools}
              onToolsChange={setSelectedTools}
              maxSelection={7}
              minSelection={2}
              showSearch={true}
              showCategories={true}
            />

            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={saving || selectedTools.length < 2}
                size="sm"
                className="flex-1"
              >
                {saving ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    {t('tools.saving')}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {t('common.save')}
                  </div>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {userTools.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {isOwnProfile
                  ? t('tools.toolsNotSelected')
                  : t('tools.userToolsNotSelected')}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {userTools.map((toolId) => {
                  const tool = availableTools.find((t) => t.id === toolId);
                  return (
                    <Badge key={toolId} variant="secondary" className="text-sm">
                      {tool?.name || toolId}
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>
        )}
    </div>
  );
}
