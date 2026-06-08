const { useState: useStatePrice, useMemo: useMemoPrice } = React;

/* ============================================================
   PRICE IMPACT — DATA  (EDIT THIS FILE TO UPDATE THE PAGE)
   ------------------------------------------------------------
   These are the price-affecting tax / VAT / duty measures from a
   SINGLE budget. Right now that is the FY 2025—26 budget — the one
   currently in force while the country waits for FY 2026—27.

   ▶ GOING LIVE WITH THE FY27 BUDGET — three small edits:
       1. Change  PRICE_FY  below to "FY27".
       2. Replace the items inside PRICIER and CHEAPER with the new
          FY27 items (keep the same shape — see below).
       3. In app-data.jsx, flip  PRELAUNCH  to false (this hides the
          "last year's budget" heads-up note automatically).
     Everything else — the year labels, the item counts, the
     pre-launch note — updates on its own.

   ▶ ITEM SHAPE — only `name` and `change` are required.
       {
         name:   "Cigarettes",                 // REQUIRED — the item
         change: "Excise and SD duties raised.",// REQUIRED — what changed
         cat:    "Tobacco · excise",            // optional — small label
         icon:   "smoke",                       // optional — glyph key (see ItemIcon)
         badge:  "VAT 7.5% → 15%",              // optional — magnitude pill
         note:   "",                            // optional — extra one-liner
       }
     ANY blank field ("") simply does not render, and any item with
     an empty `name` is skipped — so half-filled rows or leftover
     placeholders never break the layout.
============================================================ */

// The budget year these price changes belong to. Change to "FY27"
// (and swap the two arrays below) when the new budget lands.
const PRICE_FY = "FY26";
const PRICE_FY_SPAN = (typeof fyToSpan === "function") ? fyToSpan(PRICE_FY) : PRICE_FY; // → "FY 2025—26"

// Keep only real, filled-in rows; an item without a `name` is treated
// as an empty placeholder and dropped (so it never renders).
const priceValid = (arr) => (arr || []).filter(it => it && it.name && String(it.name).trim());

// ── What got PRICIER (costlier) ──────────────────────────────
const PRICIER = [
  {
    name: "Steel flats & rods", cat: "Mild steel · specific tax", icon: "bar",
    change: "Specific tax on mild-steel products raised by about 20%.",
    badge: "↑ ~20%", note: ""
  },
  {
    name: "Flat construction", cat: "Construction services · VAT", icon: "building",
    change: "VAT on construction-company services raised to 10%, from 7.5%.",
    badge: "VAT 7.5% → 10%", note: ""
  },
  {
    name: "Locally-made phones", cat: "Local assembly · VAT", icon: "phone",
    change: "VAT exemption on local phone production and assembly trimmed; the exact increase was not specified.",
    badge: "", note: ""
  },
  {
    name: "Toiletries & cosmetics", cat: "Hygiene plastics · VAT + customs", icon: "lip",
    change: "VAT on plastic hygiene products and toiletries doubled to 15%, from 7.5%; imported cosmetics also face higher customs valuation.",
    badge: "VAT 7.5% → 15%", note: ""
  },
  {
    name: "Cigarettes", cat: "Tobacco · excise + supplementary duty", icon: "smoke",
    change: "Excise and supplementary duties on cigarettes were raised — among the items the budget made costlier.",
    badge: "", note: ""
  },
  {
    name: "Plastic household goods", cat: "Plasticware · VAT", icon: "bottle",
    change: "VAT on plastic household products doubled to 15%, from 7.5%.",
    badge: "VAT 7.5% → 15%", note: ""
  },

  // ── FY27 placeholder — fill in & duplicate as needed. Empty `name` ⇒ not rendered.
  // { name: "", cat: "", icon: "", change: "", badge: "", note: "" },
];

