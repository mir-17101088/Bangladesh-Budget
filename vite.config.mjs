import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { readFileSync, cpSync, existsSync } from "node:fs";
// IMPORTANT: import esbuild from the copy Vite already installs (hoisted in
// node_modules). Declaring a second esbuild version would trigger esbuild's
// "Host version does not match binary version" crash on transformSync.
import { transformSync } from "esbuild";

const ROOT = dirname(fileURLToPath(import.meta.url));

/* ============================================================================
   Page bundles — EXACT load order copied from the original
   <script type="text/babel"> tags in each HTML file.

   These files were authored as CLASSIC scripts that share ONE global lexical
   scope and publish their components/data onto `window`. Several cross-file
   globals (e.g. TWEAK_DEFAULTS in app-data.jsx) are NOT published to `window`
   and only resolve because classic scripts share scope. We therefore
   concatenate each page's files into a SINGLE module (one shared scope) and
   transpile that — rather than importing each file as a separate ES module,
   which would break those unpublished globals. Result: ZERO source edits to
   the app/data files; identical runtime semantics; production React; no Babel.
============================================================================ */
const PAGES = {
  home: [
    "tweaks-panel.jsx", "anim-hooks.jsx", "fiscal-state.jsx",
    "app-data.jsx", "app-taka-gdp.jsx", "app-rest.jsx",
    "relevant-news.jsx", "calc.jsx", "app.jsx",
  ],
  sector: [
    "tweaks-panel.jsx", "anim-hooks.jsx", "fiscal-state.jsx",
    "app-data.jsx", "app-taka-gdp.jsx", "app-rest.jsx",
    "relevant-news.jsx", "sector-data.jsx", "sector-grid.jsx",
    "sector-charts.jsx", "sector-app.jsx",
  ],
  price: [
    "tweaks-panel.jsx", "anim-hooks.jsx", "fiscal-state.jsx",
    "app-data.jsx", "app-taka-gdp.jsx", "app-rest.jsx",
    "relevant-news.jsx", "sector-data.jsx", "sector-charts.jsx",
    "price-data.jsx", "price-charts.jsx", "price-app.jsx",
  ],
};

// Production React/ReactDOM bundled from npm and re-exposed as globals so the
// existing `React.*`, `ReactDOM.createRoot`, and `window.ReactDOM.createPortal`
// call sites keep working unchanged. `vite build` sets NODE_ENV=production, so
// these resolve to React's minified production builds automatically.
const PRELUDE = `
import React from "react";
import * as __ReactDOMClient from "react-dom/client";
import * as __ReactDOMLib from "react-dom";
const ReactDOM = Object.assign({}, __ReactDOMLib, __ReactDOMClient);
window.React = React;
window.ReactDOM = ReactDOM;
`;

function budgetPagesPlugin() {
  const VPREFIX = "virtual:budget-";
  return {
    name: "budget-pages",
    enforce: "pre",
    resolveId(source) {
      const key = source.startsWith(VPREFIX) ? source.slice(VPREFIX.length) : null;
      if (key && PAGES[key]) return "\0" + source;
    },
    load(id) {
      if (!id.startsWith("\0" + VPREFIX)) return null;
      const key = id.slice(("\0" + VPREFIX).length);
      const files = PAGES[key];
      if (!files) return null;
      const raw =
        PRELUDE + "\n" +
        files.map((f) => readFileSync(resolve(ROOT, f), "utf8")).join("\n;\n");
      const { code, map } = transformSync(raw, {
        loader: "jsx",
        jsx: "transform",
        jsxFactory: "React.createElement",
        jsxFragment: "React.Fragment",
        sourcefile: `budget-${key}.jsx`,
        sourcemap: true,
      });
      return { code, map };
    },
  };
}

// The app/data files reference background images, the hero video and the logo
// as plain string paths (e.g. "assets/100_taka_note.jpg"), which Vite does not
// rewrite. Copy those raw asset dirs into the build output verbatim so the
// string paths keep resolving. (Hashed JS/CSS go to /_assets to avoid clashing.)
function copyStaticPlugin() {
  return {
    name: "copy-static-assets",
    closeBundle() {
      const out = resolve(ROOT, "dist");
      for (const dir of ["assets", "news-images"]) {
        const src = resolve(ROOT, dir);
        if (existsSync(src)) cpSync(src, resolve(out, dir), { recursive: true });
      }
      // index.html is a pure static redirect — copy it verbatim rather than
      // letting Vite rewrite its <link rel="canonical"> into a hashed dead-end.
      const indexHtml = resolve(ROOT, "index.html");
      if (existsSync(indexHtml)) cpSync(indexHtml, resolve(out, "index.html"));
    },
  };
}

export default defineConfig({
  base: "./", // relative asset URLs — works from any sub-path or CDN origin
  plugins: [budgetPagesPlugin(), copyStaticPlugin()],
  esbuild: {
    jsxFactory: "React.createElement",
    jsxFragment: "React.Fragment",
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    assetsDir: "_assets",
    sourcemap: true,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      input: {
        "budget-at-a-glance": resolve(ROOT, "Budget at a Glance.html"),
        "sector-deep-dive": resolve(ROOT, "Sector Deep Dive.html"),
        "budget-realities": resolve(ROOT, "Budget Realities.html"),
      },
    },
  },
});
