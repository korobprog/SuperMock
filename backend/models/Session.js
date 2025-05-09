const mongoose = require('mongoose');

// Схема сессии
const sessionSchema = new mongoose.Schema({
  interviewerId: {
    type: String,
    default: null,
  },
  intervieweeId: {
    type: String,
    default: null,
  },
  observerIds: {
    type: [String],
    default: [],
  },
  videoLink: {
    type: String,
    default: null,
  },
  videoLinkStatus: {
    type: String,
    enum: ['active', 'expired', 'manual', 'pending', ''],
    default: 'pending',
  },
  creatorId: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed'],
    default: 'pending',
  },
  startTime: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Статический метод для поиска всех сессий
sessionSchema.statics.findLastSessionAsInterviewer = async function (userId) {
  try {
    if (!userId) {
      console.error('findLastSessionAsInterviewer: userId не определен');
      return null;
    }

    // Сортируем сессии по дате создания (от новых к старым)
    return this.findOne({ interviewerId: userId })
      .sort({ createdAt: -1 })
      .exec();
  } catch (error) {
    console.error('Ошибка в findLastSessionAsInterviewer:', error.message);
    return null;
  }
};

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
