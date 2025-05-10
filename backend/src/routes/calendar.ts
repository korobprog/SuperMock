import express, { Request, Response } from 'express';
import { auth } from '../middleware/auth';
import { InMemoryCalendarEntry } from '../models/InMemoryCalendar';
import { notifyCalendarUpdated } from '../websocket';

const router = express.Router();

// Получение списка всех записей календаря
// GET /api/calendar
router.get('/', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Получен запрос на /api/calendar');
    console.log('Пользователь:', req.user);

    const calendarEntries = await InMemoryCalendarEntry.find();
    console.log('Найдено записей календаря:', calendarEntries.length);

    // Устанавливаем заголовок Content-Type явно
    res.setHeader('Content-Type', 'application/json');
    res.json(calendarEntries);
  } catch (error) {
    console.error(
      'Ошибка при получении списка записей календаря:',
      (error as Error).message
    );
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение записи календаря по ID сессии
// GET /api/calendar/session/:sessionId
router.get(
  '/session/:sessionId',
  auth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;
      console.log(`Получен запрос на /api/calendar/session/${sessionId}`);

      const calendarEntry = await InMemoryCalendarEntry.findBySessionId(
        sessionId
      );

      if (!calendarEntry) {
        res.status(404).json({ message: 'Запись календаря не найдена' });
        return;
      }

      res.json(calendarEntry);
    } catch (error) {
      console.error(
        'Ошибка при получении записи календаря:',
        (error as Error).message
      );
      res.status(500).json({ message: 'Ошибка сервера' });
    }
  }
);

// Создание новой записи календаря
// POST /api/calendar
router.post('/', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId, videoLink, startTime, participants } = req.body;
    console.log(`Создание записи календаря для сессии ${sessionId}`);

    if (!sessionId) {
      res.status(400).json({ message: 'Не указан ID сессии' });
      return;
    }

    if (!startTime) {
      res.status(400).json({ message: 'Не указано время начала' });
      return;
    }

    // Создаем новую запись календаря
    const calendarEntry = new InMemoryCalendarEntry({
      sessionId,
      videoLink: videoLink || null,
      startTime: new Date(startTime),
      participants: participants || [],
    });

    // Сохраняем запись
    await calendarEntry.save();

    // Отправляем уведомление об обновлении календаря
    notifyCalendarUpdated(req.app.get('io'), {
      calendarEntryId: calendarEntry.id,
      sessionId: calendarEntry.sessionId,
      startTime: calendarEntry.startTime,
      videoLink: calendarEntry.videoLink,
      participants: calendarEntry.participants,
    });

    res.status(201).json(calendarEntry);
  } catch (error) {
    console.error(
      'Ошибка при создании записи календаря:',
      (error as Error).message
    );
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Обновление записи календаря
// PUT /api/calendar/session/:sessionId
router.put(
  '/session/:sessionId',
  auth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;
      const { videoLink, startTime, participants } = req.body;
      console.log(`Обновление записи календаря для сессии ${sessionId}`);

      // Ищем запись календаря
      const calendarEntry = await InMemoryCalendarEntry.findBySessionId(
        sessionId
      );

      if (!calendarEntry) {
        res.status(404).json({ message: 'Запись календаря не найдена' });
        return;
      }

      // Обновляем поля
      if (videoLink !== undefined) {
        calendarEntry.videoLink = videoLink;
      }

      if (startTime) {
        calendarEntry.startTime =
          startTime instanceof Date ? startTime : new Date(startTime);
      }

      if (participants && Array.isArray(participants)) {
        calendarEntry.participants = participants;
      }

      // Сохраняем обновленную запись
      await calendarEntry.save();

      // Отправляем уведомление об обновлении календаря
      notifyCalendarUpdated(req.app.get('io'), {
        calendarEntryId: calendarEntry.id,
        sessionId: calendarEntry.sessionId,
        startTime: calendarEntry.startTime,
        videoLink: calendarEntry.videoLink,
        participants: calendarEntry.participants,
      });

      res.json(calendarEntry);
    } catch (error) {
      console.error(
        'Ошибка при обновлении записи календаря:',
        (error as Error).message
      );
      res.status(500).json({ message: 'Ошибка сервера' });
    }
  }
);

export default router;
