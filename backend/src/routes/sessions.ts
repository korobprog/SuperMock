import express, { Request, Response, NextFunction } from 'express';
import { auth } from '../middleware/auth';
import { InMemorySession } from '../models/InMemorySession';
import { InMemoryUser } from '../models/InMemoryUser';
import {
  notifySessionUpdated,
  notifyRoleSelected,
  notifyFeedbackRequired,
  notifyVideoLinkStatusUpdated,
} from '../websocket';
import {
  createMeeting,
  isValidMeetUrl,
  checkMeetingStatus,
} from '../services/googleMeetService';

// Интерфейс для модели Log
interface Log {
  sessionId: string;
  userId: string;
  action: string;
  details: any;
  save(): Promise<any>;
}

// Заглушка для модели Log
class LogModel {
  sessionId: string;
  userId: string;
  action: string;
  details: any;

  constructor(data: {
    sessionId: string;
    userId: string;
    action: string;
    details: any;
  }) {
    this.sessionId = data.sessionId;
    this.userId = data.userId;
    this.action = data.action;
    this.details = data.details;
  }

  async save(): Promise<any> {
    console.log('Логирование:', this.action, this.details);
    return this;
  }

  static async create(data: {
    sessionId: string;
    userId: string;
    action: string;
    details: any;
  }): Promise<any> {
    const log = new LogModel(data);
    return log.save();
  }
}

const router = express.Router();

// Флаг для переключения между InMemory и MongoDB
const USE_MONGODB = process.env.USE_MONGODB === 'true';

// Выбор модели в зависимости от флага
const SessionModel = InMemorySession;
const Log = LogModel;

