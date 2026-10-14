# Brillo Sur — catálogo mayorista con pedidos por WhatsApp

Next.js (App Router) + Supabase + Vercel. Documentación completa al final del proyecto (Fase 6).

## Arranque rápido

```bash
cd brillo-sur
cp .env.example .env.local   # llena los valores (nunca subas este archivo)
npm ci
npm run dev
```

## Scripts

| Script | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run lint` / `npm run typecheck` | Calidad de código |
| `npm run audit:prod` | `npm audit` de dependencias de producción |
| `npm run scan:secrets` | Escanea todo el historial de Git con gitleaks |

Activa el escaneo de secretos antes de cada push (una sola vez):

```bash
git config core.hooksPath .githooks
```
