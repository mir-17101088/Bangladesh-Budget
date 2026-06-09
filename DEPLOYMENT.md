# Deployment & Testing Guide — Budget FY 2026–27

This site now uses a **Vite build**. The old setup downloaded React's *development*
builds and `@babel/standalone` (~2.8 MB) from a CDN and transpiled the JSX **in the
browser on every page load**. That is gone. JSX is now pre-compiled, React ships as a
minified **production** build, and everything is bundled, minified, and content-hashed.

> **No budget data, figures, tables, or copy were changed.** This is a pure
> build/delivery change. The `.jsx` source files were not edited at all.

---

## 1. What changed

| | Before (in-browser Babel) | After (Vite build) |
|---|---|---|
| JSX transpilation | In the browser, main thread, every load | Once, at build time |
| `@babel/standalone` | ~2.8 MB shipped to every visitor | **Removed** |
| React | `react.development.js` + `react-dom.development.js` (~1.4 MB) | Production React 18.3.1, bundled (**~46 kB gzip**, shared & cached across all pages) |
| App code | 9–11 separate `.jsx` files fetched + transpiled live | One minified, hashed chunk per page |
| Framework JS (gzip) | **~1 MB** + live CPU transpile | **~71 kB** on Home, no transpile |

**Measured production bundle (from `npm run build`):**

| File | Raw | Gzip | Notes |
|---|---|---|---|
| `index-*.js` | 143 kB | **46 kB** | Production React/ReactDOM — **shared**, cached across all 3 pages |
| `budget-at-a-glance-*.js` | 85 kB | 25 kB | Home app code |
| `sector-deep-dive-*.js` | 135 kB | 42 kB | Sector page app code |
| `budget-realities-*.js` | 139 kB | 43 kB | Budget Realities app code |
| `index-*.css` | 60 kB | 13 kB | Shared styles |

Net effect on the Home route: framework + app JS drops from **~1 MB gzip (plus
main-thread Babel)** to **~71 kB gzip with zero transpile cost** — the single biggest
lever on mobile LCP/TTI.

---

## 2. Prerequisites

- **Node.js ≥ 18** (verified on Node 24 / npm 11).
- That's it. No global tools needed.

---

## 3. Everyday commands

```bash
npm install        # one time — installs Vite, React, ReactDOM

npm run dev        # local dev server with hot reload  → http://localhost:5173
npm run build      # production build → ./dist
npm run preview    # serve the built ./dist locally    → http://localhost:4173
```

- **Develop:** `npm run dev`, then open <http://localhost:5173/> (it redirects to the
  Home page) or go straight to a page:
  - `http://localhost:5173/Budget%20at%20a%20Glance.html`
  - `http://localhost:5173/Sector%20Deep%20Dive.html`
  - `http://localhost:5173/Budget%20Realities.html`
- **Ship:** `npm run build` produces a self-contained `dist/` folder. That folder **is**
  the website — upload its contents to any static host.
- **Preview the real build before shipping:** `npm run preview`.

> ⚠️ You still cannot open the pages via `file://`. ES-module scripts require HTTP, so
> always use `npm run dev` / `npm run preview`, or a static host.

---

## 4. How the build works

The original `.jsx` files were written as **classic scripts that share one global scope**
and publish onto `window`. A few cross-file globals (e.g. `TWEAK_DEFAULTS`) are *not* on
`window` and only work because classic scripts share scope.

So the build **concatenates each page's files, in their original order, into a single
module** (preserving that shared scope) and transpiles + minifies that — instead of
treating each file as a separate ES module (which would break those globals). This is all
in **`vite.config.mjs`**:

- A small `budget-pages` plugin builds three virtual bundles (`virtual:budget-home`,
  `-sector`, `-price`) by concatenating the exact file lists from the old HTML.
- A short prelude imports **production React/ReactDOM** and re-exposes them as
  `window.React` / `window.ReactDOM` (with `createRoot` + `createPortal`), so every
  existing call site keeps working unchanged.
- `entry-home.js` / `entry-sector.js` / `entry-price.js` are the per-page entry points the
  HTML references.
- Raw assets referenced as plain strings in JS (`assets/*`, `news-images/*`) are copied
  into `dist/` verbatim; hashed build output lives in `dist/_assets/`.

**To change which files a page loads,** edit the `PAGES` lists in `vite.config.mjs`
(keep the order). You do **not** edit the HTML script tags anymore.

---

## 5. Testing checklist

After `npm run build && npm run preview`, open each page and confirm:

**Smoke test (all 3 pages):**
- [ ] Page renders; the loading screen disappears.
- [ ] **DevTools → Console: no errors.**
- [ ] **DevTools → Network: no request to `unpkg.com`, no `*.development.js`, no `babel`.**
- [ ] Home: hero + live countdown + stat strip.
- [ ] Sector Deep Dive: 14 sector cards; clicking a card expands and switches the chart;
      the Absolute / % of GDP / % of Budget toggles work.
- [ ] Budget Realities: donut + gauge charts render.
- [ ] Numbers match the previous site exactly (spot-check a few figures).