// ── What got CHEAPER ─────────────────────────────────────────
const CHEAPER = [
  {
    name: "Cancer drugs", cat: "Medicine · duty-free inputs", icon: "pill",
    change: "Duty-free facilities expanded for the raw materials and equipment used to make cancer medicines.",
    badge: "Duty-free", note: ""
  },
  {
    name: "Insulin", cat: "Medicine · duty relief", icon: "syringe",
    change: "Among the items getting cheaper as the budget widened pharmaceutical duty-relief measures.",
    badge: "", note: ""
  },
  {
    name: "Sugar", cat: "Refined sugar · import duty", icon: "sugar",
    change: "Specific import duty on refined sugar cut by ৳500 a tonne, to ৳4,000.",
    badge: "−৳500 / tonne", note: ""
  },
  {
    name: "Sanitary napkins", cat: "Hygiene · VAT", icon: "droplet",
    change: "A local-level VAT exemption was introduced for sanitary napkins.",
    badge: "VAT exempt", note: ""
  },
  {
    name: "Ice cream", cat: "Frozen treats · supplementary duty", icon: "icecream",
    change: "Supplementary duty on ice cream halved to 5%, from 10%.",
    badge: "SD 10% → 5%", note: ""
  },
  {
    name: "Land registration", cat: "Property · registration fee", icon: "doc",
    change: "Land registration charges were reduced.",
    badge: "", note: ""
  },

  // ── FY27 placeholder — fill in & duplicate as needed. Empty `name` ⇒ not rendered.
  // { name: "", cat: "", icon: "", change: "", badge: "", note: "" },
];

/* ============================================================
   RESOURCES DONUT — FY 2025—26  (EDIT THESE NUMBERS TO UPDATE)
   ------------------------------------------------------------
   "Where the budget's money comes from." Source: the FY2025-26
   proposed budget, "Resources Coming From".
   Conversion: 1 billion = 100 crore.  Total = ৳7,90,000 Cr.

   • `pct` drives the chart geometry — each list sums to exactly 100.
   • `cr`  is the published/approximate amount shown to the reader.
   • `group` ("earned" | "borrowed" | "granted") drives the legend
     grouping and the Earned/Borrowed/Granted summary — the editorial
     spine of the chart. Change a segment's group and everything follows.
   • A segment is CLICKABLE only if it has a `drill` key. Today that is
     exclusively Tax Revenue (NBR). No `drill` ⇒ reads, never expands.

   ⟶ GO-LIVE FY27: replace `pct` + `cr` in RESOURCES and in each
     RESOURCE_DRILLDOWNS list, and RESOURCES_TOTAL_CR. Year labels come
     from PRICE_FY / PRICE_FY_SPAN — no need to touch them. A drill whose
     entry is missing or has no items simply stops being clickable.
============================================================ */
const RESOURCES_TOTAL_CR = 790000;            // ৳7,90,000 Cr (Tk 7,900 billion)
const RESOURCES = [
  { key: "nbr", name: "Tax Revenue (NBR)", pct: 63.2, cr: 499280, color: "#00E6D2", group: "earned", drill: "nbr" },
  { key: "domloan", name: "Domestic Loan", pct: 15.8, cr: 124820, color: "#6666FF", group: "borrowed" },
  { key: "forloan", name: "Foreign Loan", pct: 12.2, cr: 96380, color: "#9999FF", group: "borrowed" },
  { key: "nontax", name: "Non-Tax Revenue", pct: 5.8, cr: 45820, color: "#00FFD5", group: "earned" },
  { key: "nonnbr", name: "Tax Revenue (Non-NBR)", pct: 2.4, cr: 18960, color: "#33FFCD", group: "earned" },
  { key: "grants", name: "Foreign Grants", pct: 0.6, cr: 4740, color: "#FFB700", group: "granted" },
];

// How each group reads in the summary + legend. Order = display order.
const RESOURCE_GROUPS = [
  { key: "earned", label: "Earned", note: "tax + non-tax revenue the state collects itself" },
  { key: "borrowed", label: "Borrowed", note: "domestic + foreign loans to be repaid" },
  { key: "granted", label: "Granted", note: "foreign grants — money that needn't be repaid" },
];

