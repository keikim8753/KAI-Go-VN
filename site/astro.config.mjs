// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  i18n: {
    defaultLocale: 'ko',
    locales: ['ko', 'en', 'vi'],
    routing: {
      prefixDefaultLocale: true,
    },
  },
});
