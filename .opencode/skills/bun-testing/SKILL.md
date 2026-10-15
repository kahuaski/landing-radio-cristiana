---
name: bun-testing
description: Use when the user shares a code fragment and asks for tests ("escribe tests", "genera pruebas", "cubre esta lógica", "unitarias"). Generates unit tests exclusively with the native bun:test module, always covering the happy path and at least two error cases.
---

# Bun Testing — Pruebas unitarias con `bun:test`

Genera pruebas unitarias **exclusivamente** con el módulo nativo de Bun: `bun:test`. No usar Jest, Vitest, Mocha ni Chai: Bun ya trae su propio runner, más rápido y sin config extra.

## Reglas de generación (obligatorias)

1. **Cobertura mínima por unidad probada**:
   - **1 caso happy path** (camino feliz / comportamiento esperado).
   - **Mínimo 2 casos de error** (entradas inválidas, edge cases, fallos de dependencias).
   - Agregar casos extra solo si aportan valor real (límites, concurrencia, idempotencia).
2. **Ubicación del archivo de test**: junto al código fuente con sufijo `.test.ts`:
   - `src/lib/fecha.ts` → `src/lib/fecha.test.ts`
   - `server/services/programas.ts` → `server/services/programas.test.ts`
   - Componentes Astro `.astro` **no** se unit-testean con `bun:test`; para ellos usar integración/e2e (Playwright) y solo cubrir la lógica extraída a `.ts` helpers.
3. **Ejecución**: siempre con Bun, nunca con node:
   ```bash
   bun test
   # o solo el archivo:
   bun test src/lib/fecha.test.ts
   ```
4. Agregar al `package.json` el script si no existe:
   ```json
   "scripts": { "test": "bun test" }
   ```

## Formato de pruebas (estilo del proyecto)

- Importar solo desde `bun:test`: `describe`, `it` (o `test`), `expect`, `beforeAll`, `afterAll`, `mock`, `spyOn`, `jest` (compat layer de Bun) si se necesita.
- Estructura BDD: `describe("nombre del módulo o función")` → `it("qué hace en este escenario")` → español.
- Una aserción principal por `it`; no mezclar escenarios distintos en un solo `it`.
- Nombres de escenarios en español, descriptivos: `it("devuelve un error 400 cuando el título está vacío")`.
- No usar snapshots salvo petición explícita.
- Tiempo: preferir lógica pura testeable sin timers reales; si hay `setTimeout`/promesas, usar `expect(...).resolves`/`rejects` y evitar sleeps arbitrarios.

## API de referencia de `bun:test`

```ts
import { describe, it, expect, beforeEach, afterEach, mock, spyOn } from "bun:test";
```

| API | Uso |
|---|---|
| `expect(x).toBe(y)` | Igualdad estricta (primitivos) |
| `expect(x).toEqual(y)` | Igualdad profunda (objetos/arrays) |
| `expect(x).toBeNull()` / `toBeUndefined()` / `toBeTruthy()` | Nulos y truthiness |
| `expect(x).toBeGreaterThan(n)` / `toBeLessThan(n)` | Números |
| `expect(x).toContain(y)` | Strings/arrays |
| `expect(x).toMatchObject({...})` | Subconjunto de objeto |
| `expect(fn).toThrow(ErrorClass \| "mensaje")` | Excepciones síncronas |
| `await expect(promise).rejects.toThrow()` | Promesas rechazadas |
| `await expect(promise).resolves.toBe(y)` | Promesas resueltas |
| `expect(spy).toHaveBeenCalledTimes(n)` | Mocks/spies |
| `expect(spy).toHaveBeenCalledWith(args)` | Argumentos de llamada |
| `mock.module("mod", () => ({ ... }))` | Mock de módulos (usar con cuidado) |
| `mock.restore()` en `afterEach` | Limpiar mocks |

### Mock de fetch / APIs de Bun

Para dependencias externas (fetch, DB, `Bun.serve`), inyectarlas como parámetros cuando sea posible; si no, usar `mock.module` o `spyOn(globalThis, "fetch")` y restaurar en `afterEach`.

```ts
import { spyOn, afterEach, expect, it } from "bun:test";

afterEach(() => {
  spyOn(globalThis, "fetch").mockRestore?.();
});
```

## Plantilla base

```ts
import { describe, it, expect } from "bun:test";
import { calcularDuracion } from "./duracion";

describe("calcularDuracion", () => {
  it("devuelve la diferencia en minutos entre dos fechas válidas", () => {
    const inicio = new Date("2026-01-01T10:00:00Z");
    const fin = new Date("2026-01-01T10:30:00Z");
    expect(calcularDuracion(inicio, fin)).toBe(30);
  });

  it("lanza un error cuando la fecha de fin es anterior a la de inicio", () => {
    const inicio = new Date("2026-01-01T10:30:00Z");
    const fin = new Date("2026-01-01T10:00:00Z");
    expect(() => calcularDuracion(inicio, fin)).toThrow("La fecha de fin debe ser posterior a la de inicio");
  });

  it("lanza un error cuando alguna fecha es inválida", () => {
    expect(() => calcularDuracion(new Date("no-fecha"), new Date())).toThrow(TypeError);
  });
});
```

## Flujo de trabajo

1. Leer el fragmento de código a probar e identificar: entradas, salidas, efectos secundarios, dependencias externas.
2. Si la lógica no es testeable (acoplada a `fetch`, DB o DOM), **proponer extraerla a una función pura** en `src/lib/` o `server/lib/` antes de testear; no envolver código no testeable con mocks masivos.
3. Generar el archivo `.test.ts` con: 1 happy path + ≥2 errores (+ edge cases si aplican).
4. Ejecutar `bun test <archivo>` y reportar el resultado. Si falla, corregir el test o el código según corresponda (no maquillar el test para que pase si el bug está en la fuente).
5. Confirmar que `bun test` completo del proyecto sigue en verde (no romper tests existentes).

## Prohibiciones

- No usar imports de `@jest/globals`, `vitest`, `chai`, `mocha`.
- No crear `jest.config.*`, `vitest.config.*`, ni dependencias de testing externas.
- No generar tests sin al menos un caso de error.
- No usar `it.only` / `describe.only` en código entregado (excepto debugging temporal, avisando al usuario).
