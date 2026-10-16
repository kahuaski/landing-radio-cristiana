---
name: social-integrations
description: Use when the user asks to connect or integrate social media / redes sociales — share buttons, botones de compartir, Open Graph, Twitter cards, embeds (YouTube, Spotify, Facebook, Instagram, TikTok), social links in the footer, social feeds, RSS, or social login ("conecta redes sociales", "agrega botones de compartir", "embed de YouTube/Spotify", "feed de Instagram", "login con Google").
---

# Social Integrations — Redes sociales en Astro

Integra redes sociales en este landing (Radio Ministerial Mushuk Kawsay) de forma accesible, con buen SEO y sin ralentizar el sitio. Prioriza **HTML/CSS y contenido generado en build**; evita scripts de terceros pesados y trackers sin consentimiento.

## Reglas del proyecto (obligatorias)

- Gestor/runtime: **Bun**. Astro 7 + Tailwind v4. UI en español (`es-EC`).
- El `<head>` con Open Graph, Twitter cards, canonical y JSON-LD ya vive en `src/layouts/Layout.astro`. **Reutilízalo y extiéndelo**, no lo dupliques.
- Componentes siguen **Atomic Design** (ver skill `atomic-ui`): un botón de compartir simple es un átomo/molécula, una banda de redes es un organismo.
- **Privacidad primero**: no cargar scripts de terceros (Facebook/Instagram embeds, píxeles) sin avisar; usar `loading="lazy"` y `referrerpolicy`.
- Iconos decorativos con `aria-hidden="true"`; botones de compartir con `aria-label` descriptivo y `target="_blank" rel="noopener noreferrer"`.

## 1. Open Graph / Twitter cards (ya existente — solo ajustar)

`Layout.astro` ya genera `og:*` y `twitter:*`. Al añadir una página, pasa por props:

```astro
<Layout
  title="Programación"
  description="Consulta la programación semanal en vivo de Mushuk Kawsay."
  image="/og/programacion.png"
  type="website"
/>
```

Checklist al crear/editar páginas:
- `og:image` 1200×630 en `public/og/`. Nombre estable y URL absoluta (Layout ya resuelve `imageURL` con `Astro.site`).
- `og:locale` = `es_EC` (ya configurado); mantenerlo si se agregan variantes.
- Descripción de 140–160 caracteres.
- Aviso: el `site` en `astro.config.mjs` debe ser el dominio real, si no las imágenes/URLs absolutas quedan mal (hoy es placeholder).

## 2. Datos estructurados JSON-LD

Layout ya emite `WebSite` + `Organization`. Para enriquecer el SEO social:
- **RadioStation / RadioSeries** para emisoras: agregar al `@graph`.
- **BreadcrumbList** en páginas internas.
- **Article** en blog/noticias.

```ts
const radioSchema = {
  "@type": "RadioStation",
  "@id": `${canonicalURL}#radio`,
  name: siteName,
  url: canonicalURL.href,
  broadcastAffiliateOf: { "@id": `${canonicalURL}#organization` },
  availableLanguage: "es",
};
```

Pasar el array completo a un solo `<script type="application/ld+json" set:html={JSON.stringify(schema)} />` dentro del `@graph`.

## 3. Botones de compartir (átomo/molécula)

Sin SDKs de terceros: URLs de intent directas. Extensible con el patrón de registros (ver skill `clean-solid`, principio Open/Closed).

```ts
// src/lib/share.ts
export const SHARE_PROVIDERS = {
  whatsapp: (u: string, t: string) => `https://wa.me/?text=${encodeURIComponent(`${t} ${u}`)}`,
  facebook: (u: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}`,
  x: (u: string, t: string) =>
    `https://twitter.com/intent/tweet?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}`,
  telegram: (u: string, t: string) =>
    `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}`,
} satisfies Record<string, (url: string, title?: string) => string>;

export type ShareProvider = keyof typeof SHARE_PROVIDERS;
export const buildShareUrl = (red: ShareProvider, url: string, title = "") =>
  SHARE_PROVIDERS[red](url, title);
