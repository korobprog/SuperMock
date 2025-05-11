const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Схема пользователя
const userSchema = new mongoose.Schema({
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Метод для хеширования пароля перед сохранением
userSchema.pre('save', async function (next) {
  // Хешируем пароль только если он был изменен или это новый пользователь
  if (!this.isModified('password')) return next();

  try {
    // Генерируем соль и хешируем пароль
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Метод для сравнения паролей
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
