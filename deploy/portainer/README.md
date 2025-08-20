## Portainer: deployment guide

This guide helps you publish the app to your VPS via Portainer, including optional Jitsi and TURN stacks.

### Prerequisites

- A VPS with Docker and Portainer
- Domains:
  - FRONTEND (e.g., app.example.com)
  - BACKEND/API (e.g., api.example.com)
  - JITSI (optional, e.g., jitsi.example.com)
  - TURN (optional, e.g., turn.example.com)

### 1) Prepare environment variables

Use the provided examples to build your env values:

- App (production): `production.env` or `deploy/production.env.example`
- Jitsi: `deploy/jitsi/env.example`
- TURN (optional): `deploy/turn/env.example`

Key variables:

```
FRONTEND_URL=https://app.example.com
BACKEND_URL=https://api.example.com
VITE_API_URL=https://api.example.com
VITE_JITSI_URL=https://jitsi.example.com   # if using Jitsi
VITE_STUN_URLS=stun:stun.l.google.com:19302
# TURN (optional)
VITE_TURN_URL=turn:turn.example.com:3478
VITE_TURN_USERNAME=turn_user
VITE_TURN_PASSWORD=turn_pass
```

### 2) Deploy the App stack

1. Open Portainer → Stacks → Add stack
2. Name: `Super Mock`
3. Paste content of `docker-compose.prod.yml`
4. Add Environment variables using your `.env`
5. Deploy the stack

Notes:

- This stack uses an internal nginx bound to port 80. If you already have a reverse proxy (Traefik/NGINX) on the host, route traffic to the frontend container instead of binding 80/443 at the host.

### 3) Deploy the Jitsi stack (optional)

1. Open Portainer → Stacks → Add stack
2. Name: `jitsi`
3. Paste content of `deploy/jitsi/docker-compose.yml`
4. Add Environment from `deploy/jitsi/env.example` (edit `.env`)
5. Deploy stack

Important:

- Open UDP 10000 on your firewall (JVB).
- Set `VITE_JITSI_URL` in the App env to your Jitsi domain.
- If 80/443 are in use by a reverse proxy, remove `ports` from `web` service and add reverse-proxy labels instead.

### 4) Deploy the TURN stack (optional)

1. Open Portainer → Stacks → Add stack
2. Name: `turn`
3. Paste content of `deploy/turn/docker-compose.yml`
4. Add Environment from `deploy/turn/env.example`
5. Deploy stack

Then set these in the App env:

```
VITE_TURN_URL=turn:turn.example.com:3478
VITE_TURN_USERNAME=turn_user
VITE_TURN_PASSWORD=turn_pass
```

### 5) DNS and TLS

- Point your domains (A/AAAA) to the VPS IP
- Terminate TLS either at the app nginx or your edge reverse proxy

### 6) Verify

- App health: `GET https://api.example.com/api/health`
- Frontend loads at `https://app.example.com`
- Video: Jitsi or P2P WebRTC connects; if strict NATs, enable TURN
