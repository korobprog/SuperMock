"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
// Хранилище пользователей в памяти
const users = [];
class InMemoryUser {
    id;
    email;
    password;
    roleHistory;
    feedbackStatus;
    createdAt;
    googleId;
    googleAccessToken;
    googleRefreshToken;
    tgId;
    constructor(userData) {
        this.id = crypto_1.default.randomUUID();
        this.email = userData.email;
        this.password = userData.password;
        this.roleHistory = userData.roleHistory || [];
        this.feedbackStatus = userData.feedbackStatus || 'none'; // none, pending, completed
        this.createdAt = new Date();
        this.googleId = userData.googleId;
        this.googleAccessToken = userData.googleAccessToken;
        this.googleRefreshToken = userData.googleRefreshToken;
        this.tgId = userData.tgId;
    }
    // Статический метод для поиска пользователя по email или tgId
    static async findOne(query) {
        if ('email' in query && query.email) {
            return users.find((user) => user.email === query.email) || null;
        }
        else if ('tgId' in query && query.tgId) {
            return users.find((user) => user.tgId === query.tgId) || null;
        }
        return null;
    }
    // Статический метод для поиска пользователя по googleId
    static async findByGoogleId(googleId) {
        return users.find((user) => user.googleId === googleId) || null;
    }
    // Статический метод для поиска пользователя по id
    static async findById(id) {
        const user = users.find((user) => user.id === id);
        if (!user)
            return null;
        // Создаем новый экземпляр класса InMemoryUser с данными найденного пользователя
        const userInstance = new InMemoryUser({
            email: user.email,
            password: user.password,
            roleHistory: user.roleHistory || [],
            feedbackStatus: user.feedbackStatus,
            googleId: user.googleId,
            googleAccessToken: user.googleAccessToken,
            googleRefreshToken: user.googleRefreshToken,
        });
        // Копируем id и другие поля из найденного пользователя
        userInstance.id = user.id;
        userInstance.createdAt = user.createdAt;
        // Добавляем метод select для поддержки цепочки вызовов
        userInstance.select = (fields) => {
            // Если поле начинается с '-', исключаем его из результата
            if (fields.startsWith('-')) {
                const fieldToExclude = fields.substring(1);
                const { [fieldToExclude]: excluded, ...rest } = user;
                return rest;
            }
            // Иначе включаем только указанные поля
            const fieldList = fields.split(' ');
            const result = {};
            fieldList.forEach((field) => {
                if (user[field] !== undefined) {
                    result[field] = user[field];
                }
            });
            return result;
        };
        return userInstance;
    }
    // Метод для сохранения пользователя
    async save() {
        try {
            console.log('Сохранение пользователя:', this.id, this.email);
            // Проверяем, существует ли пользователь с таким id
            const existingUserIndex = users.findIndex((user) => user.id === this.id);
            console.log('Существующий индекс:', existingUserIndex);
            if (existingUserIndex !== -1) {
                // Обновляем существующего пользователя
                console.log('Обновление существующего пользователя');
                // Проверяем, что roleHistory является массивом
                if (this.roleHistory && !Array.isArray(this.roleHistory)) {
                    console.error('roleHistory не является массивом:', this.roleHistory);
                    this.roleHistory = [];
                }
                // Сохраняем текущий пароль, чтобы не хешировать его повторно, если он уже хеширован
                const currentPassword = users[existingUserIndex].password;
                // Обновляем пользователя
                users[existingUserIndex] = this;
                // Восстанавливаем хешированный пароль, если текущий пароль не изменился
                if (this.password === 'temporary_password') {
                    users[existingUserIndex].password = currentPassword;
                }
                console.log('Пользователь обновлен');
            }
            else {
                // Проверяем, существует ли пользователь с таким email
                const existingUserByEmail = users.find((user) => user.email === this.email);
                if (existingUserByEmail &&
                    this.email !== `user_${this.id}@example.com`) {
                    throw new Error('Пользователь с таким email уже существует');
                }
                // Инициализируем roleHistory как пустой массив
                if (!this.roleHistory) {
                    this.roleHistory = [];
                }
                // Хешируем пароль перед сохранением только для нового пользователя
                const salt = await bcryptjs_1.default.genSalt(10);
                this.password = await bcryptjs_1.default.hash(this.password, salt);
                // Добавляем пользователя в хранилище
                users.push(this);
                console.log('Новый пользователь добавлен');
            }
            return this;
        }
        catch (error) {
            console.error('Ошибка при сохранении пользователя:', error);
            throw new Error(`Ошибка при сохранении пользователя: ${error.message}`);
        }
    }
    // Метод для сравнения паролей
    async comparePassword(candidatePassword) {
        return bcryptjs_1.default.compare(candidatePassword, this.password);
    }
}
exports.InMemoryUser = InMemoryUser;
//# sourceMappingURL=InMemoryUser.js.map