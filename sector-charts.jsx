/* ============================================================
   GDP SHARE HEATMAP
============================================================ */
function HeatmapSection() {
  // Skip FY09 (no prior year) — show transitions FY10..FY26
  const fyCols = SECTOR_YEARS.slice(1);
  const rows = [...SECTORS].sort((a, b) => b.rise - a.rise);
  const totalTransitions = fyCols.length;

  return (
    <section className="s s-heat" data-screen-label="04 Heatmap">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">The overall view </span>
          <h2>Which sectors won the decade?</h2>
          <p className="lede" style={{ marginTop: 18, maxWidth: 720 }}>
            For each of {totalTransitions} year-on-year transitions, did the sector's share of GDP rise or fall? Sorted by total wins, top to bottom.
          </p>
        </div>

        <div className="heat-wrap glass">
          <table className="heat-table">
            <thead>
              <tr>
                <th></th>
                {fyCols.map(y => <th key={y} className="col-h">{y}</th>)}
                <th className="col-h rises-h" style={{ paddingLeft: 18, textAlign: "left" }}>RISES</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s, i) => {
                const pat = patternFor(s.rise, s.k);
                return (
                  <tr key={s.k}>
                    <td className="row-h">
                      <span className="row-sw" style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: s.color, marginRight: 10, verticalAlign: "middle" }}></span>
                      {s.name}
                    </td>
                    {pat.map((p, j) => (
                      <td key={j}><div className={"h-cell " + p + (j === 0 ? " cap-l" : "") + (j === pat.length - 1 ? " cap-r" : "")}></div></td>
                    ))}
                    <td className="sum-h">{s.rise}<span className="of"> / {totalTransitions}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.06)", flexWrap: "wrap", gap: 16 }}>
            <div style={{ display: "flex", gap: 22, fontFamily: "var(--ui)", fontSize: 11, color: "var(--g3)", letterSpacing: "0.04em" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 14, height: 12, background: "#3CC3DE", borderRadius: 3 }}></span>Share rose
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 14, height: 12, background: "#CB5A30", borderRadius: 3 }}></span>Share fell
              </span>
            </div>
            <span className="cap">Each cell = one year-on-year transition · {SECTORS.length} sectors × {totalTransitions} transitions</span>
          </div>
        </div>

        <RelevantNews items={RELEVANT_NEWS.sector_heatmap} accent="#019933" />
      </div>
    </section>
  );
}

