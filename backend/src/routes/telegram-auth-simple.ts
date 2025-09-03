import express, { Request, Response } from 'express';

const router = express.Router();

// Простой тестовый маршрут
router.get('/telegram-simple-test', (req: Request, res: Response) => {
  res.json({ 
    message: 'Simple telegram routes are working!',
    timestamp: new Date().toISOString()
  });
});

// Тестовый callback маршрут
router.get('/telegram-auth-callback', (req: Request, res: Response) => {
  res.json({ 
    message: 'Telegram auth callback endpoint is working!',
    query: req.query,
    timestamp: new Date().toISOString()
  });
});

export default router;