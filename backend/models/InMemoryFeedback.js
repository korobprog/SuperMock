// Модель обратной связи для хранения в памяти
const crypto = require('crypto');

// Хранилище обратной связи в памяти
const feedbacks = [];

class InMemoryFeedback {
  constructor(feedbackData) {
    this.id = crypto.randomUUID();
    this.sessionId = feedbackData.sessionId;
    this.userId = feedbackData.userId;
    this.ratings = feedbackData.ratings || {};
    this.comments = feedbackData.comments || '';
    this.recommendations = feedbackData.recommendations || '';
    this.createdAt = new Date();
  }

  // Статический метод для поиска всей обратной связи
  static async find() {
    return [...feedbacks];
  }

  // Статический метод для поиска обратной связи по id
  static async findById(id) {
    return feedbacks.find((feedback) => feedback.id === id);
  }

  // Статический метод для поиска обратной связи по userId
  static async findByUserId(userId) {
    return feedbacks.filter((feedback) => feedback.userId === userId);
  }

  // Статический метод для поиска обратной связи по sessionId
  static async findBySessionId(sessionId) {
    return feedbacks.filter((feedback) => feedback.sessionId === sessionId);
  }

  // Статический метод для проверки наличия обратной связи от пользователя в сессии
  static async findByUserAndSession(userId, sessionId) {
    return feedbacks.find(
      (feedback) =>
        feedback.userId === userId && feedback.sessionId === sessionId
    );
  }

  // Метод для сохранения обратной связи
  async save() {
    try {
      // Проверяем, существует ли обратная связь с таким id
      const existingFeedbackIndex = feedbacks.findIndex(
        (feedback) => feedback.id === this.id
      );

      console.log('Сохранение обратной связи:', this.id);
      console.log('Существующий индекс:', existingFeedbackIndex);

      if (existingFeedbackIndex !== -1) {
        // Обновляем существующую обратную связь
        feedbacks[existingFeedbackIndex] = this;
        console.log('Обратная связь обновлена');
      } else {
        // Добавляем новую обратную связь в хранилище
        feedbacks.push(this);
        console.log('Новая обратная связь добавлена');
      }

      return this;
    } catch (error) {
      console.error('Ошибка при сохранении обратной связи:', error);
      throw new Error(`Ошибка при сохранении обратной связи: ${error.message}`);
    }
  }
}

module.exports = InMemoryFeedback;
