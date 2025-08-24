import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, CheckCircle, Circle, MessageCircle } from 'lucide-react';
import { apiGetQuestionRatings } from '@/lib/api';

interface QuestionRating {
  id: number;
  sessionId: string;
  questionIndex: number;
  questionText: string;
  isAsked: boolean;
  rating: number | null;
}

interface InterviewResultsProps {
  sessionId: string;
  role: 'interviewer' | 'candidate';
  feedback?: {
    rating: number;
    comments: string;
  };
}

export function InterviewResults({
  sessionId,
  role,
  feedback,
}: InterviewResultsProps) {
  const [questionRatings, setQuestionRatings] = useState<QuestionRating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuestionRatings();
  }, [sessionId]);

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

  const askedQuestions = questionRatings.filter(qr => qr.isAsked);
  const totalRating = askedQuestions.reduce((sum, qr) => sum + (qr.rating || 0), 0);
  const averageRating = askedQuestions.length > 0 ? totalRating / askedQuestions.length : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-sm text-muted-foreground">
          Загрузка результатов...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Общая статистика */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Результаты интервью
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {askedQuestions.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Заданных вопросов
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {averageRating.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">
                Средняя оценка
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Вопросы с оценками */}
      {askedQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Вопросы и оценки</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {askedQuestions.map((questionRating) => (
                <div
                  key={questionRating.id}
                  className="p-4 border rounded-lg bg-muted/30"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-primary">
                          #{questionRating.questionIndex + 1}
                        </span>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <p className="text-sm text-foreground mb-3">
                        {questionRating.questionText}
                      </p>
                    </div>
                    {questionRating.rating && (
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                questionRating.rating && questionRating.rating >= star
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {questionRating.rating}/5
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Фидбек от интервьюера */}
      {feedback && role === 'candidate' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Отзыв интервьюера
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Общая оценка:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        feedback.rating >= star
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <Badge variant="secondary" className="text-xs">
                  {feedback.rating}/5
                </Badge>
              </div>
              {feedback.comments && (
                <div>
                  <span className="text-sm font-medium">Комментарий:</span>
                  <p className="text-sm text-foreground mt-1 p-3 bg-muted/50 rounded-lg">
                    {feedback.comments}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Сообщение если нет заданных вопросов */}
      {askedQuestions.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Circle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {role === 'interviewer' 
                ? 'Вы пока не задали ни одного вопроса'
                : 'Интервьюер пока не задал ни одного вопроса'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