// Получение списка всех сессий
// GET /api/sessions
router.get('/', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Получен запрос на /api/sessions');
    console.log('Пользователь:', req.user);

    const sessions = await InMemorySession.find();
    console.log('Найдено сессий:', sessions.length);

    // Устанавливаем заголовок Content-Type явно
    res.setHeader('Content-Type', 'application/json');
    res.json(sessions);
  } catch (error) {
    console.error(
      'Ошибка при получении списка сессий:',
      (error as Error).message
    );
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Создание новой сессии
// POST /api/sessions
router.post('/', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { videoLink, startTime } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Пользователь не авторизован' });
      return;
    }

    // Проверка времени начала сессии
    const now = new Date();
    const minStartTime = new Date(now);
    minStartTime.setHours(minStartTime.getHours() + 2); // Минимум 2 часа вперед

    let sessionStartTime: Date;

    if (startTime) {
      const requestedStartTime = new Date(startTime);

      // Проверяем, не находится ли запрошенное время в прошлом
      if (requestedStartTime < now) {
        console.warn(
          `Запрошенное время начала (${requestedStartTime.toISOString()}) находится в прошлом.`
        );
        res.status(400).json({
          message: 'Невозможно создать сессию с временем начала в прошлом',
          suggestedStartTime: minStartTime.toISOString(),
        });
        return;
      }

      // Проверяем, соответствует ли запрошенное время минимальному требованию (2 часа вперед)
      if (requestedStartTime < minStartTime) {
        console.warn(
          `Запрошенное время начала (${requestedStartTime.toISOString()}) меньше минимально допустимого.`
        );
        res.status(400).json({
          message:
            'Время начала должно быть как минимум на 2 часа позже текущего времени',
          suggestedStartTime: minStartTime.toISOString(),
        });
        return;
      }

      sessionStartTime = requestedStartTime;
    } else {
      // Если время не указано, используем минимальное допустимое время
      sessionStartTime = minStartTime;
    }

    console.log(
      `Создание сессии с временем начала: ${sessionStartTime.toISOString()}`
    );

    // Создаем новую сессию
    const session = new SessionModel({
      videoLink,
      startTime: sessionStartTime,
      status: 'pending',
      creatorId: userId, // Добавляем ID создателя сессии
      videoLinkStatus: videoLink ? 'manual' : 'pending', // Если ссылка предоставлена, устанавливаем статус 'manual', иначе 'pending'
    });

    await session.save();

    // Логируем создание сессии
    if (USE_MONGODB) {
      await new Log({
        sessionId: session.id,
        userId,
        action: 'create_session',
        details: { videoLink },
      }).save();
    }

    // Получаем экземпляр Socket.IO из объекта запроса
    const io = req.app.get('io');

    // Отправляем уведомление о создании новой сессии
    notifySessionUpdated(io, session.id, session);

    res.status(201).json(session);
  } catch (error) {
    console.error('Ошибка при создании сессии:', (error as Error).message);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Выбор роли в сессии
// POST /api/sessions/:id/roles
router.post(
  '/:id/roles',
  auth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { role } = req.body;
      const sessionId = req.params.id;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ message: 'Пользователь не авторизован' });
        return;
      }

      console.log('Выбор роли для сессии:', sessionId);
      console.log('Пользователь ID:', userId);
      console.log('Выбранная роль:', role);

      // Проверяем, что роль указана корректно
      if (!['interviewer', 'interviewee', 'observer'].includes(role)) {
        console.log('Некорректная роль:', role);
        res.status(400).json({
          message:
            'Некорректная роль. Допустимые значения: interviewer, interviewee, observer',
        });
        return;
      }

      // Получаем сессию по ID
      const session = await SessionModel.findById(sessionId);
      console.log('Найдена сессия:', session ? 'Да' : 'Нет');
      if (!session) {
        res.status(404).json({ message: 'Сессия не найдена' });
        return;
      }

      // Получаем пользователя
      let user = await InMemoryUser.findById(userId);
      console.log('Найден пользователь:', user ? 'Да' : 'Нет');

      // Если пользователь не найден, создаем его
      if (!user) {
        console.log(
          'Пользователь не найден в базе данных. Создаем нового пользователя.'
        );

        // Создаем нового пользователя с тем же ID
        user = new InMemoryUser({
          email: `user_${userId}@example.com`, // Временный email
          password: 'temporary_password', // Временный пароль
        });

        // Устанавливаем ID из токена
        user.id = userId;

        // Сохраняем пользователя
        await user.save();

        console.log('Создан новый пользователь с ID:', userId);
      }

      // Проверяем статус обратной связи пользователя
      if (user.feedbackStatus === 'pending' && role !== 'observer') {
        res.status(403).json({
          message:
            'Вы не можете выбрать эту роль, пока не заполните форму обратной связи',
        });
        return;
      }

      // Проверяем ограничения для выбора роли
      try {
        if (role === 'interviewer') {
          // Проверяем, вошел ли пользователь через Google OAuth и есть ли у него googleAccessToken
          if (!user.googleId || !user.googleAccessToken) {
            res.status(403).json({
              message: 'Для роли Собеседующего требуется вход через Google',
              requiresGoogleAuth: true,
            });
            return;
          }

          // Проверяем, был ли пользователь интервьюером в последней сессии
          const lastSession = await SessionModel.findLastSessionAsInterviewer(
            userId
          );

          console.log('Последняя сессия как интервьюер:', lastSession);

          if (lastSession) {
            res.status(400).json({
              message:
                'Вы не можете выбрать роль интервьюера, так как были интервьюером в последней сессии',
            });
            return;
          }
        }
      } catch (error) {
        console.error(
          'Ошибка при проверке ограничений для выбора роли:',
          error
        );
        res.status(500).json({
          message: 'Ошибка при проверке ограничений для выбора роли',
          details: (error as Error).message,
        });
        return;
      }

      // Проверяем, не занята ли уже роль
      if (role === 'interviewer' && session.interviewerId) {
        res.status(400).json({ message: 'Роль Собеседующего уже занята' });
        return;
      }

      if (role === 'interviewee' && session.intervieweeId) {
        res.status(400).json({ message: 'Роль Отвечающего уже занята' });
        return;
      }

      // Получаем экземпляр Socket.IO из объекта запроса
      const io = req.app.get('io');

      // Если пользователь выбирает роль интервьюера и видеоссылка отсутствует или в статусе pending,
      // автоматически генерируем ссылку через Google Meet API с использованием googleAccessToken пользователя
      if (
        role === 'interviewer' &&
        (!session.videoLink || session.videoLinkStatus === 'pending')
      ) {
        // Определяем параметры встречи до блока try-catch
        // Убедимся, что ID сессии включен в summary для использования в requestId
        const meetingOptions = {
          summary: `Mock Interview ${session.id}`,
          startTime: session.startTime,
          durationMinutes: 60, // Длительность по умолчанию - 60 минут
          googleAccessToken: user.googleAccessToken, // Передаем токен пользователя
        };

        try {
          // Генерируем новую ссылку на Google Meet с использованием googleAccessToken пользователя
          // Проверяем наличие googleAccessToken у пользователя
          if (!user.googleAccessToken) {
            console.warn(
              'У пользователя отсутствует googleAccessToken для создания встречи'
            );
            session.videoLinkStatus = 'pending';

            // Логируем отсутствие токена
            if (USE_MONGODB) {
              await new Log({
                sessionId: session.id,
                userId,
                action: 'generate_video_link_failed',
                details: {
                  reason: 'missing_google_access_token',
                  role: 'interviewer',
                },
              }).save();
            }

            res.status(403).json({
              message:
                'Для создания ссылки на Google Meet требуется вход через Google',
              requiresGoogleAuth: true,
            });
            return;
          } else {
            console.log(
              'Используем googleAccessToken пользователя для создания встречи'
            );
          }

          const videoLink = await createMeeting(meetingOptions);

          // Проверяем валидность новой ссылки
          const validationResult = await isValidMeetUrl(videoLink);

          if (validationResult.isValid) {
            session.videoLink = videoLink;
            session.videoLinkStatus = 'active';

            // Логируем генерацию ссылки
            if (USE_MONGODB) {
              await new Log({
                sessionId: session.id,
                userId,
                action: 'generate_video_link',
                details: {
                  videoLink,
                  role: 'interviewer',
                  validationResult: 'valid',
                },
              }).save();
            }

            // Отправляем уведомление об обновлении ссылки на видеозвонок
            notifyVideoLinkStatusUpdated(io, sessionId, videoLink, 'active');

            console.log(
              `Автоматически сгенерирована валидная ссылка на видеозвонок: ${videoLink}`
            );
          } else {
            // Если ссылка не прошла валидацию, устанавливаем статус pending
            session.videoLinkStatus = 'pending';

            // Логируем неудачную попытку генерации ссылки
            if (USE_MONGODB) {
              await new Log({
                sessionId: session.id,
                userId,
                action: 'generate_video_link_failed',
                details: {
                  videoLink,
                  role: 'interviewer',
                  validationResult: 'invalid',
                  message: validationResult.message,
                },
              }).save();
            }

            console.warn(
              `Автоматически сгенерированная ссылка не прошла валидацию: ${validationResult.message}`
            );
          }
        } catch (error) {
          console.error(
            '=== ОШИБКА ПРИ АВТОМАТИЧЕСКОЙ ГЕНЕРАЦИИ ВИДЕОССЫЛКИ ==='
          );
          console.error('Ошибка при генерации видеоссылки:', error);
          console.error('Стек ошибки:', (error as Error).stack);

          // Логируем тип ошибки и её конструктор
          console.error('Тип ошибки:', (error as Error).constructor.name);
          console.error('Сообщение ошибки:', (error as Error).message);

          // Логируем все свойства ошибки для более полного анализа
          console.error('Все свойства ошибки:');
          const errorObj = error as Record<string, any>;
          for (const prop in errorObj) {
            if (typeof errorObj[prop] !== 'function') {
              try {
                console.error(`- ${prop}:`, JSON.stringify(errorObj[prop]));
              } catch (e) {
                console.error(`- ${prop}: [Невозможно сериализовать]`);
              }
            }
          }

          // Логируем контекст, в котором произошла ошибка
          console.error('Контекст ошибки:');
          console.error('- ID сессии:', sessionId);
          console.error(
            '- Параметры встречи:',
            JSON.stringify(meetingOptions, null, 2)
          );
          console.error('- Выбранная роль:', role);

          // Логируем в базу данных информацию об ошибке
          if (USE_MONGODB) {
            try {
              await new Log({
                sessionId: session.id,
                userId,
                action: 'generate_video_link_error_on_role_select',
                details: {
                  errorMessage: (error as Error).message,
                  errorType: (error as Error).constructor.name,
                  errorStack: (error as Error).stack,
                  meetingOptions,
                  role,
                },
              }).save();
              console.log('Информация об ошибке сохранена в логах');
            } catch (logError) {
              console.error(
                'Ошибка при сохранении информации об ошибке в логах:',
                logError
              );
            }
          }

          // Устанавливаем статус pending, чтобы пользователь мог попробовать еще раз
          session.videoLinkStatus = 'pending';
          console.error('=== КОНЕЦ ОТЧЕТА ОБ ОШИБКЕ ===');
        }
      }

      // Назначаем роль пользователю в сессии
      await session.assignRole(
        userId,
        role as 'interviewer' | 'interviewee' | 'observer'
      );

      // Если пользователь выбрал роль интервьюера, устанавливаем videoLinkStatus = active
      if (role === 'interviewer' && session.videoLink) {
        session.videoLinkStatus = 'active';
      }

      // Отправляем уведомление о выборе роли
      notifyRoleSelected(io, sessionId, userId, role);

      // Если пользователь выбирает роль интервьюера или отвечающего,
      // устанавливаем статус обратной связи как "pending"
      if (role === 'interviewer' || role === 'interviewee') {
        user.feedbackStatus = 'pending';
      }

      // Обновляем историю ролей пользователя
      if (!user.roleHistory || !Array.isArray(user.roleHistory)) {
        user.roleHistory = [];
      }

      try {
        // Добавляем новую запись в историю ролей
        user.roleHistory.push({
          sessionId: session.id,
          role,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error(
          'Ошибка при обновлении истории ролей:',
          (error as Error).message
        );
        res
          .status(500)
          .json({ message: 'Ошибка при обновлении истории ролей' });
        return;
      }

      // Сохраняем пользователя
      await user.save();

      // Отправляем уведомление об обновлении сессии всем подписчикам
      notifySessionUpdated(io, sessionId, session);

      res.json({
        message: 'Роль успешно назначена',
        session,
      });
    } catch (error) {
      console.error('Ошибка при назначении роли:', error);
      console.error('Стек ошибки:', (error as Error).stack);
      res.status(500).json({
        message: 'Ошибка сервера при назначении роли',
        details: (error as Error).message,
      });
    }
  }
);

