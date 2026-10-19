// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Dominio real: se usa para canonical, Open Graph, JSON-LD y el sitemap.
const site = 'https://radio-ministerial-mushuk-kawsay.com';

// https://astro.build/config
export default defineConfig({
	site,
	vite: { plugins: [tailwindcss()] },
	integrations: [sitemap()],
	redirects: {
		'/inicio': '/',
		'/remodelacion': '/',
	},
});
