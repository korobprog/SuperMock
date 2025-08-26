import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter, Target, Clock, Users, Star } from 'lucide-react';
import { apiGetSlotsWithTools } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { useAppTranslation } from '@/lib/i18n';
import { getToolById } from '@/lib/professions-data';
import { useHapticFeedback } from '@/lib/haptic-feedback';

interface SlotWithTools {
  time: string;
  count: number;
  matchedTools?: string[];
  matchScore?: number;
}

interface SlotsWithToolsProps {
  role: 'candidate' | 'interviewer';
  profession?: string;
  language?: string;
  date?: string;
  timezone?: string;
  onSlotSelect?: (slot: SlotWithTools) => void;
  className?: string;
  defaultMatchStrictness?: 'any' | 'partial' | 'exact';
  showFilterControls?: boolean;
}

export function SlotsWithTools({
  role,
  profession,
  language,
  date,
  timezone,
  onSlotSelect,
  className = '',
  defaultMatchStrictness = 'any',
  showFilterControls = true,
}: SlotsWithToolsProps) {
  const { t } = useAppTranslation();
  const [slots, setSlots] = useState<SlotWithTools[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchStrictness, setMatchStrictness] = useState<
    'any' | 'partial' | 'exact'
  >(defaultMatchStrictness);
  const { light } = useHapticFeedback();
  const { selectedTools } = useAppStore();
  const userId = useAppStore((s) => s.userId);

  const fetchSlots = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiGetSlotsWithTools({
        role,
        profession,
        language,
        date,
        timezone,
        tools: selectedTools.length > 0 ? selectedTools : undefined,
        matchStrictness,
      });

      setSlots(response.slots);
    } catch (err) {
      console.error('Failed to fetch slots with tools:', err);
      
      // В dev режиме используем демо слоты
      if (import.meta.env.DEV) {
        console.log('🔧 Dev mode: using demo slots (backend unavailable)');
        const demoSlots = [
          { time: '2024-01-15T10:00:00Z', count: 5, matchScore: 0.8 },
          { time: '2024-01-15T14:00:00Z', count: 3, matchScore: 0.6 },
          { time: '2024-01-15T18:00:00Z', count: 7, matchScore: 0.9 },
        ];
        setSlots(demoSlots);
        setError(null);
      } else {
        setError('Не удалось загрузить доступные слоты');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [
    role,
    profession,
    language,
    date,
    timezone,
    selectedTools,
    matchStrictness,
    userId,
  ]);

  const handleSlotClick = (slot: SlotWithTools) => {
    onSlotSelect?.(slot);
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 0.6) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (score >= 0.4) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getMatchScoreLabel = (score: number) => {
    if (score >= 0.8) return 'Отличное совпадение';
    if (score >= 0.6) return 'Хорошее совпадение';
    if (score >= 0.4) return 'Среднее совпадение';
    return 'Слабое совпадение';
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-muted-foreground">Загрузка слотов...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="text-center py-8">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={fetchSlots} variant="outline">
            Попробовать снова
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Фильтры */}
      {showFilterControls && (
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Фильтр совпадений:</span>
          </div>

          <Select
            value={matchStrictness}
            onValueChange={(value: 'any' | 'partial' | 'exact') =>
              setMatchStrictness(value)
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Любое совпадение</SelectItem>
              <SelectItem value="partial">Хотя бы 2 инструмента</SelectItem>
              <SelectItem value="exact">Точное совпадение</SelectItem>
            </SelectContent>
          </Select>

          {selectedTools.length > 0 && (
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {t('tools.yourTools')}: {selectedTools.length}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Слоты */}
      {slots.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            Нет доступных слотов
          </h3>
          <p className="text-sm text-muted-foreground">
            {selectedTools.length > 0
              ? t('tools.tryChangeFilter')
              : 'Попробуйте выбрать другие параметры поиска'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {slots.map((slot, index) => (
            <Card
              key={`${slot.time}-${index}`}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleSlotClick(slot)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    {slot.time}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{slot.count}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {slot.matchScore !== undefined && (
                  <div className="mb-3">
                    <Badge
                      variant="outline"
                      className={`${getMatchScoreColor(slot.matchScore)}`}
                    >
                      {getMatchScoreLabel(slot.matchScore)} (
                      {Math.round(slot.matchScore * 100)}%)
                    </Badge>
                  </div>
                )}

                {slot.matchedTools && slot.matchedTools.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {t('tools.matchingTools')}:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {slot.matchedTools.map((toolId) => {
                        const tool = getToolById(toolId);
                        return (
                          <Badge
                            key={toolId}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tool?.name || toolId}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
