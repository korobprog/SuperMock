import { Server as SocketIOServer } from 'socket.io';
import {
  notifySessionUpdated,
  notifyRoleSelected,
  notifyFeedbackRequired,
  notifyVideoLinkStatusUpdated,
  notifyFeedbackUpdated,
} from '../websocket';
import adapter from './prismaAdapter';

/**
 * Сервис для работы с сессиями
 * Обеспечивает взаимодействие между MongoDB (через Prisma) и WebSocket
 */
export class SessionService {
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  /**
   * Получение всех сессий
   */
  async getAllSessions() {
    try {
      return await adapter.sessions.findMany({
        include: {
          interviewer: {
            select: {
              id: true,
              email: true,
            },
          },
          interviewee: {
            select: {
              id: true,
              email: true,
            },
          },
          observers: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                },
              },
            },
          },
          feedbacks: true,
        },
      });
    } catch (error) {
      console.error('Ошибка при получении сессий:', error);
      throw new Error('Не удалось получить список сессий');
    }
  }

  /**
   * Получение сессии по ID
   */
  async getSessionById(sessionId: string) {
    try {
      return await adapter.sessions.findUnique({
        where: { id: sessionId },
        include: {
          interviewer: {
            select: {
              id: true,
              email: true,
            },
          },
          interviewee: {
            select: {
              id: true,
              email: true,
            },
          },
          observers: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                },
              },
            },
          },
          feedbacks: true,
          chatMessages: {
            orderBy: {
              createdAt: 'asc',
            },
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      console.error(`Ошибка при получении сессии ${sessionId}:`, error);
      throw new Error('Не удалось получить информацию о сессии');
    }
  }

  /**
   * Создание новой сессии
   */
  async createSession(data: {
    date: Date;
    creatorId: string;
    videoLink?: string;
  }) {
    try {
      const session = await adapter.sessions.create({
        data: {
          date: data.date,
          videoLink: data.videoLink,
          socketRoomId: `session_${Date.now()}`, // Генерируем уникальный ID комнаты для WebSocket
          lastActivity: new Date(),
        },
      });

      // Отправляем уведомление о создании сессии через WebSocket
      notifySessionUpdated(this.io, session.id, session);

      return session;
    } catch (error) {
      console.error('Ошибка при создании сессии:', error);
      throw new Error('Не удалось создать сессию');
    }
  }

  /**
   * Назначение роли пользователю в сессии
   */
  async assignRole(
    sessionId: string,
    userId: string,
    role: 'interviewer' | 'interviewee' | 'observer'
  ) {
    try {
      // Получаем сессию
      const session = await this.getSessionById(sessionId);
      if (!session) {
        throw new Error('Сессия не найдена');
      }

      // Проверяем, не занята ли уже роль
      if (
        role === 'interviewer' &&
        session.interviewerId &&
        session.interviewerId !== userId
      ) {
        throw new Error('Роль Собеседующего уже занята');
      }

      if (
        role === 'interviewee' &&
        session.intervieweeId &&
        session.intervieweeId !== userId
      ) {
        throw new Error('Роль Отвечающего уже занята');
      }

      // Обновляем сессию в зависимости от роли
      let updatedSession;

      if (role === 'interviewer') {
        updatedSession = await adapter.sessions.update({
          where: { id: sessionId },
          data: {
            interviewerId: userId,
            lastActivity: new Date(),
          },
        });
      } else if (role === 'interviewee') {
        updatedSession = await adapter.sessions.update({
          where: { id: sessionId },
          data: {
            intervieweeId: userId,
            lastActivity: new Date(),
          },
        });
      } else {
        // Для роли observer используем промежуточную модель UserSession
        // Сначала проверяем, существует ли уже такая запись
        const existingUserSession = await adapter.userSession.findUnique({
          where: {
            userId_sessionId: {
              userId: userId,
              sessionId: sessionId,
            },
          },
        });

        if (!existingUserSession) {
          await adapter.userSession.create({
            data: {
              userId: userId,
              sessionId: sessionId,
              role: 'observer',
              isOnline: true,
              lastActive: new Date(),
            },
          });
        } else {
          await adapter.userSession.update({
            where: {
              id: existingUserSession.id,
            },
            data: {
              isOnline: true,
              lastActive: new Date(),
            },
          });
        }

        updatedSession = await adapter.sessions.update({
          where: { id: sessionId },
          data: {
            lastActivity: new Date(),
          },
        });
      }

      // Обновляем историю ролей пользователя
      await this.updateUserRoleHistory(userId, sessionId, role);

      // Отправляем уведомления через WebSocket
      notifyRoleSelected(this.io, sessionId, userId, role);
      notifySessionUpdated(this.io, sessionId, updatedSession);

      return updatedSession;
    } catch (error) {
      console.error(`Ошибка при назначении роли в сессии ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Обновление истории ролей пользователя
   */
  private async updateUserRoleHistory(
    userId: string,
    sessionId: string,
    role: string
  ) {
    try {
      const user = await adapter.client.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('Пользователь не найден');
      }

      // Добавляем новую запись в историю ролей
      const roleHistory = user.roleHistory as any[];
      roleHistory.push({
        sessionId,
        role,
        timestamp: new Date(),
      });

      // Обновляем пользователя
      await adapter.client.user.update({
        where: { id: userId },
        data: {
          roleHistory: roleHistory,
        },
      });
    } catch (error) {
      console.error(
        `Ошибка при обновлении истории ролей пользователя ${userId}:`,
        error
      );
    }
  }

  /**
   * Обновление статуса сессии
   */
  async updateSessionStatus(
    sessionId: string,
    status: 'pending' | 'active' | 'completed' | 'cancelled',
    userId: string
  ) {
    try {
      // Получаем сессию
      const session = await this.getSessionById(sessionId);
      if (!session) {
        throw new Error('Сессия не найдена');
      }

      // Проверяем права доступа (только интервьюер может изменять статус)
      if (session.interviewerId !== userId) {
        throw new Error('Только Собеседующий может изменять статус сессии');
      }

      // Обновляем статус сессии
      const updatedSession = await adapter.sessions.update({
        where: { id: sessionId },
        data: {
          status,
          lastActivity: new Date(),
        },
      });

      // Отправляем уведомление об изменении статуса
      notifySessionUpdated(this.io, sessionId, updatedSession);

      // Если сессия завершена, отправляем напоминания о необходимости обратной связи
      if (status === 'completed') {
        if (session.interviewerId) {
          notifyFeedbackRequired(this.io, session.interviewerId, sessionId);
        }
        if (session.intervieweeId) {
          notifyFeedbackRequired(this.io, session.intervieweeId, sessionId);
        }
      }

      return updatedSession;
    } catch (error) {
      console.error(
        `Ошибка при обновлении статуса сессии ${sessionId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Обновление или создание ссылки на видеозвонок
   */
  async updateVideoLink(sessionId: string, videoLink: string, userId: string) {
    try {
      // Получаем сессию
      const session = await this.getSessionById(sessionId);
      if (!session) {
        throw new Error('Сессия не найдена');
      }

      // Проверяем права доступа (только интервьюер может обновлять ссылку)
      if (session.interviewerId !== userId) {
        throw new Error(
          'Только Собеседующий может обновлять ссылку на видеозвонок'
        );
      }

      // Обновляем ссылку на видеозвонок
      const updatedSession = await adapter.sessions.update({
        where: { id: sessionId },
        data: {
          videoLink,
          videoLinkStatus: 'active',
          lastActivity: new Date(),
        },
      });

      // Отправляем уведомление об обновлении ссылки
      notifySessionUpdated(this.io, sessionId, updatedSession);
      notifyVideoLinkStatusUpdated(this.io, sessionId, videoLink, 'active');

      return updatedSession;
    } catch (error) {
      console.error(
        `Ошибка при обновлении ссылки на видеозвонок для сессии ${sessionId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Добавление сообщения в чат сессии
   */
  async addChatMessage(sessionId: string, userId: string, content: string) {
    try {
      // Проверяем существование сессии
      const session = await this.getSessionById(sessionId);
      if (!session) {
        throw new Error('Сессия не найдена');
      }

      // Проверяем, является ли пользователь участником сессии
      const isParticipant =
        session.interviewerId === userId ||
        session.intervieweeId === userId ||
        session.observers.some((observer: any) => observer.userId === userId);

      if (!isParticipant) {
        throw new Error('Только участники сессии могут отправлять сообщения');
      }

      // Создаем новое сообщение
      const message = await adapter.chatMessage.create({
        data: {
          content,
          userId,
          sessionId,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

      // Обновляем время последней активности в сессии
      await adapter.sessions.update({
        where: { id: sessionId },
        data: {
          lastActivity: new Date(),
        },
      });

      // Отправляем сообщение всем участникам сессии через WebSocket
      this.io.to(`session:${sessionId}`).emit('chat-message', message);

      return message;
    } catch (error) {
      console.error(
        `Ошибка при добавлении сообщения в чат сессии ${sessionId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Получение сообщений чата для сессии
   */
  async getChatMessages(sessionId: string, userId: string) {
    try {
      // Проверяем существование сессии
      const session = await this.getSessionById(sessionId);
      if (!session) {
        throw new Error('Сессия не найдена');
      }

      // Проверяем, является ли пользователь участником сессии
      const isParticipant =
        session.interviewerId === userId ||
        session.intervieweeId === userId ||
        session.observers.some((observer: any) => observer.userId === userId);

      if (!isParticipant) {
        throw new Error(
          'Только участники сессии могут просматривать сообщения'
        );
      }

      // Получаем сообщения чата
      const messages = await adapter.chatMessage.findMany({
        where: {
          sessionId,
        },
        orderBy: {
          createdAt: 'asc',
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

      return messages;
    } catch (error) {
      console.error(
        `Ошибка при получении сообщений чата для сессии ${sessionId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Обновление статуса онлайн пользователя в сессии
   */
  async updateUserOnlineStatus(
    sessionId: string,
    userId: string,
    isOnline: boolean
  ) {
    try {
      // Проверяем, является ли пользователь интервьюером или интервьюируемым
      const session = await this.getSessionById(sessionId);
      if (!session) {
        throw new Error('Сессия не найдена');
      }

      if (
        session.interviewerId === userId ||
        session.intervieweeId === userId
      ) {
        // Для интервьюера и интервьюируемого не нужно обновлять статус в UserSession
        return;
      }

      // Для наблюдателей обновляем статус в UserSession
      const userSession = await adapter.userSession.findUnique({
        where: {
          userId_sessionId: {
            userId,
            sessionId,
          },
        },
      });

      if (userSession) {
        await adapter.userSession.update({
          where: {
            id: userSession.id,
          },
          data: {
            isOnline,
            lastActive: new Date(),
          },
        });
      }

      // Отправляем уведомление об изменении статуса пользователя
      this.io.to(`session:${sessionId}`).emit('user-status-changed', {
        sessionId,
        userId,
        isOnline,
      });
    } catch (error) {
      console.error(
        `Ошибка при обновлении статуса пользователя в сессии ${sessionId}:`,
        error
      );
    }
  }

  /**
   * Получение активных сессий для пользователя
   */
  async getUserActiveSessions(userId: string) {
    try {
      // Получаем сессии, где пользователь является интервьюером или интервьюируемым
      const sessions = await adapter.sessions.findMany({
        where: {
          OR: [
            { interviewerId: userId },
            { intervieweeId: userId },
            {
              observers: {
                some: {
                  userId: userId,
                },
              },
            },
          ],
          status: {
            in: ['pending', 'active'],
          },
        },
        include: {
          interviewer: {
            select: {
              id: true,
              email: true,
            },
          },
          interviewee: {
            select: {
              id: true,
              email: true,
            },
          },
          observers: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                },
              },
            },
          },
          feedbacks: true,
        },
        orderBy: {
          date: 'asc',
        },
      });

      return sessions;
    } catch (error) {
      console.error(
        `Ошибка при получении активных сессий пользователя ${userId}:`,
        error
      );
      throw new Error('Не удалось получить список активных сессий');
    }
  }

  /**
   * Получение завершенных сессий для пользователя
   */
  async getUserCompletedSessions(userId: string) {
    try {
      // Получаем сессии, где пользователь является интервьюером или интервьюируемым
      const sessions = await adapter.sessions.findMany({
        where: {
          OR: [
            { interviewerId: userId },
            { intervieweeId: userId },
            {
              observers: {
                some: {
                  userId: userId,
                },
              },
            },
          ],
          status: 'completed',
        },
        include: {
          interviewer: {
            select: {
              id: true,
              email: true,
            },
          },
          interviewee: {
            select: {
              id: true,
              email: true,
            },
          },
          observers: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                },
              },
            },
          },
          feedbacks: true,
        },
        orderBy: {
          date: 'desc',
        },
      });

      return sessions;
    } catch (error) {
      console.error(
        `Ошибка при получении завершенных сессий пользователя ${userId}:`,
        error
      );
      throw new Error('Не удалось получить список завершенных сессий');
    }
  }

  /**
   * Отправка уведомления о новом сообщении в чате
   */
  async notifyNewChatMessage(sessionId: string, message: any) {
    try {
      // Отправляем уведомление всем участникам сессии
      this.io.to(`session:${sessionId}`).emit('new-chat-message', {
        sessionId,
        message,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        `Ошибка при отправке уведомления о новом сообщении в чате сессии ${sessionId}:`,
        error
      );
    }
  }

  /**
   * Удаление сессии
   */
  async deleteSession(sessionId: string, userId: string) {
    try {
      // Получаем сессию
      const session = await this.getSessionById(sessionId);
      if (!session) {
        throw new Error('Сессия не найдена');
      }

      // Проверяем права доступа (только интервьюер может удалить сессию)
      if (session.interviewerId !== userId) {
        throw new Error('Только Собеседующий может удалить сессию');
      }

      // Удаляем связанные записи
      await adapter.client.$transaction([
        // Удаляем сообщения чата
        adapter.chatMessage.deleteMany({
          where: { sessionId },
        }),
        // Удаляем обратную связь
        adapter.feedback.deleteMany({
          where: { sessionId },
        }),
        // Удаляем связи с наблюдателями
        adapter.userSession.deleteMany({
          where: { sessionId },
        }),
        // Удаляем саму сессию
        adapter.sessions.delete({
          where: { id: sessionId },
        }),
      ]);

      // Отправляем уведомление об удалении сессии
      this.io.to(`session:${sessionId}`).emit('session-deleted', {
        sessionId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`Ошибка при удалении сессии ${sessionId}:`, error);
      throw error;
    }
  }
}

// Экспортируем класс сервиса
export default SessionService;