// Изменение статуса сессии
// PUT /api/sessions/:id/status
router.put(
  '/:id/status',
  auth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const sessionId = req.params.id;
      const { status } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ message: 'Пользователь не авторизован' });
        return;
      }

      // Проверяем, что статус указан корректно
      if (!['pending', 'active', 'completed'].includes(status)) {
        res.status(400).json({
          message:
            'Некорректный статус. Допустимые значения: pending, active, completed',
        });
        return;
      }

      // Получаем сессию по ID
      const session = await InMemorySession.findById(sessionId);
      if (!session) {
        res.status(404).json({ message: 'Сессия не найдена' });
        return;
      }

      // Проверяем права доступа (только интервьюер может изменять статус)
      if (session.interviewerId !== userId) {
        res.status(403).json({
          message: 'Только интервьюер может изменять статус сессии',
        });
        return;
      }

      // Обновляем статус сессии
      session.status = status as 'pending' | 'active' | 'completed';
      await session.save();

      // Получаем экземпляр Socket.IO из объекта запроса
      const io = req.app.get('io');

      // Отправляем уведомление об изменении статуса сессии
      notifySessionUpdated(io, sessionId, session);

      // Если статус изменен на "completed", отправляем напоминание о необходимости заполнить форму обратной связи
      if (status === 'completed') {
        // Отправляем напоминание интервьюеру
        if (session.interviewerId) {
          notifyFeedbackRequired(io, session.interviewerId, sessionId);
        }

        // Отправляем напоминание отвечающему
        if (session.intervieweeId) {
          notifyFeedbackRequired(io, session.intervieweeId, sessionId);
        }
      }

      res.json({
        message: 'Статус сессии успешно обновлен',
        session,
      });
    } catch (error) {
      console.error('Ошибка при обновлении статуса сессии:', error);
      res.status(500).json({
        message: 'Ошибка сервера при обновлении статуса сессии',
        details: (error as Error).message,
      });
    }
  }
);