/* ============================================================
   DEPARTMENT RANKINGS
============================================================ */
function RankingsSection() {
  const max = Math.max(...DEPTS.map(d => d.pct));
  const [ref, inView] = useInView({ threshold: 0.1 });
  return (
    <section className="s s-rankings" data-screen-label="05 Rankings">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">Top 10</span>
          <h2>The biggest single line areas</h2>
          <p className="lede" style={{ marginTop: 18, maxWidth: 720 }}>
            Two areas — debt interest and the Finance Division's catch-all — already consumed more than a quarter of all FY26's proposed expenditure.
          </p>
        </div>

        <div ref={ref} className="glass" style={{ padding: "32px 36px", borderRadius: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24, alignItems: "flex-end" }}>
            <span className="cap">By share of total {BUDGET.proposed} expenditure</span>
            <span className="cap">Bar colored by parent sector</span>
          </div>
          <div className="rk-list">
            {DEPTS.map((d, i) => {
              const w = (d.pct / max) * 100;
              const top = i < 3;
              return (
                <div key={d.name} className={"rk-row " + (top ? "top" : "")}>
                  <div className="rk-num">{i + 1}</div>
                  <div className="rk-bar-wrap">
                    <div className="rk-bar-bg">
                      <div className="rk-bar" style={{ width: inView ? (w + "%") : "0%", "--c": d.color, transitionDelay: (i * 60) + "ms" }}></div>
                      <div className="rk-bar-content">
                        <span className="rk-name">{d.name}</span>
                        <span className="rk-sub">{d.parent}</span>
                      </div>
                    </div>
                  </div>
                  <div className="rk-meta">
                    <div className="rk-pct"><CountUp value={d.pct} decimals={2} suffix="%" duration={1300} /></div>
                    <div className="rk-amt">৳<CountUp value={d.amt} duration={1300} /> cr</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <RelevantNews items={RELEVANT_NEWS.sector_rankings} accent="#B0832B" />
      </div>
    </section>
  );
}

/* ============================================================
   IMPLEMENTATION GAUGES
============================================================ */
function Gauge({ value }) {
  const size = 76, cx = size / 2, cy = size / 2, r = 30;
  const C = 2 * Math.PI * r;
  const targetDash = (value / 100) * C;
  const [ref, inView] = useInView({ threshold: 0.2 });
  const [dash, setDash] = React.useState(0);
  const [textVal, setTextVal] = React.useState(0);

  React.useEffect(() => {
    if (!inView) return;
    if (prefersReducedMotion()) { setDash(targetDash); setTextVal(value); return; }
    let raf, start = null;
    const dur = 1200;
    const tick = (t) => {
      if (start === null) start = t;
      const k = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - k, 4);
      setDash(targetDash * eased);
      setTextVal(value * eased);
      if (k < 1) raf = requestAnimationFrame(tick);
      else { setDash(targetDash); setTextVal(value); }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  let color = "#5fe093";
  if (value < 80) color = "#ff7676";
  else if (value < 90) color = "#FFEAA7";
  const gid = "gg-" + Math.round(value * 10);

  return (
    <svg ref={ref} className="gauge-svg" viewBox={"0 0 " + size + " " + size}>
      <defs>
        <linearGradient id={gid} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={color} stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
      <circle cx={cx} cy={cy} r={r}
        fill="none"
        stroke={"url(#" + gid + ")"}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={dash + " " + (C - dash)}
        transform={"rotate(-90 " + cx + " " + cy + ")"}
        style={{ filter: "drop-shadow(0 0 6px " + color + ")" }} />
      <text x={cx} y={cy + 5} textAnchor="middle"
        style={{ fontFamily: "var(--serif)", fontSize: 17, fill: "#fff" }}>
        {textVal.toFixed(0)}%
      </text>
    </svg>
  );
}

function GaugesSection() {
  const perRow = 9;
  const IMPL_PRESENT = IMPL.filter(g => typeof g.v === "number" && isFinite(g.v));
  const row1 = IMPL_PRESENT.slice(0, perRow);
  const row2 = IMPL_PRESENT.slice(perRow);
  const avg = (IMPL_PRESENT.reduce((a, b) => a + b.v, 0) / IMPL_PRESENT.length).toFixed(1);

  const label = (v) => {
    if (v >= 90) return { t: "STRONG", c: "#5fe093" };
    if (v >= 80) return { t: "PARTIAL", c: "#FFEAA7" };
    return { t: "WEAK", c: "#ff7676" };
  };

  return (
    <section className="s s-gauges" data-screen-label="06 Gauges">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">Promise vs delivery</span>
          <h2>The implementation gap</h2>
          <p className="lede" style={{ marginTop: 18, maxWidth: 720 }}>
            For each fiscal year, the share of the proposed budget that was actually spent. Implementation hovered in the low 80s through the late 2010s; FY11 and FY13 stand out.
          </p>
        </div>

        <div className="glass" style={{ padding: "32px 36px", borderRadius: 20 }}>
          <div className="gauge-row">
            {row1.map(g => {
              const lb = label(g.v);
              return (
                <div key={g.fy} className="gauge-cell">
                  <div className="yr">{g.fy}</div>
                  <Gauge value={g.v} />
                  <div className="lbl" style={{ color: lb.c }}>{lb.t}</div>
                </div>
              );
            })}
          </div>
          <div className="gauge-row row2">
            {row2.map(g => {
              const lb = label(g.v);
              return (
                <div key={g.fy} className="gauge-cell">
                  <div className="yr">{g.fy}</div>
                  <Gauge value={g.v} />
                  <div className="lbl" style={{ color: lb.c }}>{lb.t}</div>
                </div>
              );
            })}
          </div>

          <div className="avg-callout">
            <span className="big"><CountUp value={parseFloat(avg)} decimals={1} suffix="%" duration={1500} /></span>
            <span className="txt">"Average implementation: ~{avg}%." Even when finance ministries announce ambitious totals, the state typically spends only 8 out of every 10 taka pledged.</span>
          </div>
        </div>

        <RelevantNews items={RELEVANT_NEWS.sector_gauges} accent="#45B7D1" />
      </div>
    </section>
  );
}

/* ============================================================
   PAGE HERO
============================================================ */
function SectorHero({ setActive }) {
  const top = [...SECTORS].sort((a, b) => b.proposed - a.proposed)[0];
  const fastest = [...SECTORS].sort((a, b) => (b.proposed / b.fy09) - (a.proposed / a.fy09))[0];
  const implP = IMPL.filter(g => typeof g.v === "number");
  const avgImpl = (implP.reduce((a, b) => a + b.v, 0) / implP.length).toFixed(0);
  return (
    <section className="page-hero" data-screen-label="01 Page Hero">
      <div className="wrap">
        <div className="crumb">
          <span>Budget at a Glance</span><span style={{ color: "var(--g7)" }}>·</span>
        </div>
        <h1>Fourteen sectors, <em>one ledger</em></h1>
        <p className="dek">
          Sector by sector — totals, sub-sector stacks, GDP-share moves, and how much of each fiscal promise was actually delivered.
        </p>
        <div className="page-hero-stats">
          <div className="phs-cell" onClick={() => document.querySelector('.s-sector-grid')?.scrollIntoView({ behavior: 'smooth' })}><div className="l">Sectors tracked</div><div className="n"><CountUp value={SECTORS.length} duration={1000} /></div><div className="s">FY09 — {BUDGET.proposed} · {SECTOR_YEARS.length}-year panel</div></div>
          <div className="phs-cell" onClick={() => setActive && setActive(top.k)}><div className="l">Top sector {BUDGET.proposed}</div><div className="n">{top.name}</div><div className="s">৳<CountUp value={top.proposed / 1000} decimals={1} />k cr</div></div>
          <div className="phs-cell green" onClick={() => setActive && setActive(fastest.k)}><div className="l">Fastest grower</div><div className="n"><CountUp value={parseFloat(fastest.growth)} decimals={1} suffix="×" /></div><div className="s">{fastest.name} · since FY09</div></div>
          <div className="phs-cell" onClick={() => document.querySelector('.s-gauges')?.scrollIntoView({ behavior: 'smooth' })}><div className="l">Avg implementation</div><div className="n"><CountUp value={parseFloat(avgImpl)} suffix="%" /></div><div className="s">FY09 — FY25 average</div></div>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { HeatmapSection, RankingsSection, Gauge, GaugesSection, SectorHero });
