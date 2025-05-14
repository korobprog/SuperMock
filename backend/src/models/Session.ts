import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';

// Интерфейс для документа сессии в MongoDB
export interface ISession extends Document {
  id: string;
  interviewerId: string | null;
  intervieweeId: string | null;
  observerIds: string[];
  videoLink: string | null;
  videoLinkStatus: 'pending' | 'active' | 'manual' | 'expired';
  status: 'pending' | 'active' | 'completed';
  startTime: Date;
  createdAt: Date;
  creatorId?: string;
  assignRole(
    userId: string,
    role: 'interviewer' | 'interviewee' | 'observer'
  ): Promise<ISession>;
}

// Схема для сессии
const sessionSchema = new Schema<ISession>(
  {
    id: { type: String, required: true, unique: true, index: true },
    interviewerId: { type: String, default: null },
    intervieweeId: { type: String, default: null },
    observerIds: { type: [String], default: [] },
    videoLink: { type: String, default: null },
    videoLinkStatus: {
      type: String,
      enum: ['pending', 'active', 'manual', 'expired'],
      default: 'pending',
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'completed'],
      default: 'pending',
    },
    startTime: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
    creatorId: { type: String },
  },
  { timestamps: true }
);

// Метод для назначения роли пользователю
sessionSchema.methods.assignRole = async function (
  userId: string,
  role: 'interviewer' | 'interviewee' | 'observer'
): Promise<ISession> {
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

    return await this.save();
  } catch (error) {
    console.error('Ошибка в методе assignRole:', error);
    throw new Error(`Ошибка при назначении роли: ${(error as Error).message}`);
  }
};

// Статический метод для поиска последней сессии, где пользователь был интервьюером
sessionSchema.statics.findLastSessionAsInterviewer = async function (
  userId: string
): Promise<ISession | null> {
  try {
    if (!userId) {
      console.error('findLastSessionAsInterviewer: userId не определен');
      return null;
    }

    // Находим последнюю сессию, где пользователь был интервьюером
    return await this.findOne({ interviewerId: userId })
      .sort({ createdAt: -1 })
      .exec();
  } catch (error) {
    console.error(
      'Ошибка в findLastSessionAsInterviewer:',
      (error as Error).message
    );
    return null;
  }
};

// Создаем и экспортируем модель
const Session = mongoose.model<ISession>('Session', sessionSchema);

export default Session;
