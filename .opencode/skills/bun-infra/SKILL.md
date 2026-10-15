---
name: bun-infra
description: Use when the user asks for Docker, docker-compose, Dockerfiles, CI/CD pipelines, deployment, or container infrastructure for a Bun project ("crea un Dockerfile", "docker-compose para...", "pipeline de CI", "configura el despliegue"). Generates container configs exclusive to the Bun ecosystem using the official oven/bun image.
---

# Bun Infra — Docker y CI/CD para el ecosistema Bun

Genera configuraciones de Docker, docker-compose y scripts de CI/CD optimizados **exclusivamente** para proyectos con **Bun** (imagen oficial `oven/bun`), asegurando instalación con `bun install`, puertos correctos y evitando errores comunes de puertos ocupados en el contenedor.

## Reglas del proyecto (obligatorias)

- Gestor de paquetes: **Bun** (existe `bun.lock` en la raíz). **Nunca** usar `npm install`, `yarn`, `pnpm` ni `package-lock.json` en los contenedores.
- Siempre usar la imagen oficial: `oven/bun` (o `oven/bun-slim` para producción, `oven/bun-alpine` si se necesita minimalismo extremo). **No** usar imágenes `node:*` ni `node:*-alpine` como base de proyectos Bun.
- Dockerfile siempre en la raíz del proyecto (o indicar claramente la ruta si hay monorepo).
- Multi-stage build por defecto para imágenes de producción ligeras.
- Archivos `.dockerignore` siempre generados junto al Dockerfile.

## Plantilla: Dockerfile multi-stage (recomendada)

Para un proyecto Astro+Bun (build estático) o API Bun:

```dockerfile
# ---------- etapa de dependencias ----------
FROM oven/bun:1-alpine AS deps
WORKDIR /app
ENV CI=true
# Copiar solo los manifests para aprovechar caché de capas
COPY package.json bun.lock ./
# --frozen-lockfile: falla si el lock está desactualizado (reproducibilidad)
RUN bun install --frozen-lockfile

# ---------- etapa de build ----------
FROM oven/bun:1-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build del proyecto (Astro u otros). Ajustar script si el proyecto difiere.
RUN bun run build

# ---------- etapa de producción ----------
FROM oven/bun:1-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Usuario no-root por seguridad (la imagen trae el usuario "bun")
USER bun
COPY --from=deps --chown=bun:bun /app/node_modules ./node_modules
COPY --from=build --chown=bun:bun /app/dist ./dist
# Puerto: exponer el MISMO puerto que la app escucha dentro del contenedor.
# La variable PORT debe coincidir con EXPOSE y con el mapeo de docker-compose.
ENV PORT=4321
EXPOSE 4321
# Comando de arranque: servidor estático o API de Bun según el proyecto
CMD ["bun", "run", "dist/server/entry.mjs"]
```

Ajustar `CMD`/`EXPOSE`/`ENV PORT` según el tipo de proyecto:
- **Landing Astro estático**: servir `dist/` con `bunx serve` o el adaptador elegido; o usar nginx si el usuario lo prefiere (preguntar).
- **API con `Bun.serve`**: `CMD ["bun", "run", "server/index.ts"]`, puerto por defecto `3000`.
- **Astro SSR con adaptador node**: verificar que el adaptador sea compatible con Bun o usar modo standalone.

## Errores comunes de puertos (y cómo evitarlos)

