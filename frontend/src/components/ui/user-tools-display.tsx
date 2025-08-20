import React, { useState, useEffect } from 'react';
import { Badge } from './badge';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { ToolSelector } from './tool-selector';
import { Edit, Save, X, Tool } from 'lucide-react';
import { apiGetUserTools, apiSaveUserTools } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { getProfessionTools, PROFESSIONS_DATA } from '@/lib/professions-data';

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
    }
  }, [userId, profession]);

  const loadUserTools = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiGetUserTools(userId, profession);
      const tools = response.tools.map((t) => t.toolName);
      setUserTools(tools);
      setSelectedTools(tools);
    } catch (err) {
      console.error('Failed to load user tools:', err);
      setError('Не удалось загрузить инструменты');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profession) return;

    setSaving(true);
    setError(null);

    try {
      await apiSaveUserTools({
        userId,
        profession,
        tools: selectedTools,
      });

      setUserTools(selectedTools);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save user tools:', err);
      setError('Не удалось сохранить инструменты');
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

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tool className="h-5 w-5" />
            Инструменты
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Загрузка...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Tool className="h-5 w-5" />
            Инструменты
            {professionData && (
              <span className="text-sm font-normal text-muted-foreground">
                ({professionData.title})
              </span>
            )}
          </CardTitle>

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
      </CardHeader>

      <CardContent>
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
                    Сохранение...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Сохранить
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
                  ? 'Вы еще не выбрали инструменты. Нажмите "Редактировать" чтобы добавить.'
                  : 'Пользователь еще не выбрал инструменты.'}
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
      </CardContent>
    </Card>
  );
}
