"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
// Схема для сессии
const sessionSchema = new mongoose_1.Schema({
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
}, { timestamps: true });
// Метод для назначения роли пользователю
sessionSchema.methods.assignRole = async function (userId, role) {
    try {
        if (!userId) {
            throw new Error('userId не определен при назначении роли');
        }
        if (!role || !['interviewer', 'interviewee', 'observer'].includes(role)) {
            throw new Error(`Некорректная роль: ${role}`);
        }
        if (role === 'interviewer') {
            this.interviewerId = userId;
        }
        else if (role === 'interviewee') {
            this.intervieweeId = userId;
        }
        else if (role === 'observer') {
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
    }
    catch (error) {
        console.error('Ошибка в методе assignRole:', error);
        throw new Error(`Ошибка при назначении роли: ${error.message}`);
    }
};
// Статический метод для поиска последней сессии, где пользователь был интервьюером
sessionSchema.statics.findLastSessionAsInterviewer = async function (userId) {
    try {
        if (!userId) {
            console.error('findLastSessionAsInterviewer: userId не определен');
            return null;
        }
        // Находим последнюю сессию, где пользователь был интервьюером
        return await this.findOne({ interviewerId: userId })
            .sort({ createdAt: -1 })
            .exec();
    }
    catch (error) {
        console.error('Ошибка в findLastSessionAsInterviewer:', error.message);
        return null;
    }
};
// Создаем и экспортируем модель
const Session = mongoose_1.default.model('Session', sessionSchema);
exports.default = Session;
//# sourceMappingURL=Session.js.map