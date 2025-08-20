import React from 'react';
import { StyledSubtitle } from './styled-subtitle';
import { useAppTranslation } from '@/lib/i18n';

export function SubtitleDemo() {
  const { t } = useAppTranslation();

  return (
    <div className="space-y-8 p-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-6">
          Варианты стильных подзаголовков
        </h2>

        {/* Размеры */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Размеры</h3>
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Small (sm)
              </h4>
              <StyledSubtitle variant="gradient" size="sm">
                {t('common.platformSubtitle')}
              </StyledSubtitle>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Medium (md) - по умолчанию
              </h4>
              <StyledSubtitle variant="gradient" size="md">
                {t('common.platformSubtitle')}
              </StyledSubtitle>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Large (lg)
              </h4>
              <StyledSubtitle variant="gradient" size="lg">
                {t('common.platformSubtitle')}
              </StyledSubtitle>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Extra Large (xl)
              </h4>
              <StyledSubtitle variant="gradient" size="xl">
                {t('common.platformSubtitle')}
              </StyledSubtitle>
            </div>
          </div>
        </div>

        {/* Варианты стилей */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Варианты стилей</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Gradient (по умолчанию)
              </h4>
              <StyledSubtitle variant="gradient" size="lg">
                {t('common.platformSubtitle')}
              </StyledSubtitle>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Default
              </h4>
              <StyledSubtitle variant="default" size="lg">
                {t('common.platformSubtitle')}
              </StyledSubtitle>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Tech (с подчеркиванием)
              </h4>
              <StyledSubtitle variant="tech" size="lg">
                {t('common.platformSubtitle')}
              </StyledSubtitle>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Elegant (курсив)
              </h4>
              <StyledSubtitle variant="elegant" size="lg">
                {t('common.platformSubtitle')}
              </StyledSubtitle>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Mono (моноширинный)
              </h4>
              <StyledSubtitle variant="mono" size="lg">
                {t('common.platformSubtitle')}
              </StyledSubtitle>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