```

`src/components/molecules/ShareButtons.astro`:

```astro
---
interface Props {
  url: string;
  title: string;
  networks?: ("whatsapp" | "facebook" | "x" | "telegram")[];
}
import { buildShareUrl } from "../../lib/share";
const { url, title, networks = ["whatsapp", "facebook", "x"] } = Astro.props;
const etiquetas = { whatsapp: "WhatsApp", facebook: "Facebook", x: "X", telegram: "Telegram" };
---
<div class="flex items-center gap-2" role="group" aria-label="Compartir esta página">
  {networks.map((red) => (
    <a
      href={buildShareUrl(red, url, title)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Compartir en ${etiquetas[red]}`}
      class="inline-flex items-center justify-center rounded-full bg-slate-200 p-2 text-slate-700 transition-colors hover:bg-emerald-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:bg-slate-800 dark:text-slate-200"
    >
      <span aria-hidden="true">{etiquetas[red][0]}</span>
    </a>
  ))}
</div>
```

En la página, pasa la URL canónica absoluta: `const shareUrl = new URL(Astro.url.pathname, Astro.site).href;`.

## 4. Embeds de redes (YouTube / Spotify / Facebook / Instagram)

- **YouTube/Spotify**: usar `iframe` con `loading="lazy"`, `referrerpolicy="strict-origin-when-cross-origin"`, `allow`/`allowfullscreen` según el proveedor. El proyecto ya tiene `getPlaylistEmbedUrl` en `src/config/playlist.ts` — reutilízalo para YouTube.
- **Instagram/Facebook/TikTok**: sus embeds cargan scripts de terceros pesados. Preferir:
  1. Un enlace con imagen/preview propia (mejor rendimiento y privacidad), o
  2. `iframe` de embed nativo solo bajo la acción del usuario (patrón "click to load").
- Nunca incrustar el script de Facebook en el `<head>` global; cargarlo solo en la página que lo necesita.

```astro
<iframe
  src={embedUrl}
  title="Reproductor de YouTube"
  width="560" height="315"
  loading="lazy"
  referrerpolicy="strict-origin-when-cross-origin"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowfullscreen
  class="aspect-video w-full rounded-xl"
></iframe>
```

## 5. Enlaces sociales en el footer (organismo)

Centraliza los enlaces en config, no hardcodeados en el componente:

```ts
// src/config/social.ts
export const SOCIAL_LINKS = [
  { red: "whatsapp", label: "WhatsApp", url: "https://wa.me/593XXXXXXXXX" },
  { red: "facebook", label: "Facebook", url: "https://facebook.com/TUPAGINA" },
  { red: "youtube", label: "YouTube", url: "https://youtube.com/@TUCANAL" },
  { red: "instagram", label: "Instagram", url: "https://instagram.com/TUPERFIL" },
  { red: "tiktok", label: "TikTok", url: "https://tiktok.com/@TUPERFIL" },
] as const;
```

En `Footer.astro`, renderizar `SOCIAL_LINKS` con `<a target="_blank" rel="noopener noreferrer me">` (añadir `me` cuando sea un perfil propio verificable) y `aria-label`.

## 6. Feed social / RSS

- **RSS/Atom**: integrar `@astrojs/rss` y generar `src/pages/rss.xml.ts` (útil si hay blog/podcast).
- **Feed de una red** (Instagram/TikTok): requiere API/token de terceros y suele romper por CORS. Enfoques aceptables, en orden:
  1. **Servir en build** (Astro SSG): obtener el feed en build y renderizar estático.
  2. **Server route / Worker**: proxy propio que cachea el feed (ver skills `bun-backend`, `cloudflare`), nunca exponer tokens al cliente.
  3. Evitar widgets de feed de terceros que inyectan scripts y rastrean.
- Guardar tokens/API keys en variables de entorno (`Bun.env.*` / `import.meta.env`), jamás en el cliente.

## 7. Social login (si el usuario lo pide)

- No implementar OAuth a mano en el frontend. Opciones:
  - **Firebase Auth** (ver skill `firebase`) con proveedores Google/Facebook/Apple.
  - **Cloudflare Workers OAuth** o proveedor gestionado (ver skill `cloudflare`).
- El flujo debe ser server-side; el cliente solo maneja sesión y estado.
- Nunca incrustar `client_secret` en el bundle del navegador.

## Verificación

```bash
bunx astro check
bun run build
bun run preview   # revisar og:image y embeds en el HTML generado
```

Comprobar el resultado social con las herramientas oficiales de cada red (validador OG de Facebook, card validator de X) una vez definido el dominio real.

## Prohibiciones

- No añadir píxeles/trackers ni scripts sociales globales sin consentimiento del usuario.
- No hardcodear URLs de redes en componentes: usar `src/config/*.ts`.
- No incrustar tokens/secretos en el cliente ni en `set:html`.
- No cargar embeds pesados con autoplay ni sin `loading="lazy"`.
- No duplicar las meta tags OG/Twitter fuera de `Layout.astro`.
