# Этап сборки
FROM node:22-bullseye-slim as build

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код
COPY . .

# Добавляем логирование для отладки
RUN echo "Переменные окружения при сборке:" && printenv | grep VITE_ || echo "Переменные VITE_ не найдены при сборке"

# Собираем приложение
RUN npm run build

# Этап запуска
FROM nginx:stable-alpine

# Копируем собранные файлы из этапа сборки
COPY --from=build /app/dist /usr/share/nginx/html

# Копируем конфигурацию Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Копируем скрипт для замены переменных окружения в runtime
COPY env.sh /docker-entrypoint.d/40-env.sh
RUN chmod +x /docker-entrypoint.d/40-env.sh

# Добавляем логирование для отладки
RUN echo "Проверка конфигурации Nginx:" && nginx -t

# Экспонируем порт 80
EXPOSE 80

# Запускаем Nginx
CMD ["nginx", "-g", "daemon off;"]