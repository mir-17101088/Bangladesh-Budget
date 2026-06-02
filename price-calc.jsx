const { useState: useStateCalc, useMemo: useMemoCalc, useRef: useRefCalc } = React;

/* ============================================================
   HOUSEHOLD CALCULATOR
============================================================ */
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
  // base allocations adjusted per bracket
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

function CalcSection() {
  const [income, setIncome] = useStateCalc(45000);
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

  return (
    <section className="s s-calc" data-screen-label="06 Calculator">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">Chapter 06 · Your money</span>
          <h2>Where does <em style={{ fontStyle: "italic", color: "#6fc7ee" }}>your</em> ৳100 go?</h2>
          <p className="lede" style={{ marginTop: 18, maxWidth: 720 }}>
            Move the slider to your household's monthly income. We'll show an illustrative breakdown
            using national consumption surveys — not a precise audit of your spending.
          </p>
        </div>

        <div className="calc-wrap">
          <div className="calc-left glass">
            <span className="calc-illus">⚠ Illustrative · not a tax calculator</span>
            <div className="calc-q">
              For a household earning <em>৳{income.toLocaleString("en-IN")}</em> a month, every ৳100 spent roughly breaks down as shown.
            </div>

            <div className="slider-block">
              <div className="slider-vals">
                <span className="lbl">Monthly income</span>
                <span className="val">
                  ৳{income.toLocaleString("en-IN")}
                  <span className="unit">taka</span>
                </span>
              </div>
              <div className="slider-track" ref={trackRef}>
                <div className="slider-fill" style={{ width: pct + "%" }}></div>
                <div className="slider-thumb" style={{ left: pct + "%" }}></div>
                <input
                  className="slider-input"
                  type="range"
                  min={INCOME_MIN}
                  max={INCOME_MAX}
                  step={1000}
                  value={income}
                  onChange={onSlide}
                />
              </div>
              <div className="slider-ticks">
                <span>৳10k</span>
                <span>৳50k</span>
                <span>৳1L</span>
                <span>৳1.5L</span>
                <span>৳2L</span>
              </div>
            </div>

            <div className="bracket-pill" style={{ background: bracket.color + "26", borderColor: bracket.color + "66" }}>
              <span className="lbl" style={{ color: bracket.color }}>Bracket</span>
              <span className="v">{bracket.label}</span>
            </div>

            <div className="body" style={{ color: "var(--g3)", lineHeight: 1.6, marginTop: 4 }}>
              <em>{bracket.note}.</em> Approx. <b style={{ color: "#fff" }}>৳{monthlyTax.toLocaleString("en-IN")}</b> of monthly outlay flows back to the exchequer as VAT, supplementary duty and income tax — the FY26 ratchet adds an estimated <b style={{ color: "#ff7676" }}>৳{Math.round(monthlyTax * 0.06).toLocaleString("en-IN")}</b> more.
            </div>
          </div>

          <div className="calc-right glass">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <span className="eyebrow" style={{ display: "block" }}>Allocation of every ৳100</span>
              <span className="cap">FY26 illustrative</span>
            </div>
            <CalcPie data={data}/>
            <div className="calc-legend">
              {data.map((d, i) => (
                <div key={i} className="cl-row">
                  <span className="sw" style={{ background: d.color }}></span>
                  <span className="nm">{d.name}</span>
                  <span className="vl">৳{d.pct}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <RelevantNews items={RELEVANT_NEWS.price_calc} accent="#6fc7ee" />
      </div>
    </section>
  );
}

function CalcPie({ data }) {
  const size = 320, cx = size/2, cy = size/2, R = 140, r = 70;
  let acc = 0;
  return (
    <div className="calc-pie-wrap" style={{ maxWidth: 340 }}>
      <svg className="calc-pie" viewBox={"0 0 " + size + " " + size}>
        <defs>
          {data.map((s, i) => (
            <linearGradient key={i} id={"cp" + i} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="1"/>
              <stop offset="100%" stopColor={s.color} stopOpacity="0.55"/>
            </linearGradient>
          ))}
        </defs>
        {data.map((s, i) => {
          const start = (acc / 100) * 360;
          const end = ((acc + s.pct) / 100) * 360;
          acc += s.pct;
          const a1 = (start - 90) * Math.PI/180;
          const a2 = (end - 90) * Math.PI/180;
          const large = (end - start) > 180 ? 1 : 0;
          const x1o = cx + R * Math.cos(a1), y1o = cy + R * Math.sin(a1);
          const x2o = cx + R * Math.cos(a2), y2o = cy + R * Math.sin(a2);
          const x1i = cx + r * Math.cos(a2), y1i = cy + r * Math.sin(a2);
          const x2i = cx + r * Math.cos(a1), y2i = cy + r * Math.sin(a1);
          const d = ["M", x1o, y1o, "A", R, R, 0, large, 1, x2o, y2o, "L", x1i, y1i, "A", r, r, 0, large, 0, x2i, y2i, "Z"].join(" ");
          // Label at midpoint
          const midA = ((start + end) / 2 - 90) * Math.PI/180;
          const lr = (R + r) / 2;
          const lx = cx + lr * Math.cos(midA);
          const ly = cy + lr * Math.sin(midA);
          return (
            <g key={i}>
              <path d={d} fill={"url(#cp" + i + ")"} stroke="#0a1628" strokeWidth="2"/>
              {s.pct >= 8 && (
                <text x={lx} y={ly + 4} fill="#fff" textAnchor="middle"
                      style={{ fontFamily: "var(--ui)", fontSize: 13, fontWeight: 700 }}>
                  ৳{s.pct}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="calc-pie-center">
        <div className="e">Every</div>
        <div className="n">৳100</div>
        <div className="s">spent</div>
      </div>
    </div>
  );
}

Object.assign(window, { CalcSection, CalcPie });
