"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryCalendarEntry = void 0;
const crypto_1 = __importDefault(require("crypto"));
// Хранилище записей календаря в памяти
const calendarEntries = [];
class InMemoryCalendarEntry {
    id;
    sessionId;
    videoLink;
    startTime;
    participants;
    createdAt;
    constructor(entryData) {
        this.id = crypto_1.default.randomUUID();
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
    static async find() {
        return [...calendarEntries];
    }
    // Статический метод для поиска записи календаря по id сессии
    static async findBySessionId(sessionId) {
        return (calendarEntries.find((entry) => entry.sessionId === sessionId) || null);
    }
    // Метод для сохранения записи календаря
    async save() {
        try {
            // Проверяем, существует ли запись с таким sessionId
            const existingEntryIndex = calendarEntries.findIndex((entry) => entry.sessionId === this.sessionId);
            console.log('Сохранение записи календаря для сессии:', this.sessionId);
            console.log('Существующий индекс:', existingEntryIndex);
            if (existingEntryIndex !== -1) {
                // Обновляем существующую запись
                calendarEntries[existingEntryIndex] = this;
                console.log('Запись календаря обновлена');
            }
            else {
                // Добавляем новую запись в хранилище
                calendarEntries.push(this);
                console.log('Новая запись календаря добавлена');
            }
            return this;
        }
        catch (error) {
            console.error('Ошибка при сохранении записи календаря:', error);
            throw new Error(`Ошибка при сохранении записи календаря: ${error.message}`);
        }
    }
    // Метод для добавления участника
    async addParticipant(userId) {
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
        }
        catch (error) {
            console.error('Ошибка в методе addParticipant:', error);
            throw new Error(`Ошибка при добавлении участника: ${error.message}`);
        }
    }
    // Метод для обновления ссылки на видео
    async updateVideoLink(videoLink) {
        try {
            this.videoLink = videoLink;
            return this.save();
        }
        catch (error) {
            console.error('Ошибка в методе updateVideoLink:', error);
            throw new Error(`Ошибка при обновлении ссылки на видео: ${error.message}`);
        }
    }
}
exports.InMemoryCalendarEntry = InMemoryCalendarEntry;
//# sourceMappingURL=InMemoryCalendar.js.map