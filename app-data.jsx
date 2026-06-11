const { useState, useEffect, useMemo, useRef } = React;

/* ============================================================
   DATA  — EDIT THIS FILE TO UPDATE NUMBERS
   ------------------------------------------------------------
   Every chart on the home page reads from the arrays below.
   The series order is always: FY22, FY23, FY24, FY25, FY26.
   To update next year's numbers, just change the values in place.
============================================================ */

// ────────────────────────────────────────────────────────────
// 1. Taka-note shares — "per ৳100 spent" for each sector
//    Each series is in fiscal-year order: [FY22, FY23, FY24, FY25, FY26]
//    fy26 should match the last entry of the series.
// ────────────────────────────────────────────────────────────
/* ⟶ GO-LIVE FY27 (home): replace each trailing `null` in TAKA_SECTORS_RAW with
   the FY27 per-৳100 share. Filling these flips the WHOLE site to Proposed FY27 /
   Revised FY26 / Actual FY25 (this Taka series is the master trigger). Also fill
   GDP_DATA + INTEREST_DATA below, and the FY27 slots in sector-data.jsx /
   price-data.jsx. See README "Going live with a new budget year". */
const TAKA_FY = ["FY22", "FY23", "FY24", "FY25", "FY26", "FY27"];
const TAKA_SECTORS_RAW = [
  //                                                                  [FY22, FY23, FY24, FY25, FY26, FY27]
  { key: "publicadmin", name: "Public Administration", color: "#997B50", series: [7.6, 7.3, 7.3, 7.3, 9.1, 15.08] },
  { key: "interest", name: "Interest Payments", color: "#C60001", series: [11.4, 11.9, 12.4, 14.2, 15.5, 13.6] },
  { key: "education", name: "Education & Technology", color: "#0185C6", series: [15.7, 14.7, 13.7, 13.9, 14.0, 13.1] },
  { key: "transport", name: "Transport & Communication", color: "#B0832B", series: [11.7, 11.8, 11.3, 10.2, 8.8, 6.5] },
  { key: "agri", name: "Agriculture", color: "#019933", series: [3.6, 3.8, 3.5, 3.9, 3.7, 3.2] },
  { key: "localgov", name: "Local Government & Rural Development", color: "#96CEB4", series: [7.0, 6.6, 6.5, 6.0, 5.7, 4.6] },
  { key: "social", name: "Social Security & Welfare", color: "#45B7D1", series: [5.0, 4.9, 4.6, 4.8, 4.7, 5.8] },
  { key: "health", name: "Health", color: "#4ECDC4", series: [5.4, 5.4, 5.0, 5.2, 5.3, 6.7] },
  { key: "defence", name: "Defence", color: "#7D0066", series: [5.5, 5.0, 4.6, 4.3, 4.3, 3.8] },
  { key: "publicorder", name: "Public Order & Safety", color: "#FFEAA7", series: [4.7, 4.4, 4.1, 4.0, 4.1, 3.5] },
  { key: "others", name: "Others", color: "#b63495ff", series: [7.3, 7.3, 7.0, 6.7, 6.1, 6.8] },

  { key: "energy", name: "Energy & Power", color: "#ffda35ff", series: [4.6, 3.9, 4.6, 3.8, 2.9, 1.9] },
  { key: "subsidies", name: "Subsidies & Incentives", color: "#86ff35ff", series: [5.8, 8.4, 11.1, 11.1, 11.3, 9.6] },
  { key: "pension", name: "Pension", color: "#FF6B35", series: [4.7, 4.6, 4.3, 4.6, 4.5, 3.8] },
];

// Years that have data across EVERY sector — the trailing null FY27 placeholder
// is dropped until real numbers are pasted in (see GO-LIVE banner above).
const TAKA_PRESENT = presentFromSeries(TAKA_FY, TAKA_SECTORS_RAW.map(s => s.series));
// The single global fiscal state, read by every page (app-data loads first).
const BUDGET = computeFiscalState(TAKA_PRESENT);
window.BUDGET = BUDGET;