**Performance (the reason for this change):**
- [ ] Lighthouse (Chrome DevTools → Lighthouse → **Mobile**) on `npm run preview`.
      Expect a large jump in Performance vs. the old build; watch **LCP**, **TBT**, **TTI**.
- [ ] Throttle to "Slow 4G" + "4× CPU" in the Network/Performance panel and reload —
      this is where removing in-browser Babel shows the most.

> Verified during this migration: all three pages mount under **production React 18.3.1**
> with **zero console errors**, no CDN/Babel requests, assets load (200/206/304), and the
> sector-card expand interaction re-renders correctly.

---

## 6. Deploying to production

The deployable artifact is the **`dist/` folder** (run `npm run build` first). Upload its
contents to the web root of any static host. `index.html` redirects to
`Budget at a Glance.html`.

### Required host configuration

These are not done by `dist/` itself — configure them on the host/CDN. They matter as much
as the bundle size:

1. **Compression** — serve `.js`, `.css`, `.html`, `.svg` with **Brotli or gzip**
   (our ~143 kB React chunk is ~46 kB gzipped — only if the host compresses it).
2. **Cache headers:**
   - `/_assets/*` (content-hashed, safe forever):
     `Cache-Control: public, max-age=31536000, immutable`
   - `*.html` (must update on deploy): `Cache-Control: no-cache` (or a short max-age).
3. **HTTP/2 or HTTP/3** if available.

### Examples

**Netlify** — add a `dist/_headers` file (or configure in the dashboard):
```
/_assets/*
  Cache-Control: public, max-age=31536000, immutable
/*.html
  Cache-Control: no-cache
```
Build command: `npm run build` · Publish directory: `dist`

**Vercel / Cloudflare Pages** — Framework preset: **Vite** (or "Other"),
Build command `npm run build`, Output directory `dist`. Both gzip/brotli and cache
hashed assets automatically.

**Nginx** (self-hosted):
```nginx
root /var/www/budget/dist;
index index.html;

gzip on;
gzip_types text/css application/javascript image/svg+xml;
# brotli on; brotli_types text/css application/javascript image/svg+xml;  # if module present

location /_assets/ {
    add_header Cache-Control "public, max-age=31536000, immutable";
}
location ~* \.html$ {
    add_header Cache-Control "no-cache";
}
```

**Apache** — enable `mod_deflate`/`mod_brotli` and set the same `Cache-Control` per path
via `.htaccess`.

> File/URL names contain spaces (`Budget at a Glance.html`). All current links use them
> consistently and it works on every host tested. If you later want clean URLs
> (`/budget-at-a-glance`), rename the inputs in `vite.config.mjs` and add host redirects.

---

## 7. Notes & gotchas

- **Fonts** are still loaded from Google Fonts (unchanged by this task). Self-hosting and
  subsetting them is a later optimization
- **News thumbnails** call `api.microlink.io` at runtime (lazy, in `relevant-news.jsx`) —
  unrelated to the build; leave as-is or revisit later.
- **Pre-launch flag:** `PRELAUNCH` lives in `app-data.jsx` (currently `true`, showing the
  countdown hero). Flip to `false` once FY27 figures are entered — then rebuild.
- **`_serve.js`** (the old no-deps static server) is no longer the way to run the site; it
  cannot resolve the new module scripts. Use `npm run dev` / `npm run preview`. You may
  delete `_serve.js`, but it's harmless to keep.
- If you use git later, ignore build artifacts: `node_modules/` and `dist/`.

---

## 8. Files added / changed by this migration

**Added**
- `vite.config.mjs` — build config + the concatenation plugin (the heart of it).
- `entry-home.js`, `entry-sector.js`, `entry-price.js` — per-page entry points.
- `DEPLOYMENT.md` — this file.

**Changed**
- `package.json` — added `react`, `react-dom`, `vite`; added `dev`/`build`/`preview` scripts.
- `Budget at a Glance.html`, `Sector Deep Dive.html`, `Budget Realities.html` — removed the
  3 CDN `<script>` tags (dev React + Babel) and the per-file `type="text/babel"` tags;
  replaced with one `<script type="module">` entry each.


**Untouched** — every `.jsx`/`.css` source file and all budget data.

---

## 9. Where this fits in the bigger plan

This was **Phase 1** of the performance roadmap (the highest-leverage item: production
React + no in-browser Babel + bundling). Still ahead, in rough priority order:

1. **Media** — recompress `news-images/*` and `assets/100_taka_note.jpg` to AVIF/WebP and
   add `width`/`height` + `loading="lazy"` (≈ 9 MB → < 1 MB). Biggest remaining win.
2. **Fonts** — self-host + subset; drop unused weights.
3. **Runtime** — animate SVG bars/count-ups via refs/CSS instead of per-frame React state
   (improves INP on chart interactions).
4. **iOS `100vh` → `100dvh`**, convert layout-triggering CSS transitions to `transform`.
5. **Adaptive loading** for low-end Android / Save-Data; Service Worker for offline.


