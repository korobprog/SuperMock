import { InMemoryUser } from './InMemoryUser';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

// Интерфейс для пользователя, общий для обоих реализаций
export interface IUser {
  id: string;
  email: string;
  password: string;
  roleHistory: any[];
  feedbackStatus: 'none' | 'pending' | 'completed';
  createdAt: Date;
  googleId?: string;
  googleAccessToken?: string;
  googleRefreshToken?: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
  save(): Promise<any>;
}

// Расширяем интерфейс Document из mongoose
declare module 'mongoose' {
  interface Document {
    comparePassword(candidatePassword: string): Promise<boolean>;
  }
}

// Схема пользователя для MongoDB
const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  roleHistory: {
    type: Array,
    default: [],
  },
  feedbackStatus: {
    type: String,
    enum: ['none', 'pending', 'completed'],
    default: 'none',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  googleId: String,
  googleAccessToken: String,
  googleRefreshToken: String,
});

// Метод для хеширования пароля перед сохранением
userSchema.pre(
  'save',
  async function (next: mongoose.CallbackWithoutResultAndOptionalError) {
    // Хешируем пароль только если он был изменен или это новый пользователь
    if (!this.isModified('password')) return next();

    try {
      // Генерируем соль и хешируем пароль
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next();
    } catch (error) {
      next(error as mongoose.CallbackError);
    }
  }
);

// Метод для сравнения паролей
userSchema.methods.comparePassword = async function (
  candidatePassword: string
) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Создаем модель MongoDB
const MongoUser = mongoose.model('User', userSchema);

// Функция для определения, какую модель использовать
function getUserModel(): typeof InMemoryUser | typeof MongoUser {
  console.log('=== ВЫБОР МОДЕЛИ ПОЛЬЗОВАТЕЛЯ ===');
  const useMongoDb = process.env.USE_MONGODB === 'true';
  console.log(`Переменная окружения USE_MONGODB: ${process.env.USE_MONGODB}`);
  console.log(`Используем MongoDB: ${useMongoDb}`);

  if (useMongoDb) {
    console.log('Выбрана модель: MongoDB User');

    // Проверяем, есть ли соединение с MongoDB
    if (mongoose.connection.readyState === 0) {
      console.log(
        'Соединение с MongoDB не установлено, пытаемся подключиться...'
      );

      const mongoUri = process.env.MONGO_URI;
      if (!mongoUri) {
        console.error('MONGO_URI не определен, но USE_MONGODB=true');
        console.warn(
          'Переключаемся на InMemoryUser из-за отсутствия MONGO_URI'
        );
        return InMemoryUser;
      }

      // Добавляем отладочную информацию о MongoDB
      console.log('=== ОТЛАДКА MONGODB ===');
      console.log('Текущие настройки MongoDB:');
      console.log(
        `- MONGO_URI: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`
      );
      console.log('Ожидаемые настройки MongoDB на хостинге:');
      console.log('- MongoDB хост: c641b068463c.vps.myjino.ru');
      console.log('- MongoDB порт: 49305');

      // Подключаемся к MongoDB
      mongoose
        .connect(mongoUri)
        .then(() => console.log('Соединение с MongoDB установлено'))
        .catch((err) => {
          console.error('Ошибка подключения к MongoDB:', err);
          console.warn(
            'Переключаемся на InMemoryUser из-за ошибки подключения к MongoDB'
          );
        });
    }

    return MongoUser;
  } else {
    console.log('Выбрана модель: InMemoryUser');
    return InMemoryUser;
  }
}

// Экспортируем правильную модель пользователя
export const User = getUserModel();

// Экспортируем обе модели для прямого доступа при необходимости
export { InMemoryUser, MongoUser };
