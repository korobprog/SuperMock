import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';
import { telegramService } from '../services/telegramService';

const router = express.Router();
const prisma = new PrismaClient();

// Helper: generate simple id
function generateId(prefix = 'session') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

// Try to match earliest waiting candidate and interviewer for given slot/prof/lang
async function attemptQueueMatch(params: {
  slotUtc: string;
  profession?: string | null;
  language?: string | null;
}) {
  const { slotUtc, profession, language } = params;

  // load earliest candidate and interviewer in this context
  const [candidate, interviewer] = await Promise.all([
    prisma.userQueue.findFirst({
      where: {
        role: 'candidate',
        status: 'waiting',
        slotUtc,
        ...(profession ? { profession } : {}),
        ...(language ? { language } : {}),
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.userQueue.findFirst({
      where: {
        role: 'interviewer',
        status: 'waiting',
        slotUtc,
        ...(profession ? { profession } : {}),
        ...(language ? { language } : {}),
      },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  if (!candidate || !interviewer) return null;

  // mark matched
  await prisma.userQueue.update({ where: { id: candidate.id }, data: { status: 'matched' } });
  await prisma.userQueue.update({ where: { id: interviewer.id }, data: { status: 'matched' } });

  const sessionId = generateId('session');
  const jitsiRoom = `Super Mock_${sessionId}`;

  const session = await prisma.session.create({
    data: {
      id: sessionId,
      interviewerUserId: interviewer.userId,
      candidateUserId: candidate.userId,
      profession: profession || interviewer.profession || candidate.profession || null,
      language: language || interviewer.language || candidate.language || null,
      slotUtc,
      status: 'scheduled',
      jitsiRoom,
    },
  });

  // notifications for both users
  const frontUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const waitingRoomUrl = `${frontUrl}/waiting/${sessionId}`;

  await prisma.notification.createMany({
    data: [
      {
        userId: candidate.userId,
        type: 'matching',
        title: 'Моковое собеседование найдено! ',
        message: `Роль: Кандидат\nКомната: ${jitsiRoom}\nСсылка: ${waitingRoomUrl}`,
        status: 'active',
        priority: 1,
      },
      {
        userId: interviewer.userId,
        type: 'matching',
        title: 'Моковое собеседование найдено! ',
        message: `Роль: Интервьюер\nКомната: ${jitsiRoom}\nСсылка: ${waitingRoomUrl}`,
        status: 'active',
        priority: 1,
      },
    ],
  });

  // Отправляем Telegram уведомления
  try {
    await telegramService.notifyMatch(
      [candidate.userId, interviewer.userId],
      sessionId,
      slotUtc
    );
    console.log(`📱 Telegram уведомления отправлены для сессии ${sessionId}`);
  } catch (error) {
    console.error('Ошибка отправки Telegram уведомлений:', error);
    // Не прерываем выполнение, если Telegram недоступен
  }

  return session;
}

// GET /api/slots - simple stub counts per time (fallback view)
router.get(
  '/',
  (async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { date, timezone } = req.query as { date?: string; timezone?: string };
      const baseDate = date || new Date().toISOString().substring(0, 10);
      const slots = Array.from({ length: 8 }).map((_, i) => ({
        time: `${baseDate}T${String(10 + i).padStart(2, '0')}:00:00.000Z`,
        count: Math.floor(Math.random() * 3),
      }));
      res.json({ slots, date: baseDate, timezone: timezone || 'UTC' });
    } catch (err) {
      console.error('Error in GET /api/slots:', err);
      res.status(500).json({ error: 'Failed to load slots' });
    }
  }) as RequestHandler
);

// GET /api/slots/enhanced - counts based on queued users (per role)
router.get(
  '/enhanced',
  (async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { date, timezone, role, profession, language } = req.query as {
        date?: string;
        timezone?: string;
        role?: 'candidate' | 'interviewer';
        profession?: string;
        language?: string;
      };
      const baseDate = (date as string) || new Date().toISOString().slice(0, 10);
      const tz = (timezone as string) || 'UTC';

      // Time window for the selected local day [start,end)
      // Convert local day bounds to UTC range for DB filtering
      const localDayStart = new Date(`${baseDate}T00:00:00.000Z`);
      const localDayEnd = new Date(`${baseDate}T23:59:59.999Z`);

      // Fetch queued users (prefilter by opposite role/profession/language)
      const queued = await prisma.userQueue.findMany({
        where: {
          status: 'waiting',
          ...(role
            ? { role: role === 'interviewer' ? 'candidate' : 'interviewer' }
            : {}),
          ...(profession ? { profession: String(profession) } : {}),
          ...(language ? { language: String(language) } : {}),
        },
        select: { slotUtc: true, role: true },
        take: 2000,
      });

      // Определяем противоположную роль: считаем доступность ИМЕННО противоположной стороны
      const oppositeRole: 'candidate' | 'interviewer' = role === 'interviewer' ? 'candidate' : 'interviewer';

      // Build counts by local HH:mm for requested role (opposite side)
      const counts: Record<string, number> = {};
      for (const q of queued) {
        if (!q.slotUtc) continue;
        const d = new Date(q.slotUtc);
        // Check that when converted to local tz, the date equals baseDate
        const localStr = d.toLocaleString('en-CA', {
          timeZone: tz,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
        // localStr format: YYYY-MM-DD, HH:MM (depending on locale options)
        const [ymd, hm] = localStr.split(',');
        const ymdTrim = (ymd || '').trim();
        const hmTrim = (hm || '').trim();
        if (ymdTrim === baseDate && (!role || q.role === oppositeRole)) {
          counts[hmTrim] = (counts[hmTrim] || 0) + 1;
        }
      }

      // Build 24 hours slots HH:mm and attach counts
      const slots = Array.from({ length: 24 }).map((_, hour) => {
        const h = String(hour).padStart(2, '0');
        const label = `${h}:00`;
        return {
          time: label,
          utcTime: new Date(`${baseDate}T${h}:00:00.000Z`).toISOString(),
          count: counts[label] || 0,
          timezone: tz,
          offset: 0,
        };
      });

      res.json({
        slots,
        timezone: {
          name: tz,
          offset: 0,
          currentTime: new Date().toISOString(),
          utcTime: new Date().toISOString(),
        },
      });
    } catch (err) {
      console.error('Error in GET /api/slots/enhanced:', err);
      res.status(500).json({ error: 'Failed to load enhanced slots' });
    }
  }) as RequestHandler
);

// POST /api/slots/join - save to queue and create notification
router.post(
  '/join',
  (async (req: Request, res: Response) => {
    try {
      const { userId, role, slotUtc, profession, language } = req.body || {};
      if (!userId || !role || !slotUtc) return res.status(400).json({ error: 'Missing fields' });

      const uid = String(userId);
      // Ensure user exists
      await prisma.user.upsert({
        where: { id: uid },
        update: {},
        create: { id: uid, tgId: uid, language: 'ru' },
      });

      // Upsert into queue to avoid duplicates for the same slot
      await prisma.userQueue.deleteMany({ where: { userId: uid, slotUtc } });
      await prisma.userQueue.create({
        data: {
          userId: uid,
          role,
          profession: profession || null,
          language: language || null,
          slotUtc,
          status: 'waiting',
        },
      });

      // Create a notification about queue placement
      await prisma.notification.create({
        data: {
          userId: uid,
          type: 'queue',
          title: 'Вы добавлены в очередь',
          message: `Роль: ${role}, время: ${slotUtc}`,
          status: 'active',
          priority: 0,
        },
      });

      // Отправляем Telegram уведомление о добавлении в очередь
      try {
        await telegramService.notifyQueued(uid, role, slotUtc);
        console.log(`📱 Telegram уведомление о добавлении в очередь отправлено пользователю ${uid}`);
      } catch (error) {
        console.error('Ошибка отправки Telegram уведомления о добавлении в очередь:', error);
        // Не прерываем выполнение, если Telegram недоступен
      }

      // Try match immediately
      const session = await attemptQueueMatch({
        slotUtc,
        profession: profession || null,
        language: language || null,
      });

      if (session) {
        return res.json({
          ok: true,
          queued: true,
          matched: true,
          session: { id: session.id, jitsiRoom: session.jitsiRoom, slotUtc: session.slotUtc },
        });
      }

      res.json({ ok: true, queued: true, matched: false, userId: uid, role, slotUtc });
    } catch (err) {
      console.error('Error in POST /api/slots/join:', err);
      res.status(500).json({ error: 'Failed to join slot' });
    }
  }) as RequestHandler
);

export default router;


