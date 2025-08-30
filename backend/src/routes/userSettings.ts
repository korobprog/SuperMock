import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/user-settings/:userId - Get user settings
router.get(
  '/:userId',
  (async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      console.log('🔍 GET /api/user-settings called with userId:', userId);

      if (!userId) {
        console.log('❌ Missing userId');
        return res.status(400).json({ error: 'Missing userId' });
      }

      console.log('🔍 Searching for user settings in database...');

      const settings = await prisma.userSettings.findUnique({
        where: { userId: String(userId) },
        select: {
          openrouterApiKey: true,
          stackblitzApiKey: true,
          preferredModel: true,
          questionsLevel: true,
          useAIGeneration: true,
          questionsCount: true,
        },
      });

      if (!settings) {
        console.log('📝 No settings found, returning default settings for userId:', userId);
        // Return default settings if user doesn't have any
        const defaultSettings = {
          openrouterApiKey: null,
          stackblitzApiKey: null,
          preferredModel: 'meta-llama/llama-3.1-8b-instruct',
          questionsLevel: 'middle',
          useAIGeneration: false,
          questionsCount: 10,
        };
        console.log('✅ Returning default settings:', defaultSettings);
        return res.json(defaultSettings);
      }

      console.log('✅ Settings found:', settings);
      res.json(settings);
    } catch (error) {
      console.error('❌ Error in GET /api/user-settings/:userId:', error);
      res.status(500).json({ 
        error: 'Failed to load user settings', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }) as RequestHandler
);

// POST /api/user-settings - Save user settings
router.post(
  '/',
  (async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        userId,
        openrouterApiKey,
        stackblitzApiKey,
        preferredModel,
        questionsLevel,
        useAIGeneration,
        questionsCount,
      } = req.body;

      console.log('Saving user settings for userId:', userId);

      if (!userId) {
        return res.status(400).json({ error: 'Missing userId' });
      }

      // Ensure user exists
      await prisma.user.upsert({
        where: { id: String(userId) },
        update: {},
        create: { id: String(userId), tgId: String(userId), language: 'ru' },
      });

      // Upsert user settings
      const settings = await prisma.userSettings.upsert({
        where: { userId: String(userId) },
        update: {
          openrouterApiKey: openrouterApiKey || null,
          stackblitzApiKey: stackblitzApiKey || null,
          preferredModel: preferredModel || 'meta-llama/llama-3.1-8b-instruct',
          questionsLevel: questionsLevel || 'middle',
          useAIGeneration: useAIGeneration || false,
          questionsCount: questionsCount || 10,
        },
        create: {
          userId: String(userId),
          openrouterApiKey: openrouterApiKey || null,
          stackblitzApiKey: stackblitzApiKey || null,
          preferredModel: preferredModel || 'meta-llama/llama-3.1-8b-instruct',
          questionsLevel: questionsLevel || 'middle',
          useAIGeneration: useAIGeneration || false,
          questionsCount: questionsCount || 10,
        },
      });

      res.json({ ok: true, settings });
    } catch (error) {
      console.error('Error saving user settings:', error);
      res.status(500).json({ error: 'Failed to save user settings' });
    }
  }) as RequestHandler
);

export default router;
