import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/user-tools?userId=123&profession=frontend
router.get(
  '/',
  (async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const userId = String(req.query.userId || '');
      const profession = String(req.query.profession || '');

      if (!userId) {
        return res.status(400).json({ error: 'Missing userId' });
      }

      const items = await prisma.userTool.findMany({
        where: {
          userId,
          ...(profession ? { profession } : {}),
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true, toolName: true, category: true },
      });

      res.json({ tools: items });
    } catch (err) {
      console.error('Error in GET /api/user-tools:', err);
      res.status(500).json({ error: 'Failed to load user tools' });
    }
  }) as RequestHandler
);

// POST /api/user-tools
// body: { userId: string|number, profession: string, tools: string[] }
router.post(
  '/',
  (async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { userId, profession, tools } = req.body || {};
      const uid = String(userId || '').trim();

      if (!uid) return res.status(400).json({ error: 'Missing userId' });
      if (!profession || typeof profession !== 'string')
        return res.status(400).json({ error: 'Missing profession' });
      if (!Array.isArray(tools))
        return res.status(400).json({ error: 'tools must be an array' });

      // Ensure user exists
      await prisma.user.upsert({
        where: { id: uid },
        update: {},
        create: { id: uid, tgId: uid, language: 'ru' },
      });

      // Remove previous tools for this (user, profession)
      await prisma.userTool.deleteMany({ where: { userId: uid, profession } });

      // Create new tools
      if (tools.length > 0) {
        await prisma.userTool.createMany({
          data: tools.map((toolName: string) => ({
            userId: uid,
            profession,
            toolName,
          })),
          skipDuplicates: true,
        });
      }

      const saved = await prisma.userTool.findMany({
        where: { userId: uid, profession },
        orderBy: { createdAt: 'desc' },
        select: { id: true, toolName: true, category: true },
      });

      res.json({ ok: true, tools: saved });
    } catch (err) {
      console.error('Error in POST /api/user-tools:', err);
      res.status(500).json({ error: 'Failed to save user tools' });
    }
  }) as RequestHandler
);

export default router;


