# Backend Dockerfile (Express + Prisma)
FROM node:20-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install --frozen-lockfile

# Copy backend sources (including compiled dist)
COPY . ./backend

# Generate Prisma client
RUN pnpm exec prisma generate --schema backend/prisma/schema.prisma

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Run the production server (uses server/index.mjs)
CMD ["node", "backend/server/index.mjs"]