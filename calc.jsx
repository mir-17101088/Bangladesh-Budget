const { useState: useStateCalc, useMemo: useMemoCalc, useRef: useRefCalc } = React;

/* ============================================================
   HOUSEHOLD CALCULATOR  (home page)
   Relocated from the old Price-page calculator module so it now
   lives on the home page, right after the 100-taka note.
   DATA + LOGIC ARE LOCKED — do not change values (see spec §6).
   Redesigned visuals (Task 6) via frontend-design skill: a narrative
   "bridge" from the note, a stroke-arc donut that tweens on drag, a
   four-step bracket ladder, and a tactile value-bubble slider. All
   class names are calc-scoped (cx-*) to avoid colliding with home CSS.
============================================================ */

// Base 100-taka household mix (pct is overridden per income bracket by allocate()).
const HOUSEHOLD = [
  { name: "Housing & rent",   pct: 28, color: "#0185C6" },
  { name: "Food & groceries", pct: 25, color: "#019933" },
  { name: "Transport",        pct: 12, color: "#B0832B" },
  { name: "Utilities",        pct: 10, color: "#FF6B35" },
  { name: "Education",        pct: 9,  color: "#7D0066" },
  { name: "Healthcare",       pct: 7,  color: "#4ECDC4" },
  { name: "Tax & VAT",        pct: 6,  color: "#C60001" },
  { name: "Savings",          pct: 3,  color: "#96CEB4" },
];

const INCOME_MIN = 10000;
const INCOME_MAX = 200000;

function bracketFor(income) {
  if (income < 25000)  return { label: "Lower income",        color: "#019933", note: "Subsidies & rations cushion the impact" };
  if (income < 60000)  return { label: "Lower-middle income", color: "#0185C6", note: "Spending dominated by housing & food" };
  if (income < 120000) return { label: "Middle income",       color: "#B0832B", note: "Transport, education share rises" };
  return                      { label: "Upper-middle income", color: "#7D0066", note: "VAT-heavy basket; savings 8%+" };
}

// Returns 100-taka allocation for a given income — shifts mix with bracket
function allocate(income) {
  let mix;
  if (income < 25000) {
    mix = { "Housing & rent": 32, "Food & groceries": 36, "Transport": 8, "Utilities": 9, "Education": 5, "Healthcare": 5, "Tax & VAT": 4, "Savings": 1 };
  } else if (income < 60000) {
    mix = { "Housing & rent": 30, "Food & groceries": 28, "Transport": 11, "Utilities": 9, "Education": 8, "Healthcare": 6, "Tax & VAT": 6, "Savings": 2 };
  } else if (income < 120000) {
    mix = { "Housing & rent": 27, "Food & groceries": 22, "Transport": 13, "Utilities": 9, "Education": 10, "Healthcare": 7, "Tax & VAT": 8, "Savings": 4 };
  } else {
    mix = { "Housing & rent": 24, "Food & groceries": 17, "Transport": 14, "Utilities": 8, "Education": 12, "Healthcare": 8, "Tax & VAT": 11, "Savings": 6 };
  }
  return HOUSEHOLD.map(s => ({ ...s, pct: mix[s.name] }));
}

// Presentational bracket ladder — derived from the LOCKED bracketFor() at
// representative incomes (one per band). No new data: labels/colors come
// straight out of bracketFor, so they can never drift from the source of truth.
const LADDER = [15000, 40000, 90000, 150000].map(bracketFor);

