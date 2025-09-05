// Временная заглушка для Prisma client
// TODO: Восстановить Prisma после исправления проблем с Docker

export const prisma = {
  user: {
    findUnique: () => Promise.resolve(null),
    findMany: () => Promise.resolve([]),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve({}),
  },
  // Добавьте другие модели по мере необходимости
};

export default prisma;