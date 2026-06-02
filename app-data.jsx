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
const TAKA_SECTORS = [
  //                                                                    [FY22, FY23, FY24, FY25, FY26]
  { key: "publicadmin",  name: "Public Administration",      color: "#997B50", series: [ 7.6,  7.3,  7.3,  7.0, 23.5] },
  { key: "interest",     name: "Interest Payments",          color: "#C60001", series: [11.4, 11.9, 11.9, 14.0, 15.4] },
  { key: "education",    name: "Education & Technology",     color: "#0185C6", series: [15.7, 14.7, 14.7, 14.0, 14.0] },
  { key: "transport",    name: "Transport & Communication",  color: "#B0832B", series: [11.7, 11.8, 11.8, 10.0,  9.0] },
  { key: "agri",         name: "Agriculture",                color: "#019933", series: [ 3.6,  3.8,  3.8,  4.0,  5.9] },
  { key: "localgov",     name: "Local Govt & Rural Dev",     color: "#96CEB4", series: [ 7.0,  6.6,  6.6,  6.0,  5.7] },
  { key: "social",       name: "Social Security & Welfare",  color: "#45B7D1", series: [ 5.0,  4.9,  4.9,  5.0,  5.7] },
  { key: "health",       name: "Health",                     color: "#4ECDC4", series: [ 5.4,  5.4,  5.4,  5.0,  5.3] },
  { key: "defence",      name: "Defence",                    color: "#7D0066", series: [ 5.5,  5.0,  5.0,  4.0,  5.2] },
  { key: "publicorder",  name: "Public Order & Safety",      color: "#FFEAA7", series: [ 4.7,  4.4,  4.4,  4.0,  4.3] },
  { key: "others",       name: "Others",                     color: "#8B939F", series: [ 7.3,  7.3,  7.3,  7.0,  3.1] },
  { key: "energy",       name: "Energy & Power",             color: "#FF6B35", series: [ 4.6,  3.9,  3.9,  4.0,  2.9] },
].map(s => ({ ...s, fy26: s.series[s.series.length - 1] }));

// ────────────────────────────────────────────────────────────
// 2. Budget as % of GDP — full panel, FY09 → FY26
//    Append new years here as data is released.
// ────────────────────────────────────────────────────────────
const GDP_DATA = [
  { fy: "FY09", pct: 11.2 }, { fy: "FY10", pct: 11.3 }, { fy: "FY11", pct: 12.3 },
  { fy: "FY12", pct: 12.6 }, { fy: "FY13", pct: 12.5 }, { fy: "FY14", pct: 12.0 },
  { fy: "FY15", pct: 11.3 }, { fy: "FY16", pct: 11.5 }, { fy: "FY17", pct: 11.6 },
  { fy: "FY18", pct: 12.2 }, { fy: "FY19", pct: 13.3 }, { fy: "FY20", pct: 13.3 },
  { fy: "FY21", pct: 13.0 }, { fy: "FY22", pct: 13.0 }, { fy: "FY23", pct: 14.9 },
  // ── edit / extend below ─────────────────────────────────
  { fy: "FY24", pct: 14.6 }, { fy: "FY25", pct: 14.4 }, { fy: "FY26", pct: 14.2 },
];

