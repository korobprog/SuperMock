import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { DateTime } from 'luxon';
import crypto from 'crypto';
import path from 'path';
import TelegramNotificationService from './telegram-notifications.js';

dotenv.config();

console.log('DATABASE_URL:', process.env.DATABASE_URL);
if (process.env.DATABASE_URL_SECONDARY) {
  console.log('DATABASE_URL_SECONDARY:', process.env.DATABASE_URL_SECONDARY);
}
const prisma = new PrismaClient();
const prismaSecondary = process.env.DATABASE_URL_SECONDARY
  ? new PrismaClient({
      datasources: { db: { url: process.env.DATABASE_URL_SECONDARY } },
    })
  : null;

// Функция валидации Telegram авторизации
function validateTelegramAuth(data, botToken) {
  if (!botToken) {
    throw new Error('Bot token is not configured');
  }

  const checkHash = data.hash;
  const dataToCheck = { ...data };
  delete dataToCheck.hash;

  const dataCheckString = Object.keys(dataToCheck)
    .sort()
    .map((key) => `${key}=${dataToCheck[key]}`)
    .join('\n');

  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  const hash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  return hash === checkHash;
}

const app = express();
const server = http.createServer(app);

// Configure CORS for production
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173', // Добавляем поддержку 127.0.0.1
    'http://localhost:8081',
    'http://localhost:3000',
    'http://localhost:3001',
    // Добавляем production URLs если они есть
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
    'https://supermock.ru',
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};

console.log('🔧 CORS Debug:', {
  NODE_ENV: process.env.NODE_ENV,
  ENABLE_DEMO_MODE: process.env.ENABLE_DEMO_MODE,
  FRONTEND_URL: process.env.FRONTEND_URL,
  corsOrigins: corsOptions.origin,
});

const io = new SocketIOServer(server, {
  cors: corsOptions,
});

app.use(cors(corsOptions));

// Добавляем middleware для логирования CORS запросов
app.use((req, res, next) => {
  console.log('🌐 Request:', {
    method: req.method,
    url: req.url,
    origin: req.headers.origin,
    host: req.headers.host,
  });
  next();
});

app.use(express.json());

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('dist'));
}

// Prisma handles database schema automatically through migrations

// Helpers
function generateId(prefix = 'sess') {
  return `${prefix}_${Math.random()
    .toString(36)
    .slice(2, 10)}_${Date.now().toString(36)}`;
}

// Telegram WebApp data validation
function validateTelegramWebAppData(initData, botToken) {
  if (!initData || !botToken) {
    return false;
  }

  try {
    const encoded = decodeURIComponent(initData);
    const secret = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();
    const arr = encoded.split('&');
    const hashIndex = arr.findIndex((str) => str.startsWith('hash='));

    if (hashIndex === -1) {
      return false;
    }

    const hash = arr[hashIndex].split('=')[1];
    arr.splice(hashIndex, 1);
    arr.sort();

    const dataCheckString = arr.join('\n');
    const _hash = crypto
      .createHmac('sha256', secret)
      .update(dataCheckString)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(_hash, 'hex'),
      Buffer.from(hash, 'hex')
    );
  } catch (err) {
    console.error('Telegram data validation error:', err);
    return false;
  }
}

// Parse Telegram user data from initData
function parseTelegramUser(initData) {
  if (!initData) return null;

  try {
    const encoded = decodeURIComponent(initData);
    const params = new URLSearchParams(encoded);
    const userParam = params.get('user');

    if (!userParam) return null;

    return JSON.parse(userParam);
  } catch (err) {
    console.error('Parse Telegram user error:', err);
    return null;
  }
}

// Matchmaking helper using Prisma
async function findMatchPrisma({
  userId,
  role,
  profession,
  language,
  slotsUtc,
}) {
  const oppositeRole = role === 'interviewer' ? 'candidate' : 'interviewer';
  const mySlots = JSON.parse(slotsUtc || '[]');
  if (!Array.isArray(mySlots) || mySlots.length === 0) return null;

  const candidates = await prisma.preference.findMany({
    where: { role: oppositeRole, profession, language },
    orderBy: { createdAt: 'asc' },
    select: { userId: true, slotsUtc: true },
  });

  for (const row of candidates) {
    const otherSlots = JSON.parse(row.slotsUtc || '[]');
    const matchSlot = mySlots.find((slot) => otherSlots.includes(slot));
    if (matchSlot) {
      return { partnerUserId: row.userId, slot: matchSlot };
    }
  }
  return null;
}

/**
 * Queue-based matching: attempts to pair earliest waiting candidate and interviewer
 * for the same slot/profession/language.
 */
async function attemptQueueMatch({ slotUtc, profession, language }) {
  const txResult = await prisma.$transaction(async (tx) => {
    // Load waiting queues for this slot, ignore profession/language here
    const waitingCandidates = await tx.userQueue.findMany({
      where: { role: 'candidate', status: 'waiting', slotUtc },
      orderBy: { createdAt: 'asc' },
      select: { id: true, userId: true, profession: true, language: true },
    });
    const waitingInterviewers = await tx.userQueue.findMany({
      where: { role: 'interviewer', status: 'waiting', slotUtc },
      orderBy: { createdAt: 'asc' },
      select: { id: true, userId: true, profession: true, language: true },
    });

    if (!waitingCandidates.length || !waitingInterviewers.length) return null;

    // Find the first compatible pair by earliest queues
    let candidate = null;
    let interviewer = null;
    outer: for (const c of waitingCandidates) {
      for (const i of waitingInterviewers) {
        const profOk =
          !c.profession || !i.profession || c.profession === i.profession;
        const langOk = !c.language || !i.language || c.language === i.language;
        const filterProfOk =
          !profession || (c.profession || i.profession) === profession;
        const filterLangOk =
          !language || (c.language || i.language) === language;
        if (profOk && langOk && filterProfOk && filterLangOk) {
          candidate = c;
          interviewer = i;
          break outer;
        }
      }
    }

    if (!candidate || !interviewer) return null;

    // Mark queues matched
    await tx.userQueue.update({
      where: { id: candidate.id },
      data: { status: 'matched' },
    });
    await tx.userQueue.update({
      where: { id: interviewer.id },
      data: { status: 'matched' },
    });

    const sessionId = generateId('session');
    const jitsiRoom = `Super Mock_${sessionId}`;

    // Create session
    const session = await tx.session.create({
      data: {
        id: sessionId,
        interviewerUserId: interviewer.userId,
        candidateUserId: candidate.userId,
        profession:
          profession || candidate.profession || interviewer.profession || null,
        language:
          language || candidate.language || interviewer.language || null,
        slotUtc,
        status: 'scheduled',
        jitsiRoom,
      },
    });

    // Create Match record
    await tx.match.create({
      data: {
        candidateId: candidate.userId,
        interviewerId: interviewer.userId,
        slotUtc,
        status: 'scheduled',
        sessionId: session.id,
        meetingLink: jitsiRoom,
      },
    });

    // Get user tools for both users
    const candidateTools = await tx.userTool.findMany({
      where: {
        userId: candidate.userId,
        profession:
          profession || candidate.profession || interviewer.profession,
      },
      select: { toolName: true },
    });
    const interviewerTools = await tx.userTool.findMany({
      where: {
        userId: interviewer.userId,
        profession:
          profession || candidate.profession || interviewer.profession,
      },
      select: { toolName: true },
    });

    // Create notifications
    const title = 'Моковое собеседование найдено!';
    const waitingRoomUrl = `${
      process.env.FRONTEND_URL || 'http://localhost:5173'
    }/waiting/${sessionId}`;
    const actionData = JSON.stringify({ type: 'join', sessionId: session.id });

    // Format slot time for better readability
    let formattedSlotTime = slotUtc;
    try {
      const slotDate = new Date(slotUtc);
      if (!isNaN(slotDate.getTime())) {
        formattedSlotTime = slotDate.toLocaleString('ru-RU', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'UTC',
        });
      }
    } catch (error) {
      console.error('Error formatting slot time:', error);
    }

    const candidateToolsText =
      candidateTools.length > 0
        ? `\nВаши инструменты: ${candidateTools
            .map((t) => t.toolName)
            .join(', ')}`
        : '';
    const interviewerToolsText =
      interviewerTools.length > 0
        ? `\nВаши инструменты: ${interviewerTools
            .map((t) => t.toolName)
            .join(', ')}`
        : '';

    const forCandidate = {
      userId: candidate.userId,
      type: 'matching',
      title,
      message: `Время: ${formattedSlotTime}\nВаша роль: Кандидат\nКомната: ${jitsiRoom}\nСсылка: ${waitingRoomUrl}${candidateToolsText}`,
      status: 'active',
      priority: 1,
      actionData,
    };
    const forInterviewer = {
      userId: interviewer.userId,
      type: 'matching',
      title,
      message: `Время: ${formattedSlotTime}\nВаша роль: Интервьюер\nКомната: ${jitsiRoom}\nСсылка: ${waitingRoomUrl}${interviewerToolsText}`,
      status: 'active',
      priority: 1,
      actionData,
    };
    // Deduplicate notifications for the same session
    const existsCand = await tx.notification.findFirst({
      where: { userId: forCandidate.userId, type: 'matching', actionData },
      select: { id: true },
    });
    if (!existsCand) await tx.notification.create({ data: forCandidate });
    const existsInt = await tx.notification.findFirst({
      where: { userId: forInterviewer.userId, type: 'matching', actionData },
      select: { id: true },
    });
    if (!existsInt) await tx.notification.create({ data: forInterviewer });

    return session;
  });

  // Emit real-time notifications to both users
  if (txResult) {
    try {
      const waitingRoomUrl = `${
        process.env.FRONTEND_URL || 'http://localhost:5173'
      }/waiting/${txResult.id}`;

      // Get user tools for real-time notifications
      const candidateTools = await prisma.userTool.findMany({
        where: {
          userId: txResult.candidateUserId,
          profession: txResult.profession,
        },
        select: { toolName: true },
      });
      const interviewerTools = await prisma.userTool.findMany({
        where: {
          userId: txResult.interviewerUserId,
          profession: txResult.profession,
        },
        select: { toolName: true },
      });

      const candidateToolsText =
        candidateTools.length > 0
          ? `\nВаши инструменты: ${candidateTools
              .map((t) => t.toolName)
              .join(', ')}`
          : '';
      const interviewerToolsText =
        interviewerTools.length > 0
          ? `\nВаши инструменты: ${interviewerTools
              .map((t) => t.toolName)
              .join(', ')}`
          : '';

      // Format slot time for better readability
      let formattedSlotTime = txResult.slotUtc;
      try {
        const slotDate = new Date(txResult.slotUtc);
        if (!isNaN(slotDate.getTime())) {
          formattedSlotTime = slotDate.toLocaleString('ru-RU', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'UTC',
          });
        }
      } catch (error) {
        console.error('Error formatting slot time:', error);
      }

      io.to(`user:${txResult.candidateUserId}`).emit('notification', {
        type: 'matching',
        title: 'Моковое собеседование найдено!',
        message: `Время: ${formattedSlotTime}\nВаша роль: Кандидат${candidateToolsText}`,
        session: {
          id: txResult.id,
          jitsiRoom: txResult.jitsiRoom,
          slotUtc: txResult.slotUtc,
          waitingRoomUrl,
        },
      });
      io.to(`user:${txResult.interviewerUserId}`).emit('notification', {
        type: 'matching',
        title: 'Моковое собеседование найдено!',
        message: `Время: ${formattedSlotTime}\nВаша роль: Интервьюер${interviewerToolsText}`,
        session: {
          id: txResult.id,
          jitsiRoom: txResult.jitsiRoom,
          slotUtc: txResult.slotUtc,
          waitingRoomUrl,
        },
      });
    } catch (e) {
      // ignore socket errors
    }
  }

  return txResult;
}

