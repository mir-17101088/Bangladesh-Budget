# Bangladesh National Budget — FY 2026–27 · The Daily Star

An interactive, multi-page data story on Bangladesh's national budget. Three pages —
**Budget at a Glance** (home), **Sector Deep Dive**, and **Budget Realities** — built with
React, custom SVG charts, and a Vite build.

> **Performance note:** the site was migrated from in-browser Babel (which shipped ~2.8 MB
> of Babel + dev React and transpiled JSX live in every visitor's browser) to a **Vite
> build** with **production React**, pre-compiled JSX, and bundled/minified/hashed output.
> Framework JS on the home route dropped from **~1 MB gzip + live transpile** to **~71 kB
> gzip with zero transpile**. No budget figures or copy were changed. See
> [DEPLOYMENT.md](DEPLOYMENT.md) for the full story.

---

## Quick start

```bash
npm install        # one time

npm run dev        # dev server, hot reload → http://localhost:5173
npm run build      # production build → ./dist
npm run preview    # serve the built ./dist → http://localhost:4173
```

Open <http://localhost:5173/> (redirects to the home page) or a page directly, e.g.
`http://localhost:5173/Budget%20at%20a%20Glance.html`.

> Requires **Node ≥ 18** (developed on Node 24). Pages must be served over HTTP —
> `file://` will not work (ES-module scripts).

---

## Project structure

```
├── index.html                  # redirect → Budget at a Glance.html
├── Budget at a Glance.html      # Home   (entry-home.js)
├── Sector Deep Dive.html        # Sector (entry-sector.js)
├── Budget Realities.html        # Prices (entry-price.js)
├── entry-*.js                   # tiny per-page entry points
├── vite.config.mjs              # build config + the concatenation plugin
│
├── *.jsx                        # app code (classic-script style, shared globals)
│     app-data.jsx               #   shared Nav/Hero/Footer, NEWS feed, PRELAUNCH flag
│     app-rest.jsx               #   Treemap, Debt, NewsSection
│     app-taka-gdp.jsx           #   ৳100-note "signature view", GDP section
│     sector-*.jsx               #   Sector Deep Dive
│     price-*.jsx                #   Budget Realities
│     relevant-news.jsx          #   per-section "Relevant News" cards  ← see news.md
│     anim-hooks.jsx             #   IntersectionObserver animation hooks
│     fiscal-state.jsx           #   budget math helpers
│     tweaks-panel.jsx           #   in-page editor panel
├── *.css                        # styles (styles.css is the base)
├── assets/                      # logo, hero video + poster, ৳100 note (+ .webp)
├── news-images/                 # local article images (used by relevant-news.jsx)
├── scripts/optimize-images.mjs  # one-off WebP generator (see below)
│
├── README.md                    # this file
├── DEPLOYMENT.md                # deploy + test deep dive
├── news.md                      # guide for the news team's API integration
├── vercel.json                  # Vercel build + cache headers
└── dist/                        # build output (gitignored)
```

### How the build works

The `.jsx` files were authored as **classic scripts that share one global scope** and
publish onto `window`. A few cross-file globals (e.g. `TWEAK_DEFAULTS`) are *not* on
`window` and only work because of that shared scope. So the build **concatenates each
page's files, in order, into a single module** (preserving shared scope) rather than
importing them as separate ES modules — which would break those globals. The file lists
live in the `PAGES` object in [vite.config.mjs](vite.config.mjs). **Edit content in the
`.jsx` files, not the HTML script tags.**

---

## Editing content

- **Budget figures / text:** in the relevant `*-data.jsx` / `app-data.jsx` files. After
  editing, run `npm run build`.
- **Pre-launch countdown:** `PRELAUNCH` in [app-data.jsx](app-data.jsx) (currently `true`).
  Set to `false` once FY27 figures are entered, then rebuild.
- **News:** see **[news.md](news.md)** — written for the team wiring up the native news API.

---

## Deploying to Vercel (same repo as before)

This repo now has a **build step**, so Vercel must build it instead of serving raw files.
[vercel.json](vercel.json) already sets that up:

- Build command: `npm run build` · Output directory: `dist`
- Long-lived `immutable` caching on hashed `/_assets/*`; 30-day caching on images.
- Vercel adds gzip/brotli compression automatically.

**Push the new files to the existing GitHub repo and Vercel will pick up `vercel.json` on
the next deploy.** If Vercel's project was previously set to "no build / output = root",
`vercel.json` overrides it; you can confirm under *Project → Settings → Build & Output*.
See [DEPLOYMENT.md](DEPLOYMENT.md) §6 for a testing checklist and non-Vercel hosts.

### What to commit to GitHub

**Commit:** all `*.html` / `*.jsx` / `*.css`, `entry-*.js`, `vite.config.mjs`,
`package.json`, `package-lock.json`, `assets/` (incl. the new `*.webp`), `news-images/`,
`scripts/`, `vercel.json`, `.gitignore`, and the `*.md` docs.


---

## Performance work

**Done**
- ✅ Vite build, production React, no in-browser Babel, bundled/minified/hashed (Phase 1).
- ✅ ৳100-note image → WebP (713 → 328 kB) via `<picture>` + `loading="lazy"` + intrinsic
  `width`/`height` (no layout shift). Hero poster → WebP (247 → 85 kB).
- ✅ Low-end / Save-Data adaptation (`reduce-fx`): drops GPU-heavy backdrop-blur and
  decorative motion on `deviceMemory ≤ 2`, Save-Data, or 2G. Content unaffected.
- ✅ Already in place from the original build: SVG charts, `IntersectionObserver` reveals,
  `prefers-reduced-motion` support, passive touch handlers, `100svh` hero sizing.

**Recommended next** (see DEPLOYMENT.md §9 for detail)
1. Re-encode `news-images/*` (largest remaining media) — *coordinate with the news team,
   since their API may replace these.*
2. Re-encode the hero video (`assets/bangladesh.mp4`, 1.8 MB) to WebM/AV1 + a smaller MP4.
3. Self-host + subset Google Fonts; drop unused weights.
4. Animate SVG bars/count-ups via refs/CSS instead of per-frame React state (better INP).

### Re-running the image optimizer

`scripts/optimize-images.mjs` generates the WebP files. It needs `sharp`, which is **not**
a project dependency (to keep Vercel builds lean):

```bash
npm i --no-save sharp
node scripts/optimize-images.mjs
```

Commit the regenerated `assets/*.webp`. The build ships `assets/` verbatim, so new files
deploy automatically.
