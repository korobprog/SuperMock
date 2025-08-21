import express, { Request, Response, NextFunction, RequestHandler } from 'express';
const router = express.Router();
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/user/:userId - Get user data
router.get(
  '/:userId',
  (async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;

      const user = await prisma.user.findUnique({
        where: { id: String(userId) },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          language: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      console.error('Error getting user data:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }) as RequestHandler
);

export default router;
