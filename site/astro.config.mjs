// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config — GitHub Pages 프로젝트 사이트 배포 (9·10장)
export default defineConfig({
  site: 'https://keikim8753.github.io',
  base: '/KAI-Go-VN',
  i18n: {
    defaultLocale: 'vi',
    locales: ['vi', 'en', 'ko'],
    routing: {
      prefixDefaultLocale: true,
    },
  },
});
