---
name: atomic-ui
description: Use when the user asks for a UI component, interface, section, or page ("crea un componente", "diseña una sección", "agrega un navbar/card/footer", "hazlo en Vue/React") in this Astro project. Generates responsive, dark-mode, accessible components styled exclusively with Tailwind CSS, organized with Atomic Design, using Astro by default and React (.tsx) or Vue (.vue) only when real interactivity is needed.
---

# Atomic UI — Componentes Tailwind + Astro

Genera componentes frontend limpios, responsivos (mobile-first), con modo oscuro (`dark:`) y accesibilidad, usando **exclusivamente clases utilitarias de Tailwind CSS** (sin archivos CSS externos). Aplica **Atomic Design** para mantener la arquitectura de componentes del proyecto.

## Reglas del proyecto (obligatorias)

- Runtime y gestor de paquetes: **Bun** (`bun add`, `bunx`, nunca `npm`/`npx`/`yarn`).
- Framework: **Astro 7** (`src/` es la raíz de la fuente).
- **Componentes Astro (`.astro`) por defecto**. Solo usar React (`.tsx`) o Vue (`.vue`) con una directiva `client:*` cuando haya interactividad real (estado, hooks, formularios controlados, reproductor con estado, etc.). Si no la hay, no hidratar nada. Ver "Elección de framework" abajo.
- Tailwind CSS v4: integrado vía plugin `@tailwindcss/vite` en `astro.config.mjs`. **No usar** `@astrojs/tailwind` (legacy) ni clases de la capa `@apply` fuera de setup minimal.
- **Cero archivos CSS externos** por componente: todo se resuelve con clases Tailwind inline. `is:global` solo en `Layout.astro` para tokens globales si fuera estrictamente necesario.
- Idioma de UI: español (es-ES / es-419 neutro) salvo que el usuario indique lo contrario.

### Si Tailwind aún no está instalado

Antes de generar el componente, verifica la presencia de Tailwind en `astro.config.mjs` y `package.json`. Si falta, instálalo una sola vez:

```bash
bun add tailwindcss @tailwindcss/vite
```

Luego registra el plugin en `astro.config.mjs`:

```js
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  vite: { plugins: [tailwindcss()] },
});
```

Y asegura que `src/styles/global.css` (único punto de entrada de estilos, importado desde `Layout.astro`) contenga:

```css
@import "tailwindcss";
```

No repitas este setup si ya existe.

## Elección de framework (Astro / React / Vue)

El framework se decide por componente, no por proyecto. Prioridad estricta:

| Situación | Framework | Archivo | Directiva |
|---|---|---|---|
| Contenido estático, SEO, sin estado | **Astro (por defecto)** | `.astro` | ninguna (0 JS) |
| Interactividad y el proyecto ya usa React | **React** | `.tsx` | `client:load` / `client:visible` / `client:idle` |
| Interactividad y el usuario/equipo prefiere Vue | **Vue** | `.vue` | `client:load` / `client:visible` / `client:idle` |

Reglas:
- **No mezclar React y Vue para lo mismo** salvo que el usuario lo pida. Si ya hay `.tsx` en el proyecto, seguir con React; si ya hay `.vue`, seguir con Vue; si no hay ninguno y el usuario no especifica, **preguntar** antes de instalar una integración.
- Preferir `client:visible` / `client:idle` sobre `client:load` (hidratar solo cuando haga falta).
- Usar `client:only="react"` / `client:only="vue"` solo si el componente no puede renderizar en servidor.
- Los `.astro` pueden **usar** islas React/Vue (`<Player client:visible />`), pero una isla no debe importar un organismo `.astro`.

### Instalar la integración (solo si falta)

```bash
# React
bunx astro add react
# Vue
bunx astro add vue
```

Esto agrega la integración a `astro.config.mjs` y el paquete a `package.json`. No hacerlo si la integración ya está configurada.

## Atomic Design (estructura de carpetas)

Clasifica cada componente en uno de estos niveles y créalo en la ruta que corresponda:

| Nivel | Qué es | Ejemplos | Ruta |
|---|---|---|---|
| **Átomos** | Elementos indivisibles, sin composición interna | `Button.astro`, `Badge.astro`, `Icon.astro`, `Heading.astro`, `Input.astro`, `Spinner.astro` | `src/components/atoms/` |
| **Moléculas** | 2+ átomos combinados con un propósito | `SearchBar.astro` (Input+Button), `NavItem.astro`, `StatCard.astro`, `FormField.astro` | `src/components/molecules/` |
| **Organismos** | Secciones complejas y reutilizables | `Navbar.astro`, `Footer.astro`, `Hero.astro`, `ProgramCard.astro`, `ContactForm.astro`, `PlayerBar.astro` | `src/components/organisms/` |
| **Plantillas** | Composición de organismos con slots (`<slot />`) | `BaseLayout.astro`, `BlogLayout.astro` | `src/layouts/` (ya existe `Layout.astro`) |
| **Páginas** | Instancias concretas de plantillas con contenido real | `index.astro`, `programacion.astro` | `src/pages/` |

