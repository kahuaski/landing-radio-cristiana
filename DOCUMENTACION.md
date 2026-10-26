# Documentación — Radio Ministerial Mushuk Kawsay

Landing page institucional de la **Radio Ministerial Mushuk Kawsay** ("Tu canal de Fe"), emisora cristiana en línea 24/7. El sitio presenta la emisora, su programación, sus redes sociales, un presentador y espacios publicitarios, con contacto directo por WhatsApp.

- **Dominio:** `https://radio-ministerial-mushuk-kawsay.com`
- **Hosting y DNS:** Cloudflare (Cloudflare Pages + dominio gestionado en Cloudflare)
- **Idioma:** español (es-EC)
- **Tipo de sitio:** una sola página (single-page landing) + una API interna de conteo de visitas

---

## 1. Stack tecnológico

| Capa | Tecnología | Versión | Uso en el proyecto |
| --- | --- | --- | --- |
| Framework web | **Astro** | `^7.3.8` | Renderizado estático de todas las secciones (`output: static`) |
| Estilos | **Tailwind CSS** | `^4.3.3` | 100% de los estilos, vía plugin `@tailwindcss/vite` (sin CSS por componente) |
| Tipado | **TypeScript** | `5` | Props tipadas en componentes, configs y la Function de Cloudflare |
| Build tool | **Vite** | (incluido en Astro) | Bundling de scripts y Tailwind |
| Gestor de paquetes | **Bun** | — | `bun install`, `bun run build`, `bunx` (lockfile `bun.lock`) |
| Runtime requerido | **Node.js** | `>=22.12.0` | `engines` en `package.json` |
| SEO | **@astrojs/sitemap** | `^3.7.4` | Genera `sitemap-index.xml` + `sitemap-0.xml` |
| Backend / API | **Cloudflare Pages Functions** | — | Endpoint `/api/visitas` (`functions/api/visitas.ts`) |
| Base de datos | **Cloudflare D1** (SQLite) | — | Tabla `visitas` con el conteo anónimo por origen |
| CLI de infraestructura | **Wrangler** | `^4.151.0` | Config `wrangler.jsonc`, deploy y migración de D1 |
| Tipos de Workers | **@cloudflare/workers-types** | `^5...` | Tipado de `D1Database`, `PagesFunction` |
| Fuentes | **Google Fonts** | — | `Inter` (texto) y `Plus Jakarta Sans` (títulos) |

**No se usa ningún framework de UI** (nada de React, Vue, Svelte). Toda la interfaz son componentes `.astro` con HTML y clases Tailwind; la poca interactividad está resuelta con pequeños scripts inline en TypeScript servidos por Astro.

---

## 2. Alcance de la landing

### Qué incluye
- **Landing de una sola página** (`/`) con todas las secciones integradas y desplazamiento por anclas.
- **Presentación institucional** de la emisora: identidad, misión, valores ("pilares") y antigüedad.
- **Programación real** con dos bloques y estado "Al aire ahora" en tiempo vivo.
- **Reproductor multimedia** en modal con pestañas (En vivo / Música / Videos) usando embeds de YouTube.
- **Redes sociales** con enlaces a Facebook, TikTok, YouTube y Telegram.
- **Ficha del presentador** con foto, servicios y contactos (WhatsApp, email, Facebook).
- **Botón flotante de WhatsApp** presente en todas las páginas.
- **Dos espacios publicitarios** (carrusel de spots): uno compacto bajo el navbar y otro antes del footer.
- **Contador público de visitas por origen** (function oculta que solo aparece cuando hay datos).
- **SEO completo**: sitemap, `robots.txt`, canonical, Open Graph, Twitter Cards y datos estructurados JSON-LD.
- **Modo oscuro/claro** con preferencia persistente (oscuro por defecto).
- **Diseño responsive** mobile-first, revisado hasta 380px de ancho.

### Qué NO incluye (fuera de alcance actual)
- Gestor de contenidos (CMS) o panel de administración: el contenido se edita en el código.
- Cuentas de usuario, login, suscripciones o pagos.
- Blog, noticias o listado de episodios.
- Páginas internas dedicadas de Programas, Nosotros, Contacto, Privacidad y Términos (los enlaces existen en navbar/footer pero aún no hay archivos de página).
- Reproductor de audio propio (la música se sirve vía YouTube).
- Formulario de contacto con envío por servidor (el contacto es por WhatsApp, email y Facebook).

---

## 3. Arquitectura del proyecto

Diseño atómico (Atomic Design) dentro de `src/`:

