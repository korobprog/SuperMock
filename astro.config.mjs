import { defineConfig } from 'astro/config';

export default defineConfig({
  experimental: {
    i18n: {
      defaultLocale: 'ru',
      locales: ['ru', 'en', 'es', 'fr', 'de', 'zh'],
      routing: {
        prefixDefaultLocale: false,
      }
    }
  }
});
