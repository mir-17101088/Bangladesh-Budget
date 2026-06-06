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
  { key: "publicadmin", name: "Public Administration", color: "#997B50", series: [7.6, 7.3, 7.3, 7.0, 23.5, null] },
  { key: "interest", name: "Interest Payments", color: "#C60001", series: [11.4, 11.9, 11.9, 14.0, 15.4, null] },
  { key: "education", name: "Education & Technology", color: "#0185C6", series: [15.7, 14.7, 14.7, 14.0, 14.0, null] },
  { key: "transport", name: "Transport & Communication", color: "#B0832B", series: [11.7, 11.8, 11.8, 10.0, 9.0, null] },
  { key: "agri", name: "Agriculture", color: "#019933", series: [3.6, 3.8, 3.8, 4.0, 5.9, null] },
  { key: "localgov", name: "Local Govt & Rural Dev", color: "#96CEB4", series: [7.0, 6.6, 6.6, 6.0, 5.7, null] },
  { key: "social", name: "Social Security & Welfare", color: "#45B7D1", series: [5.0, 4.9, 4.9, 5.0, 5.7, null] },
  { key: "health", name: "Health", color: "#4ECDC4", series: [5.4, 5.4, 5.4, 5.0, 5.3, null] },
  { key: "defence", name: "Defence", color: "#7D0066", series: [5.5, 5.0, 5.0, 4.0, 5.2, null] },
  { key: "publicorder", name: "Public Order & Safety", color: "#FFEAA7", series: [4.7, 4.4, 4.4, 4.0, 4.3, null] },
  { key: "others", name: "Others", color: "#8B939F", series: [17.8, 20.3, 20.3, 23.0, 3.1, null] },

  { key: "energy", name: "Energy & Power", color: "#FF6B35", series: [4.6, 3.9, 3.9, 4.0, 2.9, null] },
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
});

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
  { fy: "FY27", pct: null }, // ⟶ GO-LIVE FY27: budget as % of GDP
];

