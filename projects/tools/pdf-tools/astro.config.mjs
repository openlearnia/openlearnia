import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://pdf-tools.openlearnia.com',
  output: 'static',
  integrations: [sitemap()],
  vite: {
    worker: {
      format: 'es',
    },
  },
});