1. **Puerto escuchado en `0.0.0.0`, no en `127.0.0.1`**: dentro del contenedor la app debe bindear a `0.0.0.0` o al hostname vacío, si no el mapeo del host no llega. En `Bun.serve` usar `hostname: "0.0.0.0"` si se usa red bridge (por defecto en Bun suele funcionar, pero ser explícito en prod ayuda).
2. **Desajuste entre `EXPOSE`, `ENV PORT` y el código**: un solo número de puerto como fuente de verdad (variable `PORT`), usado tanto en `EXPOSE` como en el servidor.
3. **Puerto ocupado en el host**: en `docker-compose` usar mapeo `"<PUERTO_HOST>:<PUERTO_APP>"` con puerto de host configurable por env: `"${HOST_PORT:-4321}:4321"`, permitiendo levantar múltiples instancias cambiando solo `HOST_PORT`.
4. **Contenedor que se cae al instante**: usar healthcheck en compose y logs con `docker compose logs -f`.
5. **`bun install` sin lock**: siempre `--frozen-lockfile` en CI y Docker para builds reproducibles.
6. **Copiar `node_modules` del host al contenedor**: evitar `COPY . .` sin `.dockerignore` (incluye `node_modules`, `.git`, `dist` previos).

## Plantilla: .dockerignore

```
node_modules
dist
.astro
.git
.gitignore
*.md
.vscode
.opencode
.env
.env.*
Dockerfile
docker-compose*.yml
```

## Plantilla: docker-compose.yml (API Bun)

```yaml
services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
      target: runtime
    image: landing-radio-cristiana-api:latest
    container_name: radio-cristiana-api
    ports:
      - "${HOST_PORT:-3000}:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - FRONTEND_URL=${FRONTEND_URL:-http://localhost:4321}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "bun", "-e", "fetch('http://localhost:3000/api/health').then(r => { if (!r.ok) process.exit(1) })"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
```

## Plantilla: docker-compose.yml (landing Astro estático + nginx opcional)

Si el usuario quiere servir el build estático sin runtime de Bun en prod:

```yaml
services:
  web:
    build:
      context: .
      dockerfile: Dockerfile
      target: runtime
    ports:
      - "${HOST_PORT:-4321}:4321"
    restart: unless-stopped
```

Preguntar antes de introducir nginx o Caddy: no asumir reverse proxy sin confirmación.

## Plantilla: CI/CD con GitHub Actions (Bun)

Crear `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Instalar Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Instalar dependencias
        run: bun install --frozen-lockfile

      - name: Typecheck
        run: bunx astro check || bunx tsc --noEmit

      - name: Tests
        run: bun test

      - name: Build
        run: bun run build

  docker:
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: |
            ghcr.io/${{ github.repository }}:latest
            ghcr.io/${{ github.repository }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

Ajustar el registry (GHCR, Docker Hub, etc.) según lo que use el usuario; preguntar si no lo especifica.

## Flujo de trabajo

1. Detectar tipo de proyecto: API Bun, landing Astro estático, o Astro SSR.
2. Generar `Dockerfile` multi-stage con `oven/bun:*-alpine` y `bun install --frozen-lockfile`.
3. Generar `.dockerignore` completo.
4. Si el usuario pide orquestación: generar `docker-compose.yml` con puerto configurable `${HOST_PORT}` y healthcheck.
5. Si el usuario pide CI/CD: generar workflow GitHub Actions con pasos `setup-bun`, install frozen, test, build y (opcional) push de imagen.
6. Verificar localmente cuando sea posible:
   ```bash
   docker build -t radio-cristiana .
   docker run --rm -p 4321:4321 radio-cristiana
   ```
   (avisar si Docker no está disponible en la máquina).
7. Documentar en la respuesta: puertos usados, variables de entorno requeridas y cómo levantar con `docker compose up --build`.

## Prohibiciones

- No usar imágenes base `node:*` para proyectos Bun.
- No usar `npm install` / `yarn` / `pnpm` dentro de Dockerfile o CI de este proyecto.
- No exponer puertos innecesarios ni usar `EXPOSE` sin coincidir con el `PORT` real de la app.
- No hacer `COPY . .` sin `.dockerignore` que excluya `node_modules`, `.git` y `dist`.
- No poner secrets hardcodeados en compose o Dockerfile: usar `.env` (gitignored) o el secret store del CI.