// Drill-downs keyed by the `drill` value above. Only "nbr" exists today.
// `pct` here is share OF NBR (sums to 100), not of the whole budget.
const RESOURCE_DRILLDOWNS = {
  nbr: {
    label: "Tax Revenue (NBR)",
    short: "NBR",
    total_cr: 499280,                          // ৳4,99,280 Cr (budget doc: Tk 4,990 billion)
    items: [
      { name: "VAT", pct: 37.8, cr: 188728, color: "#00E6D2" },
      { name: "Income Tax", pct: 36.5, cr: 182237, color: "#FF3366" },
      { name: "Supplementary Duty", pct: 13.7, cr: 68401, color: "#FFCC00" },
      { name: "Import Duty", pct: 10.3, cr: 51426, color: "#AA00FF" },
      { name: "Others", pct: 1.7, cr: 8488, color: "#3399FF" },
    ],
  },
};

// ── Number formatting (Bangladeshi/Indian grouping) ──────────
// fmtCr(499280)  → "৳4,99,280 Cr"   (exact, published amount)
// fmtLakhCr(499280) → "৳4.99L Cr"   (compact lakh-crore, for the hero number)
const fmtCr = (n) => "৳" + Math.round(n).toLocaleString("en-IN") + " cr";
const fmtLakhCr = (n) => "৳" + (n / 100000).toFixed(2) + "lakh cr";

// ⟶ GO-LIVE FY27 (price): add the FY27 subsidy share (per ৳100). Status/styling
// is derived from BUDGET — no `future` flag needed.
const SUBSIDY = [
  { fy: "FY22", v: 5.8 },
  { fy: "FY23", v: 8.4, delta: "+45%" },
  { fy: "FY24", v: 11.1, delta: "+32%" },
  { fy: "FY25", v: 11.1, delta: "flat" },
  { fy: "FY26", v: 11.3 },
  { fy: "FY27", v: null },
];

