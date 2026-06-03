const { useState: useStateSD, useMemo: useMemoSD } = React;

/* ============================================================
   SECTOR GRID + EXPANDED PANEL
============================================================ */
function Sparkline({ series, color }) {
  const W = 240, H = 40;
  const path = series.map((v, i) => {
    const x = (i / (series.length - 1)) * W;
    const y = H - v * (H - 4) - 2;
    return (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
  }).join(" ");
  const area = path + " L" + W + " " + H + " L0 " + H + " Z";
  return (
    <svg className="sg-spark" viewBox={"0 0 " + W + " " + H} preserveAspectRatio="none">
      <defs>
        <linearGradient id={"sgf" + color.replace("#","")} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.45"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill={"url(#sgf" + color.replace("#","") + ")"}/>
      <path d={path} stroke={color} strokeWidth="1.5" fill="none"/>
      <circle cx={W} cy={H - series[series.length - 1] * (H - 4) - 2} r="3" fill={color} stroke="#fff" strokeWidth="1"/>
    </svg>
  );
}

function SectorGridSection({ active, setActive }) {
  return (
    <section className="s s-sector-grid" data-screen-label="02 Sector Grid">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">Chapter 02 · The fourteen sectors</span>
          <h2>Every sector, every taka.</h2>
          <p className="lede" style={{ marginTop: 18, maxWidth: 720 }}>
            FY22 totals and their FY09→FY22 trajectories. Tap a card to open the stacked sub-sector view.
          </p>
        </div>

        <div className="sg-grid">
          {SECTORS.map(s => (
            <div key={s.k}
                 className={"sg-card " + (active === s.k ? "expanded" : "")}
                 style={{ "--accent": s.color }}
                 role="button"
                 tabIndex={0}
                 aria-expanded={active === s.k}
                 aria-label={"Open " + s.name + " sector detail"}
                 onClick={() => setActive(s.k)}
                 onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActive(s.k); } }}>
              <div className="sg-head">
                <span className="sg-cat">{s.name}</span>
                <span className="sg-rank">Rises · {s.rise}/{FY_YEARS.length - 1} yrs</span>
              </div>
              <div className="sg-name">{s.name}</div>
              <div className="sg-stats">
                <div className="sg-total">৳{(s.fy26/1000).toFixed(1)}k <span className="unit">Cr · FY26</span></div>
                <div className="sg-growth">
                  <div className="v">{s.growth}</div>
                  <div className="l">since FY09</div>
                </div>
              </div>
              <Sparkline series={s.series} color={s.color}/>
              <div className="sg-foot">
                <span className="cap">FY09 ৳{(s.fy09/1000).toFixed(1)}k → FY26 ৳{(s.fy26/1000).toFixed(1)}k Cr</span>
                <span className="sg-cta">Explore →</span>
              </div>
            </div>
          ))}
        </div>

        <RelevantNews items={RELEVANT_NEWS.sector_grid} accent="#0185C6" />
      </div>
    </section>
  );
}

