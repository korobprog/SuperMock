const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const InMemorySession = require('../models/InMemorySession');
const InMemoryUser = require('../models/InMemoryUser');
const Session = require('../models/Session'); // Добавляем MongoDB модель
const Log = require('../models/Log'); // Добавляем модель для логирования
const {
  notifySessionUpdated,
  notifyRoleSelected,
  notifyFeedbackRequired,
  notifyVideoLinkStatusUpdated,
} = require('../websocket');
const {
  createMeeting,
  isValidMeetUrl,
  checkMeetingStatus,
} = require('../services/googleMeetService');

// Флаг для переключения между InMemory и MongoDB
const USE_MONGODB = process.env.USE_MONGODB === 'true';

// Выбор модели в зависимости от флага
const SessionModel = USE_MONGODB ? Session : InMemorySession;

// Получение списка всех сессий
// GET /api/sessions
router.get('/', auth, async (req, res) => {
  try {
    console.log('Получен запрос на /api/sessions');
    console.log('Пользователь:', req.user);

    const sessions = await InMemorySession.find();
    console.log('Найдено сессий:', sessions.length);

    // Устанавливаем заголовок Content-Type явно
    res.setHeader('Content-Type', 'application/json');
    res.json(sessions);
  } catch (error) {
    console.error('Ошибка при получении списка сессий:', error.message);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Создание новой сессии
// POST /api/sessions
router.post('/', auth, async (req, res) => {
  try {
    const { videoLink, startTime } = req.body;
    const userId = req.user.id;

    // Проверка времени начала сессии
    const now = new Date();
    const minStartTime = new Date(now);
    minStartTime.setHours(minStartTime.getHours() + 2); // Минимум 2 часа вперед

    let sessionStartTime;

    if (startTime) {
      const requestedStartTime = new Date(startTime);

      // Проверяем, не находится ли запрошенное время в прошлом
      if (requestedStartTime < now) {
        console.warn(
          `Запрошенное время начала (${requestedStartTime.toISOString()}) находится в прошлом.`
        );
        return res.status(400).json({
          message: 'Невозможно создать сессию с временем начала в прошлом',
          suggestedStartTime: minStartTime.toISOString(),
        });
      }

      // Проверяем, соответствует ли запрошенное время минимальному требованию (2 часа вперед)
      if (requestedStartTime < minStartTime) {
        console.warn(
          `Запрошенное время начала (${requestedStartTime.toISOString()}) меньше минимально допустимого.`
        );
        return res.status(400).json({
          message:
            'Время начала должно быть как минимум на 2 часа позже текущего времени',
          suggestedStartTime: minStartTime.toISOString(),
        });
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
    console.error('Ошибка при создании сессии:', error.message);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Выбор роли в сессии
// POST /api/sessions/:id/roles
router.post('/:id/roles', auth, async (req, res) => {
  try {
    const { role } = req.body;
    const sessionId = req.params.id;
    const userId = req.user.id;

    console.log('Выбор роли для сессии:', sessionId);
    console.log('Пользователь ID:', userId);
    console.log('Выбранная роль:', role);

    // Проверяем, что роль указана корректно
    if (!['interviewer', 'interviewee', 'observer'].includes(role)) {
      console.log('Некорректная роль:', role);
      return res.status(400).json({
        message:
          'Некорректная роль. Допустимые значения: interviewer, interviewee, observer',
      });
    }

    // Получаем сессию по ID
    const session = await SessionModel.findById(sessionId);
    console.log('Найдена сессия:', session ? 'Да' : 'Нет');
    if (!session) {
      return res.status(404).json({ message: 'Сессия не найдена' });
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
      return res.status(403).json({
        message:
          'Вы не можете выбрать эту роль, пока не заполните форму обратной связи',
      });
    }

    // Проверяем ограничения для выбора роли
    try {
      if (role === 'interviewer') {
        // Проверяем, был ли пользователь интервьюером в последней сессии
        const lastSession = await SessionModel.findLastSessionAsInterviewer(
          userId
        );

        console.log('Последняя сессия как интервьюер:', lastSession);

        if (lastSession) {
          return res.status(400).json({
            message:
              'Вы не можете выбрать роль интервьюера, так как были интервьюером в последней сессии',
          });
        }
      }
    } catch (error) {
      console.error('Ошибка при проверке ограничений для выбора роли:', error);
      return res.status(500).json({
        message: 'Ошибка при проверке ограничений для выбора роли',
        details: error.message,
      });
    }

    // Проверяем, не занята ли уже роль
    if (role === 'interviewer' && session.interviewerId) {
      return res.status(400).json({ message: 'Роль Собеседующего уже занята' });
    }

    if (role === 'interviewee' && session.intervieweeId) {
      return res.status(400).json({ message: 'Роль Отвечающего уже занята' });
    }

    // Получаем экземпляр Socket.IO из объекта запроса
    const io = req.app.get('io');

    // Если пользователь выбирает роль интервьюера и видеоссылка отсутствует или в статусе pending,
    // автоматически генерируем ссылку через Видео Чат API
    if (
      role === 'interviewer' &&
      (!session.videoLink || session.videoLinkStatus === 'pending')
    ) {
      // Определяем параметры встречи до блока try-catch
      const meetingOptions = {
        summary: `Mock Interview ${session.id}`,
        startTime: session.startTime,
        durationMinutes: 60, // Длительность по умолчанию - 60 минут
      };

      try {
        // Генерируем новую ссылку на Видео Чат
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
        console.error('Стек ошибки:', error.stack);

        // Логируем тип ошибки и её конструктор
        console.error('Тип ошибки:', error.constructor.name);
        console.error('Сообщение ошибки:', error.message);

        // Логируем все свойства ошибки для более полного анализа
        console.error('Все свойства ошибки:');
        for (const prop in error) {
          if (typeof error[prop] !== 'function') {
            try {
              console.error(`- ${prop}:`, JSON.stringify(error[prop]));
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
                errorMessage: error.message,
                errorType: error.constructor.name,
                errorStack: error.stack,
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
    await session.assignRole(userId, role);

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
      console.error('Ошибка при обновлении истории ролей:', error.message);
      return res
        .status(500)
        .json({ message: 'Ошибка при обновлении истории ролей' });
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
    console.error('Стек ошибки:', error.stack);
    res.status(500).json({
      message: 'Ошибка сервера при назначении роли',
      details: error.message,
    });
  }
});

// Изменение статуса сессии
// PUT /api/sessions/:id/status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const { status } = req.body;
    const userId = req.user.id;

    // Проверяем, что статус указан корректно
    if (!['pending', 'active', 'completed'].includes(status)) {
      return res.status(400).json({
        message:
          'Некорректный статус. Допустимые значения: pending, active, completed',
      });
    }

    // Получаем сессию по ID
    const session = await InMemorySession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Сессия не найдена' });
    }

    // Проверяем права доступа (только интервьюер может изменять статус)
    if (session.interviewerId !== userId) {
      return res.status(403).json({
        message: 'Только интервьюер может изменять статус сессии',
      });
    }

    // Обновляем статус сессии
    session.status = status;
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
      details: error.message,
    });
  }
});

// Получение информации о конкретной сессии
// GET /api/sessions/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const sessionId = req.params.id;

    // Получаем сессию по ID
    const session = await InMemorySession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Сессия не найдена' });
    }

    res.json(session);
  } catch (error) {
    console.error('Ошибка при получении информации о сессии:', error);
    res.status(500).json({
      message: 'Ошибка сервера при получении информации о сессии',
      details: error.message,
    });
  }
});

// Генерация и сохранение ссылки на Видео Чат для сессии
// POST /api/sessions/:id/video
router.post('/:id/video', auth, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = req.user.id;
    const { manualLink } = req.body;

    // Получаем сессию по ID
    const session = await SessionModel.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Сессия не найдена' });
    }

    // Проверяем права доступа (только Собеседующий может генерировать ссылку)
    if (session.interviewerId !== userId) {
      return res.status(403).json({
        message: 'Только Собеседующий может сгенерировать ссылку',
      });
    }

    // Логируем попытку изменения ссылки
    if (USE_MONGODB) {
      await new Log({
        sessionId: session.id,
        userId,
        action: 'update_video_link',
        details: {
          previousLink: session.videoLink,
          previousStatus: session.videoLinkStatus,
          manualLinkProvided: !!manualLink,
        },
      }).save();
    }

    // Если ссылка уже существует и активна, возвращаем её без генерации новой
    if (session.videoLink && session.videoLinkStatus === 'active') {
      return res.json({
        message: 'Ссылка уже активна',
        videoLink: session.videoLink,
        videoLinkStatus: session.videoLinkStatus,
        session,
      });
    }

    // Если передана manualLink, сохраняем её с статусом 'manual'
    if (manualLink) {
      // Проверяем, что ссылка имеет правильный формат и существует
      try {
        const validationResult = await isValidMeetUrl(manualLink);

        if (!validationResult.isValid) {
          return res.status(400).json({
            message: `Некорректная ссылка на Видео Чат: ${validationResult.message}`,
          });
        }

        session.videoLink = manualLink;
        session.videoLinkStatus = 'manual';

        // Получаем экземпляр Socket.IO из объекта запроса
        const io = req.app.get('io');

        // Отправляем уведомление об обновлении ссылки на видеозвонок
        notifyVideoLinkStatusUpdated(io, sessionId, manualLink, 'manual');

        console.log(
          `Ручная ссылка на Видео Чат успешно проверена: ${manualLink}`
        );
      } catch (error) {
        console.error('Ошибка при проверке ссылки на Видео Чат:', error);
        return res.status(500).json({
          message: 'Ошибка при проверке ссылки на Видео Чат',
          details: error.message,
        });
      }
    }
    // Если ссылка отсутствует, пустая или истекла, генерируем новую
    else if (
      !session.videoLink ||
      session.videoLink === '' ||
      session.videoLinkStatus === 'expired'
    ) {
      // Генерируем новую ссылку на Видео Чат
      const meetingOptions = {
        summary: `Mock Interview ${session.id}`,
        startTime: session.startTime,
        durationMinutes: 60, // Длительность по умолчанию - 60 минут
      };

      try {
        const videoLink = await createMeeting(meetingOptions);

        // Проверяем валидность новой ссылки
        const validationResult = await isValidMeetUrl(videoLink);

        if (validationResult.isValid) {
          session.videoLink = videoLink;
          session.videoLinkStatus = 'active';

          // Получаем экземпляр Socket.IO из объекта запроса
          const io = req.app.get('io');

          // Отправляем уведомление об обновлении ссылки на видеозвонок
          notifyVideoLinkStatusUpdated(io, sessionId, videoLink, 'active');

          console.log(
            `Успешно сгенерирована новая ссылка на видеозвонок: ${videoLink}`
          );
        } else {
          console.warn(
            `Сгенерированная ссылка не прошла валидацию: ${validationResult.message}`
          );

          // Устанавливаем статус ссылки как pending, чтобы пользователь мог попробовать еще раз
          session.videoLinkStatus = 'pending';

          // Добавляем информацию об ошибке в ответ
          res.status(400).json({
            message: `Не удалось сгенерировать валидную ссылку: ${validationResult.message}`,
            videoLinkStatus: 'pending',
            session,
          });
          return; // Прерываем выполнение функции
        }
      } catch (error) {
        console.error('=== ОШИБКА ПРИ ГЕНЕРАЦИИ ССЫЛКИ НА ВИДЕОЗВОНОК ===');
        console.error('Ошибка при генерации ссылки на видеозвонок:', error);
        console.error('Стек ошибки:', error.stack);

        // Логируем тип ошибки и её конструктор
        console.error('Тип ошибки:', error.constructor.name);
        console.error('Сообщение ошибки:', error.message);

        // Логируем все свойства ошибки для более полного анализа
        console.error('Все свойства ошибки:');
        for (const prop in error) {
          if (typeof error[prop] !== 'function') {
            try {
              console.error(`- ${prop}:`, JSON.stringify(error[prop]));
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

        // Логируем информацию о сессии
        console.error('Информация о сессии:');
        console.error('- ID:', session.id);
        console.error('- Статус:', session.status);
        console.error('- Время начала:', session.startTime);
        console.error('- ID интервьюера:', session.interviewerId);
        console.error('- ID отвечающего:', session.intervieweeId);

        // Устанавливаем статус ссылки как pending, чтобы пользователь мог попробовать еще раз
        session.videoLinkStatus = 'pending';

        // Логируем в базу данных информацию об ошибке
        if (USE_MONGODB) {
          try {
            await new Log({
              sessionId: session.id,
              userId: req.user.id,
              action: 'generate_video_link_error',
              details: {
                errorMessage: error.message,
                errorType: error.constructor.name,
                errorStack: error.stack,
                meetingOptions,
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

        // Создаем более информативное сообщение об ошибке для клиента
        let clientErrorMessage = 'Ошибка при генерации ссылки на видеозвонок';

        // Добавляем детали ошибки в зависимости от её типа
        if (error.code) {
          // Ошибки сети
          if (error.code === 'ENOTFOUND') {
            clientErrorMessage +=
              ': проблема с подключением к серверу Видео Чат';
          } else if (error.code === 'ECONNREFUSED') {
            clientErrorMessage += ': сервер Видео Чат отклонил соединение';
          } else if (error.code === 'ETIMEDOUT') {
            clientErrorMessage +=
              ': превышено время ожидания ответа от сервера Видео Чат';
          } else {
            clientErrorMessage += `: ошибка сети (${error.code})`;
          }
        } else if (error.response && error.response.status) {
          // Ошибки HTTP
          if (error.response.status === 401) {
            clientErrorMessage += ': ошибка авторизации в Видео Чат API';
          } else if (error.response.status === 403) {
            clientErrorMessage += ': отказано в доступе к Видео Чат API';
          } else if (error.response.status === 404) {
            clientErrorMessage += ': ресурс Видео Чат API не найден';
          } else if (error.response.status === 429) {
            clientErrorMessage += ': превышен лимит запросов к Видео Чат API';
          } else {
            clientErrorMessage += `: ошибка API (HTTP ${error.response.status})`;
          }
        } else {
          // Другие ошибки
          clientErrorMessage += `: ${error.message}`;
        }

        console.error('=== КОНЕЦ ОТЧЕТА ОБ ОШИБКЕ ===');

        // Добавляем информацию об ошибке в ответ
        res.status(500).json({
          message: clientErrorMessage,
          videoLinkStatus: 'pending',
          session,
          errorDetails: {
            type: error.constructor.name,
            code: error.code || null,
            httpStatus: error.response ? error.response.status : null,
          },
        });
        return; // Прерываем выполнение функции
      }
    }

    // Сохраняем обновленную сессию
    await session.save();

    // Используем уже полученный экземпляр Socket.IO из объекта запроса
    // или получаем его, если он еще не был получен
    const io = req.app.get('io');

    // Отправляем уведомление об обновлении сессии
    notifySessionUpdated(io, sessionId, session);

    // Логируем обновление ссылки
    await Log.create({
      sessionId: session.id,
      userId: req.user.id,
      action: 'video_link_updated',
      timestamp: new Date(),
    });

    res.json({
      message: 'Ссылка на видеозвонок успешно обновлена',
      videoLink: session.videoLink,
      videoLinkStatus: session.videoLinkStatus,
      session,
    });
  } catch (error) {
    console.error('Ошибка при обновлении ссылки на видеозвонок:', error);
    res.status(500).json({
      message: 'Ошибка сервера при обновлении ссылки на видеозвонок',
      details: error.message,
    });
  }
});

// Получение ссылки на видеозвонок для сессии
// GET /api/sessions/:id/video
router.get('/:id/video', auth, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = req.user.id;

    // Получаем сессию по ID
    const session = await SessionModel.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Сессия не найдена' });
    }

    // Если статус ссылки 'pending', возвращаем соответствующее сообщение
    if (!session.videoLink || session.videoLinkStatus === 'pending') {
      return res.json({
        message: 'Ссылка еще не сгенерирована',
        videoLinkStatus: 'pending',
        isInterviewer: session.interviewerId === userId,
      });
    }

    // Проверяем статус ссылки через Видео Чат API (если API поддерживает)
    if (session.videoLink && session.videoLinkStatus === 'active') {
      const currentStatus = await checkMeetingStatus(session.videoLink);

      // Если статус изменился, обновляем его в базе данных
      if (
        currentStatus === 'expired' &&
        session.videoLinkStatus !== 'expired'
      ) {
        session.videoLinkStatus = 'expired';
        await session.save();

        // Логируем изменение статуса
        if (USE_MONGODB) {
          await new Log({
            sessionId: session.id,
            userId,
            action: 'video_link_expired',
            details: { videoLink: session.videoLink },
          }).save();
        }

        // Получаем экземпляр Socket.IO из объекта запроса
        const io = req.app.get('io');

        // Отправляем уведомление об изменении статуса ссылки
        notifyVideoLinkStatusUpdated(
          io,
          session.id,
          session.videoLink,
          'expired'
        );

        // Проверяем, является ли пользователь интервьюером
        if (session.interviewerId === userId) {
          console.log(
            'Интервьюер запросил ссылку, которая истекла. Генерируем новую ссылку...'
          );

          // Генерируем новую ссылку на Видео Чат
          const meetingOptions = {
            summary: `Mock Interview ${session.id}`,
            startTime: session.startTime,
            durationMinutes: 60, // Длительность по умолчанию - 60 минут
          };

          try {
            const videoLink = await createMeeting(meetingOptions);

            // Проверяем валидность новой ссылки
            const validationResult = await isValidMeetUrl(videoLink);

            if (validationResult.isValid) {
              session.videoLink = videoLink;
              session.videoLinkStatus = 'active';
              await session.save();

              // Отправляем уведомление об обновлении ссылки на видеозвонок
              notifyVideoLinkStatusUpdated(io, session.id, videoLink, 'active');

              console.log(
                `Автоматически сгенерирована новая ссылка на видеозвонок: ${videoLink}`
              );
            } else {
              console.warn(
                `Не удалось сгенерировать валидную ссылку: ${validationResult.message}`
              );
            }
          } catch (error) {
            console.error(
              'Ошибка при автоматической генерации новой ссылки:',
              error
            );
          }
        }
      }
    }

    res.json({
      videoLink: session.videoLink,
      videoLinkStatus: session.videoLinkStatus,
      isInterviewer: session.interviewerId === userId,
    });
  } catch (error) {
    console.error('Ошибка при получении ссылки на видеозвонок:', error);
    res.status(500).json({
      message: 'Ошибка сервера при получении ссылки на видеозвонок',
      details: error.message,
    });
  }
});

module.exports = router;
