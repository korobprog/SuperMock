import { PrismaClient } from '@prisma/client';
import { MongoClient, Collection, ObjectId } from 'mongodb';

// Создаем единый экземпляр Prisma клиента для всего приложения
const prisma = new PrismaClient();

/**
 * Класс-адаптер для работы с моделями
 * Позволяет использовать MongoDB напрямую, если Prisma клиент недоступен
 */
class PrismaAdapter {
  private prisma: PrismaClient;
  private mongoClient: MongoClient | null = null;
  private db: any = null;
  private collections: { [key: string]: Collection } = {};
  private useMongoDB: boolean = false;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
    this.useMongoDB = process.env.USE_MONGODB === 'true';
  }

  /**
   * Инициализация MongoDB клиента
   * Вызывается только если используется MongoDB напрямую
   */
  async init() {
    // Если не используем MongoDB напрямую, просто возвращаемся
    if (!this.useMongoDB) {
      console.log('PrismaAdapter использует Prisma клиент');
      return;
    }

    // Проверяем наличие переменной окружения MONGO_URI
    if (!process.env.MONGO_URI) {
      console.warn(
        'MONGO_URI не определен в переменных окружения, используем Prisma клиент'
      );
      this.useMongoDB = false;
      return;
    }

    try {
      this.mongoClient = new MongoClient(process.env.MONGO_URI);
      await this.mongoClient.connect();

      // Получаем базу данных
      const dbName = new URL(
        process.env.MONGO_URI.replace('mongodb://', 'http://')
      ).pathname.substring(1);
      this.db = this.mongoClient.db(dbName || 'supermook');

      // Инициализируем коллекции
      this.collections = {
        sessions: this.db.collection('sessions'),
        user_sessions: this.db.collection('user_sessions'),
        chat_messages: this.db.collection('chat_messages'),
        feedbacks: this.db.collection('feedbacks'),
        users: this.db.collection('users'),
      };

      console.log('PrismaAdapter успешно инициализирован с MongoDB');
    } catch (error) {
      console.error('Ошибка при инициализации MongoDB в PrismaAdapter:', error);
      console.log('Переключаемся на использование Prisma клиента');
      this.useMongoDB = false;
    }
  }

  /**
   * Получение Prisma клиента
   */
  get client() {
    return this.prisma;
  }

  /**
   * Получение коллекции MongoDB
   * @param name Имя коллекции
   */
  collection(name: string): Collection {
    if (!this.useMongoDB) {
      throw new Error('MongoDB не используется, используйте Prisma клиент');
    }

    if (!this.collections[name]) {
      throw new Error(`Коллекция ${name} не инициализирована`);
    }

    return this.collections[name];
  }

  /**
   * Преобразование ID из строки в ObjectId для MongoDB
   */
  private toObjectId(id: string): ObjectId {
    try {
      return new ObjectId(id);
    } catch (error) {
      console.error(`Ошибка при преобразовании ID ${id} в ObjectId:`, error);
      throw new Error(`Некорректный формат ID: ${id}`);
    }
  }

  /**
   * Методы для работы с сессиями
   */
  get sessions() {
    // Если не используем MongoDB, используем Prisma клиент
    if (!this.useMongoDB) {
      return (this.prisma as any)['session'];
    }

    // Иначе используем MongoDB напрямую
    return {
      findMany: async (params: any) => {
        const { where, include, orderBy } = params || {};
        const query = where ? this.convertWhereClause(where) : {};
        const options: any = {};

        if (orderBy) {
          options.sort = this.convertOrderBy(orderBy);
        }

        const sessions = await this.collection('sessions')
          .find(query, options)
          .toArray();

        // Обработка include, если необходимо
        if (include) {
          return this.processIncludes(sessions, include, 'sessions');
        }

        return sessions;
      },
      findUnique: async (params: any) => {
        const { where, include } = params;
        const query = this.convertWhereClause(where);

        const session = await this.collection('sessions').findOne(query);

        if (session && include) {
          const processed = await this.processIncludes(
            [session],
            include,
            'sessions'
          );
          return processed[0];
        }

        return session;
      },
      create: async (params: any) => {
        const { data, include } = params;
        const result = await this.collection('sessions').insertOne(data);
        const createdSession = { ...data, id: result.insertedId.toString() };

        if (include) {
          const processed = await this.processIncludes(
            [createdSession],
            include,
            'sessions'
          );
          return processed[0];
        }

        return createdSession;
      },
      update: async (params: any) => {
        const { where, data, include } = params;
        const query = this.convertWhereClause(where);

        await this.collection('sessions').updateOne(query, { $set: data });
        const updatedSession = await this.collection('sessions').findOne(query);

        if (updatedSession && include) {
          const processed = await this.processIncludes(
            [updatedSession],
            include,
            'sessions'
          );
          return processed[0];
        }

        return updatedSession;
      },
      delete: async (params: any) => {
        const { where } = params;
        const query = this.convertWhereClause(where);

        const session = await this.collection('sessions').findOne(query);
        await this.collection('sessions').deleteOne(query);

        return session;
      },
    };
  }

  /**
   * Преобразование условий where для MongoDB
   */
  private convertWhereClause(where: any): any {
    const result: any = {};

    // Обработка ID
    if (where.id) {
      try {
        result._id = this.toObjectId(where.id);
      } catch (error) {
        result._id = where.id;
      }
      delete where.id;
    }

    // Копируем остальные поля
    Object.keys(where).forEach((key) => {
      result[key] = where[key];
    });

    return result;
  }

  /**
   * Преобразование orderBy для MongoDB
   */
  private convertOrderBy(orderBy: any): any {
    const result: any = {};

    Object.keys(orderBy).forEach((key) => {
      result[key] = orderBy[key] === 'asc' ? 1 : -1;
    });

    return result;
  }

  /**
   * Обработка включений (include) для MongoDB
   */
  private async processIncludes(
    data: any[],
    include: any,
    collectionName: string
  ): Promise<any[]> {
    if (!data || data.length === 0) return data;

    // Копируем данные, чтобы не изменять оригинал
    const result = JSON.parse(JSON.stringify(data));

    // Обрабатываем каждое включение
    for (const key of Object.keys(include)) {
      if (key === 'interviewer' || key === 'interviewee') {
        // Получаем ID пользователей
        const userIds = result
          .map((item: any) => item[`${key}Id`])
          .filter(Boolean);

        if (userIds.length > 0) {
          // Получаем пользователей
          const users = this.useMongoDB
            ? await this.collection('users')
                .find({
                  _id: {
                    $in: userIds.map((id: string) => this.toObjectId(id)),
                  },
                })
                .toArray()
            : await this.prisma.user.findMany({
                where: { id: { in: userIds } },
              });

          // Добавляем пользователей к результату
          result.forEach((item: any) => {
            if (item[`${key}Id`]) {
              const user = users.find(
                (u: any) =>
                  u.id === item[`${key}Id`] ||
                  u._id.toString() === item[`${key}Id`]
              );
              item[key] = user
                ? this.selectFields(user, include[key].select)
                : null;
            } else {
              item[key] = null;
            }
          });
        }
      }

      // Другие типы включений можно добавить по аналогии
    }

    return result;
  }

  /**
   * Выбор полей из объекта согласно select
   */
  private selectFields(obj: any, select: any): any {
    if (!select) return obj;

    const result: any = {};

    Object.keys(select).forEach((key) => {
      if (select[key]) {
        result[key] = obj[key];
      }
    });

    return result;
  }

  /**
   * Методы для работы с user_sessions
   */
  get userSession() {
    // Если не используем MongoDB, используем Prisma клиент
    if (!this.useMongoDB) {
      // Используем индексную нотацию для доступа к свойству
      return (this.prisma as any)['userSession'];
    }

    // Иначе используем MongoDB напрямую
    return {
      findUnique: async (params: any) => {
        const { where } = params;
        const query = this.convertWhereClause(where);

        return await this.collection('user_sessions').findOne(query);
      },
      create: async (params: any) => {
        const { data } = params;
        const result = await this.collection('user_sessions').insertOne(data);

        return { ...data, id: result.insertedId.toString() };
      },
      update: async (params: any) => {
        const { where, data } = params;
        const query = this.convertWhereClause(where);

        await this.collection('user_sessions').updateOne(query, { $set: data });

        return await this.collection('user_sessions').findOne(query);
      },
      deleteMany: async (params: any) => {
        const { where } = params;
        const query = this.convertWhereClause(where);

        return await this.collection('user_sessions').deleteMany(query);
      },
    };
  }

  /**
   * Методы для работы с chat_messages
   */
  get chatMessage() {
    // Если не используем MongoDB, используем Prisma клиент
    if (!this.useMongoDB) {
      // Используем индексную нотацию для доступа к свойству
      return (this.prisma as any)['chatMessage'];
    }

    // Иначе используем MongoDB напрямую
    return {
      create: async (params: any) => {
        const { data, include } = params;
        const result = await this.collection('chat_messages').insertOne(data);
        const createdMessage = { ...data, id: result.insertedId.toString() };

        if (include) {
          const processed = await this.processIncludes(
            [createdMessage],
            include,
            'chat_messages'
          );
          return processed[0];
        }

        return createdMessage;
      },
      findMany: async (params: any) => {
        const { where, orderBy, include } = params || {};
        const query = where ? this.convertWhereClause(where) : {};
        const options: any = {};

        if (orderBy) {
          options.sort = this.convertOrderBy(orderBy);
        }

        const messages = await this.collection('chat_messages')
          .find(query, options)
          .toArray();

        if (include) {
          return this.processIncludes(messages, include, 'chat_messages');
        }

        return messages;
      },
      deleteMany: async (params: any) => {
        const { where } = params;
        const query = this.convertWhereClause(where);

        return await this.collection('chat_messages').deleteMany(query);
      },
    };
  }

  /**
   * Методы для работы с feedbacks
   */
  get feedback() {
    // Если не используем MongoDB, используем Prisma клиент
    if (!this.useMongoDB) {
      // Используем индексную нотацию для доступа к свойству
      return (this.prisma as any)['feedback'];
    }

    // Иначе используем MongoDB напрямую
    return {
      create: async (params: any) => {
        const { data } = params;
        const result = await this.collection('feedbacks').insertOne(data);

        return { ...data, id: result.insertedId.toString() };
      },
      findMany: async (params: any) => {
        const { where, orderBy } = params || {};
        const query = where ? this.convertWhereClause(where) : {};
        const options: any = {};

        if (orderBy) {
          options.sort = this.convertOrderBy(orderBy);
        }

        return await this.collection('feedbacks')
          .find(query, options)
          .toArray();
      },
      deleteMany: async (params: any) => {
        const { where } = params;
        const query = this.convertWhereClause(where);

        return await this.collection('feedbacks').deleteMany(query);
      },
    };
  }

  /**
   * Закрытие соединения с MongoDB
   */
  async disconnect() {
    if (this.mongoClient) {
      await this.mongoClient.close();
      console.log('PrismaAdapter отключен от MongoDB');
    }
  }
}

// Создаем экземпляр адаптера
const adapter = new PrismaAdapter(prisma);

// Инициализируем адаптер при импорте
adapter.init().catch((error) => {
  console.error('Ошибка при инициализации PrismaAdapter:', error);
  console.log('Будет использоваться Prisma клиент напрямую');
});

// Обработка завершения работы приложения
process.on('beforeExit', async () => {
  await adapter.disconnect();
  await prisma.$disconnect();
  console.log('Prisma и PrismaAdapter отключены от базы данных');
});

export default adapter;
