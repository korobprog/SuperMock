# Примеры интеграции системы оплаты YooMoney

Практические примеры кода для интеграции системы оплаты в ваше приложение.

## 📋 Содержание

- [Frontend интеграция](#frontend-интеграция)
- [Backend интеграция](#backend-интеграция)
- [Telegram Bot интеграция](#telegram-bot-интеграция)
- [Тестирование](#тестирование)

## 🎨 Frontend интеграция

### React компонент для создания платежа

```tsx
import React, { useState } from 'react';

interface PaymentFormProps {
  onPaymentCreated: (payment: any) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ onPaymentCreated }) => {
  const [amount, setAmount] = useState(100);
  const [description, setDescription] = useState('Поддержка SuperMock');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ amount, description })
      });

      const result = await response.json();

      if (result.success) {
        onPaymentCreated(result.payment);
        
        // Отображаем форму оплаты YooMoney
        const formContainer = document.getElementById('payment-form-container');
        if (formContainer) {
          formContainer.innerHTML = result.paymentForm;
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Ошибка при создании платежа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-form">
      <h2>💳 Создать платеж</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="amount">Сумма (₽):</label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            min="1"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Описание:</label>
          <input
            type="text"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Создание...' : 'Создать платеж'}
        </button>
      </form>

      {error && <div className="error">{error}</div>}
      
      <div id="payment-form-container"></div>
    </div>
  );
};

export default PaymentForm;
```

### Хук для проверки статуса платежа

```tsx
import { useState, useEffect } from 'react';

export const usePaymentStatus = (paymentId: string) => {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const checkStatus = async () => {
    try {
      const response = await fetch(`/api/payments/${paymentId}/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (result.success) {
        setStatus(result.status);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Ошибка проверки статуса');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paymentId) {
      checkStatus();
      
      // Проверяем статус каждые 30 секунд
      const interval = setInterval(checkStatus, 30000);
      
      return () => clearInterval(interval);
    }
  }, [paymentId]);

  return { status, loading, error, checkStatus };
};
```

## 🔧 Backend интеграция

### Middleware для проверки платежей

```typescript
// middleware/paymentCheck.ts
import { Request, Response, NextFunction } from 'express';
import { PaymentModel } from '../models/PaymentModel';

export const requirePayment = (requiredAmount: number = 0) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const stats = await PaymentModel.getUserStats(userId);

      if (stats.completedAmount < requiredAmount) {
        return res.status(402).json({
          success: false,
          error: 'Payment required',
          requiredAmount,
          currentAmount: stats.completedAmount,
          message: `Необходимо оплатить минимум ${requiredAmount} ₽`
        });
      }

      next();
    } catch (error) {
      console.error('Payment check error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };
};
```

## 🤖 Telegram Bot интеграция

### Команды для управления платежами

```typescript
// telegram/paymentCommands.ts
import { Telegraf, Context } from 'telegraf';
import { PaymentModel } from '../models/PaymentModel';

export const setupPaymentCommands = (bot: Telegraf<Context>) => {
  // Команда для создания платежа
  bot.command('donate', async (ctx) => {
    try {
      const userId = ctx.from?.id.toString();
      if (!userId) return;

      const payment = await PaymentModel.create({
        userId,
        amount: 100,
        description: 'Донат через Telegram',
        metadata: { source: 'telegram' }
      });

      const message = `
💳 Создан платеж для поддержки SuperMock

💰 Сумма: ${payment.amount} ₽
📝 Описание: ${payment.description}
🆔 ID платежа: ${payment.id}

Для оплаты перейдите по ссылке:
https://yoomoney.ru/to/41001337976323

В комментарии укажите: ${payment.yoomoneyLabel}

После оплаты мы автоматически зачислим ваш донат!
      `;

      await ctx.reply(message);
    } catch (error) {
      console.error('Telegram payment creation error:', error);
      await ctx.reply('❌ Ошибка создания платежа');
    }
  });
};
```

## 🧪 Тестирование

### Тестовые сценарии

```typescript
// tests/payment.test.ts
import request from 'supertest';
import { app } from '../src/server';

describe('Payment System Tests', () => {
  let authToken: string;

  beforeAll(async () => {
    // Получаем токен авторизации
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    authToken = loginResponse.body.token;
  });

  describe('POST /api/payments/create', () => {
    it('should create a new payment', async () => {
      const response = await request(app)
        .post('/api/payments/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 100,
          description: 'Test payment'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.payment).toBeDefined();
    });
  });
});
```

---

**Примечание:** Все примеры кода готовы к использованию и могут быть адаптированы под ваши потребности.