// Init endpoint
app.post('/api/init', async (req, res) => {
  const { tg, language, initData } = req.body || {};
  console.log('Init endpoint called with:', {
    tg,
    language,
    initData: initData ? 'present' : 'missing',
  });
  try {
    // Support demo mode
    const isDemoMode =
      (process.env.NODE_ENV !== 'production' ||
        process.env.ENABLE_DEMO_MODE === '1') &&
      initData === 'demo_hash_12345';
    console.log('Demo mode:', isDemoMode);

    // Support Telegram Login Widget authentication
    const isTelegramAuthMode =
      initData === 'telegram_auth_hash' || initData === 'present';
    console.log('Telegram auth mode:', isTelegramAuthMode);
    console.log('Received tg data:', tg);
    console.log('Received initData:', initData);

    // Validate Telegram data if provided and not demo mode and not telegram auth mode
    if (
      initData &&
      process.env.TELEGRAM_BOT_TOKEN &&
      !isDemoMode &&
      !isTelegramAuthMode
    ) {
      const isValid = validateTelegramWebAppData(
        initData,
        process.env.TELEGRAM_BOT_TOKEN
      );
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid Telegram data' });
      }
    }

    // Parse user from Telegram data or use provided tg data
    let user = null;
    if (isDemoMode && tg) {
      console.log('Using demo user data:', tg);
      user = tg;
    } else if (isTelegramAuthMode && tg) {
      console.log('Using Telegram Login Widget user data:', tg);
      user = tg;
    } else {
      console.log('Parsing Telegram user from initData');
      user = parseTelegramUser(initData);
    }

    if (!user) {
      console.log('No user data found, returning 400');
      return res.status(400).json({ error: 'Invalid user data' });
    }

    // Check if user exists, create if not
    const userIdString = String(user.id);
    console.log(
      'Looking for user with ID:',
      userIdString,
      'Type:',
      typeof userIdString
    );

    let dbUser = await prisma.user.findUnique({
      where: { id: userIdString },
    });

    if (!dbUser) {
      console.log('Creating new user with ID:', userIdString);
      dbUser = await prisma.user.create({
        data: {
          id: userIdString,
          tgId: userIdString,
          username: user.username || null,
          firstName: user.first_name || null,
          lastName: user.last_name || null,
          language: language || 'ru',
        },
      });
    } else {
      // Update language if provided
      if (language && dbUser.language !== language) {
        console.log('Updating user language for ID:', userIdString);
        dbUser = await prisma.user.update({
          where: { id: userIdString },
          data: { language },
        });
      }
    }

    // No need to convert BigInt to string anymore
    const userResponse = {
      ...dbUser,
    };
    res.json({ user: userResponse });
  } catch (err) {
    console.error('Error in /api/init:', err);
    res.status(500).json({ error: 'Init failed' });
  }
});

// Preferences endpoint
app.post('/api/preferences', async (req, res) => {
  const { userId, role, profession, language, slotsUtc } = req.body || {};
  try {
    // Ensure user exists and update language only on the user record
    await prisma.user.upsert({
      where: { id: String(userId) },
      update: { language: language || 'ru' },
      create: {
        id: String(userId),
        tgId: String(userId),
        language: language || 'ru',
      },
    });

    // Create or update preference for this user and role
    const existing = await prisma.preference.findFirst({
      where: { userId: String(userId), role: role || 'candidate' },
    });

    if (existing) {
      await prisma.preference.update({
        where: { id: existing.id },
        data: {
          profession: profession || existing.profession,
          language: language || existing.language,
          slotsUtc: JSON.stringify(slotsUtc || []),
        },
      });
    } else {
      await prisma.preference.create({
        data: {
          userId: String(userId),
          role: role || 'candidate',
          profession: profession || 'frontend',
          language: language || 'ru',
          slotsUtc: JSON.stringify(slotsUtc || []),
        },
      });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Error in /api/preferences:', err);
    res
      .status(500)
      .json({ error: 'Save preferences failed', details: err?.message });
  }
});

// User basic profile (language, role, profession)
app.get('/api/profile/:userId', async (req, res) => {
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
});

app.post('/api/profile', async (req, res) => {
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
});

// API для работы с инструментами пользователей
app.post('/api/user-tools', async (req, res) => {
  const { userId, profession, tools } = req.body || {};

  if (!userId || !profession || !Array.isArray(tools)) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const uid = String(userId);

    // Удаляем существующие инструменты для данной профессии
    await prisma.userTool.deleteMany({
      where: { userId: uid, profession },
    });

    // Добавляем новые инструменты
    if (tools.length > 0) {
      const toolsData = tools.map((toolName) => ({
        userId: uid,
        profession,
        toolName,
        category: getToolCategory(toolName), // Функция для определения категории
      }));

      await prisma.userTool.createMany({
        data: toolsData,
      });
    }

    res.json({ ok: true, toolsCount: tools.length });
  } catch (err) {
    console.error('Error in POST /api/user-tools:', err);
    res.status(500).json({ error: 'Failed to save user tools' });
  }
});

