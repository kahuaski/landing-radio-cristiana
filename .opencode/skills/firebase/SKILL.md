---
name: firebase
description: Use when the user asks to integrate Firebase — Firebase Hosting, Firestore, Firebase Auth, Cloud Functions, Storage, emulator suite, firebase.json, security rules, or "usa firebase", "despliega en firebase", "conecta Firestore", "login con Firebase" for this Astro + Bun project.
---

# Firebase — Hosting, Auth, Firestore y Functions para Astro/Bun

Integra Firebase en el proyecto según el caso de uso (hosting, base de datos, autenticación, storage, funciones). Firebase y Cloudflare son alternativas: si el usuario no decide la plataforma, **preguntar** (ver también skill `cloudflare`); no montar ambas a la vez sin necesidad.

## Reglas del proyecto (obligatorias)

- Runtime/gestor: **Bun** (`bunx firebase ...`, `bun add`, nunca npm/npx/yarn).
- Astro 7. El build estático va a `dist/` (verificar `output` antes de configurar hosting).
- **Nunca hardcodear secretos**. Las claves de cliente de Firebase Web (`apiKey`, etc.) son públicas por diseño, pero las de Admin SDK / service accounts **jamás** van al cliente ni al repo: usar variables de entorno y `.gitignore`.
- Identificadores en inglés, contenido/UI en español.

## Setup inicial

```bash
bunx firebase-tools login
bunx firebase-tools init        # seleccionar Hosting, Firestore, Functions, Emulators según haga falta
bun add firebase                # SDK cliente (browser)
# Solo si hay código de servidor/admin:
bun add firebase-admin
```

`firebase.json` para un Astro estático servido por Firebase Hosting:

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }],
    "headers": [
      {
        "source": "/**",
        "headers": [{ "key": "Cache-Control", "value": "public, max-age=3600" }]
      }
    ]
  }
}
```

> Si el sitio es multi-página (varias `.astro`), **no** pongas el `rewrite` a `/index.html`: solo aplica a SPA (React/Vue client-side). Para multipágina, quitar `rewrites` deja que Hosting sirva las rutas generadas y su `404.html`.

Deploy:
```bash
bun run build && bunx firebase-tools deploy --only hosting
```

## Configuración del SDK cliente (Astro)

Modo estático sin SSR: inicializa el SDK en un módulo y úsalo dentro de islas React/Vue (con `client:*`), nunca en el `<script>` del head global.

```ts
// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

`.env` (gitignored) con prefijo `PUBLIC_` solo para lo que realmente es público:

```
PUBLIC_FIREBASE_API_KEY=...
PUBLIC_FIREBASE_AUTH_DOMAIN=...
PUBLIC_FIREBASE_PROJECT_ID=...
# Secretos (sin PUBLIC_, nunca al cliente):
FIREBASE_SERVICE_ACCOUNT=...
```

## Firestore: cliente vs servidor

- **Cliente (browser, islas)**: `firebase/firestore` (`getDocs`, `onSnapshot`). Sujeto a **Security Rules**.
- **Servidor (Astro SSR / Bun / Functions)**: `firebase-admin` (`getFirestore`) **omite** las Security Rules. Usar solo donde ya hay confianza o dentro de rutas/endpoints de servidor, nunca en bundles de cliente.

```ts
// src/pages/api/programas.ts (solo en SSR) — ver skill bun-routing
import type { APIRoute } from "astro";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(Bun.env.FIREBASE_SERVICE_ACCOUNT!)) });
}

export const GET: APIRoute = async () => {
  const snap = await getFirestore().collection("programas").get();
  return Response.json({ data: snap.docs.map((d) => ({ id: d.id, ...d.data() })), error: null });
};
```

## Security Rules (obligatorias)

Nunca dejar Firestore abierto. Reglas por defecto seguras y luego abrir por colección:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    // Catálogo público de solo lectura
    match /programas/{id} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    // Datos por usuario
    match /usuarios/{uid}/{doc=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Escribir reglas propias por defecto (`allow read, write: if false;`) y abrir explícitamente. Validar con el emulador.

## Auth (si se pide login)

- Proveedores (Google, Facebook, Apple, email) se habilitan en la consola de Firebase Authentication.
- En Astro estático, manejar el estado de sesión dentro de una isla (`onAuthStateChanged` en React/Vue con `client:load`).
- Flujo completo server-side con cookies cuando se use SSR; no exponer tokens.
- Ver skill `social-integrations` para ubicar el botón de login social.

## Functions (Cloud Functions)

- Solo si se necesita lógica server-side que no cabe en rutas Astro/Worker.
- Escribir funciones en TypeScript; deploy con `bunx firebase-tools deploy --only functions`.
- Mantener las dependencias ligeras; inicializar `firebase-admin` una sola vez fuera del handler (reutilizar instancia en caliente).
- Alternativa más ligera y alineada al stack Bun: usar una API con Hono/Bun (skill `bun-backend`) en lugar de Functions si no se necesitan triggers de Firebase.

## Emuladores (desarrollo local)

```bash
bunx firebase-tools emulators:start
```
Apunta el SDK a los emuladores en desarrollo (`connectFirestoreEmulator`, `connectAuthEmulator`) solo cuando `import.meta.env.DEV` sea cierto. No mezclar datos de emulador con producción.

## Verificación

```bash
bunx astro check
bun run build
bunx firebase-tools emulators:exec --only firestore "bun test"
bunx firebase-tools deploy --only hosting   # cuando el usuario lo pida explícitamente
```

## Prohibiciones

- No poner `service_account.json` ni `FIREBASE_SERVICE_ACCOUNT` en el repo o en código de cliente.
- No usar `firebase-admin` en el bundle del navegador.
- No desplegar reglas `allow read, write: if true;` en producción.
- No usar npm/npx para `firebase-tools`: siempre `bunx`.
- No configurar Firebase y Cloudflare a la vez para la misma función sin que el usuario lo indique.
