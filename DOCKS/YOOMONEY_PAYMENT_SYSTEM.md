# Система оплаты YooMoney

Документация по интеграции системы оплаты через Яндекс.Деньги (YooMoney) с автоматическими HTTP-уведомлениями.

## 📋 Содержание

- [Обзор системы](#обзор-системы)
- [Архитектура](#архитектура)
- [Настройка](#настройка)
- [API Endpoints](#api-endpoints)
- [Модели данных](#модели-данных)
- [Безопасность](#безопасность)
- [Тестирование](#тестирование)
- [Troubleshooting](#troubleshooting)

## 🎯 Обзор системы

Система оплаты YooMoney позволяет пользователям совершать платежи через Яндекс.Деньги с автоматической обработкой уведомлений и идентификацией отправителей.

### Основные возможности

- ✅ Создание платежей с уникальными идентификаторами
- ✅ Автоматические HTTP-уведомления от YooMoney
- ✅ Проверка подписи уведомлений для безопасности
- ✅ Отслеживание статуса платежей
- ✅ История платежей пользователей
- ✅ Поддержка различных статусов платежей

### Принцип работы

1. **Создание платежа** - система генерирует уникальный `label` для идентификации
2. **Форма оплаты** - пользователь переходит на страницу YooMoney
3. **HTTP-уведомление** - YooMoney отправляет уведомление на наш webhook
4. **Проверка подписи** - система проверяет подлинность уведомления
5. **Обновление статуса** - платеж помечается как завершенный
6. **Активация функций** - пользователь получает доступ к премиум-функциям

## 🏗️ Архитектура

### Компоненты системы

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   YooMoney      │
│                 │    │                 │    │                 │
│ Payment Form    │───▶│ Payment Routes  │───▶│ Payment Gateway │
│ Payment Status  │◀───│ YooMoney Service│◀───│ HTTP Webhook    │
│ Payment History │    │ Payment Model   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Поток данных

1. **Создание платежа**
   ```
   Frontend → POST /api/payments/create → PaymentModel.create()
   ```

2. **Обработка уведомления**
   ```
   YooMoney → POST /api/payments/webhook/yoomoney → YooMoneyService.verifyNotification()
   ```

3. **Проверка статуса**
   ```
   Frontend → GET /api/payments/:id/status → PaymentModel.findById()
   ```

## ⚙️ Настройка

### 1. Регистрация в YooMoney

1. Перейдите на [https://yoomoney.ru/myservices/online.xml](https://yoomoney.ru/myservices/online.xml)
2. Введите платёжный пароль
3. Настройте HTTP-уведомления:
   - **URL уведомлений**: `https://your-domain.com/api/payments/webhook/yoomoney`
   - **Секретный ключ**: скопируйте и сохраните для `.env`
   - **Протокол**: используйте HTTPS для получения личной информации

### 2. Переменные окружения

Добавьте в файл `.env`:

```env
# YooMoney Configuration
YOOMONEY_RECEIVER=41001337976323
YOOMONEY_SECRET_KEY=your_secret_key_from_yoomoney
YOOMONEY_NOTIFICATION_URL=https://your-domain.com/api/payments/webhook/yoomoney
FRONTEND_URL=http://localhost:3000
```

### 3. Установка зависимостей

```bash
cd backend
pnpm install
```

### 4. Обновление базы данных

```bash
pnpm prisma:push
```

### 5. Запуск сервера

```bash
pnpm dev
```

## 🔌 API Endpoints

### Создание платежа

```http
POST /api/payments/create
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "amount": 100,
  "description": "Поддержка SuperMock"
}
```

**Ответ:**
```json
{
  "success": true,
  "payment": {
    "id": "payment_123",
    "amount": 100,
    "currency": "RUB",
    "description": "Поддержка SuperMock",
    "status": "pending",
    "yoomoneyLabel": "user_123_payment_456_abc123",
    "createdAt": "2024-01-01T12:00:00Z"
  },
  "paymentForm": "<form>...</form>",
  "successUrl": "http://localhost:3000/payment/success?payment_id=payment_123",
  "failUrl": "http://localhost:3000/payment/fail?payment_id=payment_123"
}
```

### Получение информации о платеже

```http
GET /api/payments/:paymentId
Authorization: Bearer <jwt_token>
```

### История платежей

```http
GET /api/payments/history/list?page=1&limit=10
Authorization: Bearer <jwt_token>
```

### Проверка статуса

```http
GET /api/payments/:paymentId/status
Authorization: Bearer <jwt_token>
```

### Webhook YooMoney

```http
POST /api/payments/webhook/yoomoney
Content-Type: application/x-www-form-urlencoded

notification_type=p2p-incoming&operation_id=123&amount=100&...
```

## 📊 Модели данных

### Payment Model

```typescript
interface IPayment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  yoomoneyLabel: string;
  yoomoneyOperationId?: string;
  yoomoneySha1Hash?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}
```

### YooMoney Notification

```typescript
interface YooMoneyNotification {
  notification_type: string;
  operation_id: string;
  amount: number;
  currency: string;
  datetime: string;
  sender: string;
  codepro: boolean;
  label: string;
  sha1_hash: string;
  unaccepted: boolean;
  // HTTPS поля
  firstname?: string;
  lastname?: string;
  email?: string;
  phone?: string;
  // ... другие поля
}
```

## 🔒 Безопасность

### Проверка подписи

Система проверяет подлинность уведомлений от YooMoney с помощью SHA1 хеша:

```typescript
const checkString = `${notification_type}&${operation_id}&${amount}&${currency}&${datetime}&${sender}&${codepro}&${secret_key}&${label}`;
const calculatedHash = crypto.createHash('sha1').update(checkString).digest('hex');
return calculatedHash === sha1_hash;
```

### Статусы платежей

- **pending** - платеж создан, ожидает оплаты
- **completed** - платеж успешно завершен
- **failed** - платеж не прошел (unaccepted = true)
- **cancelled** - платеж отменен

### Проверка статуса

```typescript
function checkPaymentStatus(notification: YooMoneyNotification): 'completed' | 'failed' | 'pending' {
  if (notification.unaccepted) return 'pending';
  if (notification.codepro) return 'pending';
  return 'completed';
}
```

## 🧪 Тестирование

### Тестовый webhook

Создайте файл `scripts/test-webhook.js`:

```javascript
const crypto = require('crypto');
const fetch = require('node-fetch');

const testNotification = {
  notification_type: 'p2p-incoming',
  operation_id: 'test-operation-123',
  amount: 100.00,
  currency: 'RUB',
  datetime: new Date().toISOString(),
  sender: 'test-sender',
  codepro: false,
  label: 'test-label-123',
  unaccepted: false,
  sha1_hash: 'test-hash'
};

// Генерируем правильный хеш
const secretKey = process.env.YOOMONEY_SECRET_KEY || 'test-secret';
const checkString = `${testNotification.notification_type}&${testNotification.operation_id}&${testNotification.amount}&${testNotification.currency}&${testNotification.datetime}&${testNotification.sender}&${testNotification.codepro}&${secretKey}&${testNotification.label}`;
const calculatedHash = crypto.createHash('sha1').update(checkString).digest('hex');

testNotification.sha1_hash = calculatedHash;

// Отправляем тестовый webhook
async function testWebhook() {
  const response = await fetch('http://localhost:4000/api/payments/webhook/yoomoney', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testNotification),
  });
  
  console.log('Status:', response.status);
  console.log('Response:', await response.text());
}

testWebhook();
```

### Запуск тестов

```bash
node scripts/test-webhook.js
```

### Тестирование в браузере

1. Откройте `http://localhost:4000/payment.html`
2. Создайте тестовый платеж
3. Проверьте генерацию формы YooMoney

## 🔧 Troubleshooting

### Частые проблемы

#### 1. "Invalid signature" ошибка

**Причина:** Неправильный секретный ключ или формат данных

**Решение:**
- Проверьте `YOOMONEY_SECRET_KEY` в `.env`
- Убедитесь, что используется правильный алгоритм SHA1
- Проверьте порядок полей в строке для хеширования

#### 2. "Payment not found" ошибка

**Причина:** Label не найден в базе данных

**Решение:**
- Проверьте, что платеж был создан с правильным label
- Убедитесь, что webhook получает правильный label
- Проверьте логи создания платежей

#### 3. Уведомления не приходят

**Причина:** Неправильная настройка webhook URL

**Решение:**
- Проверьте URL в настройках YooMoney
- Убедитесь, что сервер доступен по HTTPS
- Проверьте, что порт 443 открыт

#### 4. Платежи не обновляются

**Причина:** Ошибка в обработке webhook

**Решение:**
- Проверьте логи сервера
- Убедитесь, что база данных доступна
- Проверьте права доступа к файлам

### Логирование

Система логирует все важные события:

```typescript
// Создание платежа
console.log(`Payment ${payment.id} created for user ${userId}`);

// Получение webhook
YooMoneyService.logNotification(notification);

// Обработка ошибок
console.error('YooMoney webhook error:', error);
```

### Мониторинг

Рекомендуется настроить мониторинг:

1. **Логи webhook** - отслеживание всех входящих уведомлений
2. **Статусы платежей** - мониторинг успешных/неуспешных платежей
3. **Ошибки подписи** - отслеживание попыток подделки
4. **Время обработки** - мониторинг производительности

## 📈 Расширение функциональности

### Возможные улучшения

1. **Множественные валюты** - поддержка USD, EUR
2. **Возвраты** - система возврата средств
3. **Подписки** - рекуррентные платежи
4. **Аналитика** - детальная статистика платежей
5. **Уведомления** - email/SMS уведомления о платежах

### Интеграция с другими системами

- **Telegram Bot** - уведомления о платежах
- **Email Service** - отправка чеков
- **Analytics** - отслеживание конверсии
- **CRM** - интеграция с системой управления клиентами

## 📚 Дополнительные ресурсы

- [Официальная документация YooMoney](https://yoomoney.ru/docs/payment-buttons/using-api/forms)
- [HTTP-уведомления YooMoney](https://yoomoney.ru/docs/payment-buttons/using-api/notifications)
- [Примеры интеграции](https://misha.agency/yandex/http-uvedomleniya.html)

---

**Версия документации:** 1.0  
**Последнее обновление:** 2024-01-01  
**Автор:** SuperMock Team
