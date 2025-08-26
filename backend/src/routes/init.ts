import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

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

      // Extract user id from Telegram-like object or fallback
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

      res.json({ user });
    } catch (err) {
      console.error('Error in POST /api/init:', err);
      res.status(500).json({ error: 'Failed to initialize user' });
    }
  }) as RequestHandler
);

export default router;


