import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthDataValidator } from '@telegram-auth/server';

const router = express.Router();
const prisma = new PrismaClient();

// Инициализируем валидатор Telegram OAuth
const telegramValidator = new AuthDataValidator({ 
  botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  inValidateDataAfter: 3600 // 1 час
});

// POST /api/init
// body: { tg?: { id:number|string, first_name?:string, username?:string, language_code?:string }, language?: string, initData?: string }
router.post(
  '/',
  (async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { tg, language, initData } = req.body || {};

      console.log('Init endpoint called with:', {
        tg,
        language,
        initData: initData ? 'present' : 'missing',
      });

      // Support demo mode
      const isDemoMode =
        (process.env.NODE_ENV !== 'production' ||
          process.env.ENABLE_DEMO_MODE === '1') &&
        initData === 'demo_hash_12345';
      console.log('Demo mode:', isDemoMode);

      // Если это Telegram OAuth данные, валидируем их
      if (tg && tg.hash && tg.auth_date && !isDemoMode) {
        try {
          console.log('🔐 Validating Telegram Login Widget data...');
          
          // Создаем Map для валидации
          const authDataMap = new Map([
            ['id', tg.id.toString()],
            ['first_name', tg.first_name || ''],
            ['last_name', tg.last_name || ''],
            ['username', tg.username || ''],
            ['photo_url', tg.photo_url || ''],
            ['auth_date', tg.auth_date.toString()],
            ['hash', tg.hash]
          ]);

          // Валидируем данные
          const validatedUser = await telegramValidator.validate(authDataMap);
          console.log('✅ Telegram Login Widget data validated successfully:', validatedUser);
          
          // Используем валидированные данные
          const userId = String(validatedUser.id);
          const userLang: string | undefined = language || validatedUser.language_code || 'ru';

          // Ensure user exists / update language
          const user = await prisma.user.upsert({
            where: { id: userId },
            update: { 
              language: userLang,
              tgId: String(validatedUser.id),
              username: validatedUser.username || null,
              firstName: validatedUser.first_name || null,
            },
            create: {
              id: userId,
              tgId: String(validatedUser.id),
              username: validatedUser.username || null,
              firstName: validatedUser.first_name || null,
              language: userLang,
            },
            select: { id: true, language: true },
          });

          res.json({ user, telegramValidated: true });
          return;
          
        } catch (validationError) {
          console.error('❌ Telegram Login Widget validation failed:', validationError);
          
          // Если валидация не удалась, но у нас есть данные, все равно создаем пользователя
          // Это может быть полезно для отладки
          console.log('⚠️ Proceeding with unvalidated data for debugging...');
          
          const userId = String(tg.id);
          const userLang: string | undefined = language || 'ru';

          const user = await prisma.user.upsert({
            where: { id: userId },
            update: { 
              language: userLang,
              tgId: String(tg.id),
              username: tg.username || null,
              firstName: tg.first_name || null,
            },
            create: {
              id: userId,
              tgId: String(tg.id),
              username: tg.username || null,
              firstName: tg.first_name || null,
              language: userLang,
            },
            select: { id: true, language: true },
          });

          res.json({ user, telegramValidated: false, validationError: validationError instanceof Error ? validationError.message : 'Unknown error' });
          return;
        }
      }

      // Fallback для невалидированных данных или demo режима
      const rawId = tg?.id ?? req.body?.userId ?? null;
      if (!rawId) {
        return res.status(400).json({ error: 'Missing user id' });
      }
      const userId = String(rawId);
      const userLang: string | undefined = language || tg?.language_code || undefined;

      // Ensure user exists / update language
      const user = await prisma.user.upsert({
        where: { id: userId },
        update: { language: userLang ?? undefined },
        create: {
          id: userId,
          tgId: String(rawId),
          username: tg?.username ?? null,
          firstName: tg?.first_name ?? null,
          language: userLang ?? 'ru',
        },
        select: { id: true, language: true },
      });

      res.json({ user, telegramValidated: false });
    } catch (err) {
      console.error('Error in POST /api/init:', err);
      res.status(500).json({ error: 'Failed to initialize user' });
    }
  }) as RequestHandler
);

export default router;


