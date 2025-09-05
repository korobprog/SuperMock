# Frontend Dockerfile (Vite build + Nginx serve)
FROM node:20-alpine AS build
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install --frozen-lockfile

COPY frontend ./frontend
# Копируем папку public с логотипом
COPY public ./public
# Копируем папку media с favicon файлами
COPY media ./media
# Allow passing Vite envs at build time
# VITE_ prefix is required for Vite environment variables
ARG VITE_API_URL
ARG VITE_JITSI_URL
ARG VITE_TELEGRAM_BOT_NAME
ARG VITE_TELEGRAM_BOT_ID
ARG VITE_STUN_URLS
ARG VITE_TURN_URL
ARG VITE_TURN_USERNAME
ARG VITE_TURN_PASSWORD
ARG VITE_ENABLE_DEMO_MODE
ENV VITE_API_URL=$VITE_API_URL \
    VITE_JITSI_URL=$VITE_JITSI_URL \
    VITE_TELEGRAM_BOT_NAME=$VITE_TELEGRAM_BOT_NAME \
    VITE_TELEGRAM_BOT_ID=$VITE_TELEGRAM_BOT_ID \
    VITE_STUN_URLS=$VITE_STUN_URLS \
    VITE_TURN_URL=$VITE_TURN_URL \
    VITE_TURN_USERNAME=$VITE_TURN_USERNAME \
    VITE_TURN_PASSWORD=$VITE_TURN_PASSWORD \
    VITE_ENABLE_DEMO_MODE=$VITE_ENABLE_DEMO_MODE
WORKDIR /app/frontend
RUN pnpm exec vite build

FROM nginx:alpine AS runtime
# Build context is repo root, nginx.conf resides under nginx/
COPY nginx/frontend-nginx.conf /etc/nginx/conf.d/default.conf
# Vite builds into /app/frontend/dist (root is set in config)
COPY --from=build /app/frontend/dist /usr/share/nginx/html
# Копируем папку media в nginx контейнер
COPY --from=build /app/media /usr/share/nginx/html/media
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]