Reglas de colocación:
- Antes de crear un átomo nuevo, revisa `src/components/atoms/`; si ya existe algo equivalente, **reutilízalo y extiéndelo con props** en vez de duplicar.
- Un organismo se compone importando moléculas/átomos; una molécula importa átomos. Nunca al revés (un átomo no importa moléculas).
- Nombres en **PascalCase** + sufijo del tipo de archivo (`.astro`, `.tsx` o `.vue`).

## Checklist de calidad (aplicable a todo componente)

1. **Mobile-first**: estilos base = móvil; usar `sm:`, `md:`, `lg:` para escalar. Nunca diseñar solo desktop y "adaptar" después.
2. **Modo oscuro**: toda variable de color debe tener su variante `dark:`. Usar la estrategia de clase `dark` (verificada en `Layout.astro` con `prefers-color-scheme` + toggle manual con `classList.toggle('dark')`). Paleta sugerida para este proyecto de radio cristiana:
   - Fondo claro: `bg-white` / oscuro: `dark:bg-slate-950`
   - Texto: `text-slate-900 dark:text-slate-100`
   - Acentos de marca: definir como pares `bg-X dark:bg-Y` consistentes (consultar colores existentes en `Layout.astro`/`index.astro` antes de inventar una paleta nueva).
3. **Accesibilidad (a11y)**:
   - HTML semántico: `<nav>`, `<main>`, `<section aria-labelledby>`, `<button>` vs `<div role="button">`.
   - Imágenes: `alt` siempre (vacío `alt=""` si es decorativa).
   - Iconos decorativos: `aria-hidden="true"`.
   - Controles interactivos: alcanzables con teclado, foco visible (`focus-visible:ring-2 focus-visible:ring-offset-2`).
   - Formularios: `<label for>`/`aria-label`, mensajes de error con `aria-live="polite"`.
   - Contraste mínimo WCAG AA (4.5:1 en texto normal).
4. **Slots y props tipadas**: en Astro, declarar `interface Props` con JSDoc breve; en React, tipar `props` estrictamente (`Props` con `Readonly`); en Vue, usar `defineProps<Props>()` con `withDefaults`. Evitar `any`.
5. **Sin JavaScript innecesario**: priorizar CSS puro (`group-hover`, `peer-checked`, `details/summary`, `:target`) sobre scripts.

## Formato de salida

Al generar un componente:
1. Crear el archivo en la ruta atomic-correcta (mostrar la ruta en la respuesta).
2. Si el componente necesita datos o slots, definirlos vía `Props`/`<slot />`.
3. Si es una sección de página (organismo), integrarla en la página correspondiente de `src/pages/` solo si el usuario lo pide explícitamente.
4. Al terminar, ejecutar el typecheck/build del proyecto para validar:
   ```bash
   bunx astro check
   ```
   (si el comando `astro check` no está disponible, usar `bun run build`).

## Ejemplo de referencia (átomo)

`src/components/atoms/Button.astro`:

```astro
---
interface Props {
  variant?: "primary" | "secondary" | "ghost";
  href?: string;
  type?: "button" | "submit";
  class?: string;
  [key: string]: unknown;
}

const { variant = "primary", href, type = "button", class: className = "", ...rest } = Astro.props;
const base = "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950";
const variants = {
  primary: "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500",
  secondary: "bg-slate-200 text-slate-900 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 focus-visible:ring-slate-500",
  ghost: "text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950 focus-visible:ring-emerald-500",
};
const Tag = href ? "a" : "button";
---

<Tag
  href={href}
  type={href ? undefined : type}
  class={`${base} ${variants[variant]} ${className}`}
  {...rest}
>
  <slot />
</Tag>
```

## Ejemplo de referencia (isla Vue con interactividad)

`src/components/organisms/PlayerBar.vue` — solo cuando hay estado/interactividad real:

```vue
<script setup lang="ts">
import { ref, computed } from "vue";

interface Props {
  titulo: string;
  streamUrl: string;
  autoplay?: boolean;
}
const props = withDefaults(defineProps<Props>(), { autoplay: false });

const suena = ref(false);
const etiqueta = computed(() => (suena.value ? "Pausar" : "Escuchar en vivo"));

function toggle() {
  suena.value = !suena.value;
}
</script>

<template>
  <div
    class="flex items-center gap-3 rounded-xl bg-white/90 px-4 py-3 shadow ring-1 ring-slate-200 dark:bg-slate-900/90 dark:ring-slate-800"
  >
    <span class="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{{ props.titulo }}</span>
    <button
      type="button"
      class="ms-auto inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
      :aria-pressed="suena"
      @click="toggle"
    >
      {{ etiqueta }}
    </button>
  </div>
</template>
```

Uso desde una página Astro (hidratación diferida): `<PlayerBar titulo="Música" streamUrl="/stream" client:visible />`.
