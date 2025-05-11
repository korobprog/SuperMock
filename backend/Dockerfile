# Используем базовый образ Node.js 18
FROM node:18

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем исходный код
COPY . .

# Собираем TypeScript
RUN npm run build

# Открываем порт для API и WebSocket
EXPOSE 8080

# Запускаем сервер
CMD ["node", "dist/server.js"]