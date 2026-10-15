---
name: bun-backend
description: Use when the user provides a data model or asks for a backend endpoint, REST API, server route, middleware, or microservice ("crea un endpoint", "agrega una API", "monta el backend"). Generates typed TypeScript endpoints for Bun (Bun.serve, Hono, or Elysia) with standard error handling and validation.
---

# Bun Backend — Endpoints y microservicios

Genera rutas, controladores y middleware en **TypeScript estricto** para el runtime **Bun** de este proyecto, con manejo de errores estándar y validación de tipos. Aplica cuando el usuario pase un modelo de datos o pida lógica de servidor.

## Contexto del proyecto

- Runtime: **Bun** (ya usado como gestor de paquetes en `landing-radio-cristiana`; hay `bun.lock`).
- El proyecto actual es un landing de Astro (estático/SSR). El backend se coloca en una capa separada:
  - API routes nativas de Astro solo cuando el endpoint sirva a esta misma app (carpeta `src/pages/api/**/*.ts`).
  - Servidor Bun independiente (`Bun.serve` o Hono) en `server/` o `api/` cuando sea un microservicio desplegable por separado. **Preguntar al usuario** si no queda claro cuál necesita.
- Gestor de paquetes: siempre `bun add` / `bun remove` (nunca npm/yarn/pnpm).

## Stack permitido (en orden de preferencia)

1. **Bun nativo** (`Bun.serve`) para endpoints simples sin dependencias.
2. **Hono** (`bun add hono`) para APIs con routing, middleware y múltiples rutas — recomendado por defecto si hay más de ~3 endpoints.
3. **Elysia** (`bun add elysia`) solo si el usuario lo pide explícitamente (tipado end-to-end y validación con TypeBox/Eden).

No introducir Express, Fastify, Koa ni nada del ecosistema Node clásico.

## Reglas de código (obligatorias)

1. **TypeScript estricto**: respetar `tsconfig.json` del proyecto (`astro/tsconfigs/strict`). Tipar request/response; `any` prohibido. Usar `satisfies` cuando enriquezca inferencia.
2. **Validación**: validar TODO input externo (params, query, body) antes de usarlo. Preferir esquemas de `zod` (`bun add zod`) o la validación nativa del framework elegido. Nunca confiar en `as` para castear datos crudos.
3. **Manejo de errores estándar**: envolver handlers en try/catch y responder siempre con el mismo contrato:
   ```ts
   // Éxito
   { "data": T, "error": null }
   // Error
   { "data": null, "error": { "code": string, "message": string } }
   ```
   Códigos HTTP correctos: `200/201`, `400` validación, `401` auth, `403` permiso, `404` no existe, `409` conflicto, `500` error interno (nunca filtrar stack traces al cliente; loguearlos con `console.error`).
4. **Métodos y rutas REST**: sustantivos en plural, sin verbo HTTP en la URL (`/api/programas`, no `/api/getProgramas`). Ejemplo:
   - `GET /api/programas` → lista
   - `GET /api/programas/:id` → detalle
   - `POST /api/programas` → crea (`201` + `Location`)
   - `PUT/PATCH /api/programas/:id` → actualiza
   - `DELETE /api/programas/:id` → elimina (`204` sin body)
5. **CORS y headers**: si el servidor es independiente del frontend, configurar CORS con origen explícito (no `*` en producción) y `Content-Type: application/json`.
6. **Variables de entorno**: usar `process.env` o `Bun.env`; nunca hardcodear secrets. Ejemplo de puerto: `const PORT = Number(Bun.env.PORT ?? 3000)`.
7. **Idioma**: nombres de identificadores en inglés; mensajes de error al cliente en español (proyecto en español).

## Plantillas

### Servidor nativo Bun

