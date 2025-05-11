# Используем базовый образ Node.js 22 с явным указанием архитектуры
# Для x86_64/amd64 (большинство серверов)
FROM node:22-bullseye-slim

# Устанавливаем необходимые системные зависимости для компиляции bcrypt
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
# Убедитесь, что вы запускаете docker build из директории backend
COPY package*.json ./

# Удаляем bcrypt и устанавливаем bcryptjs вместо него
# bcryptjs - это чистая JavaScript-реализация, которая не требует компиляции нативных модулей
RUN npm uninstall bcrypt && npm install bcryptjs

# Затем устанавливаем остальные зависимости
RUN npm install --omit=dev

# Добавляем диагностические команды для проверки установки bcrypt
RUN echo "Версия Node.js:" && node --version
RUN echo "Проверка архитектуры:" && uname -a
RUN echo "Проверка наличия bcryptjs:" && ls -la node_modules/bcryptjs
RUN echo "Информация о bcryptjs:" && file node_modules/bcryptjs/dist/bcrypt.js || true

# Копируем исходный код
COPY . .

# Собираем TypeScript
RUN npm run build

# Открываем порт для API и WebSocket
EXPOSE 8080

# Запускаем сервер
CMD ["node", "dist/server.js"]