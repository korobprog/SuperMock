# 🎯 Реализация логики завершения собеседования

## ✅ Что реализовано

### 1. Backend API

#### Новый эндпоинт для завершения сессии:

```javascript
// PUT /api/sessions/:id/complete
app.put('/api/sessions/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Update session status to completed
    const updatedSession = await prisma.session.update({
      where: { id },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
      include: {
        interviewer: true,
        candidate: true,
      },
    });

    // 2. Create notifications for both participants
    const notifications = [];

    if (updatedSession.interviewer) {
      notifications.push({
        userId: updatedSession.interviewer.id,
        type: 'session_completed',
        title: 'Собеседование завершено',
        message: `Собеседование по ${updatedSession.profession} завершено. Оставьте фидбек о кандидате.`,
        status: 'active',
        priority: 1,
        actionData: JSON.stringify({
          sessionId: id,
          action: 'give_feedback',
          targetUserId: updatedSession.candidate?.id,
        }),
      });
    }

    if (updatedSession.candidate) {
      notifications.push({
        userId: updatedSession.candidate.id,
        type: 'session_completed',
        title: 'Собеседование завершено',
        message: `Собеседование по ${updatedSession.profession} завершено. Оставьте фидбек об интервьюере.`,
        status: 'active',
        priority: 1,
        actionData: JSON.stringify({
          sessionId: id,
          action: 'give_feedback',
          targetUserId: updatedSession.interviewer?.id,
        }),
      });
    }

    // 3. Save notifications to database
    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications,
      });
    }

    // 4. Emit socket event to notify participants
    if (updatedSession.interviewer) {
      io.to(`user:${updatedSession.interviewer.id}`).emit('session_completed', {
        sessionId: id,
        message: 'Собеседование завершено',
      });
    }

    if (updatedSession.candidate) {
      io.to(`user:${updatedSession.candidate.id}`).emit('session_completed', {
        sessionId: id,
        message: 'Собеседование завершено',
      });
    }

    res.json({
      success: true,
      session: updatedSession,
      notificationsCreated: notifications.length,
    });
  } catch (error) {
    console.error('Error completing session:', error);
    res.status(500).json({ error: 'Failed to complete session' });
  }
});
```

### 2. Frontend API

#### Новый метод для завершения сессии:

```typescript
export async function apiCompleteSession(sessionId: string) {
  const res = await fetch(
    createApiUrl(`${API_CONFIG.endpoints.sessions}/${sessionId}/complete`),
    {
      method: 'PUT',
      credentials: 'include',
    }
  );
  if (!res.ok) throw new Error('Complete session failed');
  return res.json();
}
```

### 3. Компоненты UI

#### FeedbackModal - модальное окно для фидбека:

```typescript
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

  // Рейтинг звездами (1-5)
  // Поле для комментариев
  // Кнопки отправки и отмены
}
```

#### ExitConfirmDialog - диалог подтверждения выхода:

```typescript
export function ExitConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  onComplete,
  isLoading = false,
}: ExitConfirmDialogProps) {
  // Две опции:
  // 1. Завершить собеседование (с фидбеком)
  // 2. Просто выйти (без завершения)
}
```

### 4. Обновленная логика Interview.tsx

#### Новые состояния:

```typescript
const [showExitConfirmDialog, setShowExitConfirmDialog] = useState(false);
const [showFeedbackModal, setShowFeedbackModal] = useState(false);
const [isCompletingSession, setIsCompletingSession] = useState(false);
const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
const [targetUser, setTargetUser] = useState<{
  id: number;
  name?: string;
} | null>(null);
```

#### Новые функции:

```typescript
// Завершение интервью
const handleCompleteInterview = async () => {
  if (!sessionId || !userId) return;

  setIsCompletingSession(true);
  try {
    // 1. Complete session on server
    const result = await apiCompleteSession(sessionId);

    // 2. Set target user for feedback
    setTargetUser({ id: userId, name: 'Партнер' });

    // 3. Show feedback modal
    setShowFeedbackModal(true);
    setShowExitConfirmDialog(false);
  } catch (error) {
    console.error('Failed to complete interview:', error);
    cleanupResources();
    navigate('/');
  } finally {
    setIsCompletingSession(false);
  }
};

// Отправка фидбека
const handleFeedbackSubmit = async (feedback: {
  rating: number;
  comments: string;
}) => {
  if (!sessionId || !userId || !targetUser) return;

  setIsSubmittingFeedback(true);
  try {
    await apiFeedback({
      sessionId,
      fromUserId: userId,
      toUserId: targetUser.id,
      rating: feedback.rating,
      comments: feedback.comments,
    });

    setShowFeedbackModal(false);
    cleanupResources();
    navigate('/history');
  } catch (error) {
    console.error('Failed to submit feedback:', error);
    setShowFeedbackModal(false);
    cleanupResources();
    navigate('/history');
  } finally {
    setIsSubmittingFeedback(false);
  }
};

// Простой выход без завершения
const handleSimpleExit = () => {
  cleanupResources();
  setShowExitConfirmDialog(false);
  navigate('/');
};

// Показать диалог подтверждения
const handleExitInterview = () => {
  setShowExitConfirmDialog(true);
};
```

### 5. Обновленная страница History.tsx

#### Новые функции:

