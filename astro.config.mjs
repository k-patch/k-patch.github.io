import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://k-patch.github.io',
  integrations: [
    react(),
    sitemap({
      i18n: {
        defaultLocale: 'ko',
        locales: {
          ko: 'ko-KR',
        },
      },
    }),
  ],
  output: 'static',

  build: {
    assets: 'assets'
  },
  vite: {
    plugins: [tailwindcss()]
  }
});