const TAKA_SECTORS = TAKA_SECTORS_RAW.map(s => {
  const valueAt = (fy) => s.series[TAKA_FY.indexOf(fy)];
  return {
    ...s,
    valueAt,
    actual: valueAt(BUDGET.actual),
    revised: valueAt(BUDGET.revised),
    proposed: valueAt(BUDGET.proposed),
  };
}).sort((a, b) => b.proposed - a.proposed);

// ────────────────────────────────────────────────────────────
// 2. Total budget and Budget as % of GDP — full panel, FY09 → FY26
//    Append new years here as data is released.
// ────────────────────────────────────────────────────────────
const TOTAL_BUDGET_BY_YEAR = {
  FY09: 88064, FY10: 101608, FY11: 128268, FY12: 152428, FY13: 174013,
  FY14: 188208, FY15: 204380, FY16: 238433, FY17: 269499, FY18: 321862,
  FY19: 391690, FY20: 420160, FY21: 460160, FY22: 518188, FY23: 573857,
  FY24: 611392, FY25: 744000, FY26: 790000, FY27: 938000,
};

window.TOTAL_BUDGET_BY_YEAR = TOTAL_BUDGET_BY_YEAR;

const GDP_DATA = [
  { fy: "FY09", pct: 14.3 }, { fy: "FY10", pct: 14.7 }, { fy: "FY11", pct: 16.3 },
  { fy: "FY12", pct: 16.7 }, { fy: "FY13", pct: 16.8 }, { fy: "FY14", pct: 15.9 },
  { fy: "FY15", pct: 13.5 }, { fy: "FY16", pct: 13.8 }, { fy: "FY17", pct: 13.8 },
  { fy: "FY18", pct: 14.4 }, { fy: "FY19", pct: 15.4 }, { fy: "FY20", pct: 15.0 },
  { fy: "FY21", pct: 14.5 }, { fy: "FY22", pct: 13.1 }, { fy: "FY23", pct: 12.9 },
  // ── edit / extend below ─────────────────────────────────
  { fy: "FY24", pct: 12.2 }, { fy: "FY25", pct: 13.4 }, { fy: "FY26", pct: 12.7 },
  { fy: "FY27", pct: 13.7 }, // ⟶ GO-LIVE FY27: budget as % of GDP
];

