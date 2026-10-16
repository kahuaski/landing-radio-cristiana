---
name: cloudflare
description: Use when the user asks to deploy or integrate Cloudflare — Cloudflare Pages, Workers, Wrangler, D1, R2, KV, Durable Objects, adapters for Astro, or "despliega en Cloudflare", "usa Workers/Pages", "guarda audio en R2", "base de datos D1" for this Astro + Bun project.
---

# Cloudflare — Pages, Workers, D1, R2 y KV para Astro/Bun

Integra Cloudflare según el caso de uso: hosting (Pages), cómputo en el edge (Workers), datos (D1), archivos/audio (R2) o caché/config (KV). Cloudflare y Firebase son alternativas: si el usuario no decide la plataforma, **preguntar** (ver también skill `firebase`); no montar ambas a la vez sin necesidad.

## Reglas del proyecto (obligatorias)

- Runtime/gestor: **Bun** (`bunx wrangler ...`, `bun add`, nunca npm/npx/yarn).
- Astro 7. Para SSR/híbrido usar `@astrojs/cloudflare` (adaptador recomendado). Para sitio puramente estático, Cloudflare Pages sirve `dist/` directamente.
- Bindings (D1/R2/KV) se declaran en `wrangler.jsonc`/`wrangler.toml` y se acceden vía `Astro.locals.runtime.env` (o `env` en Workers), **nunca** hardcodeados como credenciales de API.
- Identificadores en inglés, contenido/UI en español.

## Setup

```bash
# Adaptador para SSR/híbrido en el edge
bunx astro add cloudflare

# Wrangler para deploy y bindings
bun add -d wrangler
bunx wrangler login
```

`astro.config.mjs` (al usar el adaptador):

```js
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  output: "server", // o "hybrid" con prerender selectivo
  adapter: cloudflare({ platformProxy: { enabled: true } }),
  vite: { plugins: [tailwindcss()] },
});
```

> Si el proyecto es estático (como hoy), **no** hace falta adaptador: basta con `bun run build` y desplegar `dist/` en Pages.

## Cloudflare Pages

### Opción A — Deploy directo con Wrangler

```bash
bun run build
bunx wrangler pages deploy dist --project-name radio-cristiana
```

### Opción B — Git integration

Conectar el repo en el dashboard de Pages. Configuración de build:
- Build command: `bun run build`
- Output directory: `dist`
- Variable de entorno: `NODE_VERSION` no es necesaria; Pages soporta Bun si se define el build con Bun (`npx`/`bun` disponible). Documentar la versión.

`wrangler.jsonc` (o `wrangler.toml`):

```jsonc
{
  "name": "radio-cristiana",
  "compatibility_date": "2026-01-01",
  "pages_build_output_dir": "dist"
}
```

### Redirects y headers (Pages)

- `public/_redirects`: `https://sitio.com` → reglas tipo `/* /index.html 200` (SPA) o `301` para URLs movidas.
- `public/_headers`: cabeceras de seguridad/caché (`Cache-Control`, `X-Content-Type-Options`, CSP).

## Workers (lógica en el edge)

Para endpoints/proxy ligero sin servidor dedicado. Alternativa a `bun-backend` cuando se busca latencia mínima global.

```ts
// src/worker.ts
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/health") {
      return Response.json({ data: { status: "ok" }, error: null });
    }
    return Response.json({ data: null, error: { code: "NOT_FOUND", message: "Ruta no encontrada" } }, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
```

Probar en local con el runtime real de Workers: `bunx wrangler dev`.

## Bindings

### D1 (SQL en el edge)

```bash
bunx wrangler d1 create radio-db
bunx wrangler d1 execute radio-db --file=./schema.sql          # local
bunx wrangler d1 execute radio-db --remote --file=./schema.sql # remoto
```

```jsonc
{
  "d1_databases": [
    { "binding": "DB", "database_name": "radio-db", "database_id": "<id>" }
  ]
}
```

Uso en un Worker / ruta Astro SSR:
```ts
const { results } = await env.DB.prepare("SELECT id, titulo FROM programas WHERE activo = 1").all();
```
Siempre usar **consultas preparadas** (`prepare().bind()`), nunca concatenar SQL (evita inyección).

### R2 (almacenamiento de objetos — ideal para audio/HLS del stream)

```jsonc
{
  "r2_buckets": [
    { "binding": "AUDIO", "bucket_name": "radio-audio" }
  ]
}
```

```ts
// Servir un archivo de audio con soporte de rangos (streaming)
const obj = await env.AUDIO.get(key);
if (!obj) return new Response("No encontrado", { status: 404 });
return new Response(obj.body, {
  headers: { "Content-Type": obj.httpMetadata?.contentType ?? "audio/mpeg", "Cache-Control": "public, max-age=31536000" },
});
```

### KV (caché / configuración / metadatos)

```jsonc
{
  "kv_namespaces": [{ "binding": "CACHE", "id": "<id>", "preview_id": "<id>" }]
}
```

```ts
await env.CACHE.put("ahora-suena", JSON.stringify({ titulo, hora }), { expirationTtl: 60 });
const actual = await env.CACHE.get("ahora-suena", "json");
```

## Acceso a bindings desde Astro SSR

Con el adaptador Cloudflare, los bindings están en `Astro.locals.runtime.env`:

```astro
---
const { DB } = Astro.locals.runtime.env;
const { results } = await DB.prepare("SELECT titulo FROM programas LIMIT 5").all();
---
<ul>{results.map((p) => <li>{p.titulo}</li>)}</ul>
```

Tipar los bindings en `src/env.d.ts` con `interface Env` y `App.Locals`.

## Secretos y variables

```bash
bunx wrangler secret put FIRESTORE_TOKEN      # secreto cifrado (producción)
bunx wrangler pages secret put API_KEY --project-name radio-cristiana
```
Para desarrollo, `.dev.vars` (gitignored) con las mismas claves. Nunca commitear `.dev.vars` ni valores de `wrangler.toml`.

## Verificación

```bash
bunx astro check
bun run build
bunx wrangler dev            # probar Worker/bindings en local
bunx wrangler deploy         # cuando el usuario lo pida
bunx wrangler tail           # ver logs en producción
```

## Prohibiciones

- No usar npm/npx para `wrangler`/`astro`: siempre `bunx`/`bun`.
- No hardcodear IDs, tokens ni secrets en `wrangler.toml` o en el código.
- No concatenar SQL en D1: usar consultas preparadas con `bind()`.
- No habilitar el adaptador Cloudflare en un sitio estático sin SSR (complejidad innecesaria).
- No configurar Cloudflare y Firebase a la vez para la misma función sin que el usuario lo indique.
- No desplegar con `--remote` de D1 u operaciones destructivas sin confirmación explícita del usuario.
