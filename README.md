## CURZ FIT

A workout-tracking PWA starter built with the same stack as `curz-pos`:

- Next.js (App Router) + React
- MUI (iOS-style theme, light/dark via `colorSchemes`)
- Prisma ORM
- Supabase (Postgres + auth)
- Installable PWA: manifest, service worker, offline fallback, update banner
- Web push notifications
- Vercel deployment

## What is included

- Supabase-backed sign in/up in `app/components/login-screen.tsx`, synced to an
  `AppUser` table (`lib/auth/app-user.ts`) so authorization doesn't depend on
  Supabase alone
- Installable PWA shell: `app/manifest.ts`, `public/sw.js`, update/connectivity/
  dev-mode banners in `app/components/`
- Web push plumbing: `lib/push-notifications.ts`,
  `app/api/push-subscriptions/route.ts`, `app/components/notification-permission-manager.tsx`
- Prisma schema for exercises and workout sessions in `prisma/schema.prisma`
- Exercise API endpoint in `app/api/exercises/route.ts`
- Shared Prisma client in `lib/prisma.ts`
- Supabase client helpers in `lib/supabase/client.ts`, `lib/supabase/server.ts`,
  and `lib/supabase/server-auth.ts`
- Seed scripts in `prisma/seed.ts` and `prisma/seed-owner.ts`

## 1. Install dependencies

```bash
npm install
```

## 2. Configure Supabase

1. Create a free project at https://supabase.com.
2. In Supabase, get:
   - Project URL
   - Anon key
   - Service role key
   - Database password
3. Copy `.env.example` to `.env` and fill in all values.
4. Generate VAPID keys for web push:

```bash
npm run push:vapid
```

5. Add these variables to your environment:
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `VAPID_SUBJECT` (example: `mailto:you@example.com`)

## 3. Create database tables from Prisma

```bash
npm run prisma:generate
npm run db:push
npm run db:seed
```

Then promote your own account to Owner (set `OWNER_EMAIL` in your env first):

```bash
npm run db:seed-owner
```

If you prefer migrations instead of `db push`, use:

```bash
npm run prisma:migrate
```

## 4. Run locally

```bash
npm run dev
```

Open http://localhost:1546.

## 5. Deploy free on Vercel

1. Push this repo to GitHub.
2. Create a free account at https://vercel.com.
3. Import the repository in Vercel.
4. Add environment variables in Vercel Project Settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `VAPID_SUBJECT`
5. Deploy.

For production, run Prisma migrations from a trusted environment (CI or local) rather than at request time.

## Useful scripts

```bash
npm run dev
npm run build
npm run lint
npm run prisma:generate
npm run prisma:migrate
npm run db:push
npm run db:seed
npm run db:seed-owner
npm run prisma:studio
```