// (department, % of total, parent sector color)
const TREEMAP = [
  { name: "Domestic Interest", pct: 11.19, c: "#C60001", parent: "Interest" },
  { name: "Finance Division", pct: 21.56, c: "#997B50", parent: "Public Services" },
  { name: "Local Government Division", pct: 4.29, c: "#96CEB4", parent: "Local Govt" },
  { name: "Defence Ministry", pct: 4.30, c: "#7D0066", parent: "Defence" },


  { name: "Secondary & Higher Education Division", pct: 6.11, c: "#0185C6", parent: "Education" },
  { name: "Agriculture Ministry", pct: 3.08, c: "#019933", parent: "Agriculture" },

  { name: "Power Division", pct: 1.60, c: "#FF6B35", parent: "Energy" },
  { name: "Primary & Mass Education Ministry", pct: 4.98, c: "#0185C6", parent: "Education" },
  { name: "Road Transport & Highways Division", pct: 3.94, c: "#B0832B", parent: "Transport" },
  { name: "Public Security Division", pct: 3.32, c: "#FFEAA7", parent: "Public Order" },
  { name: "Health Services Division", pct: 5.27, c: "#4ECDC4", parent: "Health" },
  { name: "Foreign Interest", pct: 2.40, c: "#C60001", parent: "Interest" },
  { name: "Railway Ministry", pct: 1.06, c: "#4ECDC4", parent: "Transport" },

  { name: "Water Resources Ministry", pct: 1.12, c: "#019933", parent: "Agriculture" },
  { name: "Science & Technology Ministry", pct: 1.93, c: "#0185C6", parent: "Education" },
  { name: "Social Welfare Ministry", pct: 3.25, c: "#45B7D1", parent: "Social Security" },
  { name: "Disaster Management & Relief Ministry", pct: 1.10, c: "#45B7D1", parent: "Social Security" },
  { name: "Technical & Madrasa Education Division", pct: 1.97, c: "#0185C6", parent: "Education" },

  { name: "Bridges Division", pct: 0.31, c: "#B0832B", parent: "Transport" },
  { name: "Liberation War Affairs Ministry", pct: 0.80, c: "#45B7D1", parent: "Social Security" },
  { name: "Housing & Public Works Ministry", pct: 0.54, c: "#A8E6CF", parent: "Housing" },
  { name: "Food Ministry", pct: 0.95, c: "#997B50", parent: "Social Security" },



  { name: "Shipping Ministry", pct: 0.97, c: "#C60001", parent: "Transport" },
  { name: "Women & Children's Affairs Ministry", pct: 0.55, c: "#997B50", parent: "Social Security" },
  { name: "Civil Aviation & Tourism Ministry", pct: 0.20, c: "#96CEB4", parent: "Transport" },
  { name: "Medical Education & Family Welfare Division", pct: 1.44, c: "#7D0066", parent: "Health" },


  { name: "EC Secretariat", pct: 0.47, c: "#0185C6", parent: "Public Services" },
  { name: "Public Administration Ministry", pct: 0.53, c: "#019933", parent: "Public Services" },

  { name: "Fisheries & Livestock Ministry", pct: 0.29, c: "#FF6B35", parent: "Agriculture" },
  { name: "Security Services Division", pct: 0.51, c: "#0185C6", parent: "Public Order" },
  { name: "Financial Institutions Division", pct: 0.38, c: "#B0832B", parent: "Public Services" },
  { name: "PMO", pct: 0.41, c: "#FFEAA7", parent: "Public Services" },
  { name: "Posts & Telecommunication Division", pct: 0.23, c: "#4ECDC4", parent: "Transport" },
  { name: "Religious Affairs Ministry", pct: 0.32, c: "#C60001", parent: "Culture" },
  { name: "Industries Ministry", pct: 0.18, c: "#4ECDC4", parent: "Industry" },

  { name: "Information & Communication Technology Division", pct: 0.22, c: "#019933", parent: "Education" },
  { name: "Environment, Forest & Climate Change Ministry", pct: 0.24, c: "#0185C6", parent: "Agriculture" },
  { name: "Other Services (Defence)", pct: 0.20, c: "#45B7D1", parent: "Defence" },
  { name: "Land Ministry", pct: 0.26, c: "#45B7D1", parent: "Agriculture" },
  { name: "IRD", pct: 0.50, c: "#0185C6", parent: "Public Services" },

  { name: "ERD", pct: 0.08, c: "#B0832B", parent: "Public Services" },
  { name: "Law & Justice Division", pct: 0.23, c: "#45B7D1", parent: "Public Order" },
  { name: "Ctg Hill Tracts Ministry", pct: 0.16, c: "#A8E6CF", parent: "Local Govt" },
  { name: "Youth & Sports Ministry", pct: 0.28, c: "#997B50", parent: "Culture" },


  { name: "Energy & Mineral Resources Division", pct: 0.25, c: "#C60001", parent: "Energy" },
  { name: "Rural development & Cooperative Division", pct: 0.12, c: "#997B50", parent: "Local Govt" },
  { name: "Foreign Affairs Ministry", pct: 0.20, c: "#000000ff", parent: "Public Services" },
  { name: "Information & Broadcasting Ministry", pct: 0.13, c: "#7D0066", parent: "Culture" },


  { name: "Cultural Affairs Ministry", pct: 0.09, c: "#0185C6", parent: "Culture" },
  { name: "Expatriates' Welfare & Overseas Employment Ministry", pct: 0.09, c: "#019933", parent: "Industry" },

  { name: "Statistics", pct: 0.07, c: "#FF6B35", parent: "Public Services" },
  { name: "Textiles & Jute Ministry", pct: 0.05, c: "#0185C6", parent: "Industry" },
  { name: "Commerce Ministry", pct: 0.04, c: "#B0832B", parent: "Industry" },
  { name: "Bangladesh Parliament", pct: 0.03, c: "#FFEAA7", parent: "Public Services" },
  { name: "Labour & Employment Ministry", pct: 0.05, c: "#4ECDC4", parent: "Industry" },
  { name: "Supreme Court", pct: 0.03, c: "#C60001", parent: "Public Order" },
  { name: "Implementation Monitoring & Evaluation Division", pct: 0.02, c: "#4ECDC4", parent: "Public Services" },

  { name: "ACC", pct: 0.02, c: "#019933", parent: "Public Order" },
  { name: "Planning Division", pct: 3.86, c: "#0185C6", parent: "Public Services" },
  { name: "PSC", pct: 0.01, c: "#45B7D1", parent: "Public Services" },
  { name: "Cabinet Division", pct: 0.01, c: "#45B7D1", parent: "Public Services" },
  { name: "Legislative and Parliamentary Affairs Division", pct: 0.01, c: "#0185C6", parent: "Public Order" },

  { name: "Armed Forces Division", pct: 0.001, c: "#B0832B", parent: "Defence" },
  { name: "President's Office", pct: 0.001, c: "#45B7D1", parent: "Public Services" },

];

