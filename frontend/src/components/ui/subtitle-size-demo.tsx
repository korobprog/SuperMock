import React from 'react';
import { StyledSubtitle } from './styled-subtitle';
import { useAppTranslation } from '@/lib/i18n';

export function SubtitleSizeDemo() {
  const { t } = useAppTranslation();
  const variants = ['gradient', 'default', 'tech', 'elegant', 'mono'] as const;
  const sizes = ['sm', 'md', 'lg', 'xl'] as const;

  return (
    <div className="space-y-8 p-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-6">
          Демонстрация всех размеров и стилей
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {variants.map((variant) => (
            <div key={variant} className="space-y-3">
              <h3 className="text-lg font-semibold capitalize">{variant}</h3>
              {sizes.map((size) => (
                <div key={size} className="space-y-1">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase">
                    {size}
                  </h4>
                  <StyledSubtitle variant={variant} size={size}>
                    {t('common.platformSubtitle')}
                  </StyledSubtitle>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
