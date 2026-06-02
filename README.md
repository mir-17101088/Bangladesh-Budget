# Budget at a Glance — FY 2025‑26 · The Daily Star

Interactive microsite visualising the Bangladesh National Budget. Three pages,
scroll‑driven editorial charts, no build step.


---

## How it runs (the one thing to understand first)

There is **no build, no bundler, no npm install**. Each page is a plain `.html`
file that loads React, ReactDOM and **Babel Standalone** from a CDN, then
includes the `.jsx` files as `<script type="text/babel">`. Babel compiles the
JSX in the browser at load time.

- **To develop:** edit a `.jsx` or `.css` file, save, **refresh the browser**.
- **To run locally:** serve the folder over HTTP (e.g. `npx serve .` or VS Code
  Live Server). Opening via `file://` works but some browsers block the `.jsx`
  fetches — a local server is safest.
- **To deploy:** upload the folder as‑is. `vercel.json` already sets cache
  headers (assets cached 1yr, HTML 5min). Entry point is `index.html`, which
  redirects to `Budget at a Glance.html`.

Because every `.jsx` shares one global scope, components/data are exposed via
plain top‑level `function`/`const` declarations (and some `Object.assign(window, …)`).
There are no imports/exports.

---

## Pages (the 3 HTML files)

| File | Page | Mounts component | Page‑specific scripts loaded |
|------|------|------------------|------------------------------|
| `Budget at a Glance.html` | **Home** | `App` (`app.jsx`) | — (uses shared files only) |
| `Price Impact.html` | **Price Impact** | `PriceApp` (`price-app.jsx`) | `price-data`, `price-charts`, `price-calc` |
| `Sector Deep Dive.html` | **Sector Deep Dive** | `SectorApp` (`sector-app.jsx`) | `sector-data`, `sector-grid`, `sector-charts` |

`index.html` is just a redirect to the Home page.

**All three pages load these shared files (in order):** `tweaks-panel.jsx` →
`anim-hooks.jsx` → `app-data.jsx` → `app-taka-gdp.jsx` → `app-rest.jsx` →
`relevant-news.jsx`. If you add a new shared component, add its `<script>` tag
to **all three** HTML files in the right order (data/util files before the
components that use them).

---

## Where things live

### Data — edit these to change numbers

All data is hard‑coded as arrays/objects at the **top of** these files (look for
the big `DATA` comment banners):

| Data | File | What it feeds |
|------|------|---------------|
| Taka‑note shares (per ৳100), GDP %, treemap depts, interest payments, news cards, **hero number / nav defaults** (`TWEAK_DEFAULTS`) | `app-data.jsx` | Home page charts + Hero + Nav |
| Per‑sector annual totals (`SECTOR_VALUES`, FY09→FY26), sector list/meta, top‑15 depts (`DEPTS`), implementation rates (`IMPL`) | `sector-data.jsx` | Sector Deep Dive charts |
| Pricier/cheaper items, tax‑revenue donut, subsidy trend, household allocation | `price-data.jsx` | Price Impact charts |
| "Relevant News" links per section | `relevant-news.jsx` | News boxes under each section (see `NEWS.md`) |

Fiscal‑year series are always ordered **FY22→FY26** (home) or **FY09→FY26**
(sector). FY23–FY26 sector values are **mock projections** — marked `// mock — edit`
in `sector-data.jsx`. To update a year, change the number in place.

> Hero total budget (`heroNumber`, e.g. `৳7,97,000`) and the `+x% vs FY25`
> badge live in `TWEAK_DEFAULTS` in `app-data.jsx`.

### Components — edit these to change layout / behaviour

