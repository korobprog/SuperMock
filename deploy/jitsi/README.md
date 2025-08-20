## Jitsi self-hosted (Docker)

This stack deploys Jitsi components (`web`, `prosody`, `jicofo`, `jvb`) suitable for embedding via the app's Jitsi mode.

### Quick start

1. Copy env example and adjust values:

```bash
cp env.example .env
# edit .env
```

2. Start the stack:

```bash
docker compose up -d
```

3. Point the frontend to your Jitsi base URL by setting `VITE_JITSI_URL`:

```bash
# For production builds or Dokploy envs
VITE_JITSI_URL=https://jitsi.example.com
```

4. In the app UI, choose "Jitsi" in the video selector.

### Notes

- If ports 80/443 are already used on the host, remove the `web` service ports and add reverse-proxy labels for Traefik/Nginx.
- Open/forward UDP `10000` on your server for JVB.
- For public SSL, either terminate TLS at your reverse proxy or set `ENABLE_LETSENCRYPT=1` and provide `LETSENCRYPT_*` vars.
