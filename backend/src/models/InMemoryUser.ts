import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Интерфейс для данных пользователя
export interface UserData {
  email: string;
  password: string;
  roleHistory?: RoleHistoryItem[];
  feedbackStatus?: 'none' | 'pending' | 'completed';
  googleId?: string;
  googleAccessToken?: string;
  googleRefreshToken?: string;
}

// Интерфейс для элемента истории ролей
export interface RoleHistoryItem {
  sessionId: string;
  role: string;
  timestamp: Date;
}

// Интерфейс для запроса поиска
export interface UserQuery {
  email: string;
}

// Хранилище пользователей в памяти
const users: InMemoryUser[] = [];

export class InMemoryUser {
  id: string;
  email: string;
  password: string;
  roleHistory: RoleHistoryItem[];
  feedbackStatus: 'none' | 'pending' | 'completed';
  createdAt: Date;
  googleId?: string;
  googleAccessToken?: string;
  googleRefreshToken?: string;

  constructor(userData: UserData) {
    this.id = crypto.randomUUID();
    this.email = userData.email;
    this.password = userData.password;
    this.roleHistory = userData.roleHistory || [];
    this.feedbackStatus = userData.feedbackStatus || 'none'; // none, pending, completed
    this.createdAt = new Date();
    this.googleId = userData.googleId;
    this.googleAccessToken = userData.googleAccessToken;
    this.googleRefreshToken = userData.googleRefreshToken;
  }

  // Статический метод для поиска пользователя по email
  static async findOne(query: UserQuery): Promise<InMemoryUser | null> {
    return users.find((user) => user.email === query.email) || null;
  }

  // Статический метод для поиска пользователя по googleId
  static async findByGoogleId(googleId: string): Promise<InMemoryUser | null> {
    return users.find((user) => user.googleId === googleId) || null;
  }

  // Статический метод для поиска пользователя по id
  static async findById(id: string): Promise<InMemoryUser | null> {
    const user = users.find((user) => user.id === id);
    if (!user) return null;

    // Создаем новый экземпляр класса InMemoryUser с данными найденного пользователя
    const userInstance = new InMemoryUser({
      email: user.email,
      password: user.password,
      roleHistory: user.roleHistory || [],
      feedbackStatus: user.feedbackStatus,
      googleId: user.googleId,
      googleAccessToken: user.googleAccessToken,
      googleRefreshToken: user.googleRefreshToken,
    });

    // Копируем id и другие поля из найденного пользователя
    userInstance.id = user.id;
    userInstance.createdAt = user.createdAt;

    // Добавляем метод select для поддержки цепочки вызовов
    (userInstance as any).select = (fields: string) => {
      // Если поле начинается с '-', исключаем его из результата
      if (fields.startsWith('-')) {
        const fieldToExclude = fields.substring(1);
        const { [fieldToExclude as keyof typeof user]: excluded, ...rest } =
          user;
        return rest;
      }

      // Иначе включаем только указанные поля
      const fieldList = fields.split(' ');
      const result: Record<string, any> = {};
      fieldList.forEach((field) => {
        if ((user as any)[field] !== undefined) {
          result[field] = (user as any)[field];
        }
      });
      return result;
    };

    return userInstance;
  }

  // Метод для сохранения пользователя
  async save(): Promise<InMemoryUser> {
    try {
      console.log('Сохранение пользователя:', this.id, this.email);

      // Проверяем, существует ли пользователь с таким id
      const existingUserIndex = users.findIndex((user) => user.id === this.id);
      console.log('Существующий индекс:', existingUserIndex);

      if (existingUserIndex !== -1) {
        // Обновляем существующего пользователя
        console.log('Обновление существующего пользователя');

        // Проверяем, что roleHistory является массивом
        if (this.roleHistory && !Array.isArray(this.roleHistory)) {
          console.error('roleHistory не является массивом:', this.roleHistory);
          this.roleHistory = [];
        }

        // Сохраняем текущий пароль, чтобы не хешировать его повторно, если он уже хеширован
        const currentPassword = users[existingUserIndex].password;

        // Обновляем пользователя
        users[existingUserIndex] = this;

        // Восстанавливаем хешированный пароль, если текущий пароль не изменился
        if (this.password === 'temporary_password') {
          users[existingUserIndex].password = currentPassword;
        }

        console.log('Пользователь обновлен');
      } else {
        // Проверяем, существует ли пользователь с таким email
        const existingUserByEmail = users.find(
          (user) => user.email === this.email
        );
        if (
          existingUserByEmail &&
          this.email !== `user_${this.id}@example.com`
        ) {
          throw new Error('Пользователь с таким email уже существует');
        }

        // Инициализируем roleHistory как пустой массив
        if (!this.roleHistory) {
          this.roleHistory = [];
        }

        // Хешируем пароль перед сохранением только для нового пользователя
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);

        // Добавляем пользователя в хранилище
        users.push(this);
        console.log('Новый пользователь добавлен');
      }

      return this;
    } catch (error) {
      console.error('Ошибка при сохранении пользователя:', error);
      throw new Error(
        `Ошибка при сохранении пользователя: ${(error as Error).message}`
      );
    }
  }

  // Метод для сравнения паролей
  async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }
}