// ────────────────────────────────────────────────────────────
// 3. Government interest payments — d = domestic, f = foreign (in Crore Taka)
//    FY23–FY26 are MOCK values; replace as actuals are published.
// ────────────────────────────────────────────────────────────
const INTEREST_DATA = [
  { fy: "FY09", d: 13839, f: 1341 },
  { fy: "FY10", d: 13497, f: 1371 },
  { fy: "FY11", d: 14200, f: 1423 },
  { fy: "FY12", d: 18803, f: 1548 },
  { fy: "FY13", d: 22322, f: 1593 },
  { fy: "FY14", d: 26601, f: 1604 },
  { fy: "FY15", d: 29436, f: 1537 },
  { fy: "FY16", d: 31468, f: 1646 },
  { fy: "FY17", d: 33249, f: 1841 },
  { fy: "FY18", d: 38160, f: 3605 },
  { fy: "FY19", d: 46015, f: 3446 },
  { fy: "FY20", d: 53995, f: 4318 },
  { fy: "FY21", d: 66319, f: 4287 },
  { fy: "FY22", d: 73225, f: 4554 },
  // ── edit / extend below ─────────────────────────────────
  { fy: "FY23", d: 82670, f: 9437 },
  { fy: "FY24", d: 99606, f: 14984 },
  { fy: "FY25", d: 118311, f: 17812 },
  { fy: "FY26", d: 105000, f: 22000 },
  { fy: "FY27", d: 105000, f: 22500 }, // ⟶ GO-LIVE FY27: domestic / foreign interest (Crore Tk)
];

