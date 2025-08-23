import { InMemoryUser } from './InMemoryUser';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

// Создаем экземпляр Prisma Client
const prisma = new PrismaClient();

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

// Класс PrismaUser для работы с Prisma
class PrismaUser implements IUser {
  id: string;
  email: string;
  password: string;
  roleHistory: any[];
  feedbackStatus: 'none' | 'pending' | 'completed';
  createdAt: Date;
  googleId?: string;
  googleAccessToken?: string;
  googleRefreshToken?: string;

  constructor(userData: any) {
    this.id = userData.id;
    this.email = userData.email;
    this.password = userData.password;
    this.roleHistory = userData.roleHistory || [];
    this.feedbackStatus = userData.feedbackStatus || 'none';
    this.createdAt = userData.createdAt || new Date();
    this.googleId = userData.googleId;
    this.googleAccessToken = userData.googleAccessToken;
    this.googleRefreshToken = userData.googleRefreshToken;
  }

  // Метод для сравнения паролей
  async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }

  // Метод для сохранения пользователя
  async save(): Promise<PrismaUser> {
    // Хешируем пароль, если он был изменен
    const existingUser = await prisma.user.findUnique({
      where: { id: this.id },
    });

    // Сохраняем пользователя в базу данных
    const savedUser = await prisma.user.upsert({
      where: { id: this.id },
      update: {
        tgId: this.tgId,
        username: this.username,
        firstName: this.firstName,
        lastName: this.lastName,
        language: this.language,
      },
      create: {
        id: this.id,
        tgId: this.tgId,
        username: this.username,
        firstName: this.firstName,
        lastName: this.lastName,
        language: this.language,
        createdAt: this.createdAt,
      },
    });

    return new PrismaUser(savedUser);
  }

  // Статические методы для работы с моделью

  // Поиск пользователя по ID
  static async findById(id: string): Promise<PrismaUser | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    return user ? new PrismaUser(user) : null;
  }

  // Поиск пользователя по tgId
  static async findOne(filter: { tgId: string }): Promise<PrismaUser | null> {
    const user = await prisma.user.findFirst({
      where: { tgId: filter.tgId },
    });

    return user ? new PrismaUser(user) : null;
  }

  // Поиск пользователя по username
  static async findByUsername(username: string): Promise<PrismaUser | null> {
    const user = await prisma.user.findFirst({
      where: { username },
    });

    return user ? new PrismaUser(user) : null;
  }

  // Создание нового пользователя
  static async create(userData: any): Promise<PrismaUser> {
    // Генерируем ID, если он не предоставлен
    if (!userData.id) {
      const { v4: uuidv4 } = require('uuid');
      userData.id = uuidv4();
    }

    const newUser = new PrismaUser(userData);
    return await newUser.save();
  }
}

// Функция для определения, какую модель использовать
function getUserModel(): typeof InMemoryUser | typeof PrismaUser {
  console.log('=== ВЫБОР МОДЕЛИ ПОЛЬЗОВАТЕЛЯ ===');
  const useMongoDb = process.env.USE_MONGODB === 'true';
  console.log(`Переменная окружения USE_MONGODB: ${process.env.USE_MONGODB}`);
  console.log(`Используем MongoDB: ${useMongoDb}`);

  // Добавляем отладку для проверки импортов
  console.log('=== ОТЛАДКА ИМПОРТОВ В USERMODEL ===');
  console.log(`Тип InMemoryUser: ${typeof InMemoryUser}`);
  console.log(`Тип PrismaUser: ${typeof PrismaUser}`);

  if (useMongoDb) {
    console.log('Выбрана модель: Prisma User');

    // Проверяем, есть ли соединение с MongoDB через Prisma
    try {
      // Проверяем соединение с базой данных
      prisma.$connect();
      console.log('Соединение с MongoDB через Prisma установлено успешно');
      return PrismaUser;
    } catch (error) {
      console.error('Ошибка при подключении к MongoDB через Prisma:', error);
      console.warn('Переключаемся на InMemoryUser из-за ошибки подключения');
      return InMemoryUser;
    }
  } else {
    console.log('Выбрана модель: InMemoryUser (USE_MONGODB не true)');
    return InMemoryUser;
  }
}

// Экспортируем правильную модель пользователя
export const User = getUserModel();

// Экспортируем обе модели для прямого доступа при необходимости
export { InMemoryUser, PrismaUser };