app.get('/api/user-tools', async (req, res) => {
  const { userId, profession } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  try {
    const uid = String(userId);
    const where = { userId: uid };

    if (profession) {
      where.profession = String(profession);
    }

    const tools = await prisma.userTool.findMany({
      where,
      select: { id: true, toolName: true, category: true },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ tools });
  } catch (err) {
    console.error('Error in GET /api/user-tools:', err);
    res.status(500).json({ error: 'Failed to get user tools' });
  }
});

// API для получения слотов с учетом инструментов
app.get('/api/slots/with-tools', async (req, res) => {
  const {
    role,
    profession,
    language,
    date,
    timezone,
    tools,
    matchStrictness = 'any',
  } = req.query;

  if (!role) {
    return res.status(400).json({ error: 'Missing role parameter' });
  }

  try {
    const targetDate = String(date || new Date().toISOString().slice(0, 10));
    const targetTimezone = String(timezone || 'UTC');
    const oppositeRole = role === 'interviewer' ? 'candidate' : 'interviewer';

    // Compute day window in requested timezone to avoid UTC boundary issues
    const startZ = DateTime.fromISO(targetDate, {
      zone: targetTimezone,
    }).startOf('day');
    const endZ = DateTime.fromISO(targetDate, { zone: targetTimezone }).endOf(
      'day'
    );
    const start = startZ.toUTC().toISO();
    const end = endZ.toUTC().toISO();

    // Получаем базовые слоты
    const queues = await prisma.userQueue.findMany({
      where: {
        role: oppositeRole,
        status: 'waiting',
        slotUtc: { gte: start, lte: end },
        profession: profession || undefined,
        language: language || undefined,
      },
      select: { slotUtc: true },
    });

    // Group by local HH:mm in provided timezone
    const counts = {};
    for (const q of queues) {
      const d = new Date(q.slotUtc);
      const parts = d.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: targetTimezone,
      });
      counts[parts] = (counts[parts] || 0) + 1;
    }

    const baseSlots = Object.entries(counts)
      .map(([time, count]) => ({ time, count }))
      .sort((a, b) => (a.time < b.time ? -1 : 1));

    // Если инструменты не указаны, возвращаем базовые слоты
    if (!tools || !Array.isArray(tools) || tools.length === 0) {
      return res.json({ slots: baseSlots });
    }

    // Получаем пользователей с их инструментами для каждого слота
    const slotsWithTools = await Promise.all(
      baseSlots.map(async (slot) => {
        // Конвертируем время обратно в UTC для поиска
        const slotDate = DateTime.fromISO(`${targetDate}T${slot.time}`, {
          zone: targetTimezone,
        });
        const slotUtc = slotDate.toUTC().toISO();

        const usersInSlot = await prisma.userQueue.findMany({
          where: {
            slotUtc,
            role: oppositeRole,
            status: 'waiting',
            ...(profession && { profession }),
            ...(language && { language }),
          },
          include: {
            user: {
              include: {
                userTools: {
                  where: { profession: profession || undefined },
                  select: { toolName: true },
                },
              },
            },
          },
        });

        // Фильтруем пользователей по инструментам
        const matchedUsers = usersInSlot.filter((userQueue) => {
          const userTools = userQueue.user.userTools.map((ut) => ut.toolName);

          switch (matchStrictness) {
            case 'exact':
              // Все инструменты должны совпадать
              return (
                tools.every((tool) => userTools.includes(tool)) &&
                userTools.every((tool) => tools.includes(tool))
              );
            case 'partial':
              // Хотя бы 2 инструмента должны совпадать
              const commonTools = tools.filter((tool) =>
                userTools.includes(tool)
              );
              return commonTools.length >= 2;
            case 'any':
            default:
              // Хотя бы 1 инструмент должен совпадать
              return tools.some((tool) => userTools.includes(tool));
          }
        });

        // Вычисляем score совпадения
        const matchedTools = matchedUsers.flatMap((userQueue) =>
          userQueue.user.userTools
            .map((ut) => ut.toolName)
            .filter((tool) => tools.includes(tool))
        );

        const uniqueMatchedTools = [...new Set(matchedTools)];
        const matchScore = uniqueMatchedTools.length / tools.length;

        return {
          ...slot,
          count: matchedUsers.length,
          matchedTools: uniqueMatchedTools,
          matchScore: Math.round(matchScore * 100) / 100,
        };
      })
    );

    // Фильтруем слоты с совпадениями
    const filteredSlots = slotsWithTools.filter((slot) => slot.count > 0);

    res.json({ slots: filteredSlots });
  } catch (err) {
    console.error('Error in GET /api/slots/with-tools:', err);
    res.status(500).json({ error: 'Failed to get slots with tools' });
  }
});

// Вспомогательная функция для определения категории инструмента
function getToolCategory(toolName) {
  const categories = {
    frameworks: [
      'react',
      'vue',
      'angular',
      'svelte',
      'nextjs',
      'nuxt',
      'nodejs',
      'express',
      'django',
      'flask',
      'spring',
      'dotnet',
      'laravel',
      'rails',
      'react-native',
      'flutter',
      'xamarin',
      'ionic',
    ],
    languages: [
      'javascript',
      'typescript',
      'html',
      'css',
      'python',
      'java',
      'csharp',
      'go',
      'php',
      'ruby',
      'swift',
      'kotlin',
      'dart',
      'sql',
      'r',
      'bash',
    ],
    databases: ['postgresql', 'mysql', 'mongodb', 'redis', 'sqlite'],
    tools: [
      'webpack',
      'vite',
      'eslint',
      'prettier',
      'tailwind',
      'bootstrap',
      'sass',
      'git',
      'postman',
      'swagger',
      'xcode',
      'android-studio',
      'firebase',
      'jira',
      'testrail',
      'docker',
      'excel',
      'tableau',
      'powerbi',
      'jupyter',
      'pandas',
      'numpy',
      'matplotlib',
      'seaborn',
      'google-analytics',
      'mixpanel',
      'confluence',
      'notion',
      'slack',
      'figma',
      'miro',
      'trello',
      'asana',
      'amplitude',
      'hotjar',
    ],
    platforms: ['ios', 'android', 'aws', 'azure', 'gcp', 'digitalocean'],
    design: [
      'figma',
      'sketch',
      'adobe-xd',
      'photoshop',
      'illustrator',
      'invision',
      'principle',
      'framer',
    ],
    testing: [
      'selenium',
      'cypress',
      'playwright',
      'jest',
      'pytest',
      'junit',
      'postman',
      'jmeter',
      'tensorflow',
      'pytorch',
      'scikit-learn',
      'keras',
      'opencv',
      'nltk',
      'spacy',
    ],
    devops: [
      'docker',
      'kubernetes',
      'jenkins',
      'gitlab-ci',
      'github-actions',
      'terraform',
      'ansible',
      'prometheus',
      'grafana',
      'nginx',
      'linux',
    ],
  };

  const normalizedToolName = toolName.toLowerCase().replace(/[^a-z0-9]/g, '');

  for (const [category, tools] of Object.entries(categories)) {
    if (tools.includes(normalizedToolName)) {
      return category;
    }
  }

  return 'tools'; // По умолчанию
}

// Match endpoint (rewritten to Prisma)
app.post('/api/match', async (req, res) => {
  const { userId, role, profession, language, slotsUtc } = req.body || {};
  try {
    const match = await findMatchPrisma({
      userId,
      role,
      profession,
      language,
      slotsUtc: JSON.stringify(slotsUtc || []),
    });

    if (match) {
      const sessionId = generateId('session');
      const jitsiRoom = `Super Mock_${sessionId}`;
      const interviewerId =
        role === 'interviewer' ? userId : match.partnerUserId;
      const candidateId = role === 'candidate' ? userId : match.partnerUserId;

      await prisma.session.create({
        data: {
          id: sessionId,
          interviewerUserId: interviewerId,
          candidateUserId: candidateId,
          profession,
          language,
          slotUtc: match.slot,
          status: 'scheduled',
          jitsiRoom,
        },
      });

      return res.json({
        matched: true,
        session: { id: sessionId, jitsiRoom, slotUtc: match.slot },
      });
    }

    // Suggest earliest provided slot
    const mySlots = JSON.parse(JSON.stringify(slotsUtc || []));
    const suggestion =
      Array.isArray(mySlots) && mySlots.length ? [...mySlots].sort()[0] : null;

    return res.json({ matched: false, suggestion });
  } catch (err) {
    console.error('Error in /api/match:', err);
    res.status(500).json({ error: 'Match failed' });
  }
});