```typescript
// Проверка возможности оставить фидбек
const canGiveFeedback = (session: Session) => {
  if (!userId || session.status !== 'completed') return false;

  const sessionFeedbacks = getSessionFeedbacks(session.id);
  const hasGivenFeedback = sessionFeedbacks.some(
    (f) => f.from_user_id === userId
  );

  return !hasGivenFeedback;
};

// Обработка клика по кнопке фидбека
const handleGiveFeedback = (session: Session) => {
  if (!userId) return;

  const isInterviewer = session.interviewer_user_id === userId;
  const targetUserId = isInterviewer
    ? session.candidate_user_id
    : session.interviewer_user_id;

  setSelectedSession(session);
  setTargetUser({
    id: targetUserId,
    name: isInterviewer ? 'Кандидат' : 'Интервьюер',
  });
  setShowFeedbackModal(true);
};
```

#### Кнопка "Оставить фидбек" в карточке сессии:

```typescript
{
  canGiveFeedback(session) && (
    <Button
      size="sm"
      onClick={() => handleGiveFeedback(session)}
      className="bg-yellow-500 hover:bg-yellow-600 text-white"
    >
      <Star className="mr-2 h-3 w-3" />
      {t('history.giveFeedback') || 'Оставить фидбек'}
    </Button>
  );
}
```

### 6. База данных

#### Обновленная схема Session:

```prisma
model Session {
  id                  String    @id
  interviewerUserId  String?   @map("interviewer_user_id")
  candidateUserId    String?   @map("candidate_user_id")
  profession         String?
  language           String?
  slotUtc            String?   @map("slot_utc")
  createdAt          DateTime  @default(now()) @map("created_at")
  completedAt        DateTime? @map("completed_at")  // НОВОЕ ПОЛЕ
  status             String?
  jitsiRoom          String?   @map("jitsi_room")

  // Отношения
  interviewer User? @relation("InterviewerSessions", fields: [interviewerUserId], references: [id])
  candidate   User? @relation("CandidateSessions", fields: [candidateUserId], references: [id])
  feedback    Feedback[]

  @@map("sessions")
}
```

### 7. Переводы

#### Новые переводы в ru.json:

```json
{
  "interview": {
    "exitConfirmTitle": "Завершить собеседование?",
    "exitConfirmDescription": "Выберите, как вы хотите завершить собеседование:",
    "completeOption": "✅ Завершить собеседование",
    "completeDescription": "Собеседование будет помечено как завершенное. Вы сможете оставить фидбек о партнере.",
    "completeInterview": "Завершить собеседование",
    "exitOption": "🚪 Просто выйти",
    "exitDescription": "Собеседование останется активным. Вы можете вернуться позже.",
    "justExit": "Просто выйти"
  },
  "history": {
    "giveFeedback": "Оставить фидбек"
  },
  "feedback": {
    "title": "Оставьте фидбек",
    "description": "Поделитесь своими впечатлениями о собеседовании с",
    "rating": "Оценка",
    "rating1": "Очень плохо",
    "rating2": "Плохо",
    "rating3": "Удовлетворительно",
    "rating4": "Хорошо",
    "rating5": "Отлично",
    "comments": "Комментарий (необязательно)",
    "commentsPlaceholder": "Ваши впечатления, предложения, замечания...",
    "submit": "Отправить фидбек"
  },
  "common": {
    "cancel": "Отмена",
    "sending": "Отправка...",
    "processing": "Обработка..."
  }
}
```

## 🔄 Полный flow завершения интервью

### Сценарий 1: Завершение через кнопку "Завершить собеседование"

1. Пользователь нажимает "Выйти" → показывается диалог подтверждения
2. Пользователь выбирает "Завершить собеседование"
3. Сессия помечается как `completed` на сервере
4. Создаются уведомления для обоих участников
5. Показывается модальное окно фидбека
6. После отправки фидбека → переход в историю

### Сценарий 2: Выход без завершения

1. Пользователь нажимает "Выйти" → показывается диалог подтверждения
2. Пользователь выбирает "Просто выйти"
3. Сессия остается `scheduled`
4. Переход на главную страницу

### Сценарий 3: Получение уведомления о завершении

1. Пользователь получает уведомление о завершении сессии
2. Нажимает "Оставить фидбек" в истории
3. Открывается модальное окно фидбека
4. После отправки → уведомление обновляется

## 🎯 Следующие шаги

### 1. Применение миграции базы данных

```bash
cd backend
npx prisma migrate dev --name add_completed_at_field
```

### 2. Тестирование

- Протестировать завершение сессии
- Проверить создание уведомлений
- Тестировать отправку фидбека
- Проверить отображение в истории

### 3. Дополнительные улучшения

- Добавить автоматические напоминания о фидбеке
- Создать статистику завершенных интервью
- Добавить уведомления о высоких рейтингах
- Реализовать автоматическое завершение старых сессий

## 📊 Результат

Теперь у нас есть полная система завершения интервью с:

- ✅ Корректным завершением сессий
- ✅ Системой фидбека с рейтингом и комментариями
- ✅ Уведомлениями о завершении
- ✅ Возможностью оставить фидбек из истории
- ✅ Красивым UI с модальными окнами
- ✅ Полной локализацией
- ✅ Обработкой ошибок и состояний загрузки
