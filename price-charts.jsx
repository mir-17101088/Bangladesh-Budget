const { useState: useStatePC, useEffect: useEffectPC, useMemo: useMemoPC } = React;

/* ============================================================
   RESOURCES DONUT — "Where the budget's money comes from"
   A stroke-ring donut with two states:
     A) Resources (outer ring, 6 segments)
     B) NBR breakdown (5 segments) — reached by clicking the
        single clickable slice (Tax Revenue · NBR).
   Geometry is driven by each segment's `pct`. The ring is built
   from <circle> strokes + dash math, so there are no thick black
   slice borders — just a clean keyline gap between segments.
============================================================ */
function ResourceDonut({ segments, view, active, setActive, onDrill, size = 340 }) {
  const cx = size / 2, cy = size / 2;
  const R = size / 2 - 40;                 // radius to centre of stroke
  const C = 2 * Math.PI * R;
  const GAP = 7;                            // keyline gap between segments (path units)
  const W_BASE = 26;                        // ring thickness
  const W_HERO = 33;                        // NBR's thicker hero ring (state A)
  const W_LIFT = 7;                         // extra thickness when active

  // Cumulative geometry per segment.
  let acc = 0;
  const arcs = segments.map((s, i) => {
    const frac = (s.pct || 0) / 100;
    const startLen = (acc / 100) * C;
    const segLen = Math.max(0.0001, frac * C - GAP);
    const midDeg = ((startLen + (frac * C) / 2) / C) * 360 - 90;
    acc += (s.pct || 0);
    const isHero = view === "resources" && !!s.drill;
    return { s, i, startLen, segLen, midDeg, isHero };
  });

  // Plus-badge position for the clickable (NBR) slice — sits just
  // outside the ring at the slice's mid-angle.
  const hero = arcs.find(a => a.isHero);
  let badge = null;
  if (hero) {
    const a = (hero.midDeg) * Math.PI / 180;
    const rb = R + W_HERO / 2 + 14;
    badge = { x: cx + rb * Math.cos(a), y: cy + rb * Math.sin(a) };
  }

  return (
    <svg className="donut-svg" viewBox={"0 0 " + size + " " + size}
      role="img" aria-label="Donut chart of where the budget's resources come from">
      <g key={view} className="ring" transform={"rotate(-90 " + cx + " " + cy + ")"}>
        {arcs.map(({ s, i, startLen, segLen, midDeg, isHero }) => {
          const isActive = active === i;
          const w = (isHero ? W_HERO : W_BASE) + (isActive ? W_LIFT : 0);
          const dim = active != null && !isActive ? 0.4 : 1;
          const clickable = !!s.drill;
          const handlers = {
            onClick: () => setActive(active === i ? null : i),
            onFocus: () => setActive(i),
            onBlur: () => setActive(null),
          };
          const interactive = clickable
            ? {
              role: "button", tabIndex: 0,
              "aria-expanded": false,
              "aria-label": s.name + ", " + s.pct + " percent, " + fmtCr(s.cr) + ". Activate to break down.",
              onClick: () => onDrill(s.drill),
              onKeyDown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onDrill(s.drill); } },
            }
            : { "aria-hidden": true };
          return (
            <circle
              key={s.key || s.name}
              className={"ring-seg" + (isHero ? " hero" : "") + (clickable ? " clickable" : "")}
              cx={cx} cy={cy} r={R}
              fill="none"
              stroke={s.color}
              strokeWidth={w}
              strokeLinecap="butt"
              strokeDasharray={segLen + " " + C}
              strokeDashoffset={-startLen}
              opacity={dim}
              style={{ "--seglen": segLen, "--c": C, "--delay": (i * 70) + "ms", cursor: "pointer" }}
              {...handlers}
              {...interactive}
            />
          );
        })}

        {/* Persistent shimmer keyline over the clickable slice */}
        {hero && (
          <circle className="ring-shimmer" cx={cx} cy={cy} r={R + W_HERO / 2 + 3}
            fill="none" stroke="#d6f4ec" strokeWidth="1.5" strokeLinecap="round"
            strokeDasharray={hero.segLen + " " + C} strokeDashoffset={-hero.startLen}
            aria-hidden="true" />
        )}
      </g>

      {/* "+" expand badge on the clickable slice (decorative; the slice carries the click) */}
      {badge && (
        <g className="drill-badge" transform={"translate(" + badge.x + " " + badge.y + ")"} aria-hidden="true">
          <g className="drill-badge-in">
            <circle r="12" />
            <path d="M -4.5 0 H 4.5 M 0 -4.5 V 4.5" stroke="#0e1f22" strokeWidth="2" strokeLinecap="round" />
          </g>
        </g>
      )}
    </svg>
  );
}

/* One legend row — shared by both states. NBR (clickable) renders as a
   button with a "Break down" chip; every other row is a read-only entry. */