// Slots aggregated availability for a date by opposite role queues
app.get('/api/slots', async (req, res) => {
  try {
    const role = String(req.query.role || 'candidate');
    const profession = req.query.profession
      ? String(req.query.profession)
      : undefined;
    const language = req.query.language
      ? String(req.query.language)
      : undefined;
    const date = String(
      req.query.date || new Date().toISOString().slice(0, 10)
    ); // YYYY-MM-DD (interpreted in provided timezone)
    const timezone = String(req.query.timezone || 'UTC');
    const oppositeRole = role === 'interviewer' ? 'candidate' : 'interviewer';

    // Compute day window in requested timezone to avoid UTC boundary issues
    const startZ = DateTime.fromISO(date, { zone: timezone }).startOf('day');
    const endZ = DateTime.fromISO(date, { zone: timezone }).endOf('day');
    const start = startZ.toUTC().toISO();
    const end = endZ.toUTC().toISO();

    const queues = await prisma.userQueue.findMany({
      where: {
        role: oppositeRole,
        status: 'waiting',
        slotUtc: { gte: start, lte: end },
        profession: profession || undefined,
        language: language || undefined,
      },
      select: { slotUtc: true },
    });

    // Group by local HH:mm in provided timezone
    const counts = {};
    for (const q of queues) {
      const d = new Date(q.slotUtc);
      const parts = d.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: timezone,
      });
      counts[parts] = (counts[parts] || 0) + 1;
    }

    const slots = Object.entries(counts)
      .map(([time, count]) => ({ time, count }))
      .sort((a, b) => (a.time < b.time ? -1 : 1));

    res.json({ slots });
  } catch (err) {
    console.error('Error in GET /api/slots:', err);
    res.status(500).json({ error: 'Failed to load slots' });
  }
});

// Slots: join queue for a specific slot
app.post('/api/slots/join', async (req, res) => {
  try {
    const { userId, role, profession, language, slotUtc, tools } =
      req.body || {};
    if (!userId || !role || !slotUtc) {
      return res
        .status(400)
        .json({ error: 'userId, role and slotUtc are required' });
    }

    // Upsert user basic info if needed
    await prisma.user.upsert({
      where: { id: String(userId) },
      update: { language: language || undefined },
      create: {
        id: String(userId),
        tgId: String(userId),
        language: language || 'ru',
      },
    });

    // Insert into queue if not already waiting for same slot/role
    const existing = await prisma.userQueue.findFirst({
      where: { userId: String(userId), role, slotUtc, status: 'waiting' },
    });
    if (!existing) {
      await prisma.userQueue.create({
        data: {
          userId: String(userId),
          role,
          profession: profession || null,
          language: language || null,
          slotUtc,
          status: 'waiting',
        },
      });

      // Save user tools if provided
      if (tools && Array.isArray(tools) && tools.length > 0 && profession) {
        try {
          // Remove existing tools for this profession
          await prisma.userTool.deleteMany({
            where: { userId: String(userId), profession },
          });

          // Add new tools
          const toolsData = tools.map((toolName) => ({
            userId: String(userId),
            profession,
            toolName,
            category: getToolCategory(toolName),
          }));

          await prisma.userTool.createMany({
            data: toolsData,
          });
        } catch (error) {
          console.error('Error saving user tools:', error);
          // Don't fail the entire request if tools saving fails
        }
      }
    }

    // Compute position in queue within same profession/language context
    const waitingSame = await prisma.userQueue.findMany({
      where: {
        role,
        slotUtc,
        status: 'waiting',
        profession: profession || undefined,
        language: language || undefined,
      },
      orderBy: { createdAt: 'asc' },
      select: { userId: true },
    });
    const position =
      waitingSame.findIndex((q) => q.userId === String(userId)) + 1;

    // Try match immediately
    const session = await attemptQueueMatch({ slotUtc, profession, language });
    if (session) {
      return res.json({
        matched: true,
        session: {
          id: session.id,
          jitsiRoom: session.jitsiRoom,
          slotUtc: session.slotUtc,
        },
      });
    }

    // Get user tools for notification message
    let toolsMessage = '';
    let userTools = [];

    // First try to get tools from request
    if (tools && Array.isArray(tools) && tools.length > 0) {
      userTools = tools;
    } else if (profession) {
      // If not in request, get from database
      try {
        const dbTools = await prisma.userTool.findMany({
          where: {
            userId: String(userId),
            profession,
          },
          select: { toolName: true },
        });
        userTools = dbTools.map((t) => t.toolName);
      } catch (error) {
        console.error('Error getting user tools from DB:', error);
      }
    }

    if (userTools.length > 0) {
      toolsMessage = `\nИнструменты: ${userTools.join(', ')}`;
    }

    // Format slot time for better readability
    let formattedSlotTime = slotUtc;
    try {
      const slotDate = new Date(slotUtc);
      if (!isNaN(slotDate.getTime())) {
        formattedSlotTime = slotDate.toLocaleString('ru-RU', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'UTC',
        });
      }
    } catch (error) {
      console.error('Error formatting slot time:', error);
    }

    // Notify queued
    await prisma.notification.create({
      data: {
        userId: String(userId),
        type: 'queue',
        title: 'Добавлены в очередь ожидания',
        message: `Слот: ${formattedSlotTime}\nРоль: ${role}${toolsMessage}`,
        status: 'info',
        priority: 0,
      },
    });

    return res.json({ matched: false, position });
  } catch (err) {
    console.error('Error in POST /api/slots/join:', err);
    res.status(500).json({ error: 'Failed to join slot' });
  }
});

// Bookings: current user queues and sessions
app.get('/api/my-bookings/:userId', async (req, res) => {
  try {
    const userId = String(req.params.userId);
    const queues = await prisma.userQueue.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    const sessions = await prisma.session.findMany({
      where: {
        OR: [{ interviewerUserId: userId }, { candidateUserId: userId }],
      },
      orderBy: { createdAt: 'desc' },
    });

    // No need to convert BigInt fields to strings anymore
    const queuesResponse = queues;
    const sessionsResponse = sessions;

    res.json({ queues: queuesResponse, sessions: sessionsResponse });
  } catch (err) {
    console.error('Error in GET /api/my-bookings:', err);
    res.status(500).json({ error: 'Failed to load bookings' });
  }
});

// Notifications API
app.get('/api/notifications', async (req, res) => {
  try {
    const userId = String(req.query.userId);
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const items = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    const unread = items.filter((n) => !n.readAt).length;

    // No need to convert BigInt fields to strings anymore
    const itemsResponse = items;

    res.json({ items: itemsResponse, stats: { total: items.length, unread } });
  } catch (err) {
    console.error('Error in GET /api/notifications:', err);
    res.status(500).json({ error: 'Failed to load notifications' });
  }
});

app.put('/api/notifications/:id/read', async (req, res) => {
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
});

app.delete('/api/notifications/clear-all', async (req, res) => {
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
});

