# Backend Dockerfile (Express + Prisma) - Updated for Prisma fix
FROM node:20-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

WORKDIR /app

# Copy backend package files
COPY backend/package.json ./backend/
WORKDIR /app/backend

# Install backend dependencies
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install --no-frozen-lockfile

# Approve build scripts for Prisma
RUN pnpm approve-builds

# Copy only Prisma schema first
COPY backend/prisma ./prisma/

# Generate Prisma client
RUN pnpm exec prisma generate --schema prisma/schema.prisma

# Copy backend sources (including compiled dist)
COPY backend ./

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Run the production server (uses server/index.mjs)
CMD ["node", "server/index.mjs"]