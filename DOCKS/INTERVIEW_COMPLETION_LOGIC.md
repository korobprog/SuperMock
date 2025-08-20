# 🎯 Логика завершения собеседования и матчинга

## 📋 Текущее состояние

### Что происходит сейчас:

1. Пользователь нажимает "Выйти" → `handleExitInterview()`
2. Очищаются ресурсы (таймер, socket, WebRTC)
3. Навигация на главную страницу `/`
4. **Сессия остается в статусе `scheduled`** (не завершается)
5. **Нет уведомлений о завершении**
6. **Нет запроса на фидбек**

### Проблемы текущей реализации:

- Сессии не завершаются корректно
- Нет системы фидбека
- Нет уведомлений о завершении
- Нет статистики завершенных интервью
- Нет возможности оставить отзыв после завершения

## 🚀 Предлагаемая улучшенная логика

### 1. Завершение интервью (кнопка "Завершить собеседование")

#### Frontend (Interview.tsx):

```typescript
const handleCompleteInterview = async () => {
  try {
    // 1. Завершить сессию на сервере
    await apiCompleteSession(sessionId);

    // 2. Показать модальное окно с фидбеком
    setShowFeedbackModal(true);

    // 3. Очистить ресурсы
    cleanupResources();
  } catch (error) {
    console.error('Failed to complete interview:', error);
  }
};

const handleExitInterview = () => {
  // Показать диалог подтверждения
  setShowExitConfirmDialog(true);
};
```

#### Backend API (новый эндпоинт):

```javascript
// PUT /api/sessions/:id/complete
app.put('/api/sessions/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Обновить статус сессии
    await prisma.session.update({
      where: { id },
      data: { status: 'completed' },
    });

    // 2. Создать уведомления для участников
    const session = await prisma.session.findUnique({
      where: { id },
      include: { interviewer: true, candidate: true },
    });

    // 3. Отправить уведомления о завершении
    await createCompletionNotifications(session);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete session' });
  }
});
```

### 2. Модальное окно фидбека

#### Компонент FeedbackModal:

```typescript
export function FeedbackModal({
  isOpen,
  onClose,
  onSubmit,
  sessionId,
  targetUser,
}) {
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState('');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogTitle>Оставьте фидбек</DialogTitle>

        {/* Рейтинг звездами */}
        <div className="flex justify-center space-x-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <Button key={star} onClick={() => setRating(star)}>
              <Star className={rating >= star ? 'fill-yellow-400' : ''} />
            </Button>
          ))}
        </div>

        {/* Комментарий */}
        <Textarea
          placeholder="Ваши комментарии..."
          value={comments}
          onChange={(e) => setComments(e.target.value)}
        />

        <Button onClick={() => onSubmit({ rating, comments })}>
          Отправить фидбек
        </Button>
      </DialogContent>
    </Dialog>
  );
}
```

### 3. Улучшенная страница истории

#### Добавить в History.tsx:

```typescript
// Кнопка "Оставить фидбек" для завершенных сессий
const canGiveFeedback = (session) => {
  const hasGivenFeedback = sessionFeedbacks.some(
    (f) => f.from_user_id === userId
  );
  return session.status === 'completed' && !hasGivenFeedback;
};

// В карточке сессии:
{
  canGiveFeedback(session) && (
    <Button onClick={() => setShowFeedbackModal(true)}>
      <Star className="mr-2" />
      Оставить фидбек
    </Button>
  );
}
```

## 🔄 Полный flow завершения интервью

### Сценарий 1: Завершение через кнопку "Завершить собеседование"

1. Пользователь нажимает "Завершить собеседование"
2. Сессия помечается как `completed`
3. Создаются уведомления для обоих участников
4. Показывается модальное окно фидбека
5. После отправки фидбека → переход в историю

### Сценарий 2: Выход без завершения

1. Пользователь нажимает "Выйти"
2. Показывается диалог подтверждения
3. Если подтверждает → сессия остается `scheduled`
4. Если отменяет → возврат к интервью

### Сценарий 3: Получение уведомления о завершении

1. Пользователь получает уведомление
2. Нажимает "Оставить фидбек"
3. Открывается модальное окно фидбека
4. После отправки → уведомление помечается как прочитанное

## 📊 Статистика и аналитика

### Метрики для отслеживания:

- Количество завершенных интервью
- Процент оставленных фидбеков
- Средний рейтинг по ролям/профессиям
- Время до отправки фидбека

### Автоматические действия:

- Напоминание о фидбеке через 24 часа
- Автоматическое завершение сессий старше 2 часов
- Уведомления о высоких рейтингах

## 🎯 Следующие шаги

1. ✅ Создать API эндпоинт `/api/sessions/:id/complete`
2. ✅ Добавить компонент `FeedbackModal`
3. ✅ Обновить `Interview.tsx` с новой логикой завершения
4. ✅ Улучшить страницу `History.tsx`
5. ✅ Добавить обработку новых типов уведомлений
6. ✅ Создать автоматические напоминания о фидбеке

## 📝 API Endpoints

### Новые эндпоинты:

#### 1. Завершение сессии

```
PUT /api/sessions/:id/complete
```

#### 2. Получение истории с фидбеками

```
GET /api/history/:userId
```

#### 3. Отправка фидбека

```
POST /api/feedback
```

#### 4. Напоминания о фидбеке

```
POST /api/notifications/feedback-reminder
```

## 🗄️ База данных

### Обновления схемы:

- Добавить поле `completed_at` в таблицу `sessions`
- Добавить поле `feedback_reminder_sent` в таблицу `notifications`
- Создать индексы для оптимизации запросов истории

### Миграции:

```sql
-- Добавить поле completed_at
ALTER TABLE sessions ADD COLUMN completed_at TIMESTAMP;

-- Добавить поле для напоминаний о фидбеке
ALTER TABLE notifications ADD COLUMN feedback_reminder_sent BOOLEAN DEFAULT FALSE;

-- Индексы для оптимизации
CREATE INDEX idx_sessions_status_completed ON sessions(status, completed_at);
CREATE INDEX idx_feedback_session_created ON feedback(session_id, created_at);
```

## 🔧 Реализация

### 1. Backend изменения:

- Добавить эндпоинт завершения сессии
- Обновить логику уведомлений
- Добавить автоматические напоминания
- Улучшить API истории

### 2. Frontend изменения:

- Создать компонент FeedbackModal
- Обновить Interview.tsx
- Улучшить History.tsx
- Добавить новые переводы

### 3. Тестирование:

- Тесты для новых API эндпоинтов
- E2E тесты для flow завершения
- Тесты компонентов UI
- Тесты интеграции с уведомлениями
