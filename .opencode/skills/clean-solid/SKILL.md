---
name: clean-solid
description: Use when writing, refactoring, or reviewing application code (TypeScript, Astro components, Bun server code) and the user asks for "código limpio", "refactoriza", "aplica SOLID", "reduce acoplamiento", "mejora esta función/archivo/estructura", or when splitting large files, extracting logic, or removing duplication. Enforces SOLID, clean-code rules, and a safe refactor workflow.
---

# Clean Code & SOLID — TypeScript / Astro / Bun

Guía obligatoria para escribir y refactorizar código limpio en este proyecto. Aplica a cualquier archivo `.ts` / `.tsx` / `.astro` / `.vue` y a la capa `server/`. El objetivo es código legible, testeable y con bajo acoplamiento, sin sobre-ingeniería.

## Reglas del proyecto (obligatorias)

- Lenguaje: **TypeScript estricto** (`astro/tsconfigs/strict`). `any` prohibido; usar `unknown` + narrowing, genéricos o uniones.
- Runtime/gestor: **Bun** (`bun`, nunca npm/yarn/pnpm). Identificadores en inglés, mensajes/UI en español.
- **No introducir patrones por moda**: SOLID y patrones solo si resuelven un problema real. Ante duda, la solución más simple que compile y se entienda gana.
- **No refactorizar y cambiar comportamiento a la vez**: primero mover/extraer con tests verdes, luego el cambio funcional (regla del abuelo).
- Todo refactor termina validando: `bunx astro check` y, si hay tests, `bun test`.

## Principios SOLID (con ejemplo TS)

### S — Single Responsibility
Una función/módulo/componente debe tener **una única razón para cambiar**.

```ts
// ❌ Mezcla fetch + formato + render
async function renderPrograma(id: string) {
  const res = await fetch(`/api/programas/${id}`);
  const data = await res.json();
  return `<h2>${data.titulo.toUpperCase()} - ${data.hora}:00</h2>`;
}

// ✅ Responsabilidades separadas y testeables
export async function fetchPrograma(id: string): Promise<Programa> { /* fetch + validar */ }
export function formatTitulo(p: Programa): string { return p.titulo.toUpperCase(); }
export function renderPrograma(p: Programa): string { return `<h2>${formatTitulo(p)} - ${p.hora}:00</h2>`; }
```

### O — Open/Closed
Abierto a extensión, cerrado a modificación: **extiende con datos/estrategias, no con `if` encadenados**.

```ts
// ❌ Cada red social nueva obliga a tocar la función
function shareUrl(red: string, url: string) {
  if (red === "whatsapp") return `https://wa.me/?text=${url}`;
  if (red === "facebook") return `https://facebook.com/sharer?u=${url}`;
  // ...crece sin control
}

// ✅ Registro extensible sin modificar la lógica
export const SHARE_PROVIDERS = {
  whatsapp: (url: string) => `https://wa.me/?text=${encodeURIComponent(url)}`,
  facebook: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
} satisfies Record<string, (url: string) => string>;

export const buildShareUrl = (red: keyof typeof SHARE_PROVIDERS, url: string) => SHARE_PROVIDERS[red](url);
```

### L — Liskov Substitution
Los subtipos deben poder reemplazar al tipo base sin romper invariantes. En TS: no "estrechar" contratos.

```ts
type Repositorio<T> = { getById(id: string): Promise<T | null>; save(item: T): Promise<void> };
// Cualquier implementación (Firestore, D1, memoria) debe respetar el MISMO contrato,
// sin lanzar en getById cuando no existe (devuelve null).
```

### I — Interface Segregation
Muchas interfaces pequeñas y específicas > una interfaz enorme.

```ts
// ❌ Fuerza a implementar métodos que no se usan
interface Almacen { leer(): string; escribir(s: string): void; borrar(): void; listar(): string[]; }

// ✅ Contratos mínimos por capacidad
interface Lector { leer(): string; }
interface Escritor { escribir(s: string): void; }
```

### D — Dependency Inversion
Depende de **abstracciones**, no de implementaciones concretas. Inyecta dependencias (fetch, DB, reloj) para poder testear.

```ts
// ❌ Acoplado a globalThis.fetch y a la hora del sistema
export async function programaActivo() { const r = await fetch("/api/programas"); /* ... */ }