/* ============================================================
   PAGE HERO
============================================================ */
function PriceHero() {
  const upN = priceValid(PRICIER).length;
  const dnN = priceValid(CHEAPER).length;
  const prelaunch = (typeof PRELAUNCH !== "undefined") ? PRELAUNCH : false;
  const nextSpan = (typeof fyToSpan === "function") ? fyToSpan("FY27") : "FY 2026—27";
  return (
    <section className="page-hero" data-screen-label="01 Page Hero">
      <div className="wrap">
        <div className="crumb">
          <span>Budget at a Glance</span><span style={{ color: "var(--g7)" }}>·</span>
          <span style={{ color: "var(--g7)" }}>·</span><span>{PRICE_FY_SPAN}</span>
        </div>
        <h1>What got pricier, <em>what got cheaper</em></h1>
        <p className="dek">
          Every budget quietly rewrites a household's monthly bill. Here are some of the items the
          {" "}<strong style={{ color: "#fff", fontStyle: "normal", fontWeight: 600 }}>{PRICE_FY_SPAN}</strong> budget
          made costlier or cheaper — and who ultimately pays.
        </p>

        {prelaunch && (
          <div className="price-context" role="note">
            <span className="pc-tag">Note</span>
            <p>
              These changes are from the current <strong>{PRICE_FY_SPAN}</strong> budget. Bangladesh's
              {" "}<strong>{nextSpan}</strong> budget will be presented on <strong>11 June 2026</strong> — this
              page will be updated with the new figures within hours of the announcement.
            </p>
          </div>
        )}

        <div className="page-hero-stats">
          <div className="phs-cell red" onClick={() => document.querySelector('.s-pricier')?.scrollIntoView({ behavior: 'smooth' })}>
            <div className="l">Costlier — selected</div>
            <div className="n"><CountUp value={upN} /></div>
            <div className="s">higher VAT, excise &amp; duties — and many more</div>
          </div>
          <div className="phs-cell green" onClick={() => document.querySelector('.s-cheaper')?.scrollIntoView({ behavior: 'smooth' })}>
            <div className="l">Cheaper — selected</div>
            <div className="n"><CountUp value={dnN} /></div>
            <div className="s">cuts, exemptions &amp; waivers — and many more</div>
          </div>
          <div className="phs-cell" onClick={() => document.querySelector('.s-tax')?.scrollIntoView({ behavior: 'smooth' })}>
            <div className="l">Tax revenue target</div>
            <div className="n">৳<CountUp value={4.99} decimals={2} /> lakh cr</div>
            <div className="s">NBR + non-NBR · 65.6% of budget</div>
          </div>
          <div className="phs-cell" onClick={() => document.querySelector('.s-subsidy')?.scrollIntoView({ behavior: 'smooth' })}>
            <div className="l">Subsidy bill</div>
            <div className="n">৳<CountUp value={11.3} decimals={1} /></div>
            <div className="s">per ৳100 spent · 2× since FY22</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   ITEM ICONS — simple sealed glyphs
============================================================ */
function ItemIcon({ kind, color }) {
  const c = color || "currentColor";
  const props = { width: 28, height: 28, viewBox: "0 0 24 24", fill: "none", stroke: c, strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (kind) {
    case "smoke": return <svg {...props}><rect x="3" y="11" width="14" height="4" rx="0.5" /><path d="M17 11h2v4h-2" /><path d="M5 8c0-2 2-2 2-4M9 8c0-2 2-2 2-4" /></svg>;
    case "phone": return <svg {...props}><rect x="6" y="3" width="12" height="18" rx="2" /><circle cx="12" cy="18" r="0.6" fill={c} /></svg>;
    case "car": return <svg {...props}><path d="M3 14h18l-2-5H5l-2 5z" /><path d="M3 14v4M21 14v4" /><circle cx="7" cy="18" r="1.6" /><circle cx="17" cy="18" r="1.6" /></svg>;
    case "snack": return <svg {...props}><path d="M5 7h14l-1.5 12h-11L5 7z" /><path d="M9 11v5M12 11v5M15 11v5" /></svg>;
    case "soda": return <svg {...props}><path d="M7 4h10l-1 16H8L7 4z" /><path d="M8 8h8M10 4V2M14 4V2" /></svg>;
    case "lip": return <svg {...props}><path d="M7 10c1-3 3-3 5-1 2-2 4-2 5 1l-2 8H9l-2-8z" /><path d="M11 14h2" /></svg>;
    case "shirt": return <svg {...props}><path d="M7 4l-3 4 2 2v10h12V10l2-2-3-4-3 2c-1 1-3 1-4 0L7 4z" /></svg>;
    case "tractor": return <svg {...props}><circle cx="7" cy="17" r="3" /><circle cx="17" cy="17" r="2" /><path d="M4 13V8h7l2 4h6v5" /><path d="M11 8V5h3" /></svg>;
    case "sun": return <svg {...props}><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" /></svg>;
    case "pill": return <svg {...props}><rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-25 12 12)" /><path d="M9 8l4 8" transform="rotate(-25 12 12)" /></svg>;
    case "book": return <svg {...props}><path d="M4 4h7v16H4z" /><path d="M11 4h9v16h-9" /><path d="M11 8h6M11 12h6" /></svg>;
    case "bar": return <svg {...props}><rect x="3" y="10" width="18" height="4" rx="0.5" /><path d="M6 10V8M10 10V8M14 10V8M18 10V8" /></svg>;
    case "building": return <svg {...props}><path d="M3 21h18" /><path d="M5 21V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v16" /><path d="M14 21V10h4a1 1 0 0 1 1 1v10" /><path d="M8 8h1M11 8h1M8 12h1M11 12h1M8 16h1M11 16h1" /></svg>;
    case "bottle": return <svg {...props}><path d="M10 2h4v2.5l1.1 2.1a3 3 0 0 1 .4 1.5V20a1 1 0 0 1-1 1H9.5a1 1 0 0 1-1-1V8.1a3 3 0 0 1 .4-1.5L10 4.5V2z" /><path d="M9 12h6" /></svg>;
    case "syringe": return <svg {...props}><path d="M18 3l3 3" /><path d="M15.5 5.5l3 3" /><path d="M5 19l-2 2" /><path d="M14 7l3 3-8.5 8.5L5 19.5l1-3.5L14 7z" /><path d="M8 13l3 3" /></svg>;
    case "sugar": return <svg {...props}><rect x="3.5" y="11.5" width="7" height="7" rx="1" /><rect x="13.5" y="11.5" width="7" height="7" rx="1" /><rect x="8.5" y="4.5" width="7" height="7" rx="1" /></svg>;
    case "droplet": return <svg {...props}><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" /></svg>;
    case "icecream": return <svg {...props}><path d="M8 9a4 4 0 0 1 8 0" /><path d="M7.5 10h9l-4.5 11-4.5-11z" /><path d="M9.6 14h4.8" /></svg>;
    case "doc": return <svg {...props}><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v4h4" /><path d="M10 13h5M10 16h5" /></svg>;
    default: return null;
  }
}

/* ============================================================
   PRICIER + CHEAPER sections
============================================================ */
function ItemSection({ kind, items }) {
  const up = kind === "up";
  const all = priceValid(items);                 // drop empty / placeholder rows
  const PREVIEW = 6;
  const [expanded, setExpanded] = React.useState(false);
  const hasMore = all.length > PREVIEW;
  const visible = !hasMore || expanded ? all : all.slice(0, PREVIEW);
  const accent = up ? "#ff7676" : "#5fe093";
  const n = all.length;

  // No real items yet (e.g. between budgets) → render nothing.
  if (n === 0) return null;

  return (
    <section className={"s " + (up ? "s-pricier" : "s-cheaper")} data-screen-label={(up ? "02" : "03") + " " + (up ? "Pricier" : "Cheaper")}>
      <div className="wrap">
        <div className="titleblock">
          <div className={"arrow " + (up ? "up" : "down")}>
            {up ? "↑" : "↓"}
          </div>
          <div className="text">
            <span className="eyebrow" style={{ color: accent }}>
              {up ? "Up the slope" : "Down the slope"}
            </span>
            <h2>
              What got {up ? <span className="acc-red">pricier</span> : <span className="acc-grn">cheaper</span>}
            </h2>
            <p className="dek">
              {up
                ? "A selection of the items the " + PRICE_FY_SPAN + " budget made costlier — through higher VAT, excise, specific tax or customs. Many more were affected than we show here."
                : "A selection of the items the " + PRICE_FY_SPAN + " budget made cheaper — through duty cuts, exemptions and waivers on essentials. Many more were affected than we show here."}
            </p>
          </div>
        </div>

        <div className="item-grid">
          {visible.map((it, i) => (
            <article key={i} className={"item-card " + (up ? "up" : "down")}>
              {it.icon && <div className="item-icon"><ItemIcon kind={it.icon} color={accent} /></div>}
              <div className="item-name">{it.name}</div>
              {it.cat && <div className="item-sub">{it.cat}</div>}
              {it.change && <div className="item-duty">{it.change}</div>}
              {(it.badge || it.note) && (
                <div className="item-foot">
                  {it.badge && <span className={"item-badge " + (up ? "up" : "down")}>{it.badge}</span>}
                  {it.note && <span className="item-spark">{it.note}</span>}
                </div>
              )}
            </article>
          ))}
        </div>

        {hasMore && (
          <div className="see-more-wrap">
            <button
              className={"see-more " + (up ? "up" : "down")}
              onClick={() => setExpanded(v => !v)}
              aria-expanded={expanded}>
              <span className="see-more-label">
                {expanded
                  ? "Show fewer items"
                  : "Show " + (all.length - PREVIEW) + " more item" + (all.length - PREVIEW === 1 ? "" : "s")}
              </span>
              <span className={"see-more-chev " + (expanded ? "up" : "")}>↓</span>
            </button>
          </div>
        )}

        <RelevantNews items={RELEVANT_NEWS[up ? "price_pricier" : "price_cheaper"]} accent={accent} />
      </div>
    </section>
  );
}

Object.assign(window, {
  PRICIER, CHEAPER, SUBSIDY, PriceHero, ItemSection, ItemIcon,
  RESOURCES, RESOURCES_TOTAL_CR, RESOURCE_GROUPS, RESOURCE_DRILLDOWNS, fmtCr, fmtLakhCr,
});