| File | Components / contents |
|------|------------------------|
| `app-data.jsx` | `Nav`, `Hero` (+ all home data) |
| `app-taka-gdp.jsx` | `TakaSection` (the signature ৳100 note), `GDPSection` |
| `app-rest.jsx` | `Treemap`, `DebtSection`, `Stat`, `NewsSection`, `Footer` |
| `app.jsx` | Home page assembly (`App`) + tweak controls |
| `price-data.jsx` | `PriceHero`, `ItemIcon`, `ItemSection` |
| `price-charts.jsx` | `Donut`, `TaxSection`, `SubsidySection` |
| `price-calc.jsx` | `CalcSection` household calculator, `CalcPie` |
| `price-app.jsx` | Price page assembly (`PriceApp`) |
| `sector-grid.jsx` | `Sparkline`, `SectorGridSection`, `ExpandedSection` |
| `sector-charts.jsx` | `HeatmapSection`, `RankingsSection`, `Gauge`, `GaugesSection`, `SectorHero` |
| `sector-app.jsx` | Sector page assembly (`SectorApp`) + auto‑scroll on sector change |
| `relevant-news.jsx` | `RelevantNews`, `RelNewsCard`, link‑preview fetch (microlink.io) |
| `anim-hooks.jsx` | Animation utilities: `CountUp`, `AnimatedRect`, `useInView`, `useCountUp`, `useChartReveal`, `prefersReducedMotion` |
| `tweaks-panel.jsx` | In‑page editor panel (`TweaksPanel`, `useTweaks`, all `Tweak*` controls) |

Charts are hand‑built with **inline SVG + the animation hooks** (no D3 / chart
library). To change a chart's look, edit its component’s SVG markup and the
matching CSS classes.

### Styling — edit these to change design

| File | Scope |
|------|-------|
| `styles.css` | Global **design tokens** (`:root` colors, gradients, motion) + shared layout + **Home** page styles |
| `styles-price.css` | Price Impact page styles |
| `styles-sector.css` | Sector Deep Dive page styles |
| `enhance.css` | Cross‑page polish / enhancements layered on top |
| `loading-screen.css` | The `#app-loader` splash shown before React mounts |

**Brand colors, gradients, fonts and spacing tokens are all CSS variables in
`styles.css` `:root`** — change them there to re‑theme globally. Fonts (Playfair
Display, IBM Plex Serif, Inter, Hind Siliguri) load from Google Fonts in each
HTML `<head>`. Sector/chart colors are also repeated as `color:` fields inside
the data files — update both if recoloring a sector.

### Assets

`assets/` — `logo.svg`, `100_taka_note.jpg`, `bangladesh.mp4` + poster (hero
background video). `news-images/` — drop article images here for the news boxes
(see `NEWS.md`).

---

## The Tweaks Panel (live editor)

`tweaks-panel.jsx` renders a floating panel (toggle on each page) that lets you
live‑edit hero text, active nav, and the expanded sector without touching code.
Values persist via `useTweaks`. The `TWEAK_DEFAULTS` block in `app-data.jsx` is
wrapped in `/*EDITMODE-BEGIN*/ … /*EDITMODE-END*/` markers so it can be written
back programmatically — keep those markers intact.

---

## Common edits — quick recipe

- **Change a budget number:** find it in the relevant `*-data.jsx` file, edit in place, refresh.
- **Re‑theme colors/fonts:** edit `:root` tokens in `styles.css` (+ Google Fonts link in the HTML heads).
- **Add/remove a news article:** edit `RELEVANT_NEWS` in `relevant-news.jsx` — full guide in **`NEWS.md`**.
- **Edit a chart’s layout:** edit its component in the matching `*-charts.jsx` / `app-*.jsx` file + its CSS.
- **Add a new shared component:** declare it in a `.jsx`, then add its `<script type="text/babel">` tag to **all three** HTML files (after its dependencies).
- **Add a whole new page:** copy an existing HTML file, swap the page‑specific scripts, and add a new entry component + `ReactDOM.createRoot(...).render(...)`.

---

## Gotchas

- **No imports** — all files share one global scope. Loading order in the HTML matters; data/util files must come before components that use them.
- **Babel compiles in‑browser** — a JSX syntax error shows in the browser console, not at a build step. Always check the console after edits.
- **FY23–FY26 sector data is mock** — clearly labeled; replace with actuals when published.
- **News auto‑fetch is rate‑limited** (microlink.io, ~50/day) — prefer filling article fields by hand for published pages.
- Each page fires a `window` `app:ready` event after first paint to hide the loader (3.5s fallback in the HTML).
