# Checklist de seguridad — los 20 puntos

Estado al cierre de la Fase 6. ✅ = implementado y probado · ⚠️ = implementado, requiere una acción del dueño en producción (ver [`PENDIENTES.md`](./PENDIENTES.md)).

Las rutas son relativas a `brillo-sur/`.

| # | Punto | Estado | Dónde y cómo |
| --- | --- | --- | --- |
| 1 | Ocultar API Key | ✅ | Todas las claves vienen de variables de entorno; `.env.example` solo lista nombres. Las secretas se leen en `src/lib/env.server.ts` y `src/lib/supabase/admin.ts`, marcados con `server-only` (el build falla si un componente del navegador los importa). Verificado: ninguna clave aparece en `.next/static`. |
| 2 | Purgar secrets de Git | ✅ | `.env*` en `.gitignore` desde el primer commit (raíz y proyecto). gitleaks en CI (`.github/workflows/seguridad.yml`, historial completo), hook `.githooks/pre-push` y `npm run scan:secrets`. Historial escaneado: sin fugas. Procedimiento de rotación + `git filter-repo` en el README §9. |
| 3 | Key pública de BD | ✅ | Solo `NEXT_PUBLIC_SUPABASE_ANON_KEY` fuera de las tareas de servidor acotadas. De hecho, el navegador no habla con Supabase: el catálogo se lee en el servidor (`src/lib/catalog.ts`) y la sesión vive en cookies. |
| 4 | RLS | ✅ | `supabase/migrations/20261014000001_esquema_inicial.sql`: RLS en las 6 tablas + permisos mínimos por columna. Público: solo lee categorías/productos activos y columnas necesarias. Pedidos/ítems: solo `owner`/`staff`. `profiles`: cada uno ve el suyo; nadie cambia su propio rol (política + trigger). Pruebas: 43 pgTAP (`supabase/tests/rls.test.sql`) y 9 con la clave pública real (`scripts/rls-remote.test.mjs`). |
| 5 | Encriptación | ✅ | HTTPS en tránsito (puntos 18–19); Supabase cifra en reposo. El celular se guarda con `pgp_sym_encrypt` (pgcrypto) y la clave (`PHONE_ENCRYPTION_KEY`) nunca entra a la BD. Solo se piden nombre del negocio y celular (Ley 29733); aviso en `/privacidad`. |
| 6 | Forzar autenticación | ✅ | `src/proxy.ts` valida la sesión con `auth.getUser()` en todo `/admin/*`; además cada página y cada Server Action llama a `requireStaff()`/`requireOwner()` (`src/lib/auth.ts`). |
| 7 | Restringir acceso a registros | ✅ | El rol y `active` se leen de `profiles` en cada petición (servidor) y en las políticas RLS (`private.is_staff()`/`is_owner()`). Solo el dueño crea usuarios (`src/app/admin/(panel)/usuarios/actions.ts`). Registro público desactivado (`supabase/config.toml` + panel de Supabase ⚠️). |
| 8 | Manipulación de campos | ✅ | `POST /api/orders` (`src/app/api/orders/route.ts`) solo acepta producto, forma y cantidad; Zod descarta `total`, `status`, `id`, `role`, precios. La función `create_order` busca precios reales, recalcula subtotales/total y guarda `unit_price_snapshot`. El personal solo puede actualizar la columna `status` de un pedido. |
| 9 | Cookies de sesión | ✅ | `@supabase/ssr` con `HttpOnly`, `Secure` (producción) y `SameSite=Lax` forzados (`src/lib/supabase/cookies.ts`). Nada en `localStorage`. Logout con `signOut({ scope: "global" })`: una cookie copiada antes del logout deja de servir (probado). |
| 10 | Hasheo de contraseñas | ✅ ⚠️ | Supabase Auth (bcrypt). Nunca se guardan ni se registran contraseñas. Mínimo 10 caracteres validado en el servidor (`src/lib/admin-schemas.ts`) y en Supabase (`minimum_password_length`, configurar en el panel ⚠️). Cambiar contraseña exige la actual. |
| 11 | Limitar acceso al login | ✅ | `public.hit_rate_limit` (Postgres, funciona entre instancias). Login: 5 intentos/15 min por IP y 10/hora por cuenta. Pedidos: 5/10 min por IP. Las IP se guardan como HMAC, no en claro. Mensaje único "Correo o contraseña incorrectos." para clave mala, correo inexistente o usuario sin rol. |
| 12 | AntiBot | ✅ | Cloudflare Turnstile en el formulario de pedido y en el login (`src/components/Turnstile.tsx`), validado en el servidor (`src/lib/security/turnstile.ts`) con comprobación de hostname en producción. |
| 13 | Parametrización | ✅ | Cero SQL concatenado: cliente de Supabase y funciones RPC con parámetros tipados (`create_order`, `order_phone`, `hit_rate_limit`), todas con `search_path = ''`. |
| 14 | Validar inputs | ✅ | Zod en el servidor: `src/lib/order-schema.ts` (nombre 2–80 sin caracteres de control, celular peruano, cantidades enteras 1–999, 1–40 líneas sin repetidos, IDs válidos) y `src/lib/admin-schemas.ts` (precios positivos con 2 decimales, empaque coherente, contraseñas). La BD repite los controles con `CHECK` y en `create_order`. |
| 15 | Escapar contenido del usuario | ✅ | Sin `dangerouslySetInnerHTML`. Enlaces de WhatsApp con `encodeURIComponent` y el nombre del negocio aplanado a una línea para que no pueda inyectar líneas falsas (`src/lib/whatsapp.ts`, probado en `tests/whatsapp.test.ts`). |
| 16 | Restringir subida | ✅ | Solo desde el panel y con rol (`uploadPhoto` en `src/app/admin/(panel)/productos/actions.ts`). Máx. 2 MB, JPG/PNG/WebP por bytes reales (`src/lib/image-validation.ts`), nombre UUID. Bucket con límite de tamaño/tipo y políticas de Storage (`supabase/migrations/20261015000001_fotos_productos.sql`, 8 pruebas en `supabase/tests/storage.test.sql`). |
| 17 | Recortar respuestas | ✅ | Ningún `select('*')`. El público recibe solo nombre, precios, empaque, foto e id de producto; las categorías no exponen su id. `/api/orders` devuelve solo N.º, total y enlace. Errores genéricos al cliente; detalle solo en logs del servidor. |
| 18 | Headers de seguridad | ✅ | CSP con nonce por petición y `strict-dynamic` (`src/lib/security/csp.ts`, `src/proxy.ts`): solo el sitio, Supabase, Turnstile y Google Fonts; `frame-ancestors 'none'`. En `next.config.ts`: HSTS (2 años), `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` restrictiva, COOP. El panel además envía `Cache-Control: private, no-store` y `X-Robots-Tag: noindex`. |
| 19 | HTTPS | ✅ ⚠️ | Vercel sirve HTTPS y redirige HTTP; `src/proxy.ts` repite la redirección (308) y HSTS lo fija en el navegador. El dominio `.pe` obtiene certificado automático al agregarlo en Vercel ⚠️. |
| 20 | Escaneo de dependencias | ✅ | `npm audit --omit=dev`: **0 vulnerabilidades** (también en CI). Dependabot semanal (`.github/dependabot.yml`). Versiones fijadas con `package-lock.json` y `npm ci`. Solo 7 dependencias directas de producción. |

