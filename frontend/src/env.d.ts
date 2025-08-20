/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TELEGRAM_BOT_NAME: string;
  readonly VITE_TELEGRAM_BOT_ID: string;
  readonly VITE_API_URL: string;
  readonly VITE_ENABLE_DEMO_MODE: string;
  readonly VITE_JITSI_URL: string;
  readonly VITE_STUN_URLS: string;
  readonly VITE_TURN_URL: string;
  readonly VITE_TURN_USERNAME: string;
  readonly VITE_TURN_PASSWORD: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
