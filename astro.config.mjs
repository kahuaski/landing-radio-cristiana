// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// ⚠️ Reemplaza con tu dominio real (ej: https://mushukkawsay.com)
// Se usa para canonical, Open Graph, JSON-LD y el sitemap.
const site = 'https://radiocristiana.example.com';

// https://astro.build/config
export default defineConfig({
	site,
	vite: { plugins: [tailwindcss()] },
	integrations: [sitemap()],
});