const NEWS = [
  {
    tag: "ANALYSIS", tagColor: "#0185C6", c1: "#0d2847", c2: "#0185C6",
    headline: "Public administration leaps to ৳23.5 of every ৳100 — what's behind the spike?",
    dek: "FY26 reclassifies several line items into the public-administration bucket. Here is what we know.",
    date: "Jun 5, 2025", author: "Mahmudul Hasan", read: "8 min read"
  },
  {
    tag: "POLICY", tagColor: "#B0832B", c1: "#3a2a15", c2: "#B0832B",
    headline: "Interest payments now consume ৳15.4 of every taka — the trap of debt",
    dek: "Domestic interest is up sixfold since FY09. Foreign interest has grown even faster.",
    date: "Jun 5, 2025", author: "Tasnim Rahman", read: "12 min read"
  },
  {
    tag: "BUSINESS", tagColor: "#019933", c1: "#0a2818", c2: "#019933",
    headline: "Subsidy bill nearly doubles in three years as power and fertiliser costs balloon",
    dek: "FY22 subsidies stood at ৳5.8. By FY25 the share had climbed to ৳11.",
    date: "Jun 4, 2025", author: "Refaul Karim", read: "6 min read"
  },
  {
    tag: "EDITORIAL", tagColor: "#7D0066", c1: "#2a0a22", c2: "#7D0066",
    headline: "A budget of compression: education and energy lose their margins",
    dek: "Two pillars of long-run growth are quietly being squeezed. The cost will not show until later.",
    date: "Jun 4, 2025", author: "The Editorial Board", read: "4 min read"
  },
  {
    tag: "OPINION", tagColor: "#C60001", c1: "#2a0508", c2: "#C60001",
    headline: "The 97% implementation rate hides a story of compressed ambition",
    dek: "When you spend everything you promise, you have probably promised too little.",
    date: "Jun 3, 2025", author: "Dr. Selima Ahmed", read: "9 min read"
  },
  {
    tag: "EXPLAINER", tagColor: "#0185C6", c1: "#0d2847", c2: "#45B7D1",
    headline: "What is a 'proposed' budget, and why does it keep growing 14% a year?",
    dek: "A short reader on how Bangladesh's budget is drafted, debated, and rarely shrunk.",
    date: "Jun 3, 2025", author: "Digital Team", read: "5 min read"
  },
];

/* ============================================================
   NEWS FEED — Load from API and replace static fallback
============================================================ */
const NEWS_FEED_API_URL = "/api/news";

function mapFeedItem(n, index) {
  const colors = ["#0185C6", "#B0832B", "#019933", "#7D0066", "#C60001", "#45B7D1"];
  const [c1, c2] = (() => {
    const pairs = [
      ["#0d2847", "#0185C6"],
      ["#3a2a15", "#B0832B"],
      ["#0a2818", "#019933"],
      ["#2a0a22", "#7D0066"],
      ["#2a0508", "#C60001"],
      ["#0d3f47", "#45B7D1"],
    ];
    return pairs[index % pairs.length];
  })();
  return {
    tag: n.category || "NEWS",
    tagColor: colors[index % colors.length],
    c1,
    c2,
    headline: n.title || "",
    dek: n.excerpt || n.description || "",
    date: n.created || "",
    author: n.author || "The Daily Star",
    read: "Read article →",
    url: n.link_url || "",
    image: n.image_landscape || n.image_url || null,
  };
}

function loadNewsFeedRemainder() {
  console.log("[app-data] fetching news feed from", NEWS_FEED_API_URL);
  fetch(NEWS_FEED_API_URL, { headers: { Accept: "application/json" } })
    .then((r) => {
      console.log("[app-data] response status:", r.status, r.ok);
      if (!r.ok) throw new Error("News feed request failed: " + r.status);
      return r.json();
    })
    .then((j) => {
      console.log("[app-data] API response:", j);
      const items = Array.isArray(j && j.data) ? j.data : [];
      console.log("[app-data] total items:", items.length);
      if (items.length === 0) return;
      const mapped = items.map((n, i) => mapFeedItem(n, i));
      NEWS.splice(0, NEWS.length, ...mapped);
      window.dispatchEvent(new Event("news-feed:updated"));
    })
    .catch((e) => {
      console.error("[app-data] fetch error:", e);
    });
}

loadNewsFeedRemainder();

/* ============================================================
   LAUNCH FLAG — flip to false once FY27 budget data is entered.
   true  = show the pre-launch hero (countdown to 11 Jun 2026)
   false = show the normal proposed-budget hero
============================================================ */
const PRELAUNCH = false;
window.PRELAUNCH = PRELAUNCH;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "heroNumber": "৳9,38,000",
  "heroUnit": "crore",
  "heroDelta": "+18.7% vs FY26",
  "activeNav": "Home",
  "gradient": "navy",
  "showStrip": true
}/*EDITMODE-END*/;

