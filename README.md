# 🐷 LiczyGrosz

**LiczyGrosz** (Polish for "Penny Counter") is a private, offline-first expense tracker built with React Native and Expo. It runs as an installable web app (PWA) and on iOS/Android. All data stays on the device: there is no account, no server and no tracking.

## ✨ Features

- **Transactions** – add, edit and delete income and expenses with category, note, date and currency
- **Monthly dashboard** – balance, income and expense per month, with income/expense filters
- **Multi-currency** – PLN, EUR and USD; totals are kept per currency and never mixed without conversion
- **Recurring items** – weekly or monthly schedules; due occurrences are booked automatically when the app starts (missed periods are caught up)
- **Statistics** – current month result and a 6-month expense trend in the default currency
- **Categories** – custom icons and colors; defaults are seeded in the device language
- **Polish and English** – language and default currency are remembered
- **CSV export** – backup of all transactions (UTF-8, opens in Excel)
- **Dark mode**, installable PWA and offline support

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
- Data is stored in SQLite (`expo-sqlite`, WebAssembly + OPFS). It needs `SharedArrayBuffer`, which requires cross-origin isolation (COOP/COEP headers). GitHub Pages cannot set headers, so the service worker (`public/sw.js`) adds them; on the very first visit the page reloads once. The dev server sets the headers in `metro.config.js`.
- The service worker also caches the app, so it works offline after the first visit.

> ⚠️ Web data lives in the browser's storage for this site. Clearing site data removes it, so export to CSV regularly. The app requests persistent storage to reduce the risk of eviction.

## 🛠️ Tech stack

Expo SDK 54 · React Native 0.81 · Expo Router · expo-sqlite · i18n-js · date-fns · react-native-chart-kit

## 📂 Project structure

```
app/                     Screens (Expo Router)
├── (tabs)/              Dashboard, Add, Stats, Profile
├── transaction/[id].tsx Edit transaction
├── categories/          Category management
└── recurring/           Recurring items
components/              Feature and UI components
context/                 Localization (language, currency) provider
db/                      Schema, migrations and settings
locales/                 en / pl translations
utils/                   Recurring processing, money formatting, CSV export, dialogs
public/                  PWA files: index.html template, manifest, service worker, icons
scripts/                 Web post-build step
```

## 📄 License

MIT

## 👨‍💻 Author

**Piotr Ptak** – [@piotrptak](https://github.com/piotrptak)
