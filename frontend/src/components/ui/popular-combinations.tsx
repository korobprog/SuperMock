import React from 'react';
import { Badge } from './badge';
import { Button } from './button';
import { Sparkles } from 'lucide-react';
import { getToolById } from '@/lib/professions-data';

interface PopularCombinationsProps {
  combinations: string[][];
  selectedTools: string[];
  onSelectCombination: (toolIds: string[]) => void;
  maxSelection?: number;
  className?: string;
}

export function PopularCombinations({
  combinations,
  selectedTools,
  onSelectCombination,
  maxSelection = 7,
  className = '',
}: PopularCombinationsProps) {
  if (combinations.length === 0) {
    return null;
  }

  const handleSelectCombination = (toolIds: string[]) => {
    const newSelected = [...selectedTools];
    toolIds.forEach((id) => {
      if (!newSelected.includes(id) && newSelected.length < maxSelection) {
        newSelected.push(id);
      }
    });
    onSelectCombination(newSelected);
  };

  const getCombinationOverlap = (toolIds: string[]) => {
    return toolIds.filter((id) => selectedTools.includes(id)).length;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Sparkles className="h-4 w-4" />
        Популярные комбинации
      </div>

      <div className="space-y-3">
        {combinations.map((combination, index) => {
          const overlap = getCombinationOverlap(combination);
          const isFullySelected = overlap === combination.length;
          const canAdd =
            selectedTools.length + (combination.length - overlap) <=
            maxSelection;

          return (
            <div
              key={index}
              className={`
                p-3 rounded-lg border transition-all duration-200
                ${
                  isFullySelected
                    ? 'bg-primary/10 border-primary/20'
                    : 'bg-muted/50 border-border hover:bg-muted'
                }
              `}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex flex-wrap gap-1">
                  {combination.map((toolId) => {
                    const tool = getToolById(toolId);
                    const isSelected = selectedTools.includes(toolId);

                    return (
                      <Badge
                        key={toolId}
                        variant={isSelected ? 'default' : 'secondary'}
                        className={`
                          text-xs px-2 py-1
                          ${
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : ''
                          }
                        `}
                      >
                        {tool?.name || toolId}
                      </Badge>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  {overlap > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {overlap}/{combination.length} выбрано
                    </span>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectCombination(combination)}
                    disabled={!canAdd || isFullySelected}
                    className="text-xs h-7 px-2"
                  >
                    {isFullySelected ? 'Выбрано' : 'Выбрать'}
                  </Button>
                </div>
              </div>

              {!canAdd && !isFullySelected && (
                <p className="text-xs text-destructive">
                  Достигнут лимит выбора инструментов
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
