import { v4 as uuidv4 } from 'uuid';

// Интерфейс для рейтингов
interface Ratings {
  [key: string]: number;
}

// Интерфейс для обратной связи
interface FeedbackData {
  id?: string;
  sessionId: string;
  userId: string;
  ratings: Ratings;
  comments: string;
  recommendations: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Класс для работы с обратной связью в памяти
export class InMemoryFeedback {
  id: string;
  sessionId: string;
  userId: string;
  ratings: Ratings;
  comments: string;
  recommendations: string;
  createdAt: Date;
  updatedAt: Date;

  // Хранилище обратной связи в памяти
  private static feedbacks: InMemoryFeedback[] = [];

  constructor(data: FeedbackData) {
    this.id = data.id || uuidv4();
    this.sessionId = data.sessionId;
    this.userId = data.userId;
    this.ratings = data.ratings || {};
    this.comments = data.comments || '';
    this.recommendations = data.recommendations || '';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Сохранение обратной связи
  async save(): Promise<InMemoryFeedback> {
    const existingIndex = InMemoryFeedback.feedbacks.findIndex(
      (feedback) => feedback.id === this.id
    );

    if (existingIndex !== -1) {
      // Обновляем существующую обратную связь
      this.updatedAt = new Date();
      InMemoryFeedback.feedbacks[existingIndex] = this;
      console.log('Обратная связь обновлена');
    } else {
      // Добавляем новую обратную связь
      InMemoryFeedback.feedbacks.push(this);
      console.log('Новая обратная связь добавлена');
    }

    return this;
  }

  // Поиск обратной связи по ID
  static async findById(id: string): Promise<InMemoryFeedback | null> {
    const feedback = this.feedbacks.find((feedback) => feedback.id === id);
    return feedback || null;
  }

  // Поиск обратной связи по ID сессии
  static async findBySessionId(sessionId: string): Promise<InMemoryFeedback[]> {
    return this.feedbacks.filter(
      (feedback) => feedback.sessionId === sessionId
    );
  }

  // Поиск обратной связи по ID пользователя
  static async findByUserId(userId: string): Promise<InMemoryFeedback[]> {
    return this.feedbacks.filter((feedback) => feedback.userId === userId);
  }

  // Поиск обратной связи по ID пользователя и ID сессии
  static async findByUserAndSession(
    userId: string,
    sessionId: string
  ): Promise<InMemoryFeedback | null> {
    const feedback = this.feedbacks.find(
      (feedback) =>
        feedback.userId === userId && feedback.sessionId === sessionId
    );
    return feedback || null;
  }

  // Удаление обратной связи по ID
  static async deleteById(id: string): Promise<boolean> {
    const initialLength = this.feedbacks.length;
    this.feedbacks = this.feedbacks.filter((feedback) => feedback.id !== id);
    return initialLength !== this.feedbacks.length;
  }

  // Получение всех обратных связей
  static async find(): Promise<InMemoryFeedback[]> {
    return this.feedbacks;
  }
}
