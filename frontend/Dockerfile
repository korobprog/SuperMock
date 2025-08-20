# Frontend Dockerfile (Vite build + Nginx serve)
FROM node:20-alpine AS build
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install --frozen-lockfile

COPY frontend ./frontend
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
RUN pnpm run build --filter . --config frontend/vite.config.ts

FROM nginx:alpine AS runtime
# Build context is repo root, nginx.conf resides under frontend/
COPY frontend/nginx.conf /etc/nginx/nginx.conf
# Vite builds into /app/frontend/dist (root is set in config)
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]