```ts
// server/index.ts
const PORT = Number(Bun.env.PORT ?? 3000);

type ApiError = { code: string; message: string };
type Ok<T> = { data: T; error: null };
type Err = { data: null; error: ApiError };
type Res<T> = Ok<T> | Err;

const json = <T>(body: Res<T>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    try {
      if (req.method === "GET" && url.pathname === "/api/health") {
        return json({ data: { status: "ok" }, error: null });
      }
      return json<never>({ data: null, error: { code: "NOT_FOUND", message: "Ruta no encontrada" } }, 404);
    } catch (err) {
      console.error(err);
      return json<never>({ data: null, error: { code: "INTERNAL", message: "Error interno del servidor" } }, 500);
    }
  },
});

console.log(`API escuchando en http://localhost:${PORT}`);
```

Ejecutar: `bun run server/index.ts` (agregar script `"dev:api": "bun run --watch server/index.ts"` al `package.json` si el usuario lo desea).

### Servidor con Hono (recomendado para múltiples rutas)

```bash
bun add hono zod
```

```ts
// server/index.ts
import { Hono } from "hono";
import { z } from "zod";
import { cors } from "hono/cors";

const app = new Hono().basePath("/api");
app.use("*", cors({ origin: Bun.env.FRONTEND_URL ?? "http://localhost:4321" }));

const ProgramaSchema = z.object({
  titulo: z.string().min(1, "El título es obligatorio"),
  horario: z.string().min(1),
});

type Env = { Variables: {} };

app.onError((err, c) => {
  console.error(err);
  return c.json({ data: null, error: { code: "INTERNAL", message: "Error interno del servidor" } }, 500);
});

app.notFound((c) =>
  c.json({ data: null, error: { code: "NOT_FOUND", message: "Ruta no encontrada" } }, 404),
);

app.get("/health", (c) => c.json({ data: { status: "ok" }, error: null }));

app.post("/programas", async (c) => {
  const parsed = ProgramaSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json(
      { data: null, error: { code: "VALIDATION", message: parsed.error.issues[0]?.message ?? "Datos inválidos" } },
      400,
    );
  }
  // persistir...
  return c.json({ data: parsed.data, error: null }, 201);
});

export default {
  port: Number(Bun.env.PORT ?? 3000),
  fetch: app.fetch,
};
```

Ejecutar en desarrollo con recarga: `bun run --watch server/index.ts` o usar el plugin de Hono para Bun (`bun add -d @hono/node-server` NO aplica; Hono se sirve nativo con el objeto exportado).

### API routes de Astro (si el endpoint es para esta misma app)

Cuando la API consumirá el propio frontend Astro (mismo dominio, sin CORS):

```ts
// src/pages/api/programas.ts
import type { APIRoute } from "astro";
import { z } from "zod";

const ProgramaSchema = z.object({ titulo: z.string().min(1) });

export const POST: APIRoute = async ({ request }) => {
  const parsed = ProgramaSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { data: null, error: { code: "VALIDATION", message: "Datos inválidos" } },
      { status: 400 },
    );
  }
  return Response.json({ data: parsed.data, error: null }, { status: 201 });
};
```

Nota: con Astro estático (`output` por defecto) estas rutas requieren modo SSR (`output: 'server'` en `astro.config.mjs`) o el adaptador correspondiente; avisar al usuario antes de asumir despliegue SSR.

## Flujo de trabajo al recibir un modelo de datos

1. Extraer entidades, campos, tipos y relaciones del modelo.
2. Definir esquema Zod por entidad (fuente de verdad de validación).
3. Generar endpoints REST completos (CRUD mínimo) con el contrato `{ data, error }`.
4. Separar en capas si crece: `server/routes/` (rutas) + `server/services/` (lógica) + `server/lib/db.ts` (acceso a datos). Mantener simple (un solo archivo) si son 1–2 endpoints.
5. Validar compilación: `bunx tsc --noEmit` (o `bun run build` si hay script definido).
6. Si el usuario pide persistencia, usar Bun SQLite (`bun add bun:sqlite` es nativo, sin add) o preguntar por la BD preferida antes de instalar drivers.

## Prohibiciones

- No usar `require()`: solo ESM (`import`/`export`).
- No instalar `@types/node` para resolver tipos de Bun: usar los tipos nativos de Bun (`Bun.serve`, `Bun.env`, `Bun.write`, etc.) o `bun-types`.
- No exponer stack traces, queries SQL crudos ni secrets en respuestas HTTP.
- No generar endpoints sin validar input.
