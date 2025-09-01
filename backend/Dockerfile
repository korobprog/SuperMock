# Backend Dockerfile (Express + Prisma)
FROM node:20-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

WORKDIR /app

# Install deps separately for better cache
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install --frozen-lockfile

# Copy backend sources
COPY backend ./backend

# Generate Prisma client
RUN pnpm exec prisma generate --schema backend/prisma/schema.prisma

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Run the production server (uses backend/server/index.mjs)
CMD ["node", "backend/server/index.mjs"]


