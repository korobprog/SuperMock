import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Circle, Star } from 'lucide-react';
import { apiGetQuestionRatings } from '@/lib/api';

interface QuestionRating {
  id: number;
  sessionId: string;
  questionIndex: number;
  questionText: string;
  isAsked: boolean;
  rating: number | null;
}

interface QuestionsStatsProps {
  sessionId: string;
  totalQuestions: number;
  role: 'interviewer' | 'candidate';
}

export function QuestionsStats({
  sessionId,
  totalQuestions,
  role,
}: QuestionsStatsProps) {
  const [questionRatings, setQuestionRatings] = useState<QuestionRating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQuestionRatings = async () => {
      try {
        const response = await apiGetQuestionRatings(sessionId);
        setQuestionRatings(response.questionRatings || []);
      } catch (error) {
        console.error('Error loading question ratings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadQuestionRatings();

    // Обновляем данные каждые 5 секунд
    const interval = setInterval(loadQuestionRatings, 5000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const askedQuestions = questionRatings.filter(qr => qr.isAsked);
  const ratedQuestions = askedQuestions.filter(qr => qr.rating !== null);
  const totalRating = ratedQuestions.reduce((sum, qr) => sum + (qr.rating || 0), 0);
  const averageRating = ratedQuestions.length > 0 ? totalRating / ratedQuestions.length : 0;

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Статистика вопросов</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded mb-2"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Статистика вопросов
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Прогресс заданных вопросов */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Задано вопросов</span>
              <span className="text-xs font-medium">
                {askedQuestions.length} / {totalQuestions}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(askedQuestions.length / totalQuestions) * 100}%`,
                }}
              ></div>
            </div>
          </div>

          {/* Прогресс оценок */}
          {role === 'interviewer' && askedQuestions.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Оценено вопросов</span>
                <span className="text-xs font-medium">
                  {ratedQuestions.length} / {askedQuestions.length}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${askedQuestions.length > 0 ? (ratedQuestions.length / askedQuestions.length) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>
          )}

          {/* Средняя оценка */}
          {role === 'interviewer' && ratedQuestions.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Средняя оценка</span>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-medium">
                  {averageRating.toFixed(1)}/5
                </span>
              </div>
            </div>
          )}

          {/* Статус для кандидата */}
          {role === 'candidate' && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Статус</span>
              <Badge variant={askedQuestions.length > 0 ? "default" : "secondary"} className="text-xs">
                {askedQuestions.length > 0 ? "Вопросы заданы" : "Ожидание вопросов"}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
