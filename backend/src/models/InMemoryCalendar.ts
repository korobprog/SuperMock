import crypto from 'crypto';

// Интерфейс для данных календаря
export interface CalendarEntryData {
  sessionId: string;
  videoLink: string | null;
  startTime: Date;
  participants: string[];
}

// Хранилище записей календаря в памяти
const calendarEntries: InMemoryCalendarEntry[] = [];

export class InMemoryCalendarEntry {
  id: string;
  sessionId: string;
  videoLink: string | null;
  startTime: Date;
  participants: string[];
  createdAt: Date;

  constructor(entryData: CalendarEntryData) {
    this.id = crypto.randomUUID();
    this.sessionId = entryData.sessionId;
    this.videoLink = entryData.videoLink || null;
    this.startTime =
      entryData.startTime instanceof Date
        ? entryData.startTime
        : new Date(entryData.startTime);
    this.participants = entryData.participants || [];
    this.createdAt = new Date();
  }

  // Статический метод для поиска всех записей календаря
  static async find(): Promise<InMemoryCalendarEntry[]> {
    return [...calendarEntries];
  }

  // Статический метод для поиска записи календаря по id сессии
  static async findBySessionId(
    sessionId: string
  ): Promise<InMemoryCalendarEntry | null> {
    return (
      calendarEntries.find((entry) => entry.sessionId === sessionId) || null
    );
  }

  // Метод для сохранения записи календаря
  async save(): Promise<InMemoryCalendarEntry> {
    try {
      // Проверяем, существует ли запись с таким sessionId
      const existingEntryIndex = calendarEntries.findIndex(
        (entry) => entry.sessionId === this.sessionId
      );

      console.log('Сохранение записи календаря для сессии:', this.sessionId);
      console.log('Существующий индекс:', existingEntryIndex);

      if (existingEntryIndex !== -1) {
        // Обновляем существующую запись
        calendarEntries[existingEntryIndex] = this;
        console.log('Запись календаря обновлена');
      } else {
        // Добавляем новую запись в хранилище
        calendarEntries.push(this);
        console.log('Новая запись календаря добавлена');
      }

      return this;
    } catch (error) {
      console.error('Ошибка при сохранении записи календаря:', error);
      throw new Error(
        `Ошибка при сохранении записи календаря: ${(error as Error).message}`
      );
    }
  }

  // Метод для добавления участника
  async addParticipant(userId: string): Promise<InMemoryCalendarEntry> {
    try {
      if (!userId) {
        throw new Error('userId не определен при добавлении участника');
      }

      // Инициализируем массив участников, если он не существует
      if (!this.participants || !Array.isArray(this.participants)) {
        this.participants = [];
      }

      // Проверяем, не добавлен ли пользователь уже как участник
      if (!this.participants.includes(userId)) {
        this.participants.push(userId);
      }

      return this.save();
    } catch (error) {
      console.error('Ошибка в методе addParticipant:', error);
      throw new Error(
        `Ошибка при добавлении участника: ${(error as Error).message}`
      );
    }
  }

  // Метод для обновления ссылки на видео
  async updateVideoLink(videoLink: string): Promise<InMemoryCalendarEntry> {
    try {
      this.videoLink = videoLink;
      return this.save();
    } catch (error) {
      console.error('Ошибка в методе updateVideoLink:', error);
      throw new Error(
        `Ошибка при обновлении ссылки на видео: ${(error as Error).message}`
      );
    }
  }
}