// Генерация или обновление ссылки на видеозвонок
// POST /api/sessions/:id/video
router.post(
  '/:id/video',
  auth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const sessionId = req.params.id;
      const { manualLink } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ message: 'Пользователь не авторизован' });
        return;
      }

      // Получаем сессию по ID
      const session = await SessionModel.findById(sessionId);

      if (!session) {
        res.status(404).json({ message: 'Сессия не найдена' });
        return;
      }

      // Получаем пользователя
      const user = await InMemoryUser.findById(userId);
      if (!user) {
        res.status(404).json({ message: 'Пользователь не найден' });
        return;
      }

      // Проверяем, является ли пользователь интервьюером сессии
      if (session.interviewerId !== userId) {
        res.status(403).json({
          message: 'Только интервьюер может управлять ссылкой на видеозвонок',
        });
        return;
      }

      // Проверяем, есть ли у пользователя googleId
      if (!user.googleId) {
        // Логируем попытку доступа без Google-аутентификации
        await Log.create({
          sessionId: session.id,
          userId,
          action: 'video_link_access_denied',
          details: {
            reason: 'missing_google_id',
            timestamp: new Date(),
          },
        });

        res.status(403).json({
          message: 'Для управления ссылкой требуется вход через Google',
        });
        return;
      }

      // Если ссылка уже активна, возвращаем её
      if (session.videoLinkStatus === 'active' && session.videoLink) {
        // Логируем запрос на получение уже активной ссылки
        await Log.create({
          sessionId: session.id,
          userId,
          action: 'get_active_video_link',
          details: {
            videoLink: session.videoLink,
            videoLinkStatus: session.videoLinkStatus,
            timestamp: new Date(),
          },
        });

        res.json({
          message: 'Ссылка уже активна',
          videoLink: session.videoLink,
          videoLinkStatus: session.videoLinkStatus,
        });
        return;
      }

      // Если предоставлена ручная ссылка, проверяем ее валидность
      if (manualLink) {
        const validationResult = await isValidMeetUrl(manualLink);

        if (validationResult.isValid) {
          // Обновляем сессию с ручной ссылкой
          session.videoLink = manualLink;
          session.videoLinkStatus = 'manual';
          await session.save();

          // Логируем добавление ручной ссылки
          await Log.create({
            sessionId: session.id,
            userId,
            action: 'add_manual_video_link',
            details: {
              videoLink: manualLink,
              validationResult: 'valid',
            },
          });

          // Отправляем уведомление об обновлении ссылки на видеозвонок
          const io = req.app.get('io');
          notifyVideoLinkStatusUpdated(io, sessionId, manualLink, 'manual');

          res.json({
            message: 'Ссылка на видеозвонок успешно добавлена',
            videoLink: manualLink,
            videoLinkStatus: 'manual',
          });
        } else {
          // Если ссылка не прошла валидацию, возвращаем ошибку
          res.status(400).json({
            message: 'Неверный формат ссылки Google Meet',
            details: validationResult.message,
          });
        }
      } else {
        // Если ручная ссылка не предоставлена, генерируем новую через Google Meet API

        // Определяем параметры встречи
        const meetingOptions = {
          summary: `Mock Interview ${session.id}`,
          startTime: session.startTime,
          durationMinutes: 60, // Длительность по умолчанию - 60 минут
          googleAccessToken: user.googleAccessToken, // Добавляем токен пользователя
        };

        try {
          // Логируем попытку генерации новой ссылки
          await Log.create({
            sessionId: session.id,
            userId,
            action: 'generate_video_link_attempt',
            details: {
              meetingOptions,
              timestamp: new Date(),
            },
          });

          // Генерируем новую ссылку на Google Meet с использованием googleAccessToken пользователя
          const videoLink = await createMeeting(meetingOptions);

          // Проверяем валидность новой ссылки
          const validationResult = await isValidMeetUrl(videoLink);

          if (validationResult.isValid) {
            // Обновляем сессию с новой ссылкой
            session.videoLink = videoLink;
            session.videoLinkStatus = 'active';
            await session.save();

            // Логируем генерацию ссылки
            await Log.create({
              sessionId: session.id,
              userId,
              action: 'generate_video_link',
              details: {
                videoLink,
                validationResult: 'valid',
              },
            });

            // Отправляем уведомление об обновлении ссылки на видеозвонок
            const io = req.app.get('io');
            notifyVideoLinkStatusUpdated(io, sessionId, videoLink, 'active');

            res.json({
              message: 'Ссылка на видеозвонок успешно сгенерирована',
              videoLink,
              videoLinkStatus: 'active',
            });
          } else {
            // Если ссылка не прошла валидацию, возвращаем ошибку
            res.status(400).json({
              message: 'Сгенерированная ссылка не прошла валидацию',
              details: validationResult.message,
            });
          }
        } catch (error) {
          console.error('=== ОШИБКА ПРИ ГЕНЕРАЦИИ ВИДЕОССЫЛКИ ===');
          console.error('Ошибка при генерации видеоссылки:', error);
          console.error('Стек ошибки:', (error as Error).stack);

          // Логируем тип ошибки и её конструктор
          console.error('Тип ошибки:', (error as Error).constructor.name);
          console.error('Сообщение ошибки:', (error as Error).message);

          // Логируем все свойства ошибки для более полного анализа
          console.error('Все свойства ошибки:');
          const errorObj = error as Record<string, any>;
          for (const prop in errorObj) {
            if (typeof errorObj[prop] !== 'function') {
              try {
                console.error(`- ${prop}:`, JSON.stringify(errorObj[prop]));
              } catch (e) {
                console.error(`- ${prop}: [Невозможно сериализовать]`);
              }
            }
          }

          // Логируем контекст, в котором произошла ошибка
          console.error('Контекст ошибки:');
          console.error('- ID сессии:', sessionId);
          console.error(
            '- Параметры встречи:',
            JSON.stringify(
              {
                summary: `Mock Interview ${session.id}`,
                startTime: session.startTime,
                durationMinutes: 60,
              },
              null,
              2
            )
          );

          // Логируем в базу данных информацию об ошибке
          try {
            await Log.create({
              sessionId: session.id,
              userId,
              action: 'generate_video_link_error',
              details: {
                errorMessage: (error as Error).message,
                errorType: (error as Error).constructor.name,
                errorStack: (error as Error).stack,
                meetingParams: {
                  summary: `Mock Interview ${session.id}`,
                  startTime: session.startTime,
                  durationMinutes: 60,
                },
              },
            });
            console.log('Информация об ошибке сохранена в логах');
          } catch (logError) {
            console.error(
              'Ошибка при сохранении информации об ошибке в логах:',
              logError
            );
          }

          console.error('=== КОНЕЦ ОТЧЕТА ОБ ОШИБКЕ ===');

          // Возвращаем ошибку клиенту
          res.status(500).json({
            message: 'Ошибка при генерации ссылки на видеозвонок',
            details: (error as Error).message,
          });
        }
      }
    } catch (error) {
      console.error(
        'Ошибка при обработке запроса на генерацию видеоссылки:',
        error
      );
      res.status(500).json({
        message: 'Ошибка сервера при обработке запроса',
        details: (error as Error).message,
      });
    }
  }
);

