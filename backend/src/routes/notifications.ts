import express, { Request, Response, NextFunction, RequestHandler } from 'express';
const router = express.Router();
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/notifications - Get user notifications
router.get(
  '/',
  (async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = String(req.query.userId);
      if (!userId) return res.status(400).json({ error: 'userId required' });
      const items = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 200,
      });
      const unread = items.filter((n) => !n.readAt).length;

      res.json({ items, stats: { total: items.length, unread } });
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
      await prisma.notification.update({
        where: { id },
        data: { readAt: new Date(), status: 'read' },
      });
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
      console.log('Clearing all notifications for user:', userId);
      const result = await prisma.notification.deleteMany({ where: { userId } });
      console.log('Deleted notifications count:', result.count);
      res.json({ ok: true, deletedCount: result.count });
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
      await prisma.notification.delete({ where: { id } });
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
      const count = await prisma.notification.count({
        where: { userId, readAt: null },
      });
      res.json({ count });
    } catch (err) {
      console.error('Error in GET /api/notifications/unread-count:', err);
      res.status(500).json({ error: 'Failed to load unread count' });
    }
  }) as RequestHandler
);

export default router;
