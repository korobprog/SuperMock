import express, { Request, Response, NextFunction, RequestHandler } from 'express';
const router = express.Router();
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Маршрут для проверки заполненных данных пользователя
// GET /api/user-data-check/:userId
router.get(
  '/:userId',
  (async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      
      console.log('=== ПРОВЕРКА ДАННЫХ ПОЛЬЗОВАТЕЛЯ ===');
      console.log('Проверяем данные для пользователя:', userId);

      // Проверяем наличие профессии в таблице preferences
      const preferences = await prisma.preference.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });

      // Проверяем наличие инструментов в таблице userTools
      const userTools = await prisma.userTool.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      const hasProfession = preferences.length > 0;
      const hasTools = userTools.length > 0;
      
      // Получаем последнюю профессию и инструменты
      const lastPreference = preferences[0];
      const profession = lastPreference?.profession || null;
      const tools = userTools.map(tool => tool.toolName);

      console.log('Результаты проверки:');
      console.log('- Есть профессия:', hasProfession);
      console.log('- Есть инструменты:', hasTools);
      console.log('- Профессия:', profession);
      console.log('- Количество инструментов:', tools.length);

      res.json({
        hasProfession,
        hasTools,
        profession,
        tools,
      });
    } catch (error) {
      console.error('Ошибка при проверке данных пользователя:', error);
      res.status(500).json({ 
        message: 'Ошибка при проверке данных пользователя',
        error: (error as Error).message 
      });
    }
  }) as RequestHandler
);

export default router;
