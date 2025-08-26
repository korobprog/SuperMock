import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAppStore } from '@/lib/store';
import { apiFeedback, apiEnhancedFeedback } from '@/lib/api';

export function InterviewFeedback() {
  const [rating, setRating] = useState<number>(5);
  const [comments, setComments] = useState<string>('');
  const navigate = useNavigate();
  const sessionId = useAppStore((s) => s.sessionId);
  const userId = useAppStore((s) => s.userId);

  const handleSubmit = async () => {
    if (!sessionId || !userId) return;
    
    try {
      // 🤖 Используем расширенный API с AI анализом
      await apiEnhancedFeedback({
        sessionId,
        fromUserId: userId,
        toUserId: userId, // TODO: получить правильный targetUserId
        ratings: { overall: rating }, // конвертируем простой rating в объект
        comments,
        recommendations: '' // пока пустое
      });

      console.log('✅ Feedback sent with AI analysis enabled (from InterviewFeedback)');
      navigate('/');
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      // Fallback - still navigate
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-md mx-auto space-y-4">
        <h1 className="text-xl font-semibold">Обратная связь</h1>
        <div>
          <label className="block text-sm mb-1">Оценка</label>
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="w-full border rounded p-2"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Комментарий</label>
          <Textarea
            rows={5}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Ваши впечатления..."
          />
        </div>
        <Button className="w-full" onClick={handleSubmit}>
          Отправить
        </Button>
      </div>
    </div>
  );
}
