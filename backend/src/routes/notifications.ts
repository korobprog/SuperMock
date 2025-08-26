import express, { Request, Response, NextFunction, RequestHandler } from 'express';
const router = express.Router();

// Условный импорт Prisma только если USE_MONGODB=true
let prisma: any = null;
if (process.env.USE_MONGODB === 'true') {
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient();
}

// GET /api/notifications - Get user notifications
router.get(
  '/',
  (async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = String(req.query.userId);
      if (!userId) return res.status(400).json({ error: 'userId required' });
      
      const USE_MONGODB = process.env.USE_MONGODB === 'true';
      
      if (USE_MONGODB && prisma) {
        const items = await prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 200,
        });
        const unread = items.filter((n: any) => !n.readAt).length;

        res.json({ items, stats: { total: items.length, unread } });
      } else {
        // Для InMemoryUser возвращаем пустые уведомления
        res.json({ items: [], stats: { total: 0, unread: 0 } });
      }
    } catch (err) {
      console.error('Error in GET /api/notifications:', err);
      res.status(500).json({ error: 'Failed to load notifications' });
    }
  }) as RequestHandler
);

// PUT /api/notifications/:id/read - Mark notification as read
router.put(
  '/:id/read',
  (async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      const USE_MONGODB = process.env.USE_MONGODB === 'true';
      
      if (USE_MONGODB && prisma) {
        await prisma.notification.update({
          where: { id },
          data: { readAt: new Date(), status: 'read' },
        });
      }
      res.json({ ok: true });
    } catch (err) {
      console.error('Error in PUT /api/notifications/:id/read:', err);
      res.status(500).json({ error: 'Failed to mark read' });
    }
  }) as RequestHandler
);

// DELETE /api/notifications/clear-all - Clear all notifications
router.delete(
  '/clear-all',
  (async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = String(req.query.userId);
      if (!userId) return res.status(400).json({ error: 'userId required' });
      
      const USE_MONGODB = process.env.USE_MONGODB === 'true';
      
      if (USE_MONGODB && prisma) {
        console.log('Clearing all notifications for user:', userId);
        const result = await prisma.notification.deleteMany({ where: { userId } });
        console.log('Deleted notifications count:', result.count);
        res.json({ ok: true, deletedCount: result.count });
      } else {
        res.json({ ok: true, deletedCount: 0 });
      }
    } catch (err) {
      console.error('Error in DELETE /api/notifications/clear-all:', err);
      res.status(500).json({ error: 'Failed to clear notifications' });
    }
  }) as RequestHandler
);

// DELETE /api/notifications/:id - Delete specific notification
router.delete(
  '/:id',
  (async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      const USE_MONGODB = process.env.USE_MONGODB === 'true';
      
      if (USE_MONGODB && prisma) {
        await prisma.notification.delete({ where: { id } });
      }
      res.json({ ok: true });
    } catch (err) {
      console.error('Error in DELETE /api/notifications/:id:', err);
      res.status(500).json({ error: 'Failed to delete notification' });
    }
  }) as RequestHandler
);

// GET /api/notifications/unread-count - Get unread count
router.get(
  '/unread-count',
  (async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = String(req.query.userId);
      if (!userId) return res.status(400).json({ error: 'userId required' });
      
      const USE_MONGODB = process.env.USE_MONGODB === 'true';
      
      if (USE_MONGODB && prisma) {
        const count = await prisma.notification.count({
          where: { userId, readAt: null },
        });
        res.json({ count });
      } else {
        res.json({ count: 0 });
      }
    } catch (err) {
      console.error('Error in GET /api/notifications/unread-count:', err);
      res.status(500).json({ error: 'Failed to load unread count' });
    }
  }) as RequestHandler
);

export default router;
