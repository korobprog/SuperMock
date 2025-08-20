// Простая модель сессии для хранения в памяти
const crypto = require('crypto');

// Хранилище сессий в памяти
const sessions = [];

class InMemorySession {
  constructor(sessionData) {
    this.id = crypto.randomUUID();
    this.interviewerId = sessionData.interviewerId || null;
    this.intervieweeId = sessionData.intervieweeId || null;
    this.observerIds = sessionData.observerIds || [];
    this.videoLink = sessionData.videoLink || null;
    this.videoLinkStatus = sessionData.videoLinkStatus || 'pending';
    this.status = sessionData.status || 'pending'; // pending, active, completed
    this.startTime = sessionData.startTime || new Date();
    this.createdAt = new Date();
  }

  // Статический метод для поиска всех сессий
  static async find() {
    return [...sessions];
  }

  // Статический метод для поиска сессии по id
  static async findById(id) {
    return sessions.find((session) => session.id === id);
  }

  // Статический метод для поиска последней сессии, где пользователь был интервьюером
  static async findLastSessionAsInterviewer(userId) {
    try {
      if (!userId) {
        console.error('findLastSessionAsInterviewer: userId не определен');
        return null;
      }

      // Сортируем сессии по дате создания (от новых к старым)
      const sortedSessions = [...sessions].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      // Находим первую сессию, где пользователь был интервьюером
      return sortedSessions.find((session) => session.interviewerId === userId);
    } catch (error) {
      console.error('Ошибка в findLastSessionAsInterviewer:', error.message);
      return null;
    }
  }

  // Метод для сохранения сессии
  async save() {
    try {
      // Проверяем, существует ли сессия с таким id
      const existingSessionIndex = sessions.findIndex(
        (session) => session.id === this.id
      );

      console.log('Сохранение сессии:', this.id);
      console.log('Существующий индекс:', existingSessionIndex);

      if (existingSessionIndex !== -1) {
        // Обновляем существующую сессию
        sessions[existingSessionIndex] = this;
        console.log('Сессия обновлена');
      } else {
        // Добавляем новую сессию в хранилище
        sessions.push(this);
        console.log('Новая сессия добавлена');
      }

      return this;
    } catch (error) {
      console.error('Ошибка при сохранении сессии:', error);
      throw new Error(`Ошибка при сохранении сессии: ${error.message}`);
    }
  }

  // Метод для обновления роли пользователя в сессии
  async assignRole(userId, role) {
    try {
      if (!userId) {
        throw new Error('userId не определен при назначении роли');
      }

      if (!role || !['interviewer', 'interviewee', 'observer'].includes(role)) {
        throw new Error(`Некорректная роль: ${role}`);
      }

      if (role === 'interviewer') {
        this.interviewerId = userId;
      } else if (role === 'interviewee') {
        this.intervieweeId = userId;
      } else if (role === 'observer') {
        // Инициализируем массив наблюдателей, если он не существует
        if (!this.observerIds || !Array.isArray(this.observerIds)) {
          this.observerIds = [];
        }

        // Проверяем, не добавлен ли пользователь уже как наблюдатель
        if (!this.observerIds.includes(userId)) {
          this.observerIds.push(userId);
        }
      }

      return this.save();
    } catch (error) {
      console.error('Ошибка в методе assignRole:', error);
      throw new Error(`Ошибка при назначении роли: ${error.message}`);
    }
  }
}

module.exports = InMemorySession;
