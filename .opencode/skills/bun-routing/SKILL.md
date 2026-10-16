---
name: bun-routing
description: Use when the user asks about routes, routing, navigation, dynamic pages, slugs, params, redirects, 404, middleware, API routes, or "enrutamiento", "crea una página /ruta", "ruta dinámica", "monta el router" in this Astro + Bun project. Covers Astro file-based routing, dynamic/rest params, middleware, redirects, and routing for standalone Bun servers (Bun.serve routes and Hono).
---

# Bun Routing — Rutas en Astro y servidores Bun

Define rutas y navegación para este proyecto. Hay **dos superficies de enrutamiento** y debes elegir la correcta antes de escribir código:

1. **Astro** (`src/pages/`) → para páginas y API routes del propio sitio (file-based routing, sin configuración).
2. **Servidor Bun independiente** (`Bun.serve` o Hono) → solo para microservicios separados del frontend (ver también skill `bun-backend`).

> Regla: si la ruta sirve al mismo dominio Astro, va en `src/pages/`. No montar un servidor Bun aparte para servir páginas del landing.

## Parte 1 — Routing en Astro (`src/pages/`)

El enrutamiento es **por archivos**: cada archivo en `src/pages/` es una URL. No hay router que configurar.

| Archivo | URL |
|---|---|
| `src/pages/index.astro` | `/` |
| `src/pages/programacion.astro` | `/programacion` |
| `src/pages/contacto.astro` | `/contacto` |
| `src/pages/programas/[slug].astro` | `/programas/:slug` |
| `src/pages/blog/[...path].astro` | `/blog/*` (rest/spread) |
| `src/pages/api/programas.ts` | `/api/programas` (endpoint) |

Reglas:
- Carpetas = segmentos de URL. `index.astro` dentro de una carpeta mapea al directorio raíz.
- Nombres de carpeta/archivo en **kebab-case** y en español si la URL es visible al usuario (`programacion.astro`, `quienes-somos.astro`).
- No usar mayúsculas ni espacios en nombres de archivo de rutas.

### Rutas dinámicas y `getStaticPaths`

Con `output` estático (por defecto) las rutas dinámicas requieren `getStaticPaths()` que devuelva las variantes a pre-renderizar:

```astro
---
// src/pages/programas/[slug].astro
import Layout from "../../layouts/Layout.astro";
import { programas } from "../../config/playlist";

export function getStaticPaths() {
  return programas.map((p) => ({ params: { slug: p.slug }, props: { programa: p } }));
}

const { programa } = Astro.props;
---

<Layout title={programa.titulo}>
  <h1>{programa.titulo}</h1>
</Layout>
```

Parámetros disponibles en el componente:
- `Astro.params.slug` — el segmento dinámico.
- `Astro.props` — los `props` devueltos por `getStaticPaths`.
- `Astro.url` / `Astro.request.url` — URL completa.

Rest params (`[...path].astro`): captura el resto, incluido vacío; spread (`[[...path]].astro`) lo hace opcional.

### Páginas dinámicas en SSR

Si el proyecto pasa a `output: 'server'` (con adaptador, ver skills `firebase`/`cloudflare`), las rutas dinámicas se resuelven en cada request: lee `Astro.params` directamente y elimina `getStaticPaths` (o úsalo para pre-render selectivo con `export const prerender = true`).

### Redirecciones y 404

- `src/pages/404.astro` → página para rutas no encontradas.
- `astro.config.mjs` → `redirects: { "/conocenos": "/quienes-somos" }` para redirecciones declarativas.
- Redirect en runtime dentro de una página: `return Astro.redirect("/destino", 301);`.

### Middleware (Astro)

`src/middleware.ts` intercepta cada request (útil para auth, headers, i18n, locales):

```ts
// src/middleware.ts
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware((context, next) => {
  const isProtected = context.url.pathname.startsWith("/admin");
  if (isProtected && !context.locals.usuario) {
    return context.redirect("/login");
  }
  return next();
});
```

- Tipar `context.locals` en `src/env.d.ts` (interfaz `App.Locals`) y extender `Astro.Locals.ts` en `src/env.d.ts` si se usa framework.
- El middleware solo funciona con SSR o modo híbrido; avisar al usuario si el proyecto es estático puro.

## Parte 2 — Routing en servidor Bun (`Bun.serve` / Hono)

Para microservicios separados. Dos opciones (ver skill `bun-backend` para el detalle de endpoints/validación):

### Bun.serve con `routes` (nativo, reciente)

```ts
Bun.serve({
  port: Number(Bun.env.PORT ?? 3000),
  routes: {
    "/api/health": () => Response.json({ data: { status: "ok" }, error: null }),
    "/api/programas/:id": (req) => {
      const { id } = req.params;
      return Response.json({ data: { id }, error: null });
    },
    "/api/*": () => new Response("Not found", { status: 404 }),
  },
});
```

### Hono (recomendado para >3 rutas, parámetros y middleware)

```ts
import { Hono } from "hono";

const app = new Hono().basePath("/api");

app.get("/programas", (c) => c.json({ data: [], error: null }));
app.get("/programas/:id", (c) => c.json({ data: { id: c.req.param("id") }, error: null }));

// Grupo anidado
const auth = new Hono();
auth.post("/login", (c) => c.json({ data: null, error: null }));
app.route("/auth", auth);

// Middleware por ruta
app.use("/privado/*", async (c, next) => {
  if (!c.req.header("Authorization")) return c.json({ data: null, error: { code: "401", message: "No autorizado" } }, 401);
  await next();
});

export default { port: Number(Bun.env.PORT ?? 3000), fetch: app.fetch };
```

Buena práctica Hono: **un archivo de rutas por recurso** (`server/routes/programas.ts`) exportando un `Hono` y montándolo con `app.route("/programas", programasRoutes)`.

## Convenciones REST (obligatorias)

- Sustantivos en plural, sin verbos en la URL: `/api/programas`, no `/api/getProgramas`.
- Parámetros en la ruta para recursos (`/programas/:id`), query string para filtros (`?destacado=true&page=2`).
- Métodos: `GET` leer, `POST` crear, `PATCH/PUT` actualizar, `DELETE` borrar.
- Respuestas con el contrato `{ data, error }` y códigos HTTP correctos (ver `bun-backend`).
- Prefijo `/api` en todos los endpoints para separar de las páginas.

## Verificación

```bash
bunx astro check          # valida tipos de páginas/middleware
bun run build             # confirma que las rutas se generan
bun run src/server/index.ts  # probar un servidor Bun aparte (si aplica)
```

## Prohibiciones

- No agregar un router externo (react-router, vue-router manual) para navegación del sitio Astro: Astro ya enruta por archivos.
- No usar verbos ni nombres en inglés visible al usuario en las URLs en español del landing.
- No crear rutas dinámicas sin `getStaticPaths` en modo estático (falla el build).
- No montar un servidor Bun independiente para servir las páginas del propio landing.
