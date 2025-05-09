const mongoose = require('mongoose');

// Схема для логирования действий с видеоссылками
const logSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  details: {
    type: Object,
    default: {},
  },
});

const Log = mongoose.model('Log', logSchema);

module.exports = Log;