// (department, % of total, parent sector color)
const TREEMAP = [
  { name: "Domestic Interest",      pct: 14.73, c: "#C60001", parent: "Interest" },
  { name: "Finance Division",       pct: 13.54, c: "#997B50", parent: "Public Services" },
  { name: "LG & Rural Dev",         pct: 6.88,  c: "#96CEB4", parent: "Local Govt" },
  { name: "Agri Ministry",          pct: 5.80,  c: "#019933", parent: "Agriculture" },
  { name: "Roads & Railways",       pct: 5.51,  c: "#B0832B", parent: "Transport" },
  { name: "Min of Education",       pct: 5.44,  c: "#0185C6", parent: "Education" },
  { name: "Defence Ministry",       pct: 5.32,  c: "#7D0066", parent: "Defence" },
  { name: "Power Division",         pct: 4.51,  c: "#FF6B35", parent: "Energy" },
  { name: "Primary & Mass Edu",     pct: 4.24,  c: "#0185C6", parent: "Education" },
  { name: "Home Affairs",           pct: 3.79,  c: "#FFEAA7", parent: "Public Order" },
  { name: "Health Services",        pct: 3.62,  c: "#4ECDC4", parent: "Health" },
  { name: "Foreign Interest",       pct: 1.68,  c: "#C60001", parent: "Interest" },
  { name: "Health Family",          pct: 1.40,  c: "#4ECDC4", parent: "Health" },
  { name: "Bridges Division",       pct: 2.10,  c: "#B0832B", parent: "Transport" },
  { name: "Social Welfare",         pct: 3.20,  c: "#45B7D1", parent: "Social Security" },
  { name: "Disaster Mgmt",          pct: 1.90,  c: "#45B7D1", parent: "Social Security" },
  { name: "Energy & Mineral",       pct: 1.42,  c: "#FF6B35", parent: "Energy" },
  { name: "Water Resources",        pct: 1.20,  c: "#019933", parent: "Agriculture" },
  { name: "Posts & Telecom",        pct: 0.96,  c: "#0185C6", parent: "Education" },
  { name: "Public Service",         pct: 1.10,  c: "#997B50", parent: "Public Services" },
  { name: "Housing & Works",        pct: 1.05,  c: "#A8E6CF", parent: "Housing" },
  { name: "Cabinet Division",       pct: 0.88,  c: "#997B50", parent: "Public Services" },
  { name: "Industries",             pct: 0.74,  c: "#FF8C94", parent: "Industry" },
  { name: "Labour & Employment",    pct: 0.58,  c: "#FFEAA7", parent: "Public Order" },
  { name: "Information",            pct: 0.45,  c: "#DDA0DD", parent: "Recreation" },
  { name: "Foreign Affairs",        pct: 0.62,  c: "#997B50", parent: "Public Services" },
  { name: "Commerce",               pct: 0.41,  c: "#FF8C94", parent: "Industry" },
];

// ────────────────────────────────────────────────────────────
// 3. Government interest payments — d = domestic, f = foreign (in Crore Taka)
//    FY23–FY26 are MOCK values; replace as actuals are published.
// ────────────────────────────────────────────────────────────
const INTEREST_DATA = [
  { fy: "FY09", d: 13839,  f: 1341 },
  { fy: "FY10", d: 13497,  f: 1371 },
  { fy: "FY11", d: 14200,  f: 1423 },
  { fy: "FY12", d: 18803,  f: 1548 },
  { fy: "FY13", d: 22322,  f: 1593 },
  { fy: "FY14", d: 26601,  f: 1604 },
  { fy: "FY15", d: 29436,  f: 1537 },
  { fy: "FY16", d: 31468,  f: 1646 },
  { fy: "FY17", d: 33249,  f: 1841 },
  { fy: "FY18", d: 38160,  f: 3605 },
  { fy: "FY19", d: 46015,  f: 3446 },
  { fy: "FY20", d: 53995,  f: 4318 },
  { fy: "FY21", d: 66319,  f: 4287 },
  { fy: "FY22", d: 82670,  f: 9437 },
  // ── edit / extend below ─────────────────────────────────
  { fy: "FY23", d: 95400,  f: 11200 },
  { fy: "FY24", d: 108600, f: 13500 },
  { fy: "FY25", d: 122800, f: 16100 },
  { fy: "FY26", d: 138000, f: 19000 },
];