// (department, % of total, parent sector color)
const TREEMAP = [
  { name: "Domestic Interest", pct: 16.29, c: "#C60001", parent: "Interest" },
  { name: "Finance Division", pct: 12.97, c: "#997B50", parent: "Public Services" },
  { name: "LG & Rural Dev", pct: 6.87, c: "#96CEB4", parent: "Local Govt" },
  { name: "Defence Ministry", pct: 5.41, c: "#7D0066", parent: "Defence" },


  { name: "Min of Education", pct: 5.28, c: "#0185C6", parent: "Education" },
  { name: "Agri Ministry", pct: 5.23, c: "#019933", parent: "Agriculture" },

  { name: "Power Division", pct: 4.44, c: "#FF6B35", parent: "Energy" },
  { name: "Primary & Mass Edu", pct: 4.29, c: "#0185C6", parent: "Education" },
  { name: "Roads & Railways", pct: 3.96, c: "#B0832B", parent: "Transport" },
  { name: "Home Affairs", pct: 3.85, c: "#FFEAA7", parent: "Public Order" },
  { name: "Health Services", pct: 3.10, c: "#4ECDC4", parent: "Health" },
  { name: "Foreign Interest", pct: 2.45, c: "#C60001", parent: "Interest" },
  { name: "Railway Ministry", pct: 2.33, c: "#4ECDC4", parent: "Transport" },

  { name: "Water Resources", pct: 2.31, c: "#019933", parent: "Agriculture" },
  { name: "Sciene & Tech", pct: 1.83, c: "#0185C6", parent: "Education" },
  { name: "Social Welfare", pct: 1.81, c: "#45B7D1", parent: "Social Security" },
  { name: "Disaster Mgmt", pct: 1.61, c: "#45B7D1", parent: "Social Security" },
  { name: "Technical & Madrasah Education", pct: 1.35, c: "#0185C6", parent: "Education" },

  { name: "Bridges Division", pct: 1.22, c: "#B0832B", parent: "Transport" },
  { name: "Liberation War Affairs", pct: 1.14, c: "#45B7D1", parent: "Social Security" },
  { name: "Ministry of Housing", pct: 1.07, c: "#A8E6CF", parent: "Housing" },
  { name: "Food Division", pct: 1.05, c: "#997B50", parent: "Social Security" },

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
  { fy: "FY25", d: 99500, f: 22000 },
  { fy: "FY26", d: 100000, f: 22000 },
  { fy: "FY27", d: null, f: null }, // ⟶ GO-LIVE FY27: domestic / foreign interest (Crore Tk)
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
   LAUNCH FLAG — flip to false once FY27 budget data is entered.
   true  = show the pre-launch hero (countdown to 11 Jun 2026)
   false = show the normal proposed-budget hero
============================================================ */
const PRELAUNCH = true;
window.PRELAUNCH = PRELAUNCH;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "heroNumber": "৳7,97,000",
  "heroUnit": "Crore",
  "heroDelta": "+3.6% vs FY26",
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
        <div className="hero-fy">FY 2026-27</div>
        <div className="hero-num">
          <CountUp value={heroNum} prefix={heroPrefix} locale="en-IN" duration={2000} />
          <span className="unit">{tweaks.heroUnit}</span>
        </div>
        <div className="hero-cap">Total proposed expenditure — the largest in Bangladesh's history</div>
        <div className="hero-pills">
          <span className="pill green"><span className="dot"></span>{tweaks.heroDelta}</span>
          <span className="pill blue">14.9% of GDP</span>
          <span className="pill">87% implementation FY25</span>
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
                  <span className="tk-val">৳{s.proposed}</span>
                </span>
              ))}
            </div>
          </div>
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
                  <div className="num"><CountUp value={s.proposed} decimals={1} prefix="৳" /> <span className={"delta " + cls}>{arrow}</span></div>
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
const BUDGET_DATETIME = new Date("2026-06-11T18:00:00+06:00"); // 6:00 PM Dhaka

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
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const units = [
    { v: days, one: "Day", many: "Days" },
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

      <div className="pl-veil" aria-hidden="true"></div>
      <div className="pl-watermark" aria-hidden="true">৳</div>

      <div className="hero-content pl-content">
        <p className="pl-eyebrow">Bangladesh National Budget</p>

        <h1 id="pl-headline" className="pl-headline">Throughout History</h1>

        <p className="pl-lede">
          <span className="pl-lede-pre">53 budgets since FY1972-73, but </span>
          <span className="pl-hook">where did taxpayers’ money actually go?</span>
        </p>
        <p className="pl-support">
          Take a look at <strong>The Daily Star’s</strong> breakdown of the country’s last 18 budgets.
        </p>

        <ul className="pl-legend" aria-label="What each year’s figures represent">
          <li className="pl-chip"><span className="pl-chip-fy">FY24</span><span className="pl-chip-lab">Actual expenditure</span></li>
          <li className="pl-chip"><span className="pl-chip-fy">FY25</span><span className="pl-chip-lab">Revised allocation</span></li>
          <li className="pl-chip"><span className="pl-chip-fy">FY26</span><span className="pl-chip-lab">Proposed</span></li>
        </ul>

        <div
          className="pl-count"
          role="group"
          aria-label={`Live countdown to the ${span} National Budget, presented in Parliament on 11 June 2026`}
        >
          <div className="pl-count-head">
            <span className="pl-live"><span className="pl-live-dot" aria-hidden="true"></span>Live</span>
            <span className="pl-count-ctx">
              {span} budget · Parliament · <strong>11 June 2026</strong>
            </span>
          </div>

          {passed ? (
            <div className="pl-passed" role="status">
              Budget presented — figures coming soon.
            </div>
          ) : (
            <div className="pl-timer" aria-hidden="true">
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
          )}
        </div>

        <p className="pl-foot">This site updates with the new figures of FY27 within hours of the announcement.</p>
      </div>
    </section>
  );
}

Object.assign(window, { Nav, Hero, PreLaunchHero });