/* ============================================================
   NAV
============================================================ */
function Nav({ active }) {
  const host = window.location.hostname;
  const isLocal =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host === "0.0.0.0" ||
    host.endsWith(".local") ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);
  let basePath = window.location.pathname;
  basePath = basePath.replace(/(?:index\.html|budget-realities\.html|sector-deep-dive\.html)$/, "");
  basePath = basePath.replace(/(?:budget-realities|sector-deep-dive)\/$/, "");
  if (!basePath.endsWith("/")) basePath += "/";

  const routes = isLocal
    ? {
      home: basePath,
      sector: basePath + "sector-deep-dive/",
      realities: basePath + "budget-realities/",
    }
    : {
      home: "/",
      sector: "/sector-deep-dive",
      realities: "/budget-realities",
    };

  const links = [
    { name: "Home", href: routes.home },
    { name: "Sector Deep Dive", href: routes.sector },
    { name: "Budget Realities", href: routes.realities },
  ];
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setProgress(max > 0 ? Math.min(1, h.scrollTop / max) : 0);
      setScrolled(h.scrollTop > 24);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, []);
  return (
    <div className={"nav" + (scrolled ? " scrolled" : "")}>
      <div className="nav-accent" aria-hidden="true"></div>
      <div className="wrap nav-inner">
        <a href={routes.home} className="nav-brand">
          <span className="nav-mark" aria-hidden="true">৳</span>
          <img src="assets/logo.svg" alt="The Daily Star" />
          <span className="nav-divider"></span>
          <span className="nav-section">Budget at a Glance</span>
        </a>
        <div className="nav-links">
          {links.map(l => (
            <a key={l.name} href={l.href} className={"nav-link " + (l.name === active ? "active" : "")}>{l.name}</a>
          ))}
        </div>
        <span className="nav-badge"><span className="nav-live-dot" aria-hidden="true"></span>Budget {BUDGET.proposed}</span>
      </div>
      <div className="nav-progress" aria-hidden="true" style={{ transform: `scaleX(${progress})` }}></div>
    </div>
  );
}