function CalcSection() {
  const [income, setIncome] = useStateCalc(45000);
  const [hoverKey, setHoverKey] = useStateCalc(null);
  const trackRef = useRefCalc(null);

  const onSlide = (e) => {
    const v = parseInt(e.target.value, 10);
    setIncome(v);
  };

  const bracket = bracketFor(income);
  const data = useMemoCalc(() => allocate(income), [income]);
  const pct = (income - INCOME_MIN) / (INCOME_MAX - INCOME_MIN) * 100;

  const taxLine = data.find(d => d.name === "Tax & VAT").pct;
  const monthlyTax = Math.round(income * taxLine / 100 / 100) * 100;
  const ratchet = Math.round(monthlyTax * 0.06);

  return (
    <section className="s s-calc" data-screen-label="Calculator">
      <div className="wrap">

        {/* ---- The bridge: zoom from the nation's ledger to the kitchen table ---- */}
        <CalcBridge/>

        <div className="section-head cx-head">
          <span className="eyebrow">The personal picture</span>
          <h2>What ৳100 looks like for <em style={{ fontStyle: "italic", color: "#6fc7ee" }}>a household like yours</em>.</h2>
          <p className="lede" style={{ marginTop: 18, maxWidth: 720 }}>
            Slide to your monthly income and we'll sketch how a typical household at that level spends every ৳100 — drawn from national consumption surveys, not your own receipts.
          </p>
        </div>

        <div className="cx-wrap">
          {/* ---------- LEFT: the controls + narrative ---------- */}
          <div className="cx-panel glass cx-left">
            <span className="cx-illus">⚠ Illustrative · not a tax calculator</span>

            <p className="cx-q">
              For a household earning <em>৳{income.toLocaleString("en-IN")}</em> a month, every ৳100 spent roughly breaks down as shown.
            </p>

            <div className="cx-slider">
              <div className="cx-slider-head">
                <span className="cx-slider-lbl">Monthly income</span>
                <span className="cx-slider-val">
                  ৳{income.toLocaleString("en-IN")}<span className="cx-unit">taka</span>
                </span>
              </div>

              <div className="cx-track" ref={trackRef}>
                <div className="cx-fill" style={{ width: pct + "%" }}></div>
                <div className="cx-bubble" style={{ left: pct + "%" }}>
                  ৳{income.toLocaleString("en-IN")}
                </div>
                <div className="cx-thumb" style={{ left: pct + "%" }}></div>
                <input
                  className="cx-input"
                  type="range"
                  min={INCOME_MIN}
                  max={INCOME_MAX}
                  step={1000}
                  value={income}
                  onChange={onSlide}
                  aria-label="Monthly household income in taka"
                />
              </div>

              <div className="cx-ticks">
                <span>৳10k</span><span>৳50k</span><span>৳1L</span><span>৳1.5L</span><span>৳2L</span>
              </div>
            </div>

            {/* Bracket ladder — clearer than a lone pill: shows where you sit */}
            <div className="cx-ladder" role="group" aria-label="Income bracket">
              {LADDER.map((b, i) => {
                const on = b.label === bracket.label;
                return (
                  <div
                    key={i}
                    className={"cx-rung " + (on ? "on" : "")}
                    style={on ? { "--rc": b.color } : null}
                    aria-current={on ? "true" : undefined}
                  >
                    <span className="cx-rung-dot" style={{ background: on ? b.color : "currentColor" }}></span>
                    <span className="cx-rung-lbl">{b.label}</span>
                  </div>
                );
              })}
            </div>

            <p className="cx-note">
              <em style={{ color: bracket.color }}>{bracket.note}.</em> Approx. <b>৳{monthlyTax.toLocaleString("en-IN")}</b> of monthly outlay flows back to the exchequer as VAT, supplementary duty and income tax — the {BUDGET.proposed} ratchet adds an estimated <b className="cx-up">৳{ratchet.toLocaleString("en-IN")}</b> more.
            </p>
          </div>

          {/* ---------- RIGHT: the donut + legend ---------- */}
          <div className="cx-panel glass cx-right">
            <div className="cx-right-head">
              <span className="eyebrow">Allocation of every ৳100</span>
              <span className="cap">{BUDGET.proposed} illustrative</span>
            </div>

            <CalcPie data={data} hoverKey={hoverKey}/>

            <div className="cx-legend">
              {data.map((d, i) => (
                <button
                  type="button"
                  key={i}
                  className={"cx-leg " + (hoverKey && hoverKey !== d.name ? "dim" : "")}
                  onMouseEnter={() => setHoverKey(d.name)}
                  onMouseLeave={() => setHoverKey(null)}
                  onFocus={() => setHoverKey(d.name)}
                  onBlur={() => setHoverKey(null)}
                >
                  <span className="cx-sw" style={{ background: d.color }}></span>
                  <span className="cx-nm">{d.name}</span>
                  <span className="cx-vl">৳{d.pct}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RELEVANT_NEWS.price_calc is currently [] → renders nothing. */}
        <RelevantNews items={RELEVANT_NEWS.price_calc} accent="#6fc7ee" />
      </div>
    </section>
  );
}

/* The connective tissue: a centred lead-in that narrates the zoom from the
   national note above ("the whole country") into the household ("closer to
   home"). Reveals on scroll; reduced-motion shows the end-state immediately. */
function CalcBridge() {
  const [ref, inView] = useInView({ threshold: 0.4 });
  return (
    <div ref={ref} className={"cx-bridge " + (inView ? "in" : "")}>
      <span className="cx-bridge-line"></span>
      <span className="cx-bridge-coin">৳100</span>
      <p className="cx-bridge-text">
        The note showed the nation's ledger. Now follow that same ৳100<br/>
        <em>onto your own kitchen table.</em>
      </p>
    </div>
  );
}

/* Donut built from stroke-arcs (not <path d>) so re-allocation TWEENS smoothly
   via CSS transitions on stroke-dasharray / dashoffset when the slider moves.
   Labels (≥ ৳8) glide to their new mid-angle and fade across the threshold. */
function CalcPie({ data, hoverKey }) {
  const R = 42, SW = 15;
  const C = 2 * Math.PI * R;
  const GAP = 1.4; // user-unit separation between slices

  let acc = 0;
  const slices = data.map((s) => {
    const frac = s.pct / 100;
    const len = Math.max(0, frac * C - GAP);
    const offset = -(acc / 100) * C;
    const mid = ((acc + s.pct / 2) / 100) * 360; // degrees from top
    acc += s.pct;
    const rad = (mid - 90) * Math.PI / 180;
    const lr = R; // labels ride the stroke ring
    const lx = 50 + lr * Math.cos(rad);
    const ly = 50 + lr * Math.sin(rad);
    return { ...s, len, offset, lx, ly };
  });

  return (
    <div className="cx-pie-wrap">
      <svg className="cx-pie" viewBox="0 0 100 100" role="img" aria-label="Donut of how every ৳100 is spent">
        <circle className="cx-pie-track" cx="50" cy="50" r={R} fill="none" strokeWidth={SW}/>
        <g transform="rotate(-90 50 50)">
          {slices.map((s, i) => (
            <circle
              key={i}
              className="cx-arc"
              cx="50" cy="50" r={R}
              fill="none"
              stroke={s.color}
              strokeWidth={SW}
              strokeDasharray={s.len + " " + (C - s.len)}
              strokeDashoffset={s.offset}
              style={{
                opacity: hoverKey ? (hoverKey === s.name ? 1 : 0.28) : 1,
              }}
            />
          ))}
        </g>
        {slices.map((s, i) => (
          <text
            key={i}
            className="cx-arc-lbl"
            x="50" y="50"
            textAnchor="middle"
            style={{
              transform: "translate(" + (s.lx - 50) + "px," + (s.ly - 50 + 1.4) + "px)",
              opacity: s.pct >= 8 ? (hoverKey && hoverKey !== s.name ? 0.25 : 1) : 0,
            }}
          >
            ৳{s.pct}
          </text>
        ))}
      </svg>
      <div className="cx-pie-center">
        <div className="e">Every</div>
        <div className="n">৳100</div>
        <div className="s">spent</div>
      </div>
    </div>
  );
}

Object.assign(window, { CalcSection, CalcPie, HOUSEHOLD });
