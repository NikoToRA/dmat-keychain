import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://shop.wonder-drill.com',
  output: 'static',
  integrations: [tailwind()],
});
