# Быстрый старт: Система оплаты YooMoney

Краткое руководство по настройке и запуску системы оплаты через Яндекс.Деньги.

## 🚀 Быстрая настройка

### 1. Настройка YooMoney

1. Перейдите на [https://yoomoney.ru/myservices/online.xml](https://yoomoney.ru/myservices/online.xml)
2. Введите платёжный пароль
3. Настройте HTTP-уведомления:
   - **URL**: `https://your-domain.com/api/payments/webhook/yoomoney`
   - **Секрет**: скопируйте и сохраните

### 2. Переменные окружения

```env
# YooMoney Configuration
YOOMONEY_RECEIVER=41001337976323
YOOMONEY_SECRET_KEY=your_secret_key_from_yoomoney
YOOMONEY_NOTIFICATION_URL=https://your-domain.com/api/payments/webhook/yoomoney
FRONTEND_URL=http://localhost:3000
```

### 3. Установка и запуск

```bash
# Установка зависимостей
cd backend
pnpm install

# Обновление базы данных
pnpm prisma:push

# Запуск сервера
pnpm dev
```

## 🔧 Основные команды

### Создание платежа

```bash
curl -X POST http://localhost:4000/api/payments/create \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "description": "Поддержка SuperMock"
  }'
```

### Проверка статуса

```bash
curl -X GET http://localhost:4000/api/payments/PAYMENT_ID/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Тестирование webhook

```bash
node scripts/test-webhook.js
```

## 📋 Чек-лист настройки

- [ ] Настроен аккаунт YooMoney
- [ ] Добавлены переменные окружения
- [ ] Обновлена база данных
- [ ] Запущен сервер
- [ ] Протестирован webhook
- [ ] Проверена форма оплаты

## 🔍 Быстрая диагностика

### Проверка настроек

```bash
# Проверка переменных окружения
echo $YOOMONEY_RECEIVER
echo $YOOMONEY_SECRET_KEY

# Проверка базы данных
pnpm prisma studio
```

### Логи сервера

```bash
# Просмотр логов
tail -f logs/server.log

# Проверка webhook
curl -X POST http://localhost:4000/api/payments/webhook/yoomoney \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

## 📞 Поддержка

При возникновении проблем:

1. Проверьте [полную документацию](./YOOMONEY_PAYMENT_SYSTEM.md)
2. Изучите раздел [Troubleshooting](./YOOMONEY_PAYMENT_SYSTEM.md#troubleshooting)
3. Проверьте логи сервера
4. Убедитесь в правильности настроек YooMoney

---

**Время настройки:** ~15 минут  
**Сложность:** Средняя  
**Требования:** HTTPS домен для webhook