```
landing-radio-cristiana/
├── astro.config.mjs          # site real, sitemap y redirects
├── wrangler.jsonc            # config de Cloudflare Pages + binding D1
├── schema.sql                # esquema de la tabla `visitas` (D1)
├── functions/
│   └── api/
│       └── visitas.ts        # API: GET totales / POST registrar visita
├── public/                   # estáticos: logo1.jpeg, locutor.jpeg, icono1.jpg,
│                             # icono2.jpg, og-image.png, favicon.svg/.ico y robots.txt
│                             # (el favicon en uso es /icono1.jpg)
└── src/
    ├── config/
    │   ├── ads.ts            # spots del carrusel publicitario
    │   ├── media.ts          # URLs de YouTube (live / music / videos) + getEmbedUrl
    │   └── social.ts         # enlaces y colores de redes sociales
    ├── layouts/
    │   └── Layout.astro      # <html>, SEO, JSON-LD del sitio, tema, modal y FAB
    ├── styles/
    │   └── global.css        # Tailwind + tokens del sistema de diseño
    ├── components/
    │   ├── atoms/            # Badge, Button, Icon
    │   ├── molecules/        # NavItem, VideoEmbed, WhatsAppButton (+ ProgramCard, StatCard sin uso)
    │   ├── organisms/        # Navbar, Hero, Programs, Social, About, AdBanner,
    │   │                     # VisitorSources, CtaBand, Footer, MediaModal,
    │   │                     # ComingSoon, Holding, PlayerBar (sin uso)
    │   └── templates/        # Home, Holding (inactiva)
    └── pages/
        └── index.astro       # única ruta: renderiza Home
```

**Rutas**
- `/` → landing (template `Home`).
- `/inicio` → redirección `301` a `/` (evita contenido duplicado).
- `/remodelacion` → redirección a `/` (alias histórico de la página "próximamente", hoy desactivada).
- `/api/visitas` → endpoint de Cloudflare (solo existe en producción con Pages + D1).

---

## 4. Sistema de diseño

Definido como tokens de Tailwind v4 en `src/styles/global.css` (`@theme`), sin hojas de estilo por componente. El sistema se llama **"Warm Sanctum Broadcast"**:

- **Colores de marca:** `navy` `#0f172a`, `dawn` `#d97706`, `dawn-strong` `#b45309`, `dawn-bright` `#f59e0b`, `live` `#dc2626`, `prayer` para bloques devocionales, más una paleta Material de superficies (`surface`, `surface-container-*`, `on-surface`, etc.).
- **Tipografía:** escala propia (`headline-xl/lg/md/sm`, `title-md`, `body-lg/md/sm`, `label-lg/md/broadcast`) con familia `Plus Jakarta Sans` para títulos e `Inter` para texto.
- **Radios:** `sm`, `md`, `lg`, `xl`, `2xl`.
- **Sombras:** `shadow-card`, `shadow-elevated`, `shadow-player`, `shadow-aura` (resplandor ámbar).
- **Animación:** `animate-eq` (ecualizador) y utilidades de Tailwind (`animate-ping`, `animate-pulse`).
- **Modo oscuro:** variante por clase (`@custom-variant dark`). El `Layout` aplica `dark` por defecto salvo que el usuario haya elegido claro; el toggle del navbar guarda la preferencia en `localStorage` y sincroniza el `theme-color` del navegador.

---

## 5. Secciones de la landing

Orden real dentro de `Home.astro`:

1. **`AdBanner` (compacto)** — carrusel publicitario bajo el navbar, relación de aspecto 5:1/7:1.
2. **`Navbar`** — logo, nombre corto en móvil, navegación, toggle de tema y menú desplegable móvil (`<details>`).
3. **`Hero`** — titular, logo, versículo (Josué 1:9) y panel de video con `VideoEmbed` (solo ≥1024px).
4. **`Programs`** — programación real:
   - **ALLY Chishi** — lunes a viernes, 17:00–20:00 (3 h).
   - **Domingos Dominicales** — domingos, 05:00–08:00 (3 h).
   - Cada tarjeta muestra un badge **"Al aire ahora"** (con punto pulsante) cuando el horario está activo, o el próximo horario ("Hoy · 17:00", "Mañana · 05:00", "Dom · 05:00"). El cálculo se hace en el navegador y se actualiza cada 60 s. Incluye botón "Escuchar" que abre el modal.
   - Franja inferior: "El resto del día: música, alabanzas y predicación las 24 horas".
