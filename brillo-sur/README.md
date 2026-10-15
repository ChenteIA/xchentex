# Brillo Sur — catálogo mayorista con pedidos por WhatsApp

Web de la distribuidora Brillo Sur (Mala, Cañete): catálogo público con carrito que envía el pedido por WhatsApp, y un panel privado para el dueño y su personal.

- **Stack:** Next.js 16 (App Router, TypeScript) · Supabase (Postgres, Auth, Storage) · Vercel · Zod · Cloudflare Turnstile.
- **Seguridad:** ver [`SEGURIDAD.md`](./SEGURIDAD.md) (checklist de los 20 puntos).
- **Tareas del dueño:** ver [`PENDIENTES.md`](./PENDIENTES.md).

```
brillo-sur/
├─ src/app/            páginas: landing, /api/orders, /admin (panel), /privacidad
├─ src/components/     landing, catálogo/carrito, Turnstile
├─ src/lib/            Supabase, validación (Zod), seguridad, WhatsApp
├─ src/proxy.ts        CSP con nonce, HTTPS y protección de /admin
├─ supabase/           migraciones SQL, datos semilla, pruebas pgTAP
├─ tests/              pruebas unitarias (node:test)
└─ scripts/            pruebas de RLS
```

---

## 1. Requisitos

- **Node.js 22.18 o superior** y npm.
- Una cuenta en [Supabase](https://supabase.com), [Vercel](https://vercel.com) y [Cloudflare](https://dash.cloudflare.com) (las tres tienen plan gratuito suficiente para empezar).
- Opcional para desarrollo local: [CLI de Supabase](https://supabase.com/docs/guides/local-development) y Docker.

## 2. Instalación local

```bash
git clone <url-del-repo>
cd xchentex/brillo-sur
npm ci
cp .env.example .env.local     # llena los valores (sección 3)
npm run dev                    # http://localhost:3000
```

Activa el escaneo de secretos antes de cada `git push` (una sola vez, requiere [gitleaks](https://github.com/gitleaks/gitleaks#installing)):

```bash
git config core.hooksPath .githooks
```

## 3. Variables de entorno

Se llenan en `.env.local` (local) y en **Vercel → Project → Settings → Environment Variables** (producción). **Nunca** subas `.env.local` a Git.

| Variable | ¿Secreta? | De dónde sale |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | No | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No | Supabase → Project Settings → API Keys → clave **publishable** (o `anon`) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | No | Cloudflare → Turnstile → tu widget → Site Key |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | No | Número del negocio con código de país, solo dígitos. Ej.: `51987654321` |
| `NEXT_PUBLIC_SITE_URL` | No | URL pública con https. Ej.: `https://brillosur.pe` |
| `SUPABASE_SERVICE_ROLE_KEY` | **Sí** | Supabase → API Keys → clave **secret** (o `service_role`). Salta RLS: solo servidor |
| `TURNSTILE_SECRET_KEY` | **Sí** | Cloudflare → Turnstile → tu widget → Secret Key |
| `PHONE_ENCRYPTION_KEY` | **Sí** | Genérala tú: `openssl rand -base64 32`. Cifra los celulares de los clientes |

> ⚠️ **`PHONE_ENCRYPTION_KEY` no se puede perder ni cambiar** a la ligera: los celulares ya guardados solo se leen con la misma clave. Guárdala en un gestor de contraseñas.

Para desarrollo local, Cloudflare ofrece claves de prueba de Turnstile que siempre pasan: Site Key `1x00000000000000000000AA` y Secret Key `1x0000000000000000000000000000000AA`.

## 4. Configurar Supabase (una sola vez)

1. **Crea el proyecto** en Supabase. Región recomendada: São Paulo (`sa-east-1`), la más cercana a Perú.
2. **Aplica la base de datos.** Opción A, con el CLI:
   ```bash
   npx supabase login
   npx supabase link --project-ref <ref-de-tu-proyecto>
   npx supabase db push                  # aplica supabase/migrations/*
   ```
   Opción B, sin CLI: en **SQL Editor** pega y ejecuta, en orden, los archivos de `supabase/migrations/`.

   Luego ejecuta `supabase/seed.sql` en el SQL Editor si quieres los productos de ejemplo.
3. **Autenticación** (Authentication → Sign In / Providers y Authentication → Settings):
   - **Allow new users to sign up: desactivado.** Así nadie puede registrarse solo.
   - **Email provider: activado.** Es el login con correo y contraseña; si lo apagas, nadie podrá entrar al panel.
   - **Minimum password length: 10.**
   - **Site URL:** tu dominio (`https://brillosur.pe`).
4. **Storage:** la migración crea el bucket `product-images` (público para ver fotos, máx. 2 MB, solo JPG/PNG/WebP). No hace falta tocar nada.
5. **Comprueba la seguridad** con la clave pública real:
   ```bash
   npm run test:rls:remote
   ```
   Todas las pruebas deben salir `ok` (la clave pública no lee pedidos ni escribe productos).

## 5. Crear el primer usuario `owner` (dueño)

El registro público está cerrado, así que el primer dueño se crea a mano:

1. En Supabase → **Authentication → Users → Add user → Create new user**: escribe el correo y una contraseña de **al menos 10 caracteres**, y marca **Auto Confirm User**.
2. Copia el **UID** del usuario recién creado.
3. En **SQL Editor** ejecuta (reemplaza el UID y el nombre):
   ```sql
   insert into public.profiles (id, role, full_name)
   values ('PEGA-AQUI-EL-UID', 'owner', 'Nombre del dueño');
   ```
4. Entra a `https://tu-dominio/admin/login`.

Desde ahí, el dueño crea al resto del personal en **Panel → Usuarios** (rol *Personal* o *Dueño*).

## 6. Cloudflare Turnstile

1. Cloudflare → **Turnstile → Add widget**.
2. Hostnames: tu dominio (`brillosur.pe`) y el de Vercel (`brillo-sur.vercel.app`).
3. Modo: **Managed**.
4. Copia la Site Key y la Secret Key a las variables de entorno.

## 7. Desplegar en Vercel

1. Vercel → **Add New → Project** → importa el repositorio de GitHub.
2. **Root Directory: `brillo-sur`** (el proyecto vive en esa carpeta).
3. Framework: Next.js (se detecta solo). Node.js: 22.x.
4. Carga las 8 variables de la sección 3 en *Production* (y en *Preview* si usarás previews).
5. **Deploy.**
6. Dominio `.pe`: Project → Settings → **Domains** → agrega `brillosur.pe` y `www.brillosur.pe`, y crea en tu proveedor del dominio los registros DNS que indique Vercel. Vercel emite el certificado HTTPS automáticamente y redirige HTTP → HTTPS.
7. Actualiza `NEXT_PUBLIC_SITE_URL`, el *Site URL* de Supabase y los hostnames de Turnstile con el dominio final, y vuelve a desplegar.

## 8. Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Build y servidor de producción |
| `npm run lint` / `npm run typecheck` | Calidad de código |
| `npm test` | Pruebas unitarias (validación de pedidos, WhatsApp, fotos, panel) |
| `npm run test:db` | Pruebas de RLS y Storage con pgTAP en un Postgres local (ver `scripts/test-db.sh`) |
| `npm run test:rls:remote` | Pruebas con la clave pública contra tu proyecto Supabase real |
| `npm run audit:prod` | `npm audit` de dependencias de producción |
| `npm run scan:secrets` | gitleaks sobre todo el historial de Git |

Con Docker y el CLI de Supabase también puedes levantar todo en local: `npx supabase start` (aplica migraciones y seed) y `npx supabase test db`.

GitHub Actions (`.github/workflows/seguridad.yml`) corre en cada push: gitleaks, lint, typecheck, pruebas, `npm audit`, build y pruebas de RLS. Dependabot revisa dependencias cada semana.

## 9. Si una clave se filtra

1. **Rótala de inmediato** en Supabase (API Keys → *Roll*) o Cloudflare, y actualiza Vercel. Limpiar el historial no basta: la clave ya fue expuesta.
2. Elimínala del historial de Git:
   ```bash
   pip install git-filter-repo
   git filter-repo --replace-text <(echo 'LA-CLAVE-FILTRADA==>***ELIMINADA***')
   git push --force --all
   ```
3. Vuelve a correr `npm run scan:secrets`.

Si se filtra `PHONE_ENCRYPTION_KEY`, hay que recifrar los celulares con una clave nueva; pide ayuda a un desarrollador antes de cambiarla.
