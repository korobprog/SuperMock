"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryFeedback = void 0;
const uuid_1 = require("uuid");
// Класс для работы с обратной связью в памяти
class InMemoryFeedback {
    id;
    sessionId;
    userId;
    ratings;
    comments;
    recommendations;
    createdAt;
    updatedAt;
    // Хранилище обратной связи в памяти
    static feedbacks = [];
    constructor(data) {
        this.id = data.id || (0, uuid_1.v4)();
        this.sessionId = data.sessionId;
        this.userId = data.userId;
        this.ratings = data.ratings || {};
        this.comments = data.comments || '';
        this.recommendations = data.recommendations || '';
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
    }
    // Сохранение обратной связи
    async save() {
        const existingIndex = InMemoryFeedback.feedbacks.findIndex((feedback) => feedback.id === this.id);
        if (existingIndex !== -1) {
            // Обновляем существующую обратную связь
            this.updatedAt = new Date();
            InMemoryFeedback.feedbacks[existingIndex] = this;
            console.log('Обратная связь обновлена');
        }
        else {
            // Добавляем новую обратную связь
            InMemoryFeedback.feedbacks.push(this);
            console.log('Новая обратная связь добавлена');
        }
        return this;
    }
    // Поиск обратной связи по ID
    static async findById(id) {
        const feedback = this.feedbacks.find((feedback) => feedback.id === id);
        return feedback || null;
    }
    // Поиск обратной связи по ID сессии
    static async findBySessionId(sessionId) {
        return this.feedbacks.filter((feedback) => feedback.sessionId === sessionId);
    }
    // Поиск обратной связи по ID пользователя
    static async findByUserId(userId) {
        return this.feedbacks.filter((feedback) => feedback.userId === userId);
    }
    // Поиск обратной связи по ID пользователя и ID сессии
    static async findByUserAndSession(userId, sessionId) {
        const feedback = this.feedbacks.find((feedback) => feedback.userId === userId && feedback.sessionId === sessionId);
        return feedback || null;
    }
    // Удаление обратной связи по ID
    static async deleteById(id) {
        const initialLength = this.feedbacks.length;
        this.feedbacks = this.feedbacks.filter((feedback) => feedback.id !== id);
        return initialLength !== this.feedbacks.length;
    }
    // Получение всех обратных связей
    static async find() {
        return this.feedbacks;
    }
}
exports.InMemoryFeedback = InMemoryFeedback;
//# sourceMappingURL=InMemoryFeedback.js.map