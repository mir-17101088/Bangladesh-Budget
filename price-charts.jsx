const { useState: useStatePC } = React;

/* ============================================================
   TAX REVENUE DONUT
============================================================ */
function describeArc(cx, cy, r, startAng, endAng) {
  const s = polar(cx, cy, r, endAng);
  const e = polar(cx, cy, r, startAng);
  const large = endAng - startAng <= 180 ? 0 : 1;
  return ["M", s.x, s.y, "A", r, r, 0, large, 0, e.x, e.y].join(" ");
}
function polar(cx, cy, r, ang) {
  const a = (ang - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function Donut({ data, active, setActive, total = 100, size = 320, inner = 90, outer = 130 }) {
  let acc = 0;
  return (
    <svg className="donut-svg" viewBox={"0 0 " + size + " " + size}>
      <defs>
        {data.map((s, i) => (
          <linearGradient key={i} id={"dgrad" + i} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor={s.color} stopOpacity="1"/>
            <stop offset="100%" stopColor={s.color} stopOpacity="0.6"/>
          </linearGradient>
        ))}
      </defs>
      {data.map((s, i) => {
        const start = (acc / total) * 360;
        const end = ((acc + s.pct) / total) * 360;
        acc += s.pct;
        const mid = (start + end) / 2;
        const isActive = active === i;
        const r = isActive ? outer + 6 : outer;
        // Use stroke-based ring for clean look
        const C = 2 * Math.PI * ((outer + inner) / 2);
        return (
          <g key={i}
             onMouseEnter={() => setActive(i)}
             onClick={() => setActive(i)}
             role="button" aria-label={s.name + " " + s.pct + "%"}
             style={{ cursor: "pointer", transition: "all .2s" }}>
            {/* Sector as path */}
            <path
              d={(() => {
                const cx = size/2, cy = size/2;
                const a1 = (start - 90) * Math.PI/180;
                const a2 = (end - 90) * Math.PI/180;
                const large = (end - start) > 180 ? 1 : 0;
                const x1o = cx + r * Math.cos(a1), y1o = cy + r * Math.sin(a1);
                const x2o = cx + r * Math.cos(a2), y2o = cy + r * Math.sin(a2);
                const x1i = cx + inner * Math.cos(a2), y1i = cy + inner * Math.sin(a2);
                const x2i = cx + inner * Math.cos(a1), y2i = cy + inner * Math.sin(a1);
                return [
                  "M", x1o, y1o,
                  "A", r, r, 0, large, 1, x2o, y2o,
                  "L", x1i, y1i,
                  "A", inner, inner, 0, large, 0, x2i, y2i,
                  "Z"
                ].join(" ");
              })()}
              fill={"url(#dgrad" + i + ")"}
              stroke="#040D33" strokeWidth="2"
              style={{ filter: isActive ? "brightness(1.2) drop-shadow(0 0 12px " + s.color + ")" : "" }}
            />
          </g>
        );
      })}
    </svg>
  );
}

function TaxSection() {
  const [active, setActive] = useStatePC(0);
  const s = TAX_REVENUE[active];
  return (
    <section className="s s-tax" data-screen-label="04 Tax">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">Chapter 04 · Where it comes from</span>
          <h2>How the state raises ৳4,54,000 crore.</h2>
          <p className="lede" style={{ marginTop: 18, maxWidth: 720 }}>
            More than two-thirds of revenue comes from indirect taxes — VAT and customs — that fall heaviest on consumption.
          </p>
        </div>

        <div className="split2">
          <div className="donut-wrap glass">
            <Donut data={TAX_REVENUE} active={active} setActive={setActive}/>
            <div className="donut-center">
              <div className="e">{s.name}</div>
              <div className="n"><CountUp value={s.pct} suffix="%" duration={900}/></div>
              <div className="s">{s.amt}</div>
            </div>
          </div>

          <div className="donut-legend glass">
            <span className="eyebrow" style={{ marginBottom: 8 }}>Revenue sources · FY26</span>
            {TAX_REVENUE.map((d, i) => (
              <div key={i}
                   className={"dl-row " + (active === i ? "active" : "")}
                   role="button" tabIndex={0} aria-pressed={active === i}
                   onMouseEnter={() => setActive(i)}
                   onClick={() => setActive(i)}
                   onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActive(i); } }}>
                <span className="sw" style={{ background: d.color }}></span>
                <span className="name">{d.name}</span>
                <span className="pct">{d.pct}%</span>
                <span className="amt">{d.amt}</span>
              </div>
            ))}
            <div style={{ marginTop: 10, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between" }}>
              <span className="cap">Total NBR target</span>
              <span style={{ fontFamily: "var(--serif)", fontSize: 22, color: "#fff" }}>৳4,53,985 Cr</span>
            </div>
          </div>
        </div>

        <RelevantNews items={RELEVANT_NEWS.price_tax} accent="#0185C6" />
      </div>
    </section>
  );
}

/* ============================================================
   SUBSIDIES SECTION
============================================================ */
function SubsidySection() {
  const max = Math.max(...SUBSIDY.map(s => s.v)) * 1.18;
  return (
    <section className="s s-subsidy" data-screen-label="05 Subsidies">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow" style={{ color: "#f0c060" }}>Chapter 05 · The subsidy trend</span>
          <h2>The subsidy bill nearly doubled <em style={{ fontStyle: "italic", color: "#f0c060" }}>in three years</em>.</h2>
          <p className="lede" style={{ marginTop: 18, maxWidth: 720 }}>
            Power, fertiliser, and food subsidies are the three big drivers. From ৳5.8 of every ৳100 in FY22, the share climbed to ৳11.0 in FY25 — and is projected higher still.
          </p>
        </div>

        <div className="sub-chart-wrap glass">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 36, flexWrap: "wrap", gap: 12 }}>
            <span className="cap">Subsidies & incentives · Taka per ৳100 of expenditure</span>
            <div style={{ display: "flex", gap: 18, fontFamily: "var(--ui)", fontSize: 11, color: "var(--g3)", letterSpacing: "0.04em" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 14, height: 10, background: "linear-gradient(180deg, #B0832B, #6d501a)", borderRadius: 2 }}></span>Actual
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 14, height: 10, background: "repeating-linear-gradient(135deg, rgba(176,131,43,0.4) 0 4px, rgba(176,131,43,0.1) 4px 8px)", borderRadius: 2, border: "1px dashed rgba(176,131,43,0.6)" }}></span>Projected
              </span>
            </div>
          </div>

          <div className="sub-bars">
            {SUBSIDY.map((s, i) => {
              const h = (s.v / max) * 100;
              return (
                <div key={i} className={"sub-bar " + (s.future ? "future" : "")}>
                  <div className="colw">
                    <div className="col grow-bar" style={{ "--target-h": h + "%", animationDelay: (i * 110) + "ms" }}>
                      <span className="v">{s.future ? "~৳" : "৳"}<CountUp value={s.v} decimals={1} duration={1200}/></span>
                      {s.delta && <span className="delta">{s.delta}</span>}
                    </div>
                  </div>
                  <div className="yr">{s.fy}{s.future ? " · projected" : ""}</div>
                </div>
              );
            })}
          </div>

          <div className="sub-callout">
            <span className="big"><CountUp value={2.0} decimals={1} suffix="×" duration={1400}/></span>
            <span className="txt">"Nearly doubled in three years." Power & fertiliser subsidies alone now consume nearly the same share as defence.</span>
          </div>
        </div>

        <RelevantNews items={RELEVANT_NEWS.price_subsidy} accent="#B0832B" />
      </div>
    </section>
  );
}

Object.assign(window, { Donut, TaxSection, SubsidySection });
