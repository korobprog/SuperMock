import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/preferences
// { userId:number|string, role:'candidate'|'interviewer', profession:string, language:string, slotsUtc:string[] }
router.post(
  '/',
  (async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { userId, role, profession, language, slotsUtc } = req.body || {};
      const uid = String(userId || '').trim();
      if (!uid) return res.status(400).json({ error: 'Missing userId' });
      if (!role) return res.status(400).json({ error: 'Missing role' });
      if (!profession) return res.status(400).json({ error: 'Missing profession' });
      if (!language) return res.status(400).json({ error: 'Missing language' });

      // Ensure user exists
      await prisma.user.upsert({
        where: { id: uid },
        update: {},
        create: { id: uid, tgId: uid, language },
      });

      // Upsert last preference for role
      const existing = await prisma.preference.findFirst({ where: { userId: uid, role } });
      const data = {
        userId: uid,
        role,
        profession,
        language,
        slotsUtc: JSON.stringify(Array.isArray(slotsUtc) ? slotsUtc : []),
      } as const;

      if (existing) {
        await prisma.preference.update({ where: { id: existing.id }, data });
      } else {
        await prisma.preference.create({ data });
      }

      // Optional: create info notification about queue/preferences saved
      await prisma.notification.create({
        data: {
          userId: uid,
          type: 'info',
          title: 'Предпочтения сохранены',
          message: `Роль: ${role}, профессия: ${profession}`,
          status: 'active',
          priority: 0,
        },
      });

      res.json({ ok: true });
    } catch (err) {
      console.error('Error in POST /api/preferences:', err);
      res.status(500).json({ error: 'Failed to save preferences' });
    }
  }) as RequestHandler
);

export default router;


