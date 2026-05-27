import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://your-domain.com',
  integrations: [
    sitemap(),
  ],
  markdown: {
    shikiConfig: {
      theme: 'one-dark-pro',
      transformers: [],
    },
    remarkPlugins: [],
    rehypePlugins: [],
  },
  vite: {
    plugins: [tailwindcss()],
    server: {
      watch: {
        usePolling: true,
        interval: 300,
        ignored: ['!**/content/**']
      }
    }
  },
});
