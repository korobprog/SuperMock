# Простой Dockerfile без Prisma для быстрого запуска
FROM node:20-alpine AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

WORKDIR /app

# Copy backend package files
COPY backend/package.json ./backend/
COPY pnpm-lock.yaml ./backend/
WORKDIR /app/backend

# Install backend dependencies (без Prisma)
RUN pnpm install --no-frozen-lockfile

# Copy backend sources
COPY backend ./

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Run the production server
CMD ["node", "server/index.mjs"]