// Получение информации о ссылке на видеозвонок
// GET /api/sessions/:id/video
router.get(
  '/:id/video',
  auth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const sessionId = req.params.id;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ message: 'Пользователь не авторизован' });
        return;
      }

      // Получаем сессию по ID
      const session = await SessionModel.findById(sessionId);
      if (!session) {
        res.status(404).json({ message: 'Сессия не найдена' });
        return;
      }

      // Проверяем, является ли пользователь участником сессии
      const isParticipant =
        session.creatorId === userId ||
        session.interviewerId === userId ||
        session.intervieweeId === userId ||
        (session.observerIds && session.observerIds.includes(userId));

      if (!isParticipant) {
        res.status(403).json({
          message: 'У вас нет прав для просмотра ссылки на видеозвонок',
        });
        return;
      }

      // Логируем запрос на получение информации о ссылке
      await Log.create({
        sessionId: session.id,
        userId,
        action: 'get_video_link_info',
        details: {
          timestamp: new Date(),
          videoLinkStatus: session.videoLinkStatus || 'pending',
        },
      });

      // Если ссылка отсутствует или в статусе pending, возвращаем соответствующее сообщение
      if (!session.videoLink || session.videoLinkStatus === 'pending') {
        res.json({
          message: 'Ссылка еще не сгенерирована',
          videoLinkStatus: 'pending',
        });
        return;
      }

      // Возвращаем информацию о ссылке на видеозвонок
      res.json({
        videoLink: session.videoLink,
        videoLinkStatus: session.videoLinkStatus,
      });
    } catch (error) {
      console.error(
        'Ошибка при получении информации о ссылке на видеозвонок:',
        error
      );
      res.status(500).json({
        message:
          'Ошибка сервера при получении информации о ссылке на видеозвонок',
        details: (error as Error).message,
      });
    }
  }
);

// Получение информации о конкретной сессии
// GET /api/sessions/:id
router.get('/:id', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const sessionId = req.params.id;

    // Получаем сессию по ID
    const session = await InMemorySession.findById(sessionId);
    if (!session) {
      res.status(404).json({ message: 'Сессия не найдена' });
      return;
    }

    res.json(session);
  } catch (error) {
    console.error('Ошибка при получении информации о сессии:', error);
    res.status(500).json({
      message: 'Ошибка сервера при получении информации о сессии',
      details: (error as Error).message,
    });
  }
});

export default router;
