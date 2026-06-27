# CLAUDE.md

Canonical, version-controlled guide for working in this repo. Keep it in sync with the code and
[`Reference.md`](./Reference.md). (`README.md` is still the stock Vite template — **this** file is the
real orientation; replacing the README with a real front door is a worthwhile small task.)

## What Tyche is
A decision-making **randomizer** — 27 built-in themed lists plus custom options. **React 19 +
TypeScript + Vite + Tailwind v4**, mobile-first, client-side only. Awry Labs: no tracking.
('So Random!' / Disney-randomizer lineage.)

## Build / run / test / deploy
```bash
npm install
npm run dev         # Vite dev server
npm run build       # tsc -b && vite build  (type-check gates the build)
npm run lint        # eslint
npm run test        # vitest run   (npm run test:watch for watch mode)
npm run deploy      # build → gh-pages to GitHub Pages
```
`predeploy` copies `dist/index.html` → `dist/404.html` so client-side routes survive a hard refresh on
GitHub Pages (the SPA fallback). **Keep that** if you touch routing or deploy.

## Architecture
React 19 function components; `react-router-dom` v7 for routes; **Tailwind v4** (via
`@tailwindcss/vite`) for styling; source under `src/`. Tests are **Vitest + Testing Library** (jsdom).
The build runs `tsc -b` first — **TypeScript errors fail the build**, so keep types clean.

## Conventions
- TypeScript throughout; function components + hooks; Tailwind utilities over ad-hoc CSS. Mobile-first.
- Lint clean and tests green before deploy; the build won't pass with type errors.
- No tracking / analytics (Awry brand rule).
- Commits: branch from `main`.

## Docs
- **CLAUDE.md** (this) — orientation, build/test/deploy, conventions.
- **Reference.md** — fuller architecture / spec (keep current).
- `README.md` — currently the stock Vite template (replace with a real front door when convenient).