app.delete('/api/notifications/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.notification.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error('Error in DELETE /api/notifications/:id:', err);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

app.get('/api/notifications/unread-count', async (req, res) => {
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
});

// Simple schedulers
async function createMatchesFromQueues() {
  try {
    // Find distinct combinations where both roles are waiting
    const waiting = await prisma.userQueue.findMany({
      where: { status: 'waiting' },
      select: { slotUtc: true, profession: true, language: true, role: true },
    });
    const keySet = new Set(
      waiting.map(
        (w) => `${w.slotUtc}::${w.profession || ''}::${w.language || ''}`
      )
    );
    for (const key of keySet) {
      const [slotUtc, profession, language] = key.split('::');
      // check if both roles exist
      const hasCandidate = waiting.some(
        (w) =>
          w.slotUtc === slotUtc &&
          (w.profession || '') === profession &&
          (w.language || '') === language &&
          w.role === 'candidate'
      );
      const hasInterviewer = waiting.some(
        (w) =>
          w.slotUtc === slotUtc &&
          (w.profession || '') === profession &&
          (w.language || '') === language &&
          w.role === 'interviewer'
      );
      if (!hasCandidate || !hasInterviewer) continue;
      // keep matching until no more pairs can be formed
      // looping until attemptQueueMatch returns null
      while (true) {
        const session = await attemptQueueMatch({
          slotUtc,
          profession: profession || undefined,
          language: language || undefined,
        });
        if (!session) break;
      }
    }
  } catch (e) {
    console.error('Scheduler createMatchesFromQueues error:', e);
  }
}

// Get session by ID endpoint
app.get('/api/session/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const { userId } = req.query;

  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        interviewerUserId: true,
        candidateUserId: true,
        profession: true,
        language: true,
        slotUtc: true,
        status: true,
        jitsiRoom: true,
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Проверяем авторизацию - только участники сессии могут получить данные
    if (
      userId &&
      session.interviewerUserId !== userId &&
      session.candidateUserId !== userId
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(session);
  } catch (err) {
    console.error('Error getting session:', err);
    res.status(500).json({ error: 'Failed to get session' });
  }
});

async function sendReminders() {
  try {
    const now = new Date();
    const in15 = new Date(now.getTime() + 15 * 60 * 1000);
    const sessions = await prisma.session.findMany({
      where: {
        status: 'scheduled',
      },
      select: {
        id: true,
        interviewerUserId: true,
        candidateUserId: true,
        slotUtc: true,
        jitsiRoom: true,
        profession: true,
      },
    });
    for (const s of sessions) {
      if (!s.slotUtc) continue;
      const slot = new Date(s.slotUtc);
      const diff = slot.getTime() - now.getTime();
      if (diff > 14 * 60 * 1000 && diff < 16 * 60 * 1000) {
        const marker = JSON.stringify({ type: 'reminder', sessionId: s.id });

        // Get user tools for both users
        const candidateTools = s.candidateUserId
          ? await prisma.userTool.findMany({
              where: {
                userId: s.candidateUserId,
                profession: s.profession,
              },
              select: { toolName: true },
            })
          : [];
        const interviewerTools = s.interviewerUserId
          ? await prisma.userTool.findMany({
              where: {
                userId: s.interviewerUserId,
                profession: s.profession,
              },
              select: { toolName: true },
            })
          : [];

        const candidateToolsText =
          candidateTools.length > 0
            ? `\nВаши инструменты: ${candidateTools
                .map((t) => t.toolName)
                .join(', ')}`
            : '';
        const interviewerToolsText =
          interviewerTools.length > 0
            ? `\nВаши инструменты: ${interviewerTools
                .map((t) => t.toolName)
                .join(', ')}`
            : '';

        if (s.candidateUserId) {
          const existing = await prisma.notification.findFirst({
            where: {
              userId: s.candidateUserId,
              type: 'reminder',
              actionData: marker,
            },
          });
          if (!existing) {
            await prisma.notification.create({
              data: {
                userId: s.candidateUserId,
                type: 'reminder',
                title: 'Напоминание о собеседовании',
                message: `Через 15 минут начнется ваше собеседование. Ссылка: ${s.jitsiRoom}${candidateToolsText}`,
                status: 'info',
                priority: 1,
                actionData: marker,
              },
            });
          }
        }
        if (s.interviewerUserId) {
          const existing2 = await prisma.notification.findFirst({
            where: {
              userId: s.interviewerUserId,
              type: 'reminder',
              actionData: marker,
            },
          });
          if (!existing2) {
            await prisma.notification.create({
              data: {
                userId: s.interviewerUserId,
                type: 'reminder',
                title: 'Напоминание о собеседовании',
                message: `Через 15 минут начнется ваше собеседование. Ссылка: ${s.jitsiRoom}${interviewerToolsText}`,
                status: 'info',
                priority: 1,
                actionData: marker,
              },
            });
          }
        }
      }
    }
  } catch (e) {
    console.error('Scheduler sendReminders error:', e);
  }
}

async function expireOldQueues() {
  try {
    const nowIso = new Date().toISOString();
    const expired = await prisma.userQueue.findMany({
      where: { status: 'waiting', slotUtc: { lt: nowIso } },
      include: {
        user: {
          include: {
            userTools: true,
          },
        },
      },
    });
    for (const q of expired) {
      await prisma.userQueue.update({
        where: { id: q.id },
        data: { status: 'expired' },
      });

      // Get user tools for the specific profession
      const userTools = q.user.userTools.filter(
        (tool) => tool.profession === q.profession
      );
      const toolsText =
        userTools.length > 0
          ? `\nВаши инструменты: ${userTools.map((t) => t.toolName).join(', ')}`
          : '';

      // Format slot time for better readability
      let formattedSlotTime = q.slotUtc;
      try {
        const slotDate = new Date(q.slotUtc);
        if (!isNaN(slotDate.getTime())) {
          formattedSlotTime = slotDate.toLocaleString('ru-RU', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'UTC',
          });
        }
      } catch (error) {
        console.error('Error formatting slot time:', error);
      }

      await prisma.notification.create({
        data: {
          userId: q.userId,
          type: 'matching',
          title: 'Время истекло',
          message: `Не удалось найти пару для слота ${formattedSlotTime}. Выберите другое время.${toolsText}`,
          status: 'active',
          priority: 0,
        },
      });
    }
  } catch (e) {
    console.error('Scheduler expireOldQueues error:', e);
  }
}

setInterval(() => {
  createMatchesFromQueues();
  sendReminders();
  expireOldQueues();
}, 5 * 60 * 1000);