function LegendRow({ d, idx, active, setActive, onDrill }) {
  const clickable = !!d.drill;
  const common = {
    className: "dl-row" + (active === idx ? " active" : "") + (clickable ? " clickable" : ""),
    onClick: () => setActive(active === idx ? null : idx),
    style: { cursor: "pointer" },
  };
  const inner = (
    <>
      <span className="sw" style={{ background: d.color }}></span>
      <span className="dl-main">
        <span className="name">{d.name}</span>
        <span className="amt">{fmtCr(d.cr)}</span>
      </span>
      {clickable && <span className="dl-chip">Break down<span className="chev">›</span></span>}
      <span className="pct">{d.pct}%</span>
    </>
  );
  if (clickable) {
    return (
      <button type="button" {...common}
        aria-expanded={false}
        onFocus={() => setActive(idx)} onBlur={() => setActive(null)}
        onClick={() => onDrill(d.drill)}>
        {inner}
      </button>
    );
  }
  return <div {...common} aria-hidden="false">{inner}</div>;
}

const TAX_TREND_DATA = [
  { fy: "FY20", direct: 19.28, indirect: 38.32, total: 422976 },
  { fy: "FY21", direct: 19.28, indirect: 38.32, total: 453525 },
  { fy: "FY22", direct: 18.49, indirect: 37.04, total: 520033 },
  { fy: "FY23", direct: 18.66, indirect: 36.05, total: 574310 },
  { fy: "FY24", direct: 20.11, indirect: 37.89, total: 611392 },
  { fy: "FY25", direct: 20.21, indirect: 37.20, total: 628546 },
];