5. **`Social`** — tarjetas de Facebook, TikTok, YouTube y **Telegram** (`t.me/+593967198899`), cada una con el color de su marca, más botón "Escúchanos ahora".
6. **`About`** (`#nosotros`) — "Una radio con propósito", bloque "Desde 2011", tres pilares (Fe que transforma, Comunidad, Contenido de calidad) y **tarjeta del presentador**:
   - **Oswaldo Yacelga** — Animador / Locutor.
   - Servicios: eventos sociales, eclesiásticos y culturales, sonidos y transmisión en vivo.
   - Contactos: WhatsApp `0967 198 899`, email `waldo.yacelga70@gmail.com` y Facebook "Gerge waldo yacelga".
   - Foto: `public/locutor.jpeg`.
7. **`VisitorSources`** (`#comunidad`) — contador de visitas por origen; permanece oculto hasta que `/api/visitas` devuelve datos.
8. **`CtaBand`** — llamado a la acción ("¿Quieres ser parte de nuestra misión?") con botones a contacto y "Escuchar ahora".
9. **`AdBanner`** — segundo carrusel publicitario, antes del footer.
10. **`Footer`** — marca, columnas de enlaces (Radio, Institución, Legal), copyright.

**Elementos globales** (desde `Layout.astro`):
- **`WhatsAppButton`** — botón flotante abajo a la derecha (`bottom-6`, `end-4`) que abre `https://wa.me/593967198899` con mensaje pre-cargado. Visible en todas las páginas.
- **`MediaModal`** — `<dialog>` con pestañas En vivo / Música / Videos; carga el embed de YouTube de forma diferida y limpia el `src` al cerrar. Se abre con cualquier `[data-playlist-open]`.

**Componentes inactivos** (conservados, sin renderizar): `PlayerBar` (barra de reproducción inferior, retirada), `Videos` (sección de videos, no montada), `Holding` + `ComingSoon` (página "próximamente", desactivada), `ProgramCard` y `StatCard` (sustituidos por los diseños actuales).

---

## 6. Contenido configurable

Todo el contenido variable vive en `src/config/`:

- **`media.ts`** — fuentes de YouTube. `MEDIA.live` (directo), `MEDIA.music` (playlist de alabanzas) y `MEDIA.videos` (predicaciones). La función `getEmbedUrl()` convierte cualquier URL de YouTube (video, playlist, `youtu.be`, directo por canal o `/live/ID`) a su URL de embed.
- **`social.ts`** — arreglo `SOCIAL_LINKS` con `red`, `label`, `handle`, `url` y `color` de cada red.
- **`ads.ts`** — arreglo `AD_SPOTS` con los spots del carrusel (`imagen`, `href`, `alt`, `titulo`, `descripcion`). Si un spot no tiene imagen, se muestra una tarjeta de texto.

---

## 7. Backend: API y base de datos (Cloudflare)

### Function `/api/visitas`
`functions/api/visitas.ts` (Cloudflare Pages Function con binding `DB` → D1):

- **`GET /api/visitas`** — devuelve los totales agregados:
  ```json
  { "data": { "hoy": 0, "mes": 0, "total": 0,
              "porOrigen": { "facebook": { "hoy": 0, "mes": 0, "total": 0 } },
              "actualizado": "ISO-8601" },
    "error": null }
  ```
- **`POST /api/visitas`** — registra una visita con body `{ "origen": "facebook" }`. El origen se normaliza contra una lista blanca (`facebook`, `instagram`, `google`, `youtube`, `whatsapp`, `tiktok`, `twitter`, `linkedin`, `telegram`, `directo`, `otro`).
- **Privacidad:** no se guarda la IP. Se calcula una huella anónima `SHA-256(IP + User-Agent + sal diaria)` y se inserta con `INSERT OR IGNORE`; la clave primaria `(fecha, visitante)` evita contar dos veces al mismo visitante el mismo día.
- Respuestas siempre en JSON con `cache-control: no-store` y errores tipados (`INVALID_BODY`, `DB_ERROR`).

### Esquema D1 (`schema.sql`)
```sql
CREATE TABLE visitas (
  fecha TEXT NOT NULL,     -- 'YYYY-MM-DD' (UTC)
  origen TEXT NOT NULL,    -- red o canal de procedencia
  visitante TEXT NOT NULL  -- huella anónima
  , PRIMARY KEY (fecha, visitante)
);
CREATE INDEX idx_visitas_fecha  ON visitas (fecha);
CREATE INDEX idx_visitas_origen ON visitas (origen);
```

### Configuración (`wrangler.jsonc`)
- `pages_build_output_dir: "dist"` (Cloudflare Pages publica el build estático de Astro).
- `d1_databases`: binding **`DB`** → base de datos **`radio-visitas`** (falta reemplazar `database_id` por el ID real).

---

## 8. SEO y metadatos

