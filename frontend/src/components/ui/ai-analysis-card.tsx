import React from 'react';
import { Brain, TrendingUp, TrendingDown, Target, Award, BookOpen, Lightbulb, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useAppTranslation } from '@/lib/i18n';

// 🧠 Типы для AI анализа
interface SkillLevel {
  skill: string;
  level: number; // 1-10
  confidence: number; // 0-1
}

interface FeedbackAnalysis {
  id?: number;
  feedbackId?: number;
  userId?: string;
  weaknesses: string[];
  strengths: string[];
  skillLevels: SkillLevel[];
  communicationScore: number; // 1-10
  technicalScore: number; // 1-10
  overallReadiness: number; // 1-10
  suggestions: string[];
  uniquenessScore: number; // 0-1
  summary: string;
  aiModel?: string;
  createdAt?: string;
}

interface AIAnalysisCardProps {
  analysis: FeedbackAnalysis;
  className?: string;
  onViewRecommendations?: () => void;
  onStartLearning?: () => void;
  isLoading?: boolean;
}

export function AIAnalysisCard({ 
  analysis, 
  className = '', 
  onViewRecommendations, 
  onStartLearning,
  isLoading = false 
}: AIAnalysisCardProps) {
  const { t } = useAppTranslation();

  if (isLoading) {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-blue-500 animate-pulse" />
            <CardTitle className="text-lg font-semibold">
              {t('ai.analysis.loading', 'AI анализирует ваше собеседование...')}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const getReadinessLevel = (score: number): { label: string; color: string } => {
    if (score >= 8) return { label: t('ai.readiness.high', 'Высокая готовность'), color: 'text-green-600' };
    if (score >= 6) return { label: t('ai.readiness.medium', 'Средняя готовность'), color: 'text-yellow-600' };
    return { label: t('ai.readiness.low', 'Требуется развитие'), color: 'text-red-600' };
  };

  const getScoreColor = (score: number): string => {
    if (score >= 8) return 'bg-green-500';
    if (score >= 6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const readiness = getReadinessLevel(analysis.overallReadiness);

  return (
    <Card className={`w-full ${className} border-l-4 border-l-blue-500`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-lg font-semibold">
              {t('ai.analysis.title', 'AI Анализ собеседования')}
            </CardTitle>
          </div>
          <Badge variant="outline" className="flex items-center space-x-1">
            <Star className="h-3 w-3" />
            <span>{(analysis.uniquenessScore * 100).toFixed(0)}% уникальность</span>
          </Badge>
        </div>
        <CardDescription className="text-sm text-gray-600">
          {analysis.summary}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Общая готовность */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium flex items-center space-x-2">
              <Target className="h-4 w-4" />
              <span>{t('ai.overall_readiness', 'Общая готовность')}</span>
            </h4>
            <span className={`text-sm font-semibold ${readiness.color}`}>
              {analysis.overallReadiness}/10 • {readiness.label}
            </span>
          </div>
          <Progress 
            value={analysis.overallReadiness * 10} 
            className="h-2"
            style={{
              background: `linear-gradient(to right, ${getScoreColor(analysis.overallReadiness)} 0%, ${getScoreColor(analysis.overallReadiness)} ${analysis.overallReadiness * 10}%, #e5e7eb ${analysis.overallReadiness * 10}%, #e5e7eb 100%)`
            }}
          />
        </div>

        {/* Оценки по категориям */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {t('ai.communication_score', 'Коммуникация')}
              </span>
              <span className="text-sm font-semibold">
                {analysis.communicationScore}/10
              </span>
            </div>
            <Progress value={analysis.communicationScore * 10} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {t('ai.technical_score', 'Техническая часть')}
              </span>
              <span className="text-sm font-semibold">
                {analysis.technicalScore}/10
              </span>
            </div>
            <Progress value={analysis.technicalScore * 10} className="h-2" />
          </div>
        </div>

        {/* Сильные стороны и слабости */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Сильные стороны */}
          <div>
            <h4 className="font-medium mb-3 flex items-center space-x-2 text-green-600">
              <TrendingUp className="h-4 w-4" />
              <span>{t('ai.strengths', 'Сильные стороны')}</span>
            </h4>
            <div className="space-y-2">
              {analysis.strengths.slice(0, 3).map((strength, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="bg-green-50 text-green-700 border-green-200"
                >
                  {strength}
                </Badge>
              ))}
            </div>
          </div>

          {/* Области для развития */}
          <div>
            <h4 className="font-medium mb-3 flex items-center space-x-2 text-red-600">
              <TrendingDown className="h-4 w-4" />
              <span>{t('ai.weaknesses', 'Области для развития')}</span>
            </h4>
            <div className="space-y-2">
              {analysis.weaknesses.slice(0, 3).map((weakness, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="bg-red-50 text-red-700 border-red-200"
                >
                  {weakness}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Топ навыки */}
        {analysis.skillLevels.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center space-x-2">
              <Award className="h-4 w-4" />
              <span>{t('ai.skill_levels', 'Уровни навыков')}</span>
            </h4>
            <div className="space-y-3">
              {analysis.skillLevels.slice(0, 4).map((skill, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium min-w-[100px]">
                      {skill.skill}
                    </span>
                    <Progress 
                      value={skill.level * 10} 
                      className="h-2 flex-1 max-w-[100px]" 
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold">
                      {skill.level}/10
                    </span>
                    <Badge 
                      variant="outline" 
                      className="text-xs px-1 py-0"
                    >
                      {(skill.confidence * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ключевые рекомендации */}
        {analysis.suggestions.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center space-x-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              <span>{t('ai.suggestions', 'Ключевые рекомендации')}</span>
            </h4>
            <div className="space-y-2">
              {analysis.suggestions.slice(0, 3).map((suggestion, index) => (
                <div 
                  key={index}
                  className="flex items-start space-x-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200"
                >
                  <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{suggestion}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Действия */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
          {onViewRecommendations && (
            <Button 
              variant="outline" 
              className="flex-1 flex items-center space-x-2"
              onClick={onViewRecommendations}
            >
              <BookOpen className="h-4 w-4" />
              <span>{t('ai.view_recommendations', 'Все рекомендации')}</span>
            </Button>
          )}
          
          {onStartLearning && (
            <Button 
              className="flex-1 flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
              onClick={onStartLearning}
            >
              <Target className="h-4 w-4" />
              <span>{t('ai.start_learning', 'Начать обучение')}</span>
            </Button>
          )}
        </div>

        {/* Метаданные */}
        {analysis.createdAt && (
          <div className="text-xs text-gray-500 pt-2 border-t flex items-center justify-between">
            <span>
              {t('ai.analyzed_on', 'Анализ от')}: {new Date(analysis.createdAt).toLocaleDateString()}
            </span>
            {analysis.aiModel && (
              <span>
                AI: {analysis.aiModel.split('/').pop()}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export type { FeedbackAnalysis, SkillLevel, AIAnalysisCardProps };
