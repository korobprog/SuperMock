# Этап сборки
FROM node:22-bullseye-slim AS builder

# Устанавливаем необходимые системные зависимости для сборки
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

# Собираем TypeScript
RUN echo "=== НАЧАЛО СБОРКИ TYPESCRIPT ===" && \
    npm run build && \
    echo "=== СБОРКА TYPESCRIPT УСПЕШНО ЗАВЕРШЕНА ===" && \
    echo "Проверка содержимого директории dist:" && \
    ls -la dist && \
    echo "Проверка наличия скомпилированных файлов JS:" && \
    find dist -name "*.js" | sort

# Этап production
FROM node:22-bullseye-slim

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем только необходимые файлы из этапа сборки
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

# Создаем непривилегированного пользователя
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Устанавливаем правильные разрешения
RUN chown -R appuser:appuser /app

# Переключаемся на непривилегированного пользователя
USER appuser

# Добавляем логирование для отладки
RUN echo "Версия Node.js:" && node --version

# Открываем порт для API
EXPOSE 4000

# Запускаем сервер
CMD ["node", "dist/server.js"]