// ✅ Dependencias inyectadas → testeable sin red
export async function programaActivo(
  deps: { fetch: typeof fetch; now(): Date } = { fetch, now: () => new Date() },
): Promise<Programa | null> { /* usa deps.fetch y deps.now() */ }
```

## Reglas de código limpio

1. **Funciones pequeñas y con un solo nivel de abstracción**. Si necesitas scroll para verla, divídela. Ideal ≤ 20 líneas.
2. **Nombres que revelan intención**: `estaAlAire(programa)` no `check(p)`; `programasActivos` no `arr2`. Booleanos: `is/has/can/should`.
3. **Sin números/nombres mágicos**: extraer constantes con nombre (`const MAX_DURACION_MIN = 180`).
4. **Retornos tempranos (guard clauses)** en vez de `if` anidados profundos.
5. **Inmutabilidad por defecto**: `const` en vez de `let`, `readonly`/`ReadonlyArray` en props, retornar copias (`[...arr]`, `{...obj}`) en vez de mutar.
6. **Pureza**: la lógica de negocio en funciones puras (mismo input → mismo output, sin efectos). Los efectos (fetch, DOM, storage) aislados en los bordes.
7. **Sin comentarios que expliquen el "qué"**: el código se explica solo; comentar el "por qué" (decisiones, reglas de negocio, workarounds). Nunca dejar código comentado muerto.
8. **Manejo de errores explícito**: no silenciar con `catch {}`; retornar/propagar con contexto. Ver contrato `{ data, error }` de `bun-backend`.
9. **Duplicación (DRY) con moderación**: extraer en la 3ª repetición, no en la 1ª. Repetición accidental ≠ duplicación real (regla de tres).
10. **Composición sobre herencia**. Evitar jerarquías de clases profundas; preferir funciones, objetos y uniones discriminadas.

## Code smells → acción

| Smell | Señal | Refactor |
|---|---|---|
| Función larga | > 30 líneas, muchos niveles | Extraer funciones con nombre |
| Archivo dios | > 300 líneas, múltiples temas | Dividir por responsabilidad (`server/<x>/`) |
| Feature envy | Una función usa más datos de otro módulo | Mover la lógica a donde viven los datos |
| Booleanos como parámetros | `render(true, false)` | Opciones nombradas o funciones separadas |
| `if`/`switch` largos | Ramas por tipo | Mapa de estrategias / uniones discriminadas |
| Números mágicos | `if (h === 6)` | Constantes con nombre |
| Anidamiento profundo | `if` dentro de `if` dentro de `if` | Guard clauses + extracción |
| Tipos `any` | Fuga de tipos | `unknown` + narrowing / genéricos |
| Módulo acoplado a fetch/DB | Difícil de testear | Inyección de dependencias |

## Flujo de refactor seguro

1. **Leer antes de tocar**: entender el módulo y quién lo consume (usar búsqueda global de importaciones).
2. **Asegurar red de seguridad**: si hay lógica crítica y no hay tests, extraer a función pura y crear `.test.ts` con `bun:test` (ver skill `bun-testing`) antes de mover.
3. **Pasos pequeños y verificables**: un refactor a la vez; compilar/ejecutar entre pasos.
4. **No cambiar API pública sin razón**: si renombras algo exportado, actualizar todos los consumidores en el mismo cambio.
5. **Validar**: `bunx astro check` (o `bunx tsc --noEmit`) + `bun test` + `bun run build`.
6. Reportar brevemente: qué se extrajo, por qué, y resultado de la validación.

## Cuándo NO aplicar

- No crear interfaces/abstracciones para una sola implementación sin necesidad real (YAGNI).
- No partir una función de 15 líneas clara "por SOLID".
- No agregar dependencias para resolver algo que 10 líneas de TS resuelven.

## Prohibiciones

- `any` implícito o explícito; `as` para silenciar tipos en vez de validar (usar Zod, ver `bun-backend`).
- Mutar parámetros/estado compartido sin control.
- Refactors masivos "big bang" sin tests ni verificación intermedia.
- Dejar `console.log` de depuración en código entregado (usar `console.error` solo para fallos reales).
