import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, CheckCircle, Circle } from 'lucide-react';
import { apiSaveQuestionRating, apiGetQuestionRatings } from '@/lib/api';

interface QuestionRating {
  id: number;
  sessionId: string;
  questionIndex: number;
  questionText: string;
  isAsked: boolean;
  rating: number | null;
}

interface InterviewQuestionsProps {
  questions: string[];
  sessionId: string;
  role: 'interviewer' | 'candidate';
  isMobile?: boolean;
}

export function InterviewQuestions({
  questions,
  sessionId,
  role,
  isMobile = false,
}: InterviewQuestionsProps) {
  const [questionRatings, setQuestionRatings] = useState<QuestionRating[]>([]);
  const [loading, setLoading] = useState(false);

  // Загружаем существующие оценки при монтировании компонента
  useEffect(() => {
    if (sessionId) {
      loadQuestionRatings();
    }
  }, [sessionId]);

  const loadQuestionRatings = async () => {
    try {
      const response = await apiGetQuestionRatings(sessionId);
      setQuestionRatings(response.questionRatings || []);
    } catch (error) {
      console.error('Error loading question ratings:', error);
    }
  };

  const handleQuestionToggle = async (questionIndex: number, questionText: string) => {
    if (role !== 'interviewer') return;

    setLoading(true);
    try {
      const existingRating = questionRatings.find(qr => qr.questionIndex === questionIndex);
      const newIsAsked = !existingRating?.isAsked;

      await apiSaveQuestionRating({
        sessionId,
        questionIndex,
        questionText,
        isAsked: newIsAsked,
        rating: existingRating?.rating || null,
      });

      // Обновляем локальное состояние
      setQuestionRatings(prev => {
        const updated = prev.filter(qr => qr.questionIndex !== questionIndex);
        if (newIsAsked) {
          updated.push({
            id: existingRating?.id || Date.now(),
            sessionId,
            questionIndex,
            questionText,
            isAsked: newIsAsked,
            rating: existingRating?.rating || null,
          });
        }
        return updated.sort((a, b) => a.questionIndex - b.questionIndex);
      });
    } catch (error) {
      console.error('Error toggling question:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = async (questionIndex: number, questionText: string, rating: number) => {
    if (role !== 'interviewer') return;

    setLoading(true);
    try {
      await apiSaveQuestionRating({
        sessionId,
        questionIndex,
        questionText,
        isAsked: true,
        rating,
      });

      // Обновляем локальное состояние
      setQuestionRatings(prev => {
        const existing = prev.find(qr => qr.questionIndex === questionIndex);
        if (existing) {
          return prev.map(qr =>
            qr.questionIndex === questionIndex
              ? { ...qr, rating, isAsked: true }
              : qr
          );
        } else {
          return [...prev, {
            id: Date.now(),
            sessionId,
            questionIndex,
            questionText,
            isAsked: true,
            rating,
          }].sort((a, b) => a.questionIndex - b.questionIndex);
        }
      });
    } catch (error) {
      console.error('Error saving rating:', error);
    } finally {
      setLoading(false);
    }
  };

  const getQuestionRating = (questionIndex: number) => {
    return questionRatings.find(qr => qr.questionIndex === questionIndex);
  };

  const isQuestionAsked = (questionIndex: number) => {
    return getQuestionRating(questionIndex)?.isAsked || false;
  };

  const getQuestionRatingValue = (questionIndex: number) => {
    return getQuestionRating(questionIndex)?.rating || null;
  };

  if (role === 'candidate') {
    // Для кандидата показываем только заданные вопросы
    const askedQuestions = questions.filter((_, index) => isQuestionAsked(index));
    
    if (askedQuestions.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Интервьюер пока не задал ни одного вопроса
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {questions.map((question, index) => {
          if (!isQuestionAsked(index)) return null;
          
          const rating = getQuestionRatingValue(index);
          
          return (
            <div
              key={index}
              className="p-3 bg-muted/50 rounded-lg text-sm text-foreground"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <span className="text-xs text-primary font-medium">
                    #{index + 1}
                  </span>
                  <p className="mt-1">{question}</p>
                </div>
                {rating && (
                  <div className="flex items-center ml-2">
                    <Badge variant="secondary" className="text-xs">
                      <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                      {rating}/5
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Для интервьюера показываем все вопросы с возможностью отметки и оценки
  return (
    <div className="space-y-3">
      {questions.map((question, index) => {
        const isAsked = isQuestionAsked(index);
        const rating = getQuestionRatingValue(index);
        
        return (
          <div
            key={index}
            className={`p-3 rounded-lg text-sm transition-colors ${
              isAsked 
                ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800' 
                : 'bg-muted/50 hover:bg-muted/70'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-primary font-medium">
                    #{index + 1}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuestionToggle(index, question)}
                    disabled={loading}
                    className="h-6 w-6 p-0"
                  >
                    {isAsked ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Circle className="w-4 h-4 text-gray-400" />
                    )}
                  </Button>
                  {isAsked && (
                    <Badge variant="outline" className="text-xs">
                      Задан
                    </Badge>
                  )}
                </div>
                <p className="mt-1">{question}</p>
              </div>
            </div>
            
            {isAsked && (
              <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Оценка:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Button
                        key={star}
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRatingChange(index, question, star)}
                        disabled={loading}
                        className="h-6 w-6 p-0 hover:bg-yellow-50"
                      >
                        <Star
                          className={`w-4 h-4 transition-colors ${
                            rating && rating >= star
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300 hover:text-yellow-300'
                          }`}
                        />
                      </Button>
                    ))}
                  </div>
                  {rating && (
                    <span className="text-xs text-muted-foreground">
                      {rating}/5
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