/* ============================================================
   EXPANDED — Defence-style stacked bars
============================================================ */
function ExpandedSection({ active }) {
  const s = SECTORS.find(x => x.k === active);
  const [mode, setMode] = useStateSD("abs");

  // For the chosen sector, build a 3-tier stack across ALL years (FY09 → FY26)
  const allBars = useMemoSD(() => {
    return FY_YEARS.map((fy) => {
      const tot = s.values[fy];
      return {
        fy,
        a: Math.round(tot * 0.55),
        b: Math.round(tot * 0.25),
        c: Math.round(tot * 0.20),
        total: tot,
        future: ["FY23","FY24","FY25","FY26"].includes(fy),
      };
    });
  }, [active]);

  const W = 1180, H = 420, pad = { l: 80, r: 32, t: 56, b: 44 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const step = innerW / allBars.length;
  const bw = step * 0.62;

  const maxAbs = Math.max(...allBars.map(b => b.total)) * 1.15;
  const gdpMax = 1.2;
  const dispMax = mode === "abs" ? maxAbs : gdpMax;
  const sub = (v) => mode === "abs" ? v : (v / s.fy26) * gdpMax;

  const subDark = s.color + "ee";
  const subMid  = s.color + "bb";
  const subLite = s.color + "66";

  const subnames = active === "defence"
    ? ["Defence Ministry","Other Services","Armed Forces"]
    : ["Primary line","Programme spend","Subordinate"];

  // Index where projected years begin (FY23)
  const firstProjected = FY_YEARS.indexOf("FY23");

  return (
    <section className="s s-sector-expand" data-screen-label="03 Expanded">
      <div className="wrap">
        <div className="sg-expand glass" style={{ "--accent": s.color, borderColor: s.color + "33" }}>
          <div className="sg-expand-head">
            <div className="sg-expand-title">
              <span className="eyebrow" style={{ color: s.color }}>Sector deep-dive · {s.name}</span>
              <h3>{s.name} — 18 years in three layers.</h3>
            </div>
            <div className="see-toggle" style={{ "--accent": s.color }}>
              <button className={mode === "abs" ? "active" : ""} style={{ background: mode==="abs" ? s.color : "transparent" }} onClick={() => setMode("abs")}>Absolute · ৳ Cr</button>
              <button className={mode === "gdp" ? "active" : ""} style={{ background: mode==="gdp" ? s.color : "transparent" }} onClick={() => setMode("gdp")}>% of GDP</button>
            </div>
          </div>

          <div className="sg-expand-stats" style={{ marginBottom: 28, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
            <div className="see-stat"><div className="l">FY26 total</div><div className="v">৳<CountUp value={s.fy26}/><span style={{ fontSize: 14, color: "var(--g4)", marginLeft: 6 }}>Cr</span></div><div className="s">vs FY09: ৳{s.fy09.toLocaleString("en-IN")} Cr</div></div>
            <div className="see-stat"><div className="l">Growth multiple</div><div className="v" style={{ color: s.color }}><CountUp value={parseFloat(s.growth)} decimals={1} suffix="×"/></div><div className="s">FY09 → FY26 · 18 fiscal years</div></div>
            <div className="see-stat"><div className="l">Years of rise</div><div className="v"><CountUp value={s.rise}/>/{FY_YEARS.length - 1}</div><div className="s">consecutive YoY increases</div></div>
            <div className="see-stat"><div className="l">Peak year</div><div className="v">FY26</div><div className="s">all-time high in the series</div></div>
          </div>

          <div className="chart-scroll">
          <svg className="see-chart" viewBox={"0 0 " + W + " " + H} preserveAspectRatio="none">
            {/* gridlines */}
            {[0, 0.25, 0.5, 0.75, 1.0].map(g => {
              const v = g * dispMax;
              const y = pad.t + (1 - g) * innerH;
              return (
                <g key={g}>
                  <line x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke="rgba(255,255,255,0.06)"/>
                  <text x={pad.l - 10} y={y + 3} textAnchor="end" className="tick-label">
                    {mode === "abs" ? ("৳" + ((v/1000)|0) + "k Cr") : (v.toFixed(1) + "%")}
                  </text>
                </g>
              );
            })}

            {/* bars */}
            {allBars.map((b, i) => {
              const x = pad.l + i * step + (step - bw) / 2;
              const valA = sub(b.a), valB = sub(b.b), valC = sub(b.c);
              const tot = valA + valB + valC;
              const totH = (tot / dispMax) * innerH;
              const aH = (valA / dispMax) * innerH;
              const bH = (valB / dispMax) * innerH;
              const cH = (valC / dispMax) * innerH;
              const isFY26 = b.fy === "FY26";
              const baseDelay = i * 45;
              return (
                <g key={b.fy}>
                  <AnimatedRect x={x} y={pad.t + innerH - aH} width={bw} height={aH} fill={subDark} rx="2"
                        opacity={b.future ? 0.85 : 1}
                        stroke={b.future ? s.color : "none"}
                        strokeOpacity={b.future ? 0.55 : 0} strokeDasharray={b.future ? "3 3" : ""}
                        duration={900} delay={baseDelay}/>
                  <AnimatedRect x={x} y={pad.t + innerH - aH - bH} width={bw} height={bH} fill={subMid}
                        opacity={b.future ? 0.85 : 1}
                        duration={900} delay={baseDelay + 70}/>
                  <AnimatedRect x={x} y={pad.t + innerH - totH} width={bw} height={cH} fill={subLite}
                        opacity={b.future ? 0.85 : 1}
                        duration={900} delay={baseDelay + 140}/>
                  <text x={x + bw/2} y={H - 20} textAnchor="middle" className="tick-label"
                        style={{ fill: b.future ? s.color : undefined, opacity: b.future ? 0.9 : 1 }}>{b.fy}</text>
                  {isFY26 && (
                    <text x={x + bw/2} y={pad.t + innerH - totH - 14} textAnchor="middle"
                          style={{ fontFamily: "var(--serif)", fontSize: 15, fill: "#fff" }}>
                      ৳{(b.total/1000).toFixed(1)}k
                    </text>
                  )}
                </g>
              );
            })}

            {/* divider line between actual and projected */}
            <line x1={pad.l + firstProjected * step} y1={pad.t} x2={pad.l + firstProjected * step} y2={pad.t + innerH}
                  stroke={s.color} strokeOpacity="0.45" strokeDasharray="2 4"/>
            <text x={pad.l + firstProjected * step + 8} y={pad.t - 18}
                  style={{ fontFamily: "var(--ui)", fontSize: 10, fill: s.color, letterSpacing: "0.18em" }}>
              PROJECTED →
            </text>
          </svg>
          </div>

          <div className="see-legend">
            <span className="ll"><span className="sw" style={{ background: subDark }}></span>{subnames[0]}</span>
            <span className="ll"><span className="sw" style={{ background: subMid }}></span>{subnames[1]}</span>
            <span className="ll"><span className="sw" style={{ background: subLite }}></span>{subnames[2]}</span>
            <span className="ll" style={{ marginLeft: "auto" }}>
              <span className="sw" style={{ background: "transparent", border: "1px dashed " + s.color }}></span>
              FY23–FY26 · projected
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { Sparkline, SectorGridSection, ExpandedSection });
