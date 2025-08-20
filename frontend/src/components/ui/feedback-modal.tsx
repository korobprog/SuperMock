import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Star } from 'lucide-react';
import { useAppTranslation } from '@/lib/i18n';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: { rating: number; comments: string }) => void;
  sessionId: string;
  targetUser?: {
    id: number;
    name?: string;
  };
  isLoading?: boolean;
}

export function FeedbackModal({
  isOpen,
  onClose,
  onSubmit,
  sessionId,
  targetUser,
  isLoading = false,
}: FeedbackModalProps) {
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState('');
  const { t } = useAppTranslation();

  const handleSubmit = () => {
    if (rating === 0) {
      // Показать ошибку - нужно выбрать рейтинг
      return;
    }
    onSubmit({ rating, comments });
  };

  const handleClose = () => {
    setRating(0);
    setComments('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            {t('feedback.title') || 'Оставьте фидбек'}
          </DialogTitle>
          <DialogDescription>
            {targetUser?.name
              ? `${
                  t('feedback.description') ||
                  'Поделитесь своими впечатлениями о собеседовании с'
                } ${targetUser.name}`
              : t('feedback.description') ||
                'Поделитесь своими впечатлениями о собеседовании'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Рейтинг звездами */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t('feedback.rating') || 'Оценка'}
            </label>
            <div className="flex justify-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Button
                  key={star}
                  variant="ghost"
                  size="sm"
                  onClick={() => setRating(star)}
                  className="h-10 w-10 p-0 hover:bg-yellow-50"
                >
                  <Star
                    className={`h-6 w-6 transition-colors ${
                      rating >= star
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300 hover:text-yellow-300'
                    }`}
                  />
                </Button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-sm text-muted-foreground">
                {rating === 1 && (t('feedback.rating1') || 'Очень плохо')}
                {rating === 2 && (t('feedback.rating2') || 'Плохо')}
                {rating === 3 && (t('feedback.rating3') || 'Удовлетворительно')}
                {rating === 4 && (t('feedback.rating4') || 'Хорошо')}
                {rating === 5 && (t('feedback.rating5') || 'Отлично')}
              </p>
            )}
          </div>

          {/* Комментарий */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t('feedback.comments') || 'Комментарий (необязательно)'}
            </label>
            <Textarea
              placeholder={
                t('feedback.commentsPlaceholder') ||
                'Ваши впечатления, предложения, замечания...'
              }
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            {t('common.cancel') || 'Отмена'}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || isLoading}
            className="bg-yellow-500 hover:bg-yellow-600 text-white"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {t('common.sending') || 'Отправка...'}
              </div>
            ) : (
              <>
                <Star className="mr-2 h-4 w-4" />
                {t('feedback.submit') || 'Отправить фидбек'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
