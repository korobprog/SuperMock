import { useState } from 'react';
import {
  Users,
  TrendingUp,
  Lightbulb,
  Info,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
} from 'lucide-react';
import { Badge } from './badge';
import { useAppTranslation } from '@/lib/i18n';

interface SlotAnalysis {
  time: string;
  candidateCount: number;
  interviewerCount: number;
  load: number;
  recommendation: 'high' | 'medium' | 'low';
}

interface InfoPanelProps {
  mode: 'candidate' | 'interviewer';
  candidateCounts: Record<string, number>;
  interviewerCounts: Record<string, number>;
  recommendedSlot?: SlotAnalysis;
  onClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  timeUntilMatch?: string | null;
  selectedSlots?: string[];
  getUTCTimeForSlot?: (localTime: string) => string;
}

export function InfoPanel({
  mode,
  candidateCounts,
  interviewerCounts,
  recommendedSlot,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
  timeUntilMatch,
  selectedSlots = [],
  getUTCTimeForSlot,
}: InfoPanelProps) {
  const { t } = useAppTranslation();

  // Получаем цвет для рекомендации
  const getRecommendationColor = (
    recommendation: 'high' | 'medium' | 'low'
  ) => {
    switch (recommendation) {
      case 'high':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <Info size={16} className="mr-2 text-blue-600" />
          <h3 className="text-sm font-medium text-blue-900">
            {t('time.analysis.title')}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="text-blue-600 hover:text-blue-800 transition-colors p-1"
              title={
                isCollapsed
                  ? t('time.analysis.expand')
                  : t('time.analysis.collapse')
              }
            >
              {isCollapsed ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronUp size={16} />
              )}
            </button>
          )}
          <button
            onClick={onClose}
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Свернутое состояние - минимальная информация */}
      {isCollapsed ? (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center">
            <Users size={14} className="mr-1 text-blue-600" />
            <span className="text-blue-800">
              {mode === 'candidate'
                ? t('role.interviewer')
                : t('role.candidate')}
              :
              <span className="font-medium ml-1">
                {Object.values(
                  mode === 'candidate' ? interviewerCounts : candidateCounts
                ).reduce((sum, count) => sum + count, 0)}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            {timeUntilMatch && (
              <div className="flex items-center">
                <Clock size={14} className="mr-1 text-green-600" />
                <span className="text-xs text-green-700 font-medium">
                  {timeUntilMatch}
                </span>
              </div>
            )}
            {recommendedSlot && (
              <div className="flex items-center">
                <Lightbulb size={14} className="mr-1 text-yellow-600" />
                <Badge
                  className={`text-xs ${getRecommendationColor(
                    recommendedSlot.recommendation
                  )}`}
                >
                  {recommendedSlot.time}
                </Badge>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Развернутое состояние - полная информация */
        <div className="space-y-3">
          {/* Общая статистика */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <Users size={14} className="mr-1 text-blue-600" />
              <span className="text-blue-800">
                {mode === 'candidate'
                  ? t('role.interviewer')
                  : t('role.candidate')}{' '}
                {t('time.analysis.online')}:
              </span>
            </div>
            <span className="font-medium text-blue-900">
              {Object.values(
                mode === 'candidate' ? interviewerCounts : candidateCounts
              ).reduce((sum, count) => sum + count, 0)}
            </span>
          </div>

          {/* Рекомендуемый слот */}
          {recommendedSlot && (
            <div className="flex items-center justify-between p-2 bg-white rounded border">
              <div className="flex items-center">
                <Lightbulb size={14} className="mr-1 text-yellow-600" />
                <span className="text-sm text-blue-800">
                  {t('time.analysis.recommendedTime')}
                </span>
              </div>
              <Badge
                className={`text-xs ${getRecommendationColor(
                  recommendedSlot.recommendation
                )}`}
              >
                {recommendedSlot.time}
              </Badge>
            </div>
          )}

          {/* Время до матчинга */}
          {timeUntilMatch && (
            <div className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
              <div className="flex items-center">
                <Clock size={14} className="mr-1 text-green-600" />
                <span className="text-sm text-green-800">
                  {t('time.analysis.untilMatch')}
                </span>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-green-700">
                  {timeUntilMatch}
                </span>
                {selectedSlots.length > 0 && getUTCTimeForSlot && (
                  <div className="text-xs text-green-600 mt-1">
                    {t('time.timeDisplay.yourTime')}: {selectedSlots[0]}
                    <br />
                    {t('time.timeDisplay.utcTime')}:{' '}
                    {getUTCTimeForSlot(selectedSlots[0])}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Причина рекомендации */}
          {recommendedSlot && (
            <div className="text-xs text-blue-700 bg-white p-2 rounded border">
              <TrendingUp size={12} className="inline mr-1" />
              {mode === 'candidate'
                ? `${t('time.analysis.interviewersShort')}: ${
                    recommendedSlot.interviewerCount
                  }, ${t('time.analysis.candidates')}: ${
                    recommendedSlot.candidateCount
                  }`
                : `${t('time.analysis.candidates')}: ${
                    recommendedSlot.candidateCount
                  }, ${t('time.analysis.interviewersShort')}: ${
                    recommendedSlot.interviewerCount
                  }`}
              <br />
              <span className="text-gray-600">
                {t('time.analysis.load')} {recommendedSlot.load}%
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
