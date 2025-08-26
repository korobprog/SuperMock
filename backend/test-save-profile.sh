#!/bin/bash

echo "🧪 ТЕСТ СОХРАНЕНИЯ ПРОФИЛЯ"
echo "=========================="
echo ""

# Тестируем сохранение профиля
echo "1. Тестируем сохранение профессии..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_123",
    "profession": "frontend",
    "language": "en"
  }')

echo "Ответ сервера: $RESPONSE"
echo ""

# Тестируем получение профиля
echo "2. Тестируем получение профиля..."
RESPONSE=$(curl -s http://localhost:3000/api/profile/test_user_123)

echo "Ответ сервера: $RESPONSE"
echo ""

# Тестируем сохранение инструментов
echo "3. Тестируем сохранение инструментов..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/user-tools \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_123",
    "profession": "frontend",
    "tools": ["JavaScript", "React", "TypeScript"]
  }')

echo "Ответ сервера: $RESPONSE"
echo ""

echo "✅ Тест завершен!"
echo "Теперь откройте http://localhost:5173 и протестируйте приложение"