/* ============================================================
   HERO
============================================================ */
function Hero({ tweaks }) {
  const numStr = (tweaks.heroNumber || "").replace(/[^\d.]/g, "");
  const heroNum = parseFloat(numStr) || 0;
  const heroPrefix = (tweaks.heroNumber || "").match(/^[^\d]*/)?.[0] || "";
  return (
    <section className="hero" data-screen-label="01 Hero">
      <div className="hero-bg">
        <video
          className="hero-video"
          src="assets/bangladesh.mp4"
          poster="assets/bangladesh-poster.webp"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        ></video>
        <div className="hero-bg-tint"></div>
        <div className="hero-bg-vignette"></div>
      </div>
      <div className="hero-dots"></div>
      <div className="hero-glow"></div>
      <div className="hero-taka-float" aria-hidden="true">
        <span>৳</span><span>৳</span><span>৳</span><span>৳</span><span>৳</span><span>৳</span>
      </div>

      <div className="hero-content">
        <div className="hero-fy-badge">FY 2026-27</div>
        <h1 className="hero-title">Bangladesh National Budget</h1>
        <div className="hero-num-wrapper">
          <div className="hero-num">
            {tweaks.heroNumber}
            <span className="unit">{tweaks.heroUnit}</span>
          </div>
          <div className="hero-num-glow-intense" aria-hidden="true"></div>
        </div>
        <div className="hero-cap">Total proposed expenditure — the largest in Bangladesh's history</div>
        <div className="hero-pills">
          <span className="pill green"><span className="dot"></span>{tweaks.heroDelta}</span>
          <span className="pill blue"><span className="dot"></span>13.7% of GDP</span>
          <span className="pill purple"><span className="dot"></span>64.4% Tax Revenue</span>
        </div>
      </div>

      {tweaks.showStrip && (
        <div className="hero-strip">

          <div className="wrap hero-strip-inner">
            {[
              { key: "publicadmin", lbl: "Public administration" },
              { key: "interest", lbl: "Interest payments" },
              { key: "education", lbl: "Education & tech" },
              { key: "transport", lbl: "Transport" },
            ].map(({ key, lbl }) => {
              const s = TAKA_SECTORS.find(x => x.key === key);
              const delta = (s.proposed != null && s.revised != null) ? +(s.proposed - s.revised).toFixed(1) : 0;
              const cls = delta > 0 ? "" : delta < 0 ? "red" : "flat";
              const arrow = delta > 0 ? "▲ +" + delta.toFixed(1) : delta < 0 ? "▼ −" + Math.abs(delta).toFixed(1) : "— flat";
              return (
                <div className="hero-strip-cell" key={key}>
                  <div className="lbl">{lbl}</div>
                  <div className="num"><CountUp value={s.proposed} decimals={1} prefix="৳" alwaysOn={true} /> <span className={"delta " + cls}>{arrow}</span></div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </section>
  );
}

/* ============================================================
   PRE-LAUNCH HERO  — shown when PRELAUNCH === true.
   Frames the site as a historical budget archive and counts down
   to the FY 2026—27 National Budget being presented in Parliament.
   No "proposed total" is shown (it isn't announced yet) — this hero
   sells the archive + the live countdown instead.
============================================================ */

// Target anchored to a fixed timezone (UTC+6, Dhaka) so the countdown is
// correct for every visitor regardless of their local clock. Edit if the
// presentation time changes.
const BUDGET_DATETIME = new Date("2026-06-11T15:00:00+06:00"); // 03:00 PM Dhaka

function PreLaunchHero() {
  // ── live 1-second tick, single interval, cleaned up on unmount ──
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = BUDGET_DATETIME.getTime() - now;
  const passed = diff <= 0;
  const total = Math.max(0, Math.floor(diff / 1000));
  const hours = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const units = [
    { v: hours, one: "Hour", many: "Hours" },
    { v: mins, one: "Minute", many: "Minutes" },
    { v: secs, one: "Second", many: "Seconds" },
  ];

  // FY 2026—27 — the budget this live countdown points to.
  const span = fyToSpan("FY27"); // "FY 2026—27"

  return (
    <section className="hero pl-hero" data-screen-label="01 Hero (Pre-launch)"
      aria-labelledby="pl-headline">
      <div className="hero-bg">
        <video
          className="hero-video"
          src="assets/bangladesh.mp4"
          poster="assets/bangladesh-poster.webp"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        ></video>
        <div className="hero-bg-tint"></div>
        <div className="hero-bg-vignette"></div>
      </div>
      <div className="hero-dots"></div>
      <div className="hero-glow"></div>
      <div className="hero-taka-float" aria-hidden="true">
        <span>৳</span><span>৳</span><span>৳</span><span>৳</span><span>৳</span><span>৳</span>
      </div>

      <div className="pl-veil" aria-hidden="true"></div>


      <div className="hero-content pl-content" style={{ alignItems: "center", textAlign: "center" }}>


        <h1 id="pl-headline" className="pl-headline" style={{ fontSize: "clamp(36px, 11vw, 80px)", marginBottom: "clamp(12px, 2.5vh, 20px)", textWrap: "balance", textAlign: "center", overflowWrap: "break-word", hyphens: "auto" }}>
          Bangladesh's National Budget<br />
          <span style={{ fontStyle: "italic", fontWeight: 400, color: "rgba(255,255,255,0.6)" }}>Then and Now</span>
        </h1>

        <div className="pl-lede" style={{ maxWidth: "62ch", margin: "0 auto clamp(16px, 3vh, 32px) auto", fontSize: "clamp(15px, 2vh, 18px)", color: "rgba(255,255,255,0.85)", lineHeight: 1.5, textShadow: "0 2px 14px rgba(2,6,31,0.8)", textAlign: "center" }}>
          <p style={{ margin: "0 0 16px 0" }}>
            Over 53 budgets, state expenditure has grown 1,000-fold. Yet at just over 12% of GDP, its true footprint relative to the economy remains constrained.
          </p>
          <p style={{ margin: 0, fontStyle: "italic", color: "rgba(255,255,255,0.95)" }}>
            <strong style={{ fontWeight: 600, color: "#fff", fontStyle: "normal" }}>The Daily Star</strong> analysed spending patterns to see where public money was spent the most and which sectors lagged behind.
          </p>
        </div>

        <div className="pl-stats" style={{ width: "fit-content", margin: "0 auto clamp(16px, 4vh, 56px)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "center", textAlign: "center" }}>
            <span style={{ fontFamily: "var(--ui)", fontSize: "clamp(6.5px, 2.2vw, 10px)", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--eyebrow)" }}>First Budget (FY73)</span>
            <span style={{ fontFamily: "var(--serif)", fontSize: "clamp(14px, 4.5vw, 32px)", color: "#fff", lineHeight: 1 }}>৳786<span style={{ fontSize: "clamp(9px, 2.5vw, 14px)", color: "rgba(255,255,255,0.5)", marginLeft: "4px" }}>cr</span></span>
          </div>
          <div className="pl-stat-div" style={{ margin: "0 auto" }}></div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "center", textAlign: "center" }}>
            <span style={{ fontFamily: "var(--ui)", fontSize: "clamp(6.5px, 2.2vw, 10px)", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--eyebrow)" }}>FY26</span>
            <span style={{ fontFamily: "var(--serif)", fontSize: "clamp(14px, 4.5vw, 32px)", color: "#6fc7ee", lineHeight: 1 }}>৳790,000<span style={{ fontSize: "clamp(9px, 2.5vw, 14px)", color: "rgba(111,199,238,0.7)", marginLeft: "4px" }}>cr</span></span>
          </div>
          <div className="pl-stat-div" style={{ margin: "0 auto" }}></div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "center", textAlign: "center" }}>
            <span style={{ fontFamily: "var(--ui)", fontSize: "clamp(6.5px, 2.2vw, 10px)", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--eyebrow)" }}>Share of GDP</span>
            <span style={{ fontFamily: "var(--serif)", fontSize: "clamp(14px, 4.5vw, 32px)", color: "#5fe093", lineHeight: 1 }}>~12<span style={{ fontSize: "clamp(10px, 3vw, 20px)" }}>%</span></span>
          </div>
        </div>

        <div
          className="pl-count"
          role="group"
          aria-label={`Live countdown to the ${span} National Budget, presented in Parliament on 11 June 2026`}
          style={{ alignItems: "center", textAlign: "center" }}
        >
          <div className="pl-count-head" style={{ justifyContent: "center" }}>
            <span className="pl-live"><span className="pl-live-dot" aria-hidden="true"></span>Live</span>
            <span className="pl-count-ctx">
              {span} budget · Parliament · <strong>11 June 2026</strong>
            </span>
          </div>

          <div className="pl-timer" aria-hidden="true" style={{ justifyContent: "center" }}>
            {units.map((u, i) => (
              <React.Fragment key={u.one}>
                {i > 0 && <span className="pl-colon" aria-hidden="true">:</span>}
                <span className="pl-tu">
                  <span className="pl-tnum">{String(u.v).padStart(2, "0")}</span>
                  <span className="pl-tlab">{u.v === 1 ? u.one : u.many}</span>
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>

        <p className="pl-foot">
          {passed
            ? "FY27 budget data coming soon"
            : "This site updates with the new figures of FY27 within hours of the announcement."}
        </p>
      </div>
    </section>
  );
}

Object.assign(window, { Nav, Hero, PreLaunchHero });
