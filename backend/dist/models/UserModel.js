"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaUser = exports.InMemoryUser = exports.User = void 0;
const InMemoryUser_1 = require("./InMemoryUser");
Object.defineProperty(exports, "InMemoryUser", { enumerable: true, get: function () { return InMemoryUser_1.InMemoryUser; } });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
// Создаем экземпляр Prisma Client
const prisma = new client_1.PrismaClient();
// Класс PrismaUser для работы с Prisma
class PrismaUser {
    constructor(userData) {
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
    async comparePassword(candidatePassword) {
        return bcryptjs_1.default.compare(candidatePassword, this.password);
    }
    // Метод для сохранения пользователя
    async save() {
        // Хешируем пароль, если он был изменен
        const existingUser = await prisma.user.findUnique({
            where: { id: this.id },
        });
        // Если пользователь новый или пароль изменился, хешируем его
        if (!existingUser || existingUser.password !== this.password) {
            const salt = await bcryptjs_1.default.genSalt(10);
            this.password = await bcryptjs_1.default.hash(this.password, salt);
        }
        // Сохраняем пользователя в базу данных
        const savedUser = await prisma.user.upsert({
            where: { id: this.id },
            update: {
                email: this.email,
                password: this.password,
                roleHistory: this.roleHistory,
                feedbackStatus: this.feedbackStatus,
                googleId: this.googleId,
                googleAccessToken: this.googleAccessToken,
                googleRefreshToken: this.googleRefreshToken,
            },
            create: {
                id: this.id,
                email: this.email,
                password: this.password,
                roleHistory: this.roleHistory,
                feedbackStatus: this.feedbackStatus,
                createdAt: this.createdAt,
                googleId: this.googleId,
                googleAccessToken: this.googleAccessToken,
                googleRefreshToken: this.googleRefreshToken,
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
    // Поиск пользователя по email
    static async findOne(filter) {
        const user = await prisma.user.findUnique({
            where: { email: filter.email },
        });
        return user ? new PrismaUser(user) : null;
    }
    // Поиск пользователя по googleId
    static async findByGoogleId(googleId) {
        const user = await prisma.user.findFirst({
            where: { googleId },
        });
        return user ? new PrismaUser(user) : null;
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
    console.log(`Переменная окружения USE_MONGODB: ${process.env.USE_MONGODB}`);
    console.log(`Используем MongoDB: ${useMongoDb}`);
    // Добавляем отладку для проверки импортов
    console.log('=== ОТЛАДКА ИМПОРТОВ В USERMODEL ===');
    console.log(`Тип InMemoryUser: ${typeof InMemoryUser_1.InMemoryUser}`);
    console.log(`Тип PrismaUser: ${typeof PrismaUser}`);
    if (useMongoDb) {
        console.log('Выбрана модель: Prisma User');
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
        console.log('Выбрана модель: InMemoryUser (USE_MONGODB не true)');
        return InMemoryUser_1.InMemoryUser;
    }
}
// Экспортируем правильную модель пользователя
exports.User = getUserModel();
//# sourceMappingURL=UserModel.js.map