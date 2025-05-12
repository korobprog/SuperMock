# Используем базовый образ Node.js 22
FROM node:22-bullseye-slim

# Устанавливаем необходимые системные зависимости
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    make \
    g++ \
    file \
    && rm -rf /var/lib/apt/lists/*

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код
COPY . .

# Собираем TypeScript (если используется)
RUN npm run build || echo "Сборка не требуется"

# Добавляем логирование для отладки
RUN echo "Версия Node.js:" && node --version
RUN echo "Проверка переменных окружения:" && printenv | grep -E "PORT|MONGO|REDIS" || echo "Переменные не найдены"

# Открываем порт для API
EXPOSE 4000

# Запускаем сервер
CMD ["node", "dist/server.js"]