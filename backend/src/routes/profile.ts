import express, { Request, Response, NextFunction, RequestHandler } from 'express';
const router = express.Router();
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/profile/:userId - Get user profile
router.get(
  '/:userId',
  (async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = String(req.params.userId);
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const pref = await prisma.preference.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { role: true, profession: true, language: true, slotsUtc: true },
      });
      res.json({
        user: user
          ? { id: user.id, language: user.language }
          : { id: userId, language: 'ru' },
        preference: pref || null,
      });
    } catch (err) {
      console.error('Error in GET /api/profile:', err);
      res.status(500).json({ error: 'Failed to load profile' });
    }
  }) as RequestHandler
);

// POST /api/profile - Update user profile
router.post(
  '/',
  (async (req: Request, res: Response, next: NextFunction) => {
    const { userId, language, role, profession } = req.body || {};
    try {
      const uid = String(userId);
      // Ensure user exists and update language
      const user = await prisma.user.upsert({
        where: { id: uid },
        update: { language: language || undefined },
        create: { id: uid, tgId: String(userId), language: language || 'ru' },
        select: { id: true, language: true },
      });

      if (role || profession) {
        const existing = await prisma.preference.findFirst({
          where: { userId: uid, role: role || 'candidate' },
        });
        if (existing) {
          await prisma.preference.update({
            where: { id: existing.id },
            data: {
              role: role || existing.role,
              profession: profession || existing.profession,
              language: language || existing.language,
            },
          });
        } else {
          await prisma.preference.create({
            data: {
              userId: uid,
              role: role || 'candidate',
              profession: profession || 'frontend',
              language: language || 'ru',
              slotsUtc: JSON.stringify([]),
            },
          });
        }
      }

      res.json({ ok: true, user });
    } catch (err) {
      console.error('Error in POST /api/profile:', err);
      res.status(500).json({ error: 'Failed to save profile' });
    }
  }) as RequestHandler
);

export default router;
