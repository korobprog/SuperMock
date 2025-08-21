import React, { useState, useMemo } from 'react';
import { Badge } from './badge';
import { Button } from './button';
import { Input } from './input';
import { Search, X, Check } from 'lucide-react';
import { Tool } from '@/lib/professions-data';
import { useAppTranslation } from '@/lib/i18n';

interface ToolSelectorProps {
  tools: Tool[];
  selectedTools: string[];
  onToolsChange: (tools: string[]) => void;
  maxSelection?: number;
  minSelection?: number;
  showSearch?: boolean;
  showCategories?: boolean;
  className?: string;
}

export function ToolSelector({
  tools,
  selectedTools,
  onToolsChange,
  maxSelection = 7,
  minSelection = 2,
  showSearch = true,
  showCategories = true,
  className = '',
}: ToolSelectorProps) {
  const { t } = useAppTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Фильтрация инструментов по поиску и категории
  const filteredTools = useMemo(() => {
    let filtered = tools;

    if (searchQuery) {
      filtered = filtered.filter((tool) =>
        tool.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((tool) => tool.category === selectedCategory);
    }

    return filtered;
  }, [tools, searchQuery, selectedCategory]);

  // Группировка по категориям
  const toolsByCategory = useMemo(() => {
    const grouped: Record<string, Tool[]> = {};
    filteredTools.forEach((tool) => {
      if (!grouped[tool.category]) {
        grouped[tool.category] = [];
      }
      grouped[tool.category].push(tool);
    });
    return grouped;
  }, [filteredTools]);

  const handleToolToggle = (toolId: string) => {
    const newSelected = selectedTools.includes(toolId)
      ? selectedTools.filter((id) => id !== toolId)
      : selectedTools.length < maxSelection
      ? [...selectedTools, toolId]
      : selectedTools;

    onToolsChange(newSelected);
  };

  const handleSelectPopular = (toolIds: string[]) => {
    const newSelected = [...selectedTools];
    toolIds.forEach((id) => {
      if (!newSelected.includes(id) && newSelected.length < maxSelection) {
        newSelected.push(id);
      }
    });
    onToolsChange(newSelected);
  };

  const isSelectionValid = selectedTools.length >= minSelection;
  const isMaxReached = selectedTools.length >= maxSelection;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Поиск */}
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={t('tools.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Фильтр по категориям */}
      {showCategories && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            {t('tools.allCategories')}
          </Button>
          {['frameworks', 'languages', 'databases', 'tools', 'platforms', 'design', 'testing', 'devops'].map((key) => (
            <Button
              key={key}
              variant={selectedCategory === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(key)}
            >
              {t(`tools.categories.${key}`)}
            </Button>
          ))}
        </div>
      )}

      {/* Счетчик выбранных */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {t('tools.selectedCount', { count: selectedTools.length, max: maxSelection })}
        </span>
        {!isSelectionValid && (
          <span className="text-destructive">
            {t('tools.minimumTools', { count: minSelection })}
          </span>
        )}
      </div>

      {/* Инструменты */}
      {showCategories ? (
        // Группировка по категориям
        <div className="space-y-6">
          {Object.entries(toolsByCategory).map(([category, categoryTools]) => (
            <div key={category} className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                {t(`tools.categories.${category}`)}
              </h3>
              <div className="flex flex-wrap gap-2">
                {categoryTools.map((tool) => (
                  <ToolBadge
                    key={tool.id}
                    tool={tool}
                    selected={selectedTools.includes(tool.id)}
                    disabled={!selectedTools.includes(tool.id) && isMaxReached}
                    onClick={() => handleToolToggle(tool.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Простой список
        <div className="flex flex-wrap gap-2">
          {filteredTools.map((tool) => (
            <ToolBadge
              key={tool.id}
              tool={tool}
              selected={selectedTools.includes(tool.id)}
              disabled={!selectedTools.includes(tool.id) && isMaxReached}
              onClick={() => handleToolToggle(tool.id)}
            />
          ))}
        </div>
      )}

      {/* Сообщение если ничего не найдено */}
      {filteredTools.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {searchQuery
            ? t('tools.noToolsFound')
            : t('tools.noToolsAvailable')}
        </div>
      )}
    </div>
  );
}

interface ToolBadgeProps {
  tool: Tool;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}

function ToolBadge({ tool, selected, disabled, onClick }: ToolBadgeProps) {
  return (
    <Badge
      variant={selected ? 'default' : 'outline'}
      className={`
        cursor-pointer transition-all duration-200
        ${selected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        flex items-center gap-2 px-3 py-1
      `}
      onClick={disabled ? undefined : onClick}
    >
      {selected && <Check className="h-3 w-3" />}
      {tool.name}
    </Badge>
  );
}
