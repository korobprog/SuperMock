"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoUser = exports.InMemoryUser = exports.User = void 0;
const InMemoryUser_1 = require("./InMemoryUser");
Object.defineProperty(exports, "InMemoryUser", { enumerable: true, get: function () { return InMemoryUser_1.InMemoryUser; } });
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// Схема пользователя для MongoDB
const userSchema = new mongoose_1.default.Schema({
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
userSchema.pre('save', async function (next) {
    // Хешируем пароль только если он был изменен или это новый пользователь
    if (!this.isModified('password'))
        return next();
    try {
        // Генерируем соль и хешируем пароль
        const salt = await bcryptjs_1.default.genSalt(10);
        this.password = await bcryptjs_1.default.hash(this.password, salt);
        next();
    }
    catch (error) {
        next(error);
    }
});
// Метод для сравнения паролей
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcryptjs_1.default.compare(candidatePassword, this.password);
};
// Создаем модель MongoDB
const MongoUser = mongoose_1.default.model('User', userSchema);
exports.MongoUser = MongoUser;
// Функция для определения, какую модель использовать
function getUserModel() {
    console.log('=== ВЫБОР МОДЕЛИ ПОЛЬЗОВАТЕЛЯ ===');
    const useMongoDb = process.env.USE_MONGODB === 'true';
    console.log(`Переменная окружения USE_MONGODB: ${process.env.USE_MONGODB}`);
    console.log(`Используем MongoDB: ${useMongoDb}`);
    // Добавляем отладку для проверки импортов
    console.log('=== ОТЛАДКА ИМПОРТОВ В USERMODEL ===');
    console.log(`Тип InMemoryUser: ${typeof InMemoryUser_1.InMemoryUser}`);
    console.log(`Тип MongoUser: ${typeof MongoUser}`);
    if (useMongoDb) {
        console.log('Выбрана модель: MongoDB User');
        // Проверяем, есть ли соединение с MongoDB
        console.log(`Состояние соединения MongoDB: ${mongoose_1.default.connection.readyState}`);
        if (mongoose_1.default.connection.readyState === 0) {
            console.log('Соединение с MongoDB не установлено, пытаемся подключиться...');
            const mongoUri = process.env.MONGO_URI;
            if (!mongoUri) {
                console.error('MONGO_URI не определен, но USE_MONGODB=true');
                console.warn('Переключаемся на InMemoryUser из-за отсутствия MONGO_URI');
                return InMemoryUser_1.InMemoryUser;
            }
            // Добавляем отладочную информацию о MongoDB
            console.log('=== ОТЛАДКА MONGODB ===');
            console.log('Текущие настройки MongoDB:');
            console.log(`- MONGO_URI: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
            console.log('Ожидаемые настройки MongoDB на хостинге:');
            console.log('- MongoDB хост: c641b068463c.vps.myjino.ru');
            console.log('- MongoDB порт: 49305');
            // Подключаемся к MongoDB
            try {
                // Синхронная проверка подключения
                console.log('Попытка синхронного подключения к MongoDB...');
                mongoose_1.default
                    .connect(mongoUri)
                    .then(() => {
                    console.log('Соединение с MongoDB установлено успешно');
                    console.log(`Новое состояние соединения: ${mongoose_1.default.connection.readyState}`);
                })
                    .catch((err) => {
                    console.error('Ошибка подключения к MongoDB:', err);
                    console.warn('Переключаемся на InMemoryUser из-за ошибки подключения к MongoDB');
                    // Здесь нет возврата InMemoryUser, что может быть проблемой
                });
            }
            catch (error) {
                console.error('Исключение при подключении к MongoDB:', error);
                console.warn('Переключаемся на InMemoryUser из-за исключения');
                return InMemoryUser_1.InMemoryUser;
            }
        }
        else {
            console.log(`MongoDB уже подключена, состояние: ${mongoose_1.default.connection.readyState}`);
        }
        console.log('Возвращаем MongoUser из getUserModel()');
        return MongoUser;
    }
    else {
        console.log('Выбрана модель: InMemoryUser (USE_MONGODB не true)');
        return InMemoryUser_1.InMemoryUser;
    }
}
// Экспортируем правильную модель пользователя
exports.User = getUserModel();
//# sourceMappingURL=UserModel.js.map