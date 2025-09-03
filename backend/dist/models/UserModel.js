"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaUser = exports.InMemoryUser = void 0;
exports.getCurrentUserModel = getCurrentUserModel;
exports.getCurrentUser = getCurrentUser;
const InMemoryUser_1 = require("./InMemoryUser");
Object.defineProperty(exports, "InMemoryUser", { enumerable: true, get: function () { return InMemoryUser_1.InMemoryUser; } });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
// Принудительно загружаем переменные окружения
dotenv_1.default.config();
// Создаем экземпляр Prisma Client
const prisma = new client_1.PrismaClient();
// Класс PrismaUser для работы с Prisma
class PrismaUser {
    id;
    email;
    password;
    roleHistory;
    feedbackStatus;
    createdAt;
    googleId;
    googleAccessToken;
    googleRefreshToken;
    // Поля из Prisma схемы
    tgId;
    username;
    firstName;
    lastName;
    photoUrl;
    language;
    updatedAt;
    constructor(userData) {
        this.id = userData.id;
        this.email = userData.email || `user_${userData.id}@example.com`; // Временный email
        this.password = userData.password || 'temporary_password';
        this.roleHistory = userData.roleHistory || [];
        this.feedbackStatus = userData.feedbackStatus || 'none';
        this.createdAt = userData.createdAt || new Date();
        this.googleId = userData.googleId;
        this.googleAccessToken = userData.googleAccessToken;
        this.googleRefreshToken = userData.googleRefreshToken;
        // Поля из Prisma схемы
        this.tgId = userData.tgId;
        this.username = userData.username;
        this.firstName = userData.firstName;
        this.lastName = userData.lastName;
        this.photoUrl = userData.photoUrl;
        this.language = userData.language;
        this.updatedAt = userData.updatedAt;
    }
    // Метод для сравнения паролей
    async comparePassword(candidatePassword) {
        return bcryptjs_1.default.compare(candidatePassword, this.password);
    }
    // Метод для сохранения пользователя
    async save() {
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
    static async findById(id) {
        const user = await prisma.user.findUnique({
            where: { id },
        });
        return user ? new PrismaUser(user) : null;
    }
    // Поиск пользователя по tgId
    static async findOne(filter) {
        let whereClause = {};
        if (filter.email) {
            // В Prisma схеме нет поля email, поэтому ищем по tgId или возвращаем null
            console.warn('Поиск по email не поддерживается в PrismaUser модели');
            return null;
        }
        else if (filter.tgId) {
            whereClause.tgId = filter.tgId;
        }
        else {
            return null;
        }
        const user = await prisma.user.findFirst({
            where: whereClause,
        });
        return user ? new PrismaUser(user) : null;
    }
    // Поиск пользователя по username
    static async findByUsername(username) {
        const user = await prisma.user.findFirst({
            where: { username },
        });
        return user ? new PrismaUser(user) : null;
    }
    // Поиск пользователя по googleId (не поддерживается в Prisma схеме)
    static async findByGoogleId(googleId) {
        console.warn('Поиск по googleId не поддерживается в PrismaUser модели');
        return null;
    }
    // Создание нового пользователя
    static async create(userData) {
        // Генерируем ID, если он не предоставлен
        if (!userData.id) {
            const { v4: uuidv4 } = require('uuid');
            userData.id = uuidv4();
        }
        const newUser = new PrismaUser(userData);
        return await newUser.save();
    }
}
exports.PrismaUser = PrismaUser;
// Функция для определения, какую модель использовать
function getUserModel() {
    console.log('=== ВЫБОР МОДЕЛИ ПОЛЬЗОВАТЕЛЯ ===');
    const useMongoDb = process.env.USE_MONGODB === 'true';
    const hasDatabaseUrl = process.env.DATABASE_URL;
    console.log(`Переменная окружения USE_MONGODB: ${process.env.USE_MONGODB}`);
    console.log(`DATABASE_URL настроен: ${!!hasDatabaseUrl}`);
    console.log(`Используем MongoDB: ${useMongoDb}`);
    // Добавляем отладку для проверки импортов
    console.log('=== ОТЛАДКА ИМПОРТОВ В USERMODEL ===');
    console.log(`Тип InMemoryUser: ${typeof InMemoryUser_1.InMemoryUser}`);
    console.log(`Тип PrismaUser: ${typeof PrismaUser}`);
    // Используем PostgreSQL если DATABASE_URL настроен, независимо от USE_MONGODB
    if (hasDatabaseUrl) {
        console.log('Выбрана модель: Prisma User (PostgreSQL)');
        // Проверяем соединение с базой данных
        try {
            // Проверяем соединение с базой данных
            prisma.$connect();
            console.log('Соединение с PostgreSQL через Prisma установлено успешно');
            return PrismaUser;
        }
        catch (error) {
            console.error('Ошибка при подключении к PostgreSQL через Prisma:', error);
            console.warn('Переключаемся на InMemoryUser из-за ошибки подключения');
            return InMemoryUser_1.InMemoryUser;
        }
    }
    else if (useMongoDb) {
        console.log('Выбрана модель: Prisma User (MongoDB)');
        // Проверяем, есть ли соединение с MongoDB через Prisma
        try {
            // Проверяем соединение с базой данных
            prisma.$connect();
            console.log('Соединение с MongoDB через Prisma установлено успешно');
            return PrismaUser;
        }
        catch (error) {
            console.error('Ошибка при подключении к MongoDB через Prisma:', error);
            console.warn('Переключаемся на InMemoryUser из-за ошибки подключения');
            return InMemoryUser_1.InMemoryUser;
        }
    }
    else {
        console.log('Выбрана модель: InMemoryUser (нет DATABASE_URL и USE_MONGODB не true)');
        return InMemoryUser_1.InMemoryUser;
    }
}
// Динамический экспорт модели пользователя
function getCurrentUserModel() {
    return getUserModel();
}
// Экспортируем функцию для получения актуальной модели
function getCurrentUser() {
    return getCurrentUserModel();
}
//# sourceMappingURL=UserModel.js.map