const NEWS = [
  { tag: "ANALYSIS", tagColor: "#0185C6", c1: "#0d2847", c2: "#0185C6",
    headline: "Public administration leaps to ৳23.5 of every ৳100 — what's behind the spike?",
    dek: "FY26 reclassifies several line items into the public-administration bucket. Here is what we know.",
    date: "Jun 5, 2025", author: "Mahmudul Hasan", read: "8 min read" },
  { tag: "POLICY", tagColor: "#B0832B", c1: "#3a2a15", c2: "#B0832B",
    headline: "Interest payments now consume ৳15.4 of every taka — the trap of debt",
    dek: "Domestic interest is up sixfold since FY09. Foreign interest has grown even faster.",
    date: "Jun 5, 2025", author: "Tasnim Rahman", read: "12 min read" },
  { tag: "BUSINESS", tagColor: "#019933", c1: "#0a2818", c2: "#019933",
    headline: "Subsidy bill nearly doubles in three years as power and fertiliser costs balloon",
    dek: "FY22 subsidies stood at ৳5.8. By FY25 the share had climbed to ৳11.",
    date: "Jun 4, 2025", author: "Refaul Karim", read: "6 min read" },
  { tag: "EDITORIAL", tagColor: "#7D0066", c1: "#2a0a22", c2: "#7D0066",
    headline: "A budget of compression: education and energy lose their margins",
    dek: "Two pillars of long-run growth are quietly being squeezed. The cost will not show until later.",
    date: "Jun 4, 2025", author: "The Editorial Board", read: "4 min read" },
  { tag: "OPINION", tagColor: "#C60001", c1: "#2a0508", c2: "#C60001",
    headline: "The 97% implementation rate hides a story of compressed ambition",
    dek: "When you spend everything you promise, you have probably promised too little.",
    date: "Jun 3, 2025", author: "Dr. Selima Ahmed", read: "9 min read" },
  { tag: "EXPLAINER", tagColor: "#0185C6", c1: "#0d2847", c2: "#45B7D1",
    headline: "What is a 'proposed' budget, and why does it keep growing 14% a year?",
    dek: "A short reader on how Bangladesh's budget is drafted, debated, and rarely shrunk.",
    date: "Jun 3, 2025", author: "Digital Team", read: "5 min read" },
];

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "heroNumber": "৳7,97,000",
  "heroUnit": "কোটি",
  "heroDelta": "+3.6% vs FY25",
  "activeNav": "Home",
  "gradient": "navy",
  "showStrip": true
}/*EDITMODE-END*/;

/* ============================================================
   NAV
============================================================ */
function Nav({ active }) {
  const links = [
    { name: "Home", href: "Budget at a Glance.html" },
    { name: "Price Impact", href: "Price Impact.html" },
    { name: "Sector Deep Dive", href: "Sector Deep Dive.html" },
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
        <a href="Budget at a Glance.html" className="nav-brand">
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
        <span className="nav-badge"><span className="nav-live-dot" aria-hidden="true"></span>Budget FY26</span>
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
          poster="assets/bangladesh-poster.jpg"
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
        <div className="hero-eyebrow">Bangladesh National Budget</div>
        <div className="hero-fy">FY 2025—26</div>
        <div className="hero-num">
          <CountUp value={heroNum} prefix={heroPrefix} locale="en-IN" duration={2000}/>
          <span className="unit">{tweaks.heroUnit}</span>
        </div>
        <div className="hero-cap">Total proposed expenditure — the largest in Bangladesh's history</div>
        <div className="hero-pills">
          <span className="pill green"><span className="dot"></span>{tweaks.heroDelta}</span>
          <span className="pill blue">14.9% of GDP</span>
          <span className="pill">97% implementation FY23</span>
        </div>
      </div>

      {tweaks.showStrip && (
        <div className="hero-strip">
          <div className="hero-ticker" aria-hidden="true">
            <div className="hero-ticker-track">
              {[...TAKA_SECTORS, ...TAKA_SECTORS].map((s, i) => (
                <span className="hero-ticker-item" key={i}>
                  <span className="tk-dot" style={{ background: s.color }}></span>
                  <span className="tk-name">{s.name}</span>
                  <span className="tk-val">৳{s.fy26}</span>
                </span>
              ))}
            </div>
          </div>
          <div className="wrap hero-strip-inner">
            <div className="hero-strip-cell">
              <div className="lbl">Public administration</div>
              <div className="num"><CountUp value={23.5} decimals={1} prefix="৳"/> <span className="delta">▲ +16.5</span></div>
            </div>
            <div className="hero-strip-cell">
              <div className="lbl">Interest payments</div>
              <div className="num"><CountUp value={15.4} decimals={1} prefix="৳"/> <span className="delta">▲ +1.4</span></div>
            </div>
            <div className="hero-strip-cell">
              <div className="lbl">Education & tech</div>
              <div className="num"><CountUp value={14.0} decimals={1} prefix="৳"/> <span className="delta red">— flat</span></div>
            </div>
            <div className="hero-strip-cell">
              <div className="lbl">Transport</div>
              <div className="num"><CountUp value={9.0} decimals={1} prefix="৳"/> <span className="delta red">▼ −1.0</span></div>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}

Object.assign(window, { Nav, Hero });