function TaxTrendChart() {
  const maxPct = 45; // slightly above 38.32%

  return (
    <div className="tax-trend-wrap" style={{ marginTop: "56px", paddingTop: "56px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="section-head" style={{ marginBottom: "32px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <h3 style={{ fontSize: "28px", color: "#fff", margin: 0, fontFamily: "var(--serif)", fontWeight: 600 }}>The burden of indirect taxation remains high</h3>
        <p className="lede" style={{ fontSize: "18px", maxWidth: "760px", margin: 0, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
          Despite a growing budget, the reliance on indirect taxes continues to heavily outweigh taxes on income and profit. This regressive structure disproportionately impacts lower-income citizens.
        </p>
      </div>

      <div className="glass" style={{ padding: "40px", position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "48px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div className="cap" style={{ color: "rgba(255,255,255,0.5)", marginBottom: "8px" }}>Tax collection as a % of total expenditure</div>
          </div>
          <div style={{ display: "flex", gap: "24px", fontSize: "14px", fontFamily: "var(--ui)", fontWeight: 500 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#FF6B35" }}></div>
              <span style={{ color: "#fff" }}>Indirect Taxes*</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#3FD3B8" }}></div>
              <span style={{ color: "#fff" }}>Taxes on income & profit</span>
            </div>
          </div>
        </div>

        {/* --- DESKTOP CHART --- */}
        <div className="chart-desktop">
          <div style={{ display: "flex", alignItems: "flex-end", height: "280px", gap: "16px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "16px" }}>
            {TAX_TREND_DATA.map((d, i) => {
              const hInd = (d.indirect / maxPct) * 100;
              const hDir = (d.direct / maxPct) * 100;
              const isProposed = d.fy === "FY25";

              return (
                <div key={d.fy} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end", opacity: 0, animation: "fadeInUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards", animationDelay: `${i * 100}ms` }}>
                  
                  <div style={{ width: "100%", display: "flex", alignItems: "flex-end", justifyContent: "center", gap: "8px", height: "100%", position: "relative" }}>
                    
                    {/* Indirect Bar */}
                    <div style={{ width: "min(40%, 32px)", height: `${hInd}%`, background: isProposed ? "linear-gradient(to top, rgba(255,107,53,0.2), #FF6B35)" : "linear-gradient(to top, rgba(255,107,53,0.1), rgba(255,107,53,0.6))", borderRadius: "6px 6px 0 0", position: "relative", display: "flex", justifyContent: "center", transition: "all 0.3s", boxShadow: isProposed ? "0 0 16px rgba(255,107,53,0.3)" : "none" }} className="hover-bar">
                      <div className="bar-val indirect-bar-val" style={{ position: "absolute", top: "-28px", fontSize: "14px", fontFamily: "var(--ui)", color: isProposed ? "#FF6B35" : "rgba(255,107,53,0.8)", fontWeight: isProposed ? 700 : 500, opacity: isProposed ? 1 : 0.8 }}>
                        <CountUp value={d.indirect} decimals={2} duration={1200} />%
                      </div>
                    </div>

                    {/* Direct Bar */}
                    <div style={{ width: "min(40%, 32px)", height: `${hDir}%`, background: isProposed ? "linear-gradient(to top, rgba(63,211,184,0.2), #3FD3B8)" : "linear-gradient(to top, rgba(63,211,184,0.1), rgba(63,211,184,0.6))", borderRadius: "6px 6px 0 0", position: "relative", display: "flex", justifyContent: "center", transition: "all 0.3s", boxShadow: isProposed ? "0 0 16px rgba(63,211,184,0.3)" : "none" }} className="hover-bar">
                      <div className="bar-val direct-bar-val" style={{ position: "absolute", top: "-28px", fontSize: "14px", fontFamily: "var(--ui)", color: isProposed ? "#3FD3B8" : "rgba(63,211,184,0.8)", fontWeight: isProposed ? 700 : 500, opacity: isProposed ? 1 : 0.8 }}>
                        <CountUp value={d.direct} decimals={2} duration={1200} />%
                      </div>
                    </div>

                  </div>

                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: "16px", marginTop: "16px" }}>
            {TAX_TREND_DATA.map((d, i) => {
              const isProposed = d.fy === "FY25";
              return (
                <div key={d.fy + "-label"} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: "15px", fontFamily: "var(--ui)", color: isProposed ? "#fff" : "rgba(255,255,255,0.7)", fontWeight: isProposed ? 700 : 500, background: isProposed ? "rgba(255,255,255,0.1)" : "transparent", padding: "4px 8px", borderRadius: "12px", display: "inline-block" }}>{d.fy}</div>
                  <div style={{ fontSize: "13px", fontFamily: "var(--ui)", color: "rgba(255,255,255,0.5)", marginTop: "12px", lineHeight: 1.4 }}>
                    <span style={{ color: "rgba(255,255,255,0.4)", display: "block", marginBottom: "2px" }}>Total Exp.</span>
                    <span style={{ color: isProposed ? "#fff" : "rgba(255,255,255,0.8)", fontWeight: 500 }}>৳{(d.total/100000).toFixed(2)} Lakh</span>
                    <span style={{ fontSize: "11px", marginLeft: "2px" }}>cr</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* --- MOBILE CHART (Horizontal) --- */}
        <div className="chart-mobile">
          {TAX_TREND_DATA.map((d, i) => {
            const wInd = (d.indirect / maxPct) * 100;
            const wDir = (d.direct / maxPct) * 100;
            const isProposed = d.fy === "FY25";

            return (
              <div key={d.fy} style={{ marginBottom: "24px", opacity: 0, animation: "fadeInUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards", animationDelay: `${i * 100}ms` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", alignItems: "baseline" }}>
                  <span style={{ fontSize: "16px", fontFamily: "var(--ui)", fontWeight: 700, color: isProposed ? "#fff" : "rgba(255,255,255,0.7)", background: isProposed ? "rgba(255,255,255,0.1)" : "transparent", padding: "2px 8px", borderRadius: "8px", marginLeft: "-8px" }}>{d.fy}</span>
                  <span style={{ fontSize: "13px", fontFamily: "var(--ui)", color: "rgba(255,255,255,0.5)" }}>
                    Total: <span style={{ color: isProposed ? "#fff" : "rgba(255,255,255,0.8)", fontWeight: 500 }}>৳{(d.total/100000).toFixed(2)} Lakh</span> <span style={{ fontSize: "11px" }}>cr</span>
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  
                  {/* Indirect Bar */}
                  <div style={{ width: "100%", height: "24px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", position: "relative" }}>
                    <div style={{ width: `${wInd}%`, height: "100%", background: isProposed ? "linear-gradient(to right, rgba(255,107,53,0.2), #FF6B35)" : "linear-gradient(to right, rgba(255,107,53,0.1), rgba(255,107,53,0.6))", borderRadius: "4px", position: "absolute", left: 0, top: 0, boxShadow: isProposed ? "0 0 16px rgba(255,107,53,0.3)" : "none", transition: "width 0.5s" }} />
                    <div style={{ position: "absolute", left: `calc(${wInd}% + 8px)`, top: "50%", transform: "translateY(-50%)", fontSize: "13px", fontFamily: "var(--ui)", color: isProposed ? "#FF6B35" : "rgba(255,107,53,0.8)", fontWeight: 700 }}>
                      <CountUp value={d.indirect} decimals={2} duration={1200} />%
                    </div>
                  </div>

                  {/* Direct Bar */}
                  <div style={{ width: "100%", height: "24px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", position: "relative" }}>
                    <div style={{ width: `${wDir}%`, height: "100%", background: isProposed ? "linear-gradient(to right, rgba(63,211,184,0.2), #3FD3B8)" : "linear-gradient(to right, rgba(63,211,184,0.1), rgba(63,211,184,0.6))", borderRadius: "4px", position: "absolute", left: 0, top: 0, boxShadow: isProposed ? "0 0 16px rgba(63,211,184,0.3)" : "none", transition: "width 0.5s" }} />
                    <div style={{ position: "absolute", left: `calc(${wDir}% + 8px)`, top: "50%", transform: "translateY(-50%)", fontSize: "13px", fontFamily: "var(--ui)", color: isProposed ? "#3FD3B8" : "rgba(63,211,184,0.8)", fontWeight: 700 }}>
                      <CountUp value={d.direct} decimals={2} duration={1200} />%
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        <div style={{ fontSize: "13px", fontFamily: "var(--ui)", color: "rgba(255,255,255,0.4)", marginTop: "32px", textAlign: "left", fontStyle: "italic" }}>
          * Indirect taxes include Value Added Taxes, Supplementary Duty and Import Duty
        </div>

      </div>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hover-bar:hover { filter: brightness(1.3); }
        .chart-desktop { display: block; }
        .chart-mobile { display: none; }
        
        .indirect-bar-val {
          transform: translateX(-4px);
        }
        .direct-bar-val {
          transform: translateX(4px);
        }
        
        @media (max-width: 900px) and (min-width: 769px) {
          .indirect-bar-val {
            transform: translateX(-12px);
          }
          .direct-bar-val {
            transform: translateX(12px);
          }
        }
        
        @media (max-width: 768px) {
          .tax-trend-wrap .glass { padding: 32px 24px; }
          .chart-desktop { display: none !important; }
          .chart-mobile { display: block !important; }
        }
        @media (max-width: 480px) {
          .tax-trend-wrap .glass { padding: 24px 16px; }
        }
      `}</style>
    </div>
  );
}

function TaxSection() {
  const TOTAL = RESOURCES_TOTAL_CR;
  const [view, setView] = useStatePC("resources");          // "resources" | drill-key
  const [active, setActive] = useStatePC(null);

  // Resolve the current view's segment list. A drill with no items
  // (or a missing entry) degrades safely back to resources.
  const drill = view !== "resources" ? RESOURCE_DRILLDOWNS[view] : null;
  const segments = (view === "resources")
    ? RESOURCES.filter(s => (s.pct || 0) > 0)
    : ((drill && Array.isArray(drill.items)) ? drill.items.filter(s => (s.pct || 0) > 0) : []);

  // Guard: if a drill view somehow has no items, fall back.
  useEffectPC(() => {
    if (view !== "resources" && segments.length === 0) setView("resources");
  }, [view, segments.length]);

  // Esc returns from a breakdown to resources.
  useEffectPC(() => {
    const onKey = (e) => { if (e.key === "Escape" && view !== "resources") { setView("resources"); setActive(null); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view]);

  const enterDrill = (k) => {
    if (RESOURCE_DRILLDOWNS[k] && Array.isArray(RESOURCE_DRILLDOWNS[k].items) && RESOURCE_DRILLDOWNS[k].items.length) {
      setView(k); setActive(null);
    }
  };
  const back = () => { setView("resources"); setActive(null); };

  // Group proportions for the Earned / Borrowed / Granted summary.
  const groupStat = useMemoPC(() => RESOURCE_GROUPS.map(g => ({
    ...g,
    pct: RESOURCES.filter(r => r.group === g.key).reduce((a, r) => a + r.pct, 0),
  })), []);

  // Centre "hero number" — the focused segment, else the running total.
  const totalCr = (view === "resources") ? TOTAL : (drill ? drill.total_cr : TOTAL);
  const focus = (active != null) ? segments[active] : null;
  const center = focus
    ? { eyebrow: focus.name, value: focus.cr, sub: focus.pct + "% · " + fmtCr(focus.cr) }
    : (view === "resources")
      ? { eyebrow: "Total budget", value: TOTAL, sub: PRICE_FY_SPAN + " · " + fmtCr(TOTAL) }
      : { eyebrow: "Total " + (drill.short || drill.label), value: drill.total_cr, sub: PRICE_FY_SPAN + " · " + fmtCr(drill.total_cr) };

  return (
    <section className="s s-tax" data-screen-label="04 Resources">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">Where it comes from</span>
          <h2>Funding the ৳7,90,000 crore budget</h2>
          <p className="lede" style={{ marginTop: 18, maxWidth: 760 }}>
            Most of the {PRICE_FY_SPAN} budget is self-financed: the state earns roughly seven taka of every ten
            it spends.
            <strong style={{ color: "#fff", fontWeight: 600 }}> But how fair is our tax system?</strong>
            <p>Bangladesh's tax system leans heavily on indirect taxes — VAT, supplementary duty, and customs duty — which everyone pays regardless of income. 
            That hits lower-income households hardest. While taxation is meant to promote equity, direct taxes account for only a third of Bangladesh’s total revenue.</p>Tap <em style={{ fontStyle: "italic", color: "#3FD3B8" }}>Tax Revenue (NBR)</em> to see how regressive taxes fund the country.
          </p>
        </div>

        {/* Breadcrumb */}
        <nav className="donut-crumb" aria-label="Chart location">
          {view === "resources" ? (
            <span className="crumb-here">Resources</span>
          ) : (
            <>
              <button type="button" className="crumb-link" onClick={back}>‹ Resources</button>
              <span className="crumb-sep">/</span>
              <span className="crumb-here">{drill.label}</span>
            </>
          )}
        </nav>

        <div className="split2">
          <div className="donut-wrap glass">
            <ResourceDonut segments={segments} view={view} active={active} setActive={setActive} onDrill={enterDrill} />
            <div className="donut-center" aria-hidden="true">
              <div className="e">{center.eyebrow}</div>
              <div className="n">
                <CountUp value={center.value / 100000} decimals={2} prefix="৳" suffix=" lakh" duration={900} />
              </div>
              <div className="u">crore</div>
              <div className="s">{center.sub}</div>
            </div>
          </div>

          <div className="donut-legend glass">
            {view === "resources" ? (
              <>
                <div className="legend-head">
                  <span className="eyebrow">Resources · {PRICE_FY_SPAN}</span>
                </div>

                {/* Earned / Borrowed / Granted summary bar — the editorial spine */}
                <div className="grp-summary" aria-hidden="true">
                  <div className="grp-bar">
                    {groupStat.map(g => (
                      <span key={g.key} className={"grp-seg grp-" + g.key} style={{ width: g.pct + "%" }} title={g.label + " " + g.pct.toFixed(1) + "%"}></span>
                    ))}
                  </div>
                  <div className="grp-keys">
                    {groupStat.map(g => (
                      <span key={g.key} className="grp-key">
                        <span className={"dot grp-" + g.key}></span>
                        <b>{g.label}</b> {g.pct.toFixed(1).replace(/\.0$/, "")}%
                      </span>
                    ))}
                  </div>
                </div>

                {/* Rows grouped by Earned / Borrowed / Granted */}
                <div className="legend-groups">
                  {RESOURCE_GROUPS.map(g => {
                    const rows = RESOURCES.map((r, i) => ({ r, i })).filter(x => x.r.group === g.key && x.r.pct > 0);
                    if (!rows.length) return null;
                    return (
                      <div key={g.key} className="legend-group">
                        <div className="lg-head"><span className={"dot grp-" + g.key}></span>{g.label}<span className="lg-note">{g.note}</span></div>
                        {rows.map(({ r, i }) => (
                          <LegendRow key={r.key} d={r} idx={i} active={active} setActive={setActive} onDrill={enterDrill} />
                        ))}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <div className="legend-head with-back">
                  <button type="button" className="back-btn" onClick={back}>
                    <span className="bk-chev">‹</span> Back to resources
                  </button>
                  <span className="eyebrow">{drill.label} · breakdown</span>
                </div>
                <div className="legend-groups">
                  {segments.map((d, i) => (
                    <LegendRow key={d.name} d={d} idx={i} active={active} setActive={setActive} onDrill={enterDrill} />
                  ))}
                </div>
                <div className="legend-total">
                  <span className="cap">Total NBR · {PRICE_FY_SPAN}</span>
                  <span className="lt-amt">{fmtCr(drill.total_cr)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Screen-reader data table mirroring the current view */}
        <table className="sr-only">
          <caption>{view === "resources" ? "Budget resources, " + PRICE_FY_SPAN : drill.label + " breakdown, " + PRICE_FY_SPAN}</caption>
          <thead><tr><th>Source</th><th>Share</th><th>Amount</th></tr></thead>
          <tbody>
            {segments.map((d, i) => (
              <tr key={i}><td>{d.name}</td><td>{d.pct}%</td><td>{fmtCr(d.cr)}</td></tr>
            ))}
          </tbody>
        </table>

        <TaxTrendChart />

        <RelevantNews items={RELEVANT_NEWS.price_tax} accent="#28B49E" />
      </div>
    </section>
  );
}

/* ============================================================
   SUBSIDIES SECTION
============================================================ */
function SubsidySection() {
  const SUB = SUBSIDY.filter(s => typeof s.v === "number" && isFinite(s.v));
  const max = Math.max(...SUB.map(s => s.v)) * 1.18;
  return (
    <section className="s s-subsidy" data-screen-label="05 Subsidies">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow" style={{ color: "#f0c060" }}>The subsidy trend</span>
          <h2>The subsidy bill nearly doubled <em style={{ fontStyle: "italic", color: "#f0c060" }}>in three years</em></h2>
          <p className="lede" style={{ marginTop: 18, maxWidth: 720 }}>
            Power, fertiliser, and food subsidies are the three big drivers. From ৳5.8 of every ৳100 in FY22, the share climbed to ৳11.1 in FY25 — and is projected higher still.
          </p>
        </div>

        <div className="sub-chart-wrap glass">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 36, flexWrap: "wrap", gap: 12 }}>
            <span className="cap">Subsidies & incentives · per ৳100 of expenditure</span>

          </div>

          <div className="sub-bars">
            {SUB.map((s, i) => {
              const h = (s.v / max) * 100;
              const status = BUDGET.statusOf(s.fy);
              const isProposed = s.fy === BUDGET.proposed;
              return (
                <div key={i} className={"sub-bar " + (isProposed ? "active " : "") + status}>
                  <div className="colw">
                    <div className="col grow-bar" style={{ "--target-h": h + "%", animationDelay: (i * 110) + "ms" }}>
                      <span className="v">৳<CountUp value={s.v} decimals={1} duration={1200} /></span>
                      {s.delta && <span className="delta">{s.delta}</span>}
                    </div>
                  </div>
                  <div className="yr">{s.fy}</div>
                </div>
              );
            })}
          </div>

          <div className="sub-callout">
            <span className="big"><CountUp value={2.0} decimals={1} suffix="×" duration={1400} /></span>
            <span className="txt">"Nearly doubled in three years." Power & fertiliser subsidies alone now consume nearly the same share as defence.</span>
          </div>
        </div>

        <RelevantNews items={RELEVANT_NEWS.price_subsidy} accent="#B0832B" />
      </div>
    </section>
  );
}

/* ============================================================
   BUDGET-GDP RATIO SECTION
============================================================ */
const GDP_RATIO_DATA = [
  { country: "Bangladesh", pct: 12.03, color: "#FF6B35", isBd: true },
  { country: "Indonesia", pct: 16.84, color: "rgba(255,255,255,0.4)" },
  { country: "Cambodia", pct: 17.26, color: "rgba(255,255,255,0.4)" },
  { country: "Sri Lanka", pct: 19.32, color: "rgba(255,255,255,0.4)" },
  { country: "Pakistan", pct: 19.47, color: "rgba(255,255,255,0.4)" },
  { country: "Hong Kong", pct: 23.00, color: "rgba(255,255,255,0.4)" },
  { country: "Bhutan", pct: 27.13, color: "rgba(255,255,255,0.4)" },
  { country: "India", pct: 28.38, color: "rgba(255,255,255,0.4)" }
];

function BudgetGdpRatioSection() {
  const max = 30; // Max percentage to scale the bars against

  return (
    <section className="s s-gdp-ratio" data-screen-label="04b Regional Ratio">
      <div className="wrap">
        <div className="split2" style={{ alignItems: "center" }}>
          <div className="section-head" style={{ marginBottom: 0 }}>
            <span className="eyebrow" style={{ color: "#FF6B35" }}>Regional comparison</span>
            <h2>Budget-GDP ratio among lowest in South Asia</h2>
            <p className="lede" style={{ marginTop: 18, maxWidth: "100%" }}>
              For more than a decade, the unveiling of the national budget has triggered a familiar chorus of reactions: “big budget”, a “massive budget” or a “debt-driven budget”. As if its size alone determines its significance. Yet a comparison with neighbouring countries tells a different story.
            </p>
          </div>

          <div className="gdp-chart-wrap glass" style={{ padding: "32px" }}>
            <div className="cap" style={{ marginBottom: 24 }}>Government Expenditure (% of GDP, 2024)</div>
            <div className="gdp-bars" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {GDP_RATIO_DATA.map((d, i) => {
                const w = (d.pct / max) * 100;
                return (
                  <div key={d.country} style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ width: "90px", textAlign: "right", fontFamily: "var(--ui)", fontSize: "14px", fontWeight: d.isBd ? 700 : 400, color: d.isBd ? "#fff" : "rgba(255,255,255,0.8)" }}>
                      {d.country}
                    </div>
                    <div style={{ flex: 1, height: "24px", background: "rgba(255,255,255,0.05)", borderRadius: "12px", overflow: "hidden", position: "relative" }}>
                      <div style={{
                        position: "absolute", left: 0, top: 0, bottom: 0, width: w + "%",
                        background: d.color, borderRadius: "12px",
                        animation: "growBarH 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards",
                        animationDelay: (i * 100) + "ms",
                        transformOrigin: "left",
                        transform: "scaleX(0)"
                      }}></div>
                    </div>
                    <div style={{ width: "64px", fontFamily: "var(--serif)", fontSize: d.isBd ? "22px" : "15px", fontWeight: d.isBd ? 700 : 400, color: d.isBd ? d.color : "#fff" }}>
                      <CountUp value={d.pct} decimals={2} duration={1200} />%
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ fontFamily: "var(--ui)", fontSize: "12px", color: "rgba(255,255,255,0.4)", textAlign: "right", marginTop: "24px" }}>Source: IMF</div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes growBarH {
          0% { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
        @media (max-width: 640px) {
          .s-gdp-ratio .split2 {
            display: flex;
            flex-direction: column;
            gap: 40px;
          }
          .s-gdp-ratio .gdp-chart-wrap {
            padding: 24px !important;
            width: 100%;
          }
        }
      `}</style>
    </section>
  );
}

function DevOpGapSection() {
  const [hoverIdx, setHoverIdx] = useStatePC(null);

  // We use DEV_OP_GAP_DATA from price-data.jsx
  const data = window.DEV_OP_GAP_DATA || [];

  if (data.length === 0) return null;

  // SVG Chart dimensions
  const w = 800;
  const h = 400;
  const padX = 40;
  const padY = 60;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;

  // Min/Max for Y axis to give some breathing room
  const minV = Math.min(...data.map(d => Math.min(d.dev, d.op))) - 5;
  const maxV = Math.max(...data.map(d => Math.max(d.dev, d.op))) + 5;
  const range = maxV - minV;

  // Scale functions
  const getX = (index) => padX + (index / (data.length - 1)) * innerW;
  const getY = (val) => h - padY - ((val - minV) / range) * innerH;

  // Generate SVG path strings
  const devPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.dev)}`).join(' ');
  const opPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.op)}`).join(' ');

  // Gap Area (combine opPath forward, then devPath backward)
  const areaPath = opPath + ' ' + [...data].reverse().map((d, i) => `L ${getX(data.length - 1 - i)} ${getY(d.dev)}`).join(' ') + ' Z';

  return (
    <section className="s s-dev-op" data-screen-label="04 Dev vs Op Gap">
      <div className="wrap">
        <div className="split2" style={{ alignItems: "center" }}>
          <div className="section-head" style={{ marginBottom: 0 }}>
            <span className="eyebrow" style={{ color: "#c084fc" }}>Development vs Operating Expenditure</span>
            <h2>Development spending collapses as operating costs surge</h2>
            <p className="lede" style={{ marginTop: 18, maxWidth: "100%" }}>
              Since FY2019, the gap between development and operating expenditure has steadily grown. But in FY2025, development implementation fell to a record low of 53.92% of allocation — even as operating spending hit 93.52%, its highest in the period.
            </p>
          </div>

          <div className="gap-chart-wrap glass">
            {hoverIdx !== null && (
              <div
                className={`gap-tooltip ${hoverIdx === data.length - 1 ? 'edge-right' : ''}`}
                style={{ left: `${(getX(hoverIdx) / w) * 100}%` }}
              >
                <button className="gap-tooltip-close" onClick={() => setHoverIdx(null)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <div className="gt-title">{data[hoverIdx].fy} Gap</div>
                <div className="gt-val">{Math.abs(data[hoverIdx].op - data[hoverIdx].dev).toFixed(2)}%</div>
                <div className="gt-sub">Difference between operating<br />and development spending</div>
              </div>
            )}

            <div className="gap-legend">
              <div className="gap-lg-item">
                <div className="gap-lg-dot" style={{ background: "#ff7676", boxShadow: "0 0 10px #ff7676" }}></div>
                Operating Expenditure
              </div>
              <div className="gap-lg-item">
                <div className="gap-lg-dot" style={{ background: "#45B7D1", boxShadow: "0 0 10px #45B7D1" }}></div>
                Development Expenditure
              </div>
            </div>

            <svg viewBox={`0 0 ${w} ${h}`} className="gap-chart-svg" onMouseLeave={() => setHoverIdx(null)}>
              <defs>
                <linearGradient id="gapGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(255, 118, 118, 0.4)" />
                  <stop offset="100%" stopColor="rgba(69, 183, 209, 0.4)" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map(pct => {
                const y = h - padY - pct * innerH;
                return (
                  <line key={pct} x1={padX} y1={y} x2={w - padX} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                );
              })}

              {/* Gap Area */}
              <path d={areaPath} fill="url(#gapGrad)" className="gap-area" />

              {/* Hover Line */}
              {hoverIdx !== null && (
                <line
                  x1={getX(hoverIdx)} y1={padY}
                  x2={getX(hoverIdx)} y2={h - padY}
                  stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="4 4"
                  pointerEvents="none"
                />
              )}

              {/* Lines */}
              <path d={opPath} stroke="#ff7676" className="gap-line" />
              <path d={devPath} stroke="#45B7D1" className="gap-line" />

              {/* Data Points & Labels */}
              {data.map((d, i) => {
                const x = getX(i);
                const opY = getY(d.op);
                const devY = getY(d.dev);
                const isLast = i === data.length - 1;
                return (
                  <g key={d.fy} className="gap-pt" style={{ animationDelay: `${0.8 + (i * 0.1)}s` }}>
                    {/* X Axis Label */}
                    <text x={x} y={h - 15} className="gap-label-fy">{d.fy}</text>

                    {/* Operating Point */}
                    <circle cx={x} cy={opY} r="5" fill="#181d24" stroke="#ff7676" strokeWidth="2" />
                    <text x={x} y={opY - 14} className="gap-label" fill="#ff7676" style={{ fontWeight: isLast ? 700 : 400 }}>
                      {d.op}%
                    </text>

                    {/* Development Point */}
                    <circle cx={x} cy={devY} r="5" fill="#181d24" stroke="#45B7D1" strokeWidth="2" />
                    <text x={x} y={devY + 22} className="gap-label" fill="#45B7D1" style={{ fontWeight: isLast ? 700 : 400 }}>
                      {d.dev}%
                    </text>
                  </g>
                );
              })}

              {/* Invisible Hitboxes for Hover/Touch */}
              {data.map((d, i) => {
                const x = getX(i);
                const rectWidth = innerW / Math.max(1, data.length - 1);
                return (
                  <rect
                    key={"hit-" + i}
                    x={x - rectWidth / 2}
                    y={0}
                    width={rectWidth}
                    height={h}
                    fill="transparent"
                    onMouseEnter={() => setHoverIdx(i)}
                    onTouchStart={() => setHoverIdx(i)}
                    style={{ cursor: 'pointer', outline: 'none', WebkitTapHighlightColor: 'transparent' }}
                  />
                );
              })}
            </svg>
          </div>
        </div>

        <RelevantNews items={RELEVANT_NEWS.dev_op} accent="#45B7D1" />
      </div>
    </section>
  );
}

/* ============================================================
   TAX REVENUE RATIO SECTION
============================================================ */
const TAX_REVENUE_RATIO_DATA = [
  //{ country: "Solomon Islands", pct: 32.72, color: "rgba(255,255,255,0.4)" },
  { country: "Bhutan", pct: 26.97, color: "rgba(255,255,255,0.4)" },
  { country: "Philippines", pct: 21.16, color: "rgba(255,255,255,0.4)" },
  { country: "India", pct: 20.48, color: "rgba(255,255,255,0.4)" },
  { country: "Senegal", pct: 20.13, color: "rgba(255,255,255,0.4)" },
  { country: "Cambodia", pct: 14.58, color: "rgba(255,255,255,0.4)" },
  { country: "Indonesia", pct: 14.55, color: "rgba(255,255,255,0.4)" },
  { country: "Sri Lanka", pct: 13.68, color: "rgba(255,255,255,0.4)" },
  { country: "Pakistan", pct: 12.67, color: "rgba(255,255,255,0.4)" },
  { country: "Bangladesh", pct: 8.34, color: "#FF6B35", isBd: true }
];

function TaxRevenueRatioSection() {
  // Use the data and max value (Bhutan is highest at ~27, so max 30 is good)
  const data = TAX_REVENUE_RATIO_DATA;
  const max = 30; 
  const bdColor = "#00E5FF";

  return (
    <section className="s s-tax-ratio" data-screen-label="04c Tax Revenue Ratio" style={{ position: "relative" }}>
      {/* Subtle background glow effect behind the section */}
      <div style={{ position: "absolute", top: "50%", right: "10%", width: "40vw", height: "40vw", background: "radial-gradient(circle, rgba(0,229,255,0.05) 0%, rgba(0,0,0,0) 70%)", transform: "translateY(-50%)", pointerEvents: "none", zIndex: 0 }}></div>

      <div className="wrap" style={{ position: "relative", zIndex: 1 }}>
        <div className="split2" style={{ alignItems: "center" }}>
          <div className="section-head" style={{ marginBottom: 0 }}>
            <span className="eyebrow" style={{ color: bdColor }}>Revenue Generation</span>
            <h2>Bangladesh collects far less than its peers</h2>
            <p className="lede" style={{ marginTop: 18, maxWidth: "100%" }}>
              Government budgets are meant to be funded by tax revenue — but at 8.34% of GDP, Bangladesh collects far less than its peers. The average among comparable countries is nearly double, leaving the budget chronically dependent on borrowing from domestic and external creditors.
            </p>
          </div>

          <div className="tax-chart-wrap" style={{ padding: "40px 24px", background: "linear-gradient(145deg, rgba(20,25,30,0.8) 0%, rgba(10,15,20,0.95) 100%)", border: "1px solid rgba(0,229,255,0.1)", borderRadius: "24px", boxShadow: "0 20px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)" }}>
            <div className="cap" style={{ marginBottom: 40, textAlign: "center", color: "rgba(255,255,255,0.7)" }}>Govt. Revenue to GDP Ratio (%)</div>
            
            <div className="tax-dom-chart" style={{ position: "relative", height: "240px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", margin: "0 10px" }}>
              
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map(pct => (
                <div key={pct} style={{ position: "absolute", left: "-10px", right: "-10px", bottom: `${pct * 100}%`, borderBottom: "1px dashed rgba(255,255,255,0.1)", zIndex: 0 }}></div>
              ))}

              {/* Columns */}
              {data.map((d, i) => {
                if (!d) return null; // Safe guard
                const isBd = d.country === "Bangladesh";
                const barH = (d.pct / max) * 100;
                
                return (
                  <div key={d.country} style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 1, flex: 1, position: "relative", height: "100%", justifyContent: "flex-end", animation: "colGrowDom 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards", animationDelay: `${i * 80}ms`, opacity: 0 }}>
                    
                    <div style={{ fontFamily: "var(--serif)", fontSize: isBd ? "16px" : "13px", fontWeight: isBd ? 700 : 500, color: isBd ? bdColor : "#fff", marginBottom: "8px", textAlign: "center", whiteSpace: "nowrap" }}>
                      <CountUp value={d.pct} decimals={2} duration={1200} />%
                    </div>
                    
                    <div style={{ width: "min(100%, 32px)", height: `${barH}%`, background: isBd ? `linear-gradient(to top, rgba(0,229,255,0.1), ${bdColor})` : "linear-gradient(to top, rgba(255,255,255,0.05), rgba(255,255,255,0.3))", borderRadius: "4px 4px 0 0", boxShadow: isBd ? "0 0 10px rgba(0,229,255,0.3)" : "none" }}></div>
                    
                    <div style={{ position: "absolute", top: "100%", right: "50%", marginTop: "12px", transform: "rotate(-45deg)", transformOrigin: "top right", whiteSpace: "nowrap", fontFamily: "var(--ui)", fontSize: "12px", color: isBd ? "#fff" : "rgba(255,255,255,0.6)", fontWeight: isBd ? 700 : 400 }}>
                      {d.country}
                    </div>
                    
                  </div>
                );
              })}
            </div>
            {/* Spacer for the rotated labels below the chart */}
            <div style={{ height: "90px" }}></div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes colGrowDom {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 640px) {
          .s-tax-ratio .split2 {
            display: flex;
            flex-direction: column;
            gap: 40px;
          }
          .s-tax-ratio .tax-chart-wrap {
            padding: 32px 16px !important;
          }
        }
      `}</style>
    </section>
  );
}

Object.assign(window, { ResourceDonut, LegendRow, TaxSection, SubsidySection, BudgetGdpRatioSection, DevOpGapSection, TaxRevenueRatioSection });