// Get session (rewritten to Prisma)
app.get('/api/sessions/:id', async (req, res) => {
  try {
    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
    });
    if (!session) return res.status(404).json({ error: 'Not found' });

    // No need to convert BigInt fields to strings anymore
    const sessionResponse = {
      ...session,
    };

    res.json({ session: sessionResponse });
  } catch (err) {
    console.error('Error fetching session:', err);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// Feedback (rewritten to Prisma)
app.post('/api/feedback', async (req, res) => {
  const { sessionId, fromUserId, toUserId, rating, comments } = req.body || {};
  try {
    await prisma.feedback.create({
      data: {
        sessionId,
        fromUserId: String(fromUserId),
        toUserId: String(toUserId),
        rating,
        comments: comments || null,
      },
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('Error saving feedback:', err);
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

// History (rewritten to Prisma)
app.get('/api/history/:userId', async (req, res) => {
  const userId = String(req.params.userId);
  try {
    const sessions = await prisma.session.findMany({
      where: {
        OR: [{ interviewerUserId: userId }, { candidateUserId: userId }],
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get tools for each session
    const sessionsWithTools = await Promise.all(
      sessions.map(async (session) => {
        // Get interviewer tools
        const interviewerTools = session.interviewerUserId
          ? await prisma.userTool.findMany({
              where: {
                userId: session.interviewerUserId,
                profession: session.profession,
              },
              select: { toolName: true },
            })
          : [];

        // Get candidate tools
        const candidateTools = session.candidateUserId
          ? await prisma.userTool.findMany({
              where: {
                userId: session.candidateUserId,
                profession: session.profession,
              },
              select: { toolName: true },
            })
          : [];

        return {
          ...session,
          interviewer_tools: interviewerTools.map((t) => t.toolName),
          candidate_tools: candidateTools.map((t) => t.toolName),
        };
      })
    );

    const feedbacks = await prisma.feedback.findMany({
      where: { OR: [{ fromUserId: userId }, { toUserId: userId }] },
      orderBy: { createdAt: 'desc' },
    });

    // No need to convert BigInt fields to strings anymore
    const sessionsResponse = sessionsWithTools;
    const feedbacksResponse = feedbacks;

    res.json({ sessions: sessionsResponse, feedbacks: feedbacksResponse });
  } catch (err) {
    console.error('Error fetching history:', err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Complete session endpoint
app.put('/api/sessions/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Update session status to completed
    const updatedSession = await prisma.session.update({
      where: { id },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
      include: {
        interviewer: true,
        candidate: true,
      },
    });

    // 2. Create notifications for both participants
    const notifications = [];

    if (updatedSession.interviewer) {
      notifications.push({
        userId: updatedSession.interviewer.id,
        type: 'session_completed',
        title: 'Собеседование завершено',
        message: `Собеседование по ${updatedSession.profession} завершено. Оставьте фидбек о кандидате.`,
        status: 'active',
        priority: 1,
        actionData: JSON.stringify({
          sessionId: id,
          action: 'give_feedback',
          targetUserId: updatedSession.candidate?.id,
        }),
      });
    }

    if (updatedSession.candidate) {
      notifications.push({
        userId: updatedSession.candidate.id,
        type: 'session_completed',
        title: 'Собеседование завершено',
        message: `Собеседование по ${updatedSession.profession} завершено. Оставьте фидбек об интервьюере.`,
        status: 'active',
        priority: 1,
        actionData: JSON.stringify({
          sessionId: id,
          action: 'give_feedback',
          targetUserId: updatedSession.interviewer?.id,
        }),
      });
    }

    // 3. Save notifications to database
    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications,
      });
    }

    // 4. Send Telegram notifications
    const telegramService = new TelegramNotificationService();

    if (updatedSession.interviewer) {
      const telegramResult =
        await telegramService.sendSessionCompletedNotification(
          updatedSession.interviewer.id,
          updatedSession,
          'interviewer'
        );

      if (telegramResult.success) {
        console.log(
          `📱 Telegram уведомление о завершении отправлено интервьюеру ${updatedSession.interviewer.id}`
        );
      } else {
        console.log(
          `⚠️ Telegram уведомление не отправлено интервьюеру ${updatedSession.interviewer.id}: ${telegramResult.reason}`
        );
      }
    }

    if (updatedSession.candidate) {
      const telegramResult =
        await telegramService.sendSessionCompletedNotification(
          updatedSession.candidate.id,
          updatedSession,
          'candidate'
        );

      if (telegramResult.success) {
        console.log(
          `📱 Telegram уведомление о завершении отправлено кандидату ${updatedSession.candidate.id}`
        );
      } else {
        console.log(
          `⚠️ Telegram уведомление не отправлено кандидату ${updatedSession.candidate.id}: ${telegramResult.reason}`
        );
      }
    }

    // 5. Emit socket event to notify participants
    if (updatedSession.interviewer) {
      io.to(`user:${updatedSession.interviewer.id}`).emit('session_completed', {
        sessionId: id,
        message: 'Собеседование завершено',
      });
    }

    if (updatedSession.candidate) {
      io.to(`user:${updatedSession.candidate.id}`).emit('session_completed', {
        sessionId: id,
        message: 'Собеседование завершено',
      });
    }

    res.json({
      success: true,
      session: updatedSession,
      notificationsCreated: notifications.length,
    });
  } catch (error) {
    console.error('Error completing session:', error);
    res.status(500).json({ error: 'Failed to complete session' });
  }
});

// User Settings API

// Эндпоинт для проверки доступности Telegram бота
app.get('/api/telegram-bot-check', async (req, res) => {
  try {
    const telegramService = new TelegramNotificationService();
    const result = await telegramService.checkBotAvailability();
    res.json(result);
  } catch (error) {
    console.error('Error checking bot availability:', error);
    res.json({ available: false, reason: 'Error checking bot' });
  }
});

// Эндпоинт для обработки callback'ов от Telegram бота
app.get('/api/telegram-webhook', (req, res) => {
  res.json({ status: 'ok', message: 'Telegram webhook is working' });
});

app.post('/api/telegram-webhook', async (req, res) => {
  try {
    console.log('📥 Получен POST запрос к webhook:', {
      body: req.body,
      headers: req.headers,
      method: req.method,
      url: req.url,
    });

    const { callback_query, message } = req.body;
    console.log('📥 Получен webhook update:', {
      updateId: req.body.update_id,
      hasMessage: !!message,
      hasCallbackQuery: !!callback_query,
      messageText: message?.text,
    });

    if (callback_query) {
      const telegramService = new TelegramNotificationService();

      const result = await telegramService.handleCallback(
        callback_query.data,
        callback_query.message.chat.id,
        callback_query.from
      );

      // Отвечаем на callback
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (botToken) {
        await fetch(
          `https://api.telegram.org/bot${botToken}/answerCallbackQuery`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              callback_query_id: callback_query.id,
              text: result.message || 'Обработано',
            }),
          }
        );
      }

      res.json({ success: true });
    } else if (message) {
      // Обработка команд и сообщений
      console.log('📨 Получено сообщение:', {
        chatId: message.chat?.id,
        userId: message.from?.id,
        text: message.text,
        type: message.chat?.type,
      });

      const telegramService = new TelegramNotificationService();

      if (message.text === '/start') {
        // Обработка команды /start
        console.log('🚀 Обработка команды /start для chatId:', message.chat.id);
        const result = await telegramService.handleStartCommand(
          message.chat.id,
          message.from
        );
        console.log('✅ Результат обработки /start:', result);
        res.json({ success: true, handled: 'start_command' });
      } else if (message.text === '/stats') {
        // Обработка команды /stats
        const user = await prisma.user.findFirst({
          where: { tgId: String(message.from.id) },
        });

        if (user) {
          const stats = await telegramService.getUserStats(user.id);
          const result = await telegramService.sendUserStats(user.id, stats);
          res.json({ success: true, handled: 'stats_command' });
        } else {
          const result = await telegramService.sendMessage(
            message.chat.id,
            '❌ Пользователь не найден в базе данных. Сначала нажмите кнопку START.'
          );
          res.json({ success: true, handled: 'stats_command_not_found' });
        }
      } else if (message.text === '/help') {
        // Обработка команды /help
        const result = await telegramService.handleCallback(
          'help',
          message.chat.id,
          message.from
        );
        res.json({ success: true, handled: 'help_command' });
      } else {
        // Обработка других сообщений (если нужно)
        res.json({ success: true });
      }
    } else {
      res.json({ success: false, reason: 'Unknown update type' });
    }
  } catch (error) {
    console.error('Error handling Telegram webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Эндпоинт для валидации и сохранения Telegram пользователя
app.post('/api/telegram-auth', async (req, res) => {
  const telegramData = req.body;

  try {
    // Валидируем данные Telegram
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    // ИСПРАВЛЕНИЕ: Поддержка демо режима
    const isDemoMode =
      process.env.NODE_ENV !== 'production' &&
      telegramData.hash === 'demo_hash_12345';

    if (!isDemoMode) {
      if (!botToken) {
        return res.status(500).json({ error: 'Bot token not configured' });
      }

      if (!validateTelegramAuth(telegramData, botToken)) {
        return res
          .status(400)
          .json({ error: 'Invalid Telegram authorization data' });
      }

      // Проверяем актуальность данных (не старше 24 часов)
      const now = Math.floor(Date.now() / 1000);
      const maxAge = 24 * 60 * 60; // 24 часа
      if (now - telegramData.auth_date > maxAge) {
        return res.status(400).json({ error: 'Authorization data is too old' });
      }
    }

    // Сохраняем/обновляем пользователя в базе данных через Prisma
    await prisma.user.upsert({
      where: { id: String(telegramData.id) },
      update: {
        tgId: String(telegramData.id),
        username: telegramData.username || null,
        firstName: telegramData.first_name,
        lastName: telegramData.last_name || null,
        updatedAt: new Date(),
      },
      create: {
        id: String(telegramData.id),
        tgId: String(telegramData.id),
        username: telegramData.username || null,
        firstName: telegramData.first_name,
        lastName: telegramData.last_name || null,
        language: 'ru',
      },
    });

    res.json({
      success: true,
      user: {
        id: telegramData.id,
        first_name: telegramData.first_name,
        last_name: telegramData.last_name,
        username: telegramData.username,
        photo_url: telegramData.photo_url,
      },
    });
  } catch (error) {
    console.error('Error validating Telegram auth:', error);
    res
      .status(500)
      .json({ error: 'Failed to validate Telegram authorization' });
  }
});

// Telegram OAuth callback endpoint
app.get('/api/telegram-oauth-callback', (req, res) => {
  const { id, first_name, last_name, username, photo_url, auth_date, hash } =
    req.query;

  console.log('🔐 Telegram OAuth callback received:', req.query);

  if (!id || !first_name || !auth_date || !hash) {
    console.error('❌ Missing required OAuth parameters');
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  // Создаем пользователя из OAuth данных
  const user = {
    id: parseInt(id),
    first_name,
    last_name: last_name || '',
    username: username || '',
    photo_url: photo_url || '',
    auth_date: parseInt(auth_date),
    hash,
  };

  console.log('✅ OAuth user data:', user);

  // Возвращаем HTML страницу, которая закроет popup и передаст данные в родительское окно
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Telegram Auth Success</title>
    </head>
    <body>
      <script>
        // Передаем данные в родительское окно
        if (window.opener) {
          window.opener.postMessage({
            type: 'TELEGRAM_OAUTH_SUCCESS',
            user: ${JSON.stringify(user)}
          }, '*');
          window.close();
        } else {
          // Если popup был закрыт, перенаправляем на главную страницу
          window.location.href = '${
            process.env.FRONTEND_URL || 'http://127.0.0.1:5173'
          }';
        }
      </script>
      <p>Авторизация успешна! Окно закроется автоматически...</p>
    </body>
    </html>
  `;

  res.send(html);
});

// API endpoint для получения настроек пользователя
app.get('/api/user-settings/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    console.log(`Fetching settings for user ${userId}`);
    const settings = await prisma.userSettings.findUnique({
      where: { userId: String(userId) },
    });

    if (!settings) {
      console.log(`No settings found for user ${userId}, returning defaults`);
      // Return default settings if none exist
      return res.json({
        openRouterApiKey: null,
        stackblitzApiKey: null,
        preferredModel: 'meta-llama/llama-3.1-8b-instruct',
        questionsLevel: 'middle',
        useAIGeneration: false,
        questionsCount: 10,
      });
    }

    console.log(`Settings found for user ${userId}:`, {
      hasApiKey: !!settings.openrouterApiKey,
      preferredModel: settings.preferredModel,
      questionsLevel: settings.questionsLevel,
      useAIGeneration: settings.useAiGeneration,
      questionsCount: settings.questionsCount,
    });

    res.json({
      openRouterApiKey: settings.openrouterApiKey,
      stackblitzApiKey: settings.stackblitzApiKey,
      preferredModel: settings.preferredModel,
      questionsLevel: settings.questionsLevel,
      useAIGeneration: settings.useAiGeneration,
      questionsCount: settings.questionsCount,
    });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// API endpoint для сохранения настроек пользователя
app.post('/api/user-settings', async (req, res) => {
  const {
    userId,
    openRouterApiKey,
    stackblitzApiKey,
    preferredModel,
    questionsLevel,
    useAIGeneration,
    questionsCount,
  } = req.body || {};

  console.log('Saving user settings:', {
    userId,
    hasApiKey: !!openRouterApiKey,
    preferredModel,
    questionsLevel,
    useAIGeneration,
    questionsCount,
  });

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    // Сначала проверяем существует ли пользователь
    const userExists = await prisma.user.findUnique({
      where: { id: String(userId) },
    });

    if (!userExists) {
      console.log(`User ${userId} not found, creating user record`);
      // Если пользователь не существует, создаем его (для случая проектного режима)
      await prisma.user.create({
        data: {
          id: String(userId),
          tgId: String(userId),
          firstName: 'Project User',
          language: 'ru',
        },
      });
    }

    const settings = await prisma.userSettings.upsert({
      where: { userId: String(userId) },
      update: {
        openrouterApiKey: openRouterApiKey || null,
        stackblitzApiKey: stackblitzApiKey || null,
        preferredModel: preferredModel || 'meta-llama/llama-3.1-8b-instruct',
        questionsLevel: questionsLevel || 'middle',
        useAiGeneration: !!useAIGeneration,
        questionsCount: questionsCount || 10,
        updatedAt: new Date(),
      },
      create: {
        userId: String(userId),
        openrouterApiKey: openRouterApiKey || null,
        stackblitzApiKey: stackblitzApiKey || null,
        preferredModel: preferredModel || 'meta-llama/llama-3.1-8b-instruct',
        questionsLevel: questionsLevel || 'middle',
        useAiGeneration: !!useAIGeneration,
        questionsCount: questionsCount || 10,
      },
    });

    console.log(`Settings saved successfully for user ${userId}`);
    res.json({ success: true, settings });
  } catch (error) {
    console.error('Error saving user settings:', error);
    console.error('Error details:', error.message);
    res.status(500).json({
      error: 'Failed to save settings',
      details: error.message,
    });
  }
});

// Debug endpoint для проверки настроек пользователя (rewritten to Prisma)
app.get('/api/debug/user/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: String(userId) },
      include: { userSettings: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Маскируем API ключ для безопасности
    if (user.userSettings?.openrouterApiKey) {
      const key = user.userSettings.openrouterApiKey;
      user.userSettings.openrouterApiKey_masked =
        key.substring(0, 8) +
        '••••••••••••••••' +
        key.substring(key.length - 4);
      user.userSettings.openrouterApiKey_exists = true;
      delete user.userSettings.openrouterApiKey;
    }

    res.json({ user, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint для получения данных пользователя
app.get('/api/user/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
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
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Check primary database connection
    await prisma.$queryRaw`SELECT 1`;

    // Optionally check secondary database connection if configured
    if (prismaSecondary) {
      await prismaSecondary.$queryRaw`SELECT 1`;
    }

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      databaseSecondary: prismaSecondary ? 'connected' : 'not_configured',
      uptime: process.uptime(),
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message,
    });
  }
});

// Development helpers (disabled in production unless explicitly enabled)
if (
  process.env.NODE_ENV !== 'production' ||
  process.env.ENABLE_DEV_ENDPOINTS === '1'
) {
  console.log('Dev endpoints enabled');
  app.post('/api/dev/seed-users', async (req, res) => {
    try {
      const {
        time = '09:00',
        profession = 'frontend',
        language = 'ru',
        join = 'both', // both | candidate | interviewer | none
      } = req.body || {};

      const candidateId = 600001;
      const interviewerId = 600002;

      const today = new Date();
      const [hh, mm] = String(time).split(':');
      const local = new Date(today);
      local.setHours(Number(hh) || 9, Number(mm) || 0, 0, 0);
      const slotUtc = local.toISOString();

      // Ensure users exist
      await prisma.user.upsert({
        where: { id: candidateId },
        update: { language },
        create: {
          id: candidateId,
          tgId: String(candidateId),
          firstName: 'TestCandidate',
          language,
        },
      });
      await prisma.user.upsert({
        where: { id: interviewerId },
        update: { language },
        create: {
          id: interviewerId,
          tgId: String(interviewerId),
          firstName: 'TestInterviewer',
          language,
        },
      });

      // Preferences
      const upsertPref = async (userId, role) => {
        const existing = await prisma.preference.findFirst({
          where: { userId, role },
        });
        if (existing) {
          await prisma.preference.update({
            where: { id: existing.id },
            data: { profession, language, slotsUtc: JSON.stringify([slotUtc]) },
          });
        } else {
          await prisma.preference.create({
            data: {
              userId,
              role,
              profession,
              language,
              slotsUtc: JSON.stringify([slotUtc]),
            },
          });
        }
      };
      await upsertPref(candidateId, 'candidate');
      await upsertPref(interviewerId, 'interviewer');

      // Optionally join queues
      const doJoin = async (userId, role) => {
        const existing = await prisma.userQueue.findFirst({
          where: { userId, role, slotUtc, status: 'waiting' },
        });
        if (!existing) {
          await prisma.userQueue.create({
            data: {
              userId,
              role,
              profession,
              language,
              slotUtc,
              status: 'waiting',
            },
          });
        }
      };

      if (join === 'both' || join === 'candidate')
        await doJoin(candidateId, 'candidate');
      if (join === 'both' || join === 'interviewer')
        await doJoin(interviewerId, 'interviewer');

      // Try match
      const session = await attemptQueueMatch({
        slotUtc,
        profession,
        language,
      });

      res.json({ ok: true, slotUtc, profession, language, session });
    } catch (e) {
      res.status(500).json({ ok: false, error: e?.message || 'Seed failed' });
    }
  });

  app.post('/api/dev/cleanup', async (req, res) => {
    try {
      const candidateId = 600001;
      const interviewerId = 600002;

      const sessions = await prisma.session.findMany({
        where: {
          OR: [
            { candidateUserId: candidateId },
            { interviewerUserId: interviewerId },
          ],
        },
        select: { id: true },
      });
      const sessionIds = sessions.map((s) => s.id);

      await prisma.feedback.deleteMany({
        where: { sessionId: { in: sessionIds } },
      });
      await prisma.match.deleteMany({
        where: {
          OR: [{ candidateId: candidateId }, { interviewerId: interviewerId }],
        },
      });
      await prisma.session.deleteMany({ where: { id: { in: sessionIds } } });
      await prisma.userQueue.deleteMany({
        where: { OR: [{ userId: candidateId }, { userId: interviewerId }] },
      });
      await prisma.notification.deleteMany({
        where: { OR: [{ userId: candidateId }, { userId: interviewerId }] },
      });
      await prisma.preference.deleteMany({
        where: { OR: [{ userId: candidateId }, { userId: interviewerId }] },
      });

      res.json({ ok: true, removedSessions: sessionIds.length });
    } catch (e) {
      res
        .status(500)
        .json({ ok: false, error: e?.message || 'Cleanup failed' });
    }
  });

  app.get('/api/dev/status', async (req, res) => {
    try {
      const candidateId = 600001;
      const interviewerId = 600002;

      const candidateQueues = await prisma.userQueue.findMany({
        where: { userId: candidateId },
        orderBy: { createdAt: 'desc' },
      });
      const interviewerQueues = await prisma.userQueue.findMany({
        where: { userId: interviewerId },
        orderBy: { createdAt: 'desc' },
      });
      const sessions = await prisma.session.findMany({
        where: {
          OR: [
            { interviewerUserId: interviewerId },
            { candidateUserId: candidateId },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });
      const notifications = await prisma.notification.findMany({
        where: { OR: [{ userId: candidateId }, { userId: interviewerId }] },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        ok: true,
        candidateId,
        interviewerId,
        candidateQueues,
        interviewerQueues,
        sessions,
        notifications,
      });
    } catch (e) {
      res.status(500).json({ ok: false, error: e?.message || 'Status failed' });
    }
  });

  app.get('/api/dev/latest-session', async (req, res) => {
    try {
      const s = await prisma.session.findFirst({
        orderBy: { createdAt: 'desc' },
      });
      if (!s) return res.json({ ok: true, session: null });
      res.json({ ok: true, session: s });
    } catch (e) {
      res
        .status(500)
        .json({ ok: false, error: e?.message || 'Latest session failed' });
    }
  });
}

// Socket.IO
io.on('connection', (socket) => {
  try {
    console.log('[socket] connected', {
      id: socket.id,
      query: socket.handshake?.query || {},
    });
  } catch {}
  // Optional: authenticate userId via query param (for notifications)
  const { userId } = socket.handshake.query || {};
  if (userId) {
    try {
      const uid = String(userId);
      socket.join(`user:${uid}`);
    } catch {}
  }
  socket.on('join_room', async ({ sessionId, userId }) => {
    try {
      if (!sessionId || !userId) {
        socket.emit('join_denied', { reason: 'Missing sessionId or userId' });
        return;
      }
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
      });
      if (!session) {
        socket.emit('join_denied', { reason: 'Session not found' });
        return;
      }
      const devMode =
        process.env.NODE_ENV !== 'production' ||
        process.env.ENABLE_DEV_ENDPOINTS === '1';
      let allowed =
        session.candidateUserId === String(userId) ||
        session.interviewerUserId === String(userId);
      if (!allowed && devMode) {
        // In dev, allow joining known session to simplify testing across arbitrary IDs
        allowed = true;
      }
      if (!allowed) {
        socket.emit('join_denied', { reason: 'Not a session participant' });
        return;
      }
      socket.join(sessionId);
      try {
        const members = await io.in(sessionId).allSockets();
        console.log('[socket] join_room ok', {
          sessionId,
          userId,
          members: members.size,
        });
      } catch {}
      socket.emit('joined', { sessionId });
      io.to(sessionId).emit('presence_update', {
        userId,
        at: Date.now(),
        joined: true,
      });
    } catch (e) {
      socket.emit('join_denied', { reason: 'Internal error' });
    }
  });

  // Basic presence broadcasting within a session room
  socket.on('presence', ({ sessionId, userId, role }) => {
    if (!sessionId) return;
    io.to(sessionId).emit('presence_update', { userId, role, at: Date.now() });
  });

  socket.on('chat_message', async ({ sessionId, user, message }) => {
    if (!sessionId || typeof message !== 'string' || !message.trim()) return;
    const safeUser = String(user || 'Партнер').slice(0, 50);
    const safeMsg = String(message).slice(0, 2000);
    const payload = { user: safeUser, message: safeMsg, at: Date.now() };
    try {
      const members = await io.in(sessionId).allSockets();
      console.log('[socket] chat_message', {
        sessionId,
        from: safeUser,
        len: safeMsg.length,
        members: members.size,
      });
    } catch {}
    io.to(sessionId).emit('chat_message', payload);
  });

  socket.on('code_update', ({ sessionId, code, from }) => {
    socket.to(sessionId).emit('code_update', { code, from });
  });

  // Dev echo to validate room broadcast path
  socket.on('debug_ping', ({ sessionId, text }) => {
    if (!sessionId) return;
    const payload = {
      user: 'Система',
      message: `echo: ${String(text || '')}`,
      at: Date.now(),
    };
    io.to(sessionId).emit('chat_message', payload);
  });

  // --- Simple WebRTC signaling via Socket.IO ---
  socket.on('webrtc_offer', ({ sessionId, sdp, from }) => {
    if (!sessionId || !sdp) return;
    socket.to(sessionId).emit('webrtc_offer', { sdp, from });
  });
  socket.on('webrtc_answer', ({ sessionId, sdp, from }) => {
    if (!sessionId || !sdp) return;
    socket.to(sessionId).emit('webrtc_answer', { sdp, from });
  });
  socket.on('webrtc_ice', ({ sessionId, candidate, from }) => {
    if (!sessionId || !candidate) return;
    socket.to(sessionId).emit('webrtc_ice', { candidate, from });
  });

  socket.on('cursor', ({ sessionId, cursor }) => {
    socket.to(sessionId).emit('cursor', { cursor });
  });

  socket.on('disconnect', (reason) => {
    try {
      console.log('[socket] disconnected', { id: socket.id, reason });
    } catch {}
  });
});

// Эндпоинт для проверки доступности Telegram бота
app.get('/api/telegram-bot-status', async (req, res) => {
  try {
    const telegramService = new TelegramNotificationService();
    const status = await telegramService.checkBotAvailability();
    res.json(status);
  } catch (error) {
    console.error('Error checking bot availability:', error);
    res.json({ available: false, reason: 'Error checking bot' });
  }
});

// Эндпоинт для настройки webhook'а Telegram бота
app.post('/api/telegram-setup-webhook', async (req, res) => {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const domain =
      process.env.FRONTEND_URL?.replace('https://', '').replace(
        'http://',
        ''
      ) || 'supermock.ru';

    if (!botToken) {
      return res.status(400).json({ error: 'Bot token not configured' });
    }

    const webhookUrl = `https://${domain}/api/telegram-webhook`;

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/setWebhook`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ['callback_query', 'message'],
          drop_pending_updates: true,
        }),
      }
    );

    const data = await response.json();

    if (data.ok) {
      console.log(`✅ Webhook set successfully to ${webhookUrl}`);
      res.json({
        success: true,
        webhookUrl,
        message: 'Webhook configured successfully',
      });
    } else {
      console.error('❌ Failed to set webhook:', data.description);
      res.status(400).json({
        error: 'Failed to set webhook',
        description: data.description,
      });
    }
  } catch (error) {
    console.error('Error setting webhook:', error);
    res.status(500).json({ error: 'Error setting webhook' });
  }
});

// Эндпоинт для получения информации о webhook'е
app.get('/api/telegram-webhook-info', async (req, res) => {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      return res.status(400).json({ error: 'Bot token not configured' });
    }

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/getWebhookInfo`
    );
    const data = await response.json();

    res.json(data);
  } catch (error) {
    console.error('Error getting webhook info:', error);
    res.status(500).json({ error: 'Error getting webhook info' });
  }
});

// Catch-all handler for SPA routing in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'dist/index.html'));
  });
}

const PORT = Number(process.env.PORT || 3001);
server.listen(PORT, () => {
  console.log(`API server listening on :${PORT}`);
});
