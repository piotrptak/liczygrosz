# 🐷 LiczyGrosz

**LiczyGrosz** (Polish for "Penny Counter") is an expense tracker built with React Native and Expo. It runs as an installable web app (PWA) on the phone and the computer, with one account and one database: whatever you add on the phone shows up on the web and vice versa, live.

## ✨ Features

- **Transactions** – add, edit and delete income and expenses with category, note, date and currency
- **Monthly dashboard** – balance, income and expense per month, with income/expense filters
- **Multi-currency** – PLN, EUR and USD; totals are kept per currency and never mixed without conversion
- **Recurring items** – weekly or monthly schedules; due occurrences are booked automatically when the app starts (missed periods are caught up)
- **Statistics** – current month result and a 6-month expense trend in the default currency
- **Categories** – custom icons and colors; defaults are seeded in the device language
- **Polish and English** – language and default currency are stored per account
- **Sync between devices** – Supabase (Postgres) with live updates over Realtime
- **Account** – e-mail + password, password reset, account deletion (removes all data)
- **CSV export** – all transactions (UTF-8, opens in Excel)
- **Dark mode**, installable PWA; last loaded data is readable offline (saving needs a connection)

## 🗄️ Supabase setup (one-time)

1. Create a project at [supabase.com](https://supabase.com) – region **Central EU (Frankfurt)**.
2. **SQL Editor → New query**: paste [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) and run it. It creates the tables, Row Level Security policies, Realtime publication and the `process_recurring` / `delete_my_account` functions.
3. **Authentication → URL Configuration**: set **Site URL** to `https://<user>.github.io/liczygrosz/` and add the same URL (plus `http://localhost:8081/**` for development) to **Redirect URLs**. E-mail confirmation and password reset links return there.
4. **Project Settings → API**: copy the **Project URL** and the **anon public** key.
   - GitHub: **Settings → Secrets and variables → Actions → Variables**: add `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
   - Local development: copy `.env.example` to `.env.local` and fill it in.

The anon key is public by design (it ships in the web app); every table is protected by Row Level Security, so a user can only read and change their own rows.

## 🚀 Getting started

```bash
npm install
npm run web        # web (http://localhost:8081)
npm run android    # Android emulator / Expo Go
npm run ios        # iOS simulator / Expo Go
```

Other scripts:

| Script | Purpose |
| --- | --- |
| `npm run typecheck` | TypeScript check |
| `npm run build:web` | Production web build into `dist/` (see below) |
| `npm run serve:web` | Serve `dist/` locally on port 8080 |

## 🌐 Web / PWA deployment

The web app is deployed to **GitHub Pages** by `.github/workflows/deploy-web.yml` on every push to `master`.

One-time setup: in the repository go to **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**. The app is then available at `https://<user>.github.io/liczygrosz/`.

How the web build works:

- `expo export -p web` creates a single-page app; `scripts/postbuild-web.mjs` then fills in the base URL, generates the service worker precache list, adds `404.html` (SPA fallback for deep links) and `.nojekyll`.
- `EXPO_BASE_URL` sets the path the app is served from (`/liczygrosz` on GitHub Pages). Use an empty value when hosting on a domain root, e.g. a custom domain.
- `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` are inlined at build time.
- The service worker (`public/sw.js`) caches the app shell, so the PWA opens offline; the last fetched data is kept in localStorage.

## 🛠️ Tech stack

Expo SDK 54 · React Native 0.81 · Expo Router · Supabase (Postgres, Auth, Realtime) · TanStack Query · i18n-js · date-fns · react-native-chart-kit

## 📂 Project structure

```
app/                     Screens (Expo Router)
├── (tabs)/              Dashboard, Add, Stats, Profile
├── login.tsx            Sign in / sign up / password reset
├── reset-password.tsx   New password after a reset link
├── transaction/[id].tsx Edit transaction
├── categories/          Category management
└── recurring/           Recurring items
components/              Feature and UI components
context/                 Auth and localization (language, currency) providers
lib/                     Supabase client, data API, query cache, device sync
supabase/migrations/     Database schema (run in the Supabase SQL editor)
locales/                 en / pl translations
utils/                   Money formatting, CSV export, dialogs, error messages
public/                  PWA files: index.html template, manifest, service worker, icons
scripts/                 Web post-build step
```

## 📄 License

MIT

## 👨‍💻 Author

**Piotr Ptak** – [@piotrptak](https://github.com/piotrptak)