- **`site` real** en `astro.config.mjs` → `https://radio-ministerial-mushuk-kawsay.com` (alimenta canonical, Open Graph, JSON-LD y sitemap).
- **`robots.txt`** con `Allow: /` y la URL del sitemap; la página "próximamente" (noindex) está desactivada.
- **Sitemap** generado en `dist/sitemap-index.xml` y `sitemap-0.xml`.
- **Por página** (`Layout.astro`): `<title>`, `description`, `keywords`, `robots`, `canonical`, `theme-color`, Open Graph completo (tipo, locale `es_EC`, imagen 1200×630) y Twitter Card `summary_large_image`.
- **Datos estructurados JSON-LD:**
  - `WebSite` + `Organization` (Layout), con `areaServed: Ecuador` y `inLanguage: es-EC`.
  - `RadioStation` (Home), con canal "En línea 24/7" y lenguajes `es` y `qu`.

---

## 9. Accesibilidad y responsividad

- HTML semántico (`header`, `nav`, `main`, `section` con `aria-labelledby`, `footer`, `dialog`), `alt` en imágenes, iconos decorativos con `aria-hidden`, foco visible (`focus-visible:ring`) y `aria-live` en los estados en vivo.
- Contraste orientado a WCAG AA y navegación por teclado en menú, modal, carrusel y toggle de tema.
- **Mobile-first**, revisado hasta **380px** de ancho; en móvil se ocultan etiquetas largas (botón de WhatsApp, versión corta del nombre), los grids colapsan a una columna y el modal tiene `max-h-[92dvh]` con scroll.
- Respeta `prefers-reduced-motion` en el carrusel publicitario (no rota automáticamente).

---

## 10. Rendimiento y privacidad

- **Sitio estático** servido desde el CDN de Cloudflare: sin servidor de render por request.
- **Cero frameworks de UI**: el JavaScript es mínimo y se limita a scripts inline (tema, carrusel, estado de programación, modal, embed diferido, contador).
- **Carga diferida**: imágenes con `loading="lazy"`, iframes solo al abrir el modal o pulsar play.
- **Privacidad del contador**: sin cookies, sin almacenar IP y huella con sal diaria; el script solo registra una visita por sesión (`sessionStorage`).

---

## 11. Infraestructura y despliegue (Cloudflare)

- **Dominio** `radio-ministerial-mushuk-kawsay.com` administrado en **Cloudflare**, con SSL/TLS automático.
- **Cloudflare Pages** publica el directorio `dist` generado por `astro build`; las Functions de `functions/` se despliegan junto al sitio y exponen `/api/visitas`.
- **Cloudflare D1** (base `radio-visitas`) enlazada al proyecto mediante el binding `DB` de `wrangler.jsonc`.

**Comandos habituales**
```bash
bun install                                   # dependencias
bun run dev                                   # servidor local (localhost:4321)
bun run build                                 # build de producción → dist/
bunx astro check                              # typecheck de los .astro
bunx wrangler d1 execute radio-visitas --file=schema.sql   # crear tabla en D1
bunx wrangler pages deploy dist               # publicar en Cloudflare Pages
```

---

## 12. Pendientes / tareas por completar

- **`src/config/media.ts`** — `MEDIA.live` sigue con la URL de ejemplo (`REPLACE_LIVE_VIDEO_ID`); reemplazar por el directo real de YouTube.
- **`src/config/social.ts`** — Facebook, TikTok y YouTube conservan URLs de plantilla (`REEMPLAZA_...`); solo Telegram está completo.
- **`src/config/ads.ts`** — los 3 spots son de ejemplo; cargar imágenes 1200×300 y enlaces reales.
- **`wrangler.jsonc`** — reemplazar `database_id` por el ID real de la base D1.
- **Páginas enlazadas sin archivo** — navbar, footer, `About` ("Conoce nuestra historia") y `CtaBand` apuntan a `/programas`, `/nosotros`, `/contacto`, `/privacidad` y `/terminos`, que hoy no existen (404). Crear las páginas o cambiar los enlaces a anclas (`#programas`, `#nosotros`, `#redes`).
- **Anclas muertas** — el navbar enlaza a `#videos` (el organismo `Videos.astro` no está renderizado) y el footer a `/#player` (la `PlayerBar` fue retirada), por lo que no desplazan a ninguna sección.
- **Facebook del presentador** — el botón enlaza a una búsqueda; sustituir por la URL exacta del perfil cuando se disponga de ella.
- **Redirecciones heredadas** — `/inicio` y `/remodelacion` mantienen redirectores a `/`; se pueden retirar cuando ya no aporten.