## Riesgos aceptados

- **`braces` (alta, solo desarrollo).** Llega vía `eslint-config-next` → `fast-glob` → `micromatch`. Es una denegación de servicio con patrones glob maliciosos al correr ESLint; no forma parte del sitio publicado. No existe versión corregida y el "arreglo" de `npm audit fix --force` bajaría ESLint de Next 16 a 14. Dependabot avisará cuando haya parche.
- **`style-src 'unsafe-inline'` en la CSP.** Lo requiere Turnstile para sus estilos. Los *scripts* en línea siguen bloqueados (nonce), que es lo que previene XSS.
- **Fotos sin reprocesar.** Se valida el tipo real y el tamaño, pero no se eliminan metadatos EXIF. Para fotos de productos el riesgo es bajo.

## Cómo se verificó

| Prueba | Resultado |
| --- | --- |
| `npm test` (unitarias) | 20/20 |
| `npm run test:db` (pgTAP, Postgres local) | 51/51 |
| pgTAP contra Supabase local oficial | 51/51 |
| `npm run test:rls:remote` contra la API de Supabase local | 9/9 |
| Prueba de punta a punta del panel (navegador) | 29/29 |
| Prueba de punta a punta de pedidos (API y navegador) | todos los casos esperados |
| gitleaks, historial completo | sin fugas |
| GitHub Actions | verde en todas las fases |
