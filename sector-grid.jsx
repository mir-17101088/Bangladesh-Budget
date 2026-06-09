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
        <linearGradient id={"sgf" + color.replace("#", "")} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.45" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={"url(#sgf" + color.replace("#", "") + ")"} />
      <path d={path} stroke={color} strokeWidth="1.5" fill="none" />
      <circle cx={W} cy={H - series[series.length - 1] * (H - 4) - 2} r="3" fill={color} stroke="#fff" strokeWidth="1" />
    </svg>
  );
}

const SUBTITLE_TEMPLATES = {
  interest: "Interest Payments surge {g}",
  publicsvc: "Public Services expenditure jumps {g}",
  education: "Education and Technology spending rises {g}",
  transport: "Transport and Communication spending soars {g}",
  agri: "Agriculture records only {g} growth in spending",
  localgov: "Local Government and Rural Development expenditure rises {g}",
  social: "Social Security spending increases {g}",
  defence: "Defence Services expenditure grows {g}",
  energy: "Energy and Power spending grows {g}",
  order: "Public Order and Safety expenditure increases {g}",
  health: "Health Sector expenditure grows {g}",
  housing: "Housing sees only {g} growth in spending",
  rec: "Recreation, Culture and Religious Affairs expenditure spikes {g}",
  industry: "Industrial and Economic Services expenditure grows {g}"
};

function SectorGridSection({ active, setActive }) {
  return (
    <section className="s s-sector-grid" data-screen-label="02 Sector Grid">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">The fourteen sectors</span>
          <h2>Which Sectors Got Priority?</h2>
          <p className="lede" style={{ marginTop: 18, maxWidth: 720 }}>
            The cards below show how public spending across sectors has grown since FY09, the earliest year for which actual expenditure data is available.
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
                <span className="sg-rank">Rises · {s.rise}/{SECTOR_YEARS.length - 1} yrs</span>
              </div>
              <div className="sg-name">{s.name}</div>
              <div className="sg-stats">
                <div className="sg-total">৳{(s.proposed / 1000).toFixed(0)}k <span className="unit">cr · {BUDGET.proposed}</span></div>
                <div className="sg-growth">
                  <div className="v">{s.growth}</div>
                  <div className="l">since FY09</div>
                </div>
              </div>
              <Sparkline series={s.series} color={s.color} />
              <div className="sg-foot">
                <span className="cap">FY09 ৳{(s.fy09 / 1000).toFixed(0)}k → {BUDGET.proposed} ৳{(s.proposed / 1000).toFixed(0)}k cr</span>
                <span className="sg-cta">Explore →</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

/* ============================================================
   EXPANDED — Real sub-sector stacked bars from CSV data
============================================================ */
/* ============================================================
   EXPANDED — Real sub-sector stacked bars from CSV data
============================================================ */
function ExpandedSection({ active }) {
  const s = SECTORS.find(x => x.k === active);
  const [mode, setMode] = useStateSD("abs");
  const [tooltip, setTooltip] = useStateSD(null); // { x, y, data, isMobile }
  const chartContainerRef = React.useRef(null);
  const tooltipRef = React.useRef(null);
  const touchStartRef = React.useRef(null); // {x,y} of the last touchstart on a bar — used to tell a tap from a scroll

  const [isMobile, setIsMobile] = useStateSD(window.innerWidth <= 640);
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Get the sub-sector config for this sector
  const subCfg = useMemoSD(() => getSubSectorConfig(active), [active]);
  const subNames = subCfg ? subCfg.names : ["Total"];
  const subColors = subCfg ? subCfg.colors : [s.color];
  const subCount = subNames.length;

  // GDP% data for this sector
  const gdpData = useMemoSD(() => GDP_SECTOR_DATA[active] || {}, [active]);

  // % of total budget data for this sector
  const budData = useMemoSD(() => BUDGET_SHARE_SECTOR_DATA[active] || {}, [active]);

  // Build bars for ABSOLUTE view.
  // Only include years that actually have a sub-sector breakdown — a year with a
  // sector total but no breakdown (e.g. FY27 before its detail is filled) is
  // dropped rather than drawn as an empty zero-height bar.
  const absBars = useMemoSD(() => {
    return SECTOR_YEARS.map(fy => {
      const status = BUDGET.statusOf(fy);
      const subVals = subCfg && subCfg.data[fy] ? subCfg.data[fy] : [];
      const total = subVals.reduce((a, b) => a + b, 0);
      return {
        fy, subVals, total, status,
        notYetActual: status === "revised" || status === "proposed",
      };
    }).filter(b => b.subVals.length > 0 && b.total > 0);
  }, [active]);

  // Build bars for GDP% view — single bar per year
  const gdpBars = useMemoSD(() => {
    return SECTOR_YEARS.map(fy => {
      const status = BUDGET.statusOf(fy);
      const entry = gdpData[fy];
      return {
        fy, pct: entry ? entry.pct : null, total: entry ? entry.total : null, status,
        notYetActual: status === "revised" || status === "proposed",
      };
    }).filter(b => b.pct != null);
  }, [active]);

  // Build bars for % of total budget view — single bar per year (same shape as GDP)
  const budBars = useMemoSD(() => {
    return SECTOR_YEARS.map(fy => {
      const status = BUDGET.statusOf(fy);
      const entry = budData[fy];
      return {
        fy, pct: entry ? entry.pct : null, total: entry ? entry.total : null, status,
        notYetActual: status === "revised" || status === "proposed",
      };
    }).filter(b => b.pct != null);
  }, [active]);

  // The two percent views (GDP share / budget share) share one rendering path.
  const pctBars = mode === "bud" ? budBars : gdpBars;
  const allBars = mode === "abs" ? absBars : pctBars;
  const n = allBars.length;

  // ── Measure the real container width with a ResizeObserver so the chart
  //    always fits its panel at every viewport (no overflow, no horizontal
  //    scroll) and renders at 1:1 — one SVG user-unit = one CSS px — so text
  //    and bars are never stretched/squished by viewBox scaling. ──
  const [measuredW, setMeasuredW] = useStateSD(0);
  React.useLayoutEffect(() => {
    const el = chartContainerRef.current;
    if (!el) return;
    const read = () => setMeasuredW(el.clientWidth);
    read();
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(read);
      ro.observe(el);
      return () => ro.disconnect();
    }
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, [isMobile, active, mode]);

  // Fallback for the very first paint (corrected pre-paint by the layout effect above).
  const fallbackW = isMobile
    ? Math.max(260, window.innerWidth - 64)
    : Math.min(1180, Math.max(360, window.innerWidth - 96));
  const W = measuredW > 0 ? measuredW : fallbackW;

  const H = isMobile
    ? n * 34 + 22 + 30
    : Math.round(Math.min(470, Math.max(380, W * 0.36)));
  const pad = isMobile
    ? { l: 46, r: 60, t: 22, b: 30 }
    : { l: 76, r: 30, t: 54, b: 40 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const step = isMobile ? innerH / n : innerW / n;
  const bw = isMobile ? Math.min(step * 0.66, 26) : Math.min(step * 0.64, 46);

  // Headroom above the tallest bar so the floating value/tag labels never sit on a bar.
  const maxAbs = mode === "abs" ? Math.max(...absBars.map(b => b.total)) * (isMobile ? 1.12 : 1.16) : 0;
  const maxPct = mode !== "abs" ? Math.max(...pctBars.map(b => b.pct)) * (isMobile ? 1.22 : 1.28) : 0;
  const dispMax = mode === "abs" ? maxAbs : maxPct;

  // Floating callouts (proposed value + revised/proposed tags) anchor to the TOP
  // of the tallest bar, i.e. inside the clear headroom above every bar — so they
  // never sit on a bar, even when a neighbour bar is taller than the labelled one.
  const dataMax = mode === "abs" ? Math.max(...absBars.map(b => b.total)) : Math.max(...pctBars.map(b => b.pct));
  const tallestTopY = pad.t + innerH - (dataMax / dispMax) * innerH;
  // Only show the side-by-side REVISED/PROPOSED tags when columns are wide enough
  // that the two labels can't touch; otherwise the top-margin annotation carries it.
  const showTags = !isMobile && step >= 64;

  // Divider between actual and revised/proposed years.
  const firstProjected = Math.max(0, allBars.findIndex(b => b.notYetActual));
  const dividerX = pad.l + firstProjected * step;
  const dividerY = pad.t + firstProjected * step;

  // Thin the dense vertical-axis year labels so they never collide horizontally.
  // The proposed (last) bar is always labelled; any gridded label that would butt
  // against it is dropped so adjacent labels never touch at any width.
  const labelEvery = isMobile ? 1 : Math.max(1, Math.ceil(36 / step));
  const showYearLabel = (i, isProposed) => {
    if (isMobile || i === n - 1 || isProposed) return true;
    if (i % labelEvery !== 0) return false;
    // when thinning, drop a gridded label that would butt against the always-shown last one
    return labelEvery === 1 || i <= n - 1 - labelEvery;
  };

  // Hairline between stacked sub-sector segments so adjacent shades read as distinct.
  const SEG_SEP = "rgba(6,8,14,0.45)";

  // Tooltip event handlers
  const handleBarEnter = (e, barData, barIndex) => {
    const container = chartContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    // Works for mouse (clientX/Y), touchstart/move (touches) and touchend (changedTouches).
    const touch = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
    const clientX = touch ? touch.clientX : e.clientX;
    const clientY = touch ? touch.clientY : e.clientY;

    // Check width dynamically inside the handler to ensure truthiness
    const currentIsMobile = window.innerWidth <= 640;

    setTooltip({
      x: clientX - rect.left,
      y: clientY - rect.top,
      bar: barData,
      mode,
      isMobile: currentIsMobile,
    });
  };

  const handleBarLeave = () => {
    // On mobile, let the bottom sheet stay open until explicitly closed
    if (window.innerWidth > 640) {
      setTooltip(null);
    }
  };

  // Touch: showing the tooltip on touchstart made it pop up the instant a finger
  // landed — including at the start of a scroll. Instead, remember where the touch
  // began and only show the tooltip on touchend if the finger barely moved (a tap).
  // A clear drag is a scroll and is left to scroll the page normally.
  const TAP_SLOP = 12; // px of movement still treated as a tap, not a scroll
  const handleBarTouchStart = (e) => {
    const t = e.touches && e.touches[0];
    touchStartRef.current = t ? { x: t.clientX, y: t.clientY } : null;
  };
  const handleBarTouchEnd = (e, barData, barIndex) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;
    const t = e.changedTouches && e.changedTouches[0];
    if (!t) return;
    if (Math.abs(t.clientX - start.x) <= TAP_SLOP && Math.abs(t.clientY - start.y) <= TAP_SLOP) {
      e.preventDefault(); // a tap → suppress the ghost click and show the tooltip
      handleBarEnter(e, barData, barIndex);
    }
  };

  // Close tooltip on tap/click outside
  React.useEffect(() => {
    const close = (e) => {
      // If we clicked inside the tooltip, don't close
      if (tooltipRef.current && tooltipRef.current.contains(e.target)) return;
      // If we clicked on an SVG bar (it has a transparent hit area), let the bar handler take over
      if (e.target.tagName === 'rect' && e.target.getAttribute('fill') === 'transparent') return;

      setTooltip(null);
    };
    document.addEventListener("touchstart", close, { passive: true });
    document.addEventListener("mousedown", close);
    return () => {
      document.removeEventListener("touchstart", close);
      document.removeEventListener("mousedown", close);
    };
  }, []);

  // Reset tooltip when mode or sector changes
  React.useEffect(() => { setTooltip(null); }, [mode, active]);

  const tooltipEl = tooltip ? (
    <div className="see-tooltip"
      ref={tooltipRef}
      style={tooltip.isMobile ? {} : {
        left: Math.min(tooltip.x, (chartContainerRef.current?.offsetWidth || 400) - 240),
        top: Math.max(0, tooltip.y - 20),
      }}>
      {tooltip.isMobile && (
        <button className="see-tooltip-close" onClick={() => setTooltip(null)}>
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      )}
      <div className="see-tooltip-fy">{tooltip.bar.fy}</div>
      {tooltip.mode === "abs" && tooltip.bar.subVals && (
        <>
          {tooltip.bar.subVals.map((val, i) => (
            val > 0 && (
              <div key={i} className="see-tooltip-row">
                <span className="see-tooltip-sw" style={{ background: subColors[i] }}></span>
                <span className="see-tooltip-name">{subNames[i]}</span>
                <span className="see-tooltip-val">৳{val.toLocaleString("en-IN")} cr</span>
              </div>
            )
          ))}
          <div className="see-tooltip-total">
            Total: ৳{tooltip.bar.total.toLocaleString("en-IN")} cr
          </div>
        </>
      )}
      {tooltip.mode !== "abs" && (
        <div className="see-tooltip-row">
          <span className="see-tooltip-sw" style={{ background: s.color }}></span>
          <span className="see-tooltip-name">{tooltip.mode === "gdp" ? "as % of GDP" : "as % of total budget"}</span>
          <span className="see-tooltip-val">{tooltip.bar.pct.toFixed(2)}%</span>
        </div>
      )}
    </div>
  ) : null;

  return (
    <section className="s s-sector-expand" data-screen-label="03 Expanded">
      <div className="wrap">
        <div className="sg-expand glass" style={{ "--accent": s.color, borderColor: s.color + "33" }}>
          <div className="sg-expand-head">
            <div className="sg-expand-title">
              <span className="eyebrow" style={{ background: s.color, color: "#fff", padding: "8px 18px", borderRadius: "8px", display: "inline-block", marginBottom: "16px", fontWeight: 700, fontSize: "15px", letterSpacing: "0.08em", textShadow: "0 1px 3px rgba(0,0,0,0.3)", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", lineHeight: 1 }}>{s.name}</span>
              <h3>
                {(() => {
                  if (mode === "abs") return SUBTITLE_TEMPLATES[s.k]?.replace('{g}', s.growth.replace(/\.0×$/, '×'));
                  
                  if (mode === "gdp") {
                    const pts = parseFloat(s.gdpGrowth);
                    const absPts = Math.abs(pts).toFixed(2) + " pts";
                    const TEMPLATES = {
                      publicsvc: "Public Services expands its economic footprint, up {g}",
                      transport: "Transport infrastructure outpaces GDP growth, rising {g}",
                      interest: "Interest payments shrink relative to the economy, down {g}",
                      defence: "Defence spending halves as a share of GDP, down {g}",
                      education: "Education fails to keep pace with economic growth, dropping {g}",
                      social: "Social Security footprint shrinks significantly, down {g}",
                      industry: "Industry's share of the economy halves, dropping {g}",
                      health: "Health spending falls behind economic expansion, down {g}",
                      agri: "Agriculture's economic footprint declines by {g}",
                      energy: "Energy spending remains relatively flat, " + (pts >= 0 ? "up" : "down") + " {g}",
                      localgov: "Local Government's share of GDP falls by {g}",
                      order: "Public Order shrinks relative to the economy, down {g}",
                      housing: "Housing expenditure drops as a share of GDP, down {g}",
                      rec: "Recreation & Culture's economic footprint shrinks, down {g}",
                    };
                    return (TEMPLATES[s.k] || "Share of GDP changes by {g}").replace('{g}', absPts);
                  }

                  // mode === "bud"
                  const budPts = parseFloat(s.budGrowth);
                  const absBudPts = Math.abs(budPts).toFixed(2) + " pts";
                  const BUD_TEMPLATES = {
                    interest: "Interest consumes " + (budPts > 0 ? "more" : "less") + " of the budget, " + (budPts > 0 ? "up" : "down") + " {g}",
                    publicsvc: "Public Services takes a massive leap in budget priority, up {g}",
                    transport: "Transport secures a larger slice of the national budget, up {g}",
                    education: "Education loses priority in the budget allocation, down {g}",
                    agri: "Agriculture's share of the national budget drops by {g}",
                    social: "Social Security's budget priority falls by {g}",
                    health: "Health sector sees its budget share shrink by {g}",
                    defence: "Defence is deprioritized in the national budget, down {g}",
                    energy: "Energy maintains its budget allocation, " + (budPts >= 0 ? "up" : "down") + " {g}",
                    localgov: "Local Government loses budget share, down {g}",
                    order: "Public Order's slice of the budget decreases by {g}",
                    housing: "Housing's budget priority drops by {g}",
                    industry: "Industry loses half its budget share, down {g}",
                    rec: "Recreation & Culture's budget slice shrinks by {g}",
                  };
                  return (BUD_TEMPLATES[s.k] || "Budget priority changes by {g}").replace('{g}', absBudPts);
                })()}
              </h3>
            </div>
            <div className="see-toggle" style={{ "--accent": s.color }}>
              <button className={mode === "abs" ? "active" : ""} style={{ background: mode === "abs" ? s.color : "transparent" }} onClick={() => setMode("abs")}>{isMobile ? "Absolute" : "Absolute · ৳ cr"}</button>
              <button className={mode === "gdp" ? "active" : ""} style={{ background: mode === "gdp" ? s.color : "transparent" }} onClick={() => setMode("gdp")}>% of GDP</button>
              <button className={mode === "bud" ? "active" : ""} style={{ background: mode === "bud" ? s.color : "transparent" }} onClick={() => setMode("bud")}>% of Budget</button>
            </div>
          </div>

          <div className="sg-expand-stats" style={{ marginBottom: 28, display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: isMobile ? 12 : 20 }}>
            {(() => {
              const statCardStyle = { background: "rgba(255,255,255,0.03)", padding: isMobile ? "14px 16px" : "18px 20px", borderRadius: "12px", borderTop: "3px solid " + s.color, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" };
              const lStyle = { color: "rgba(255,255,255,0.55)", fontWeight: 600, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px", fontFamily: "var(--ui)" };
              const vStyle = { color: "#fff", fontSize: isMobile ? "22px" : "26px", fontWeight: 700, fontFamily: "var(--serif)", lineHeight: 1 };
              const sStyle = { color: "var(--g4)", fontSize: "12px", marginTop: "8px", fontWeight: 400 };

              const renderCard = (label, valObj, sub) => (
                <div className="see-stat" style={statCardStyle}>
                  <div className="l" style={lStyle}>{label}</div>
                  <div className="v" style={vStyle}>{valObj}</div>
                  <div className="s" style={sStyle}>{sub}</div>
                </div>
              );

              if (mode === "abs") return (
                <>
                  {renderCard(`${BUDGET.proposed} total`, <>৳<CountUp value={s.proposed} /><span style={{ fontSize: 14, color: "var(--g4)", marginLeft: 6 }}>cr</span></>, `vs FY09: ৳${s.fy09.toLocaleString("en-IN")} cr`)}
                  {renderCard("Growth multiple", <><CountUp value={parseFloat(s.growth)} decimals={1} suffix="×" /></>, `FY09 → ${BUDGET.proposed}`)}
                  {renderCard("Years of rise", <><CountUp value={s.riseAbs || 0} />{`/${SECTOR_YEARS.length - 1}`}</>, "YoY increases (absolute)")}
                  {renderCard("Peak year", s.peakYearAbs || BUDGET.proposed, "all-time high in the series")}
                </>
              );
              if (mode === "gdp") return (
                <>
                  {renderCard(`${BUDGET.proposed} share`, <><CountUp value={parseFloat(s.gdpProposed) || 0} decimals={2} /><span style={{ fontSize: 14, color: "var(--g4)", marginLeft: 6 }}>%</span></>, `vs FY09: ${(s.gdp09 || 0).toFixed(2)}%`)}
                  {renderCard("Change since FY09", <><CountUp value={parseFloat(s.gdpGrowth) || 0} decimals={2} prefix={parseFloat(s.gdpGrowth) > 0 ? "+" : ""} /><span style={{ fontSize: 14, color: "var(--g4)", marginLeft: 6 }}>pts</span></>, `FY09 → ${BUDGET.proposed}`)}
                  {renderCard("Years of rise", <><CountUp value={s.riseGdp || 0} />{`/${SECTOR_YEARS.length - 1}`}</>, "YoY increases (% share)")}
                  {renderCard("Peak year", s.peakYearGdp || BUDGET.proposed, "highest GDP share")}
                </>
              );
              return (
                <>
                  {renderCard(`${BUDGET.proposed} share`, <><CountUp value={parseFloat(s.budProposed) || 0} decimals={2} /><span style={{ fontSize: 14, color: "var(--g4)", marginLeft: 6 }}>%</span></>, `vs FY09: ${(s.bud09 || 0).toFixed(2)}%`)}
                  {renderCard("Change since FY09", <><CountUp value={parseFloat(s.budGrowth) || 0} decimals={2} prefix={parseFloat(s.budGrowth) > 0 ? "+" : ""} /><span style={{ fontSize: 14, color: "var(--g4)", marginLeft: 6 }}>pts</span></>, `FY09 → ${BUDGET.proposed}`)}
                  {renderCard("Years of rise", <><CountUp value={s.riseBud || 0} />{`/${SECTOR_YEARS.length - 1}`}</>, "YoY increases (% of budget)")}
                  {renderCard("Peak year", s.peakYearBud || BUDGET.proposed, "highest budget share")}
                </>
              );
            })()}
          </div>

          <div className="chart-scroll" ref={chartContainerRef} style={{ position: "relative", minHeight: isMobile ? H : 'auto' }}>
            {/* ── SVG CHART — 1:1 coordinate system (viewBox === rendered px) ── */}
            <svg className="see-chart" width={W} height={H} viewBox={"0 0 " + W + " " + H}
              style={{ width: W + "px", height: H + "px" }}>
              {/* gridlines */}
              {[0, 0.25, 0.5, 0.75, 1.0].map(g => {
                const v = g * dispMax;
                if (isMobile) {
                  const x = pad.l + g * innerW;
                  return (
                    <g key={g}>
                      <line x1={x} x2={x} y1={pad.t} y2={H - pad.b} stroke="rgba(255,255,255,0.06)" />
                      {g > 0 && <text x={x} y={H - pad.b + 18} textAnchor="middle" className="tick-label">
                        {mode === "abs" ? ((v / 1000) | 0) + "k" : v.toFixed(1) + "%"}
                      </text>}
                    </g>
                  );
                } else {
                  const y = pad.t + (1 - g) * innerH;
                  return (
                    <g key={g}>
                      <line x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke="rgba(255,255,255,0.06)" />
                      <text x={pad.l - 10} y={y + 3} textAnchor="end" className="tick-label">
                        {mode === "abs" ? ("৳" + ((v / 1000) | 0) + "k cr") : (v.toFixed(2) + "%")}
                      </text>
                    </g>
                  );
                }
              })}

              {/* divider line between actual and projected, with a label kept
                  entirely inside a clear margin so it never overlaps a bar */}
              {firstProjected > 0 && (
                isMobile ? (
                  <line x1={pad.l} x2={W - pad.r} y1={dividerY} y2={dividerY}
                    stroke={s.color} strokeOpacity="0.5" strokeDasharray="2 4" />
                ) : (
                  <>
                    <line x1={dividerX} y1={pad.t} x2={dividerX} y2={pad.t + innerH}
                      stroke={s.color} strokeOpacity="0.5" strokeDasharray="2 4" />
                    <text x={W - pad.r} y={pad.t - 18} textAnchor="end"
                      style={{ fontFamily: "var(--ui)", fontSize: 10, fill: "#fff", fontWeight: 600, letterSpacing: "0.14em" }}>
                      REVISED / ALLOCATION →
                    </text>
                  </>
                )
              )}

              {/* ── ABSOLUTE VIEW: stacked bars ── */}
              {mode === "abs" && absBars.map((b, i) => {
                const baseDelay = i * 45;
                const isProposed = b.fy === BUDGET.proposed;
                const isActual = b.fy === BUDGET.actual;
                const tag = BUDGET.tagFor(b.fy);

                let cum = 0;
                const segments = b.subVals.map((val, si) => {
                  const segSize = (val / dispMax) * (isMobile ? innerW : innerH);
                  const segStart = cum;
                  cum += segSize;
                  return { val, segSize, segStart, color: subColors[si] || s.color, name: subNames[si], idx: si };
                });

                const totSize = (b.total / dispMax) * (isMobile ? innerW : innerH);

                if (isMobile) {
                  const y = pad.t + i * step + (step - bw) / 2;
                  return (
                    <g key={b.fy}>
                      {isActual && <rect x={pad.l} y={y - 2} width={innerW + pad.r} height={bw + 4} fill={s.color} opacity="0.06" rx="3" />}
                      <text x={pad.l - 8} y={y + bw / 2 + 4} textAnchor="end" className="tick-label"
                        style={{ fill: b.notYetActual ? "#fff" : undefined, fontWeight: b.notYetActual ? 700 : 400, opacity: 1, fontSize: 10 }}>{b.fy}</text>
                      {tag && (
                        <text x={pad.l + totSize + (isProposed ? 58 : 8)} y={y + bw / 2 + 3} textAnchor="start"
                          className={"fy-tag-text " + tag.cls}
                          style={{ fontFamily: "var(--ui)", fontSize: 8, letterSpacing: "0.08em" }}>
                          {tag.label.toUpperCase()}
                        </text>
                      )}

                      {segments.map((seg, si) => (
                        <AnimatedRect key={si} axis="x"
                          x={pad.l + seg.segStart} y={y}
                          width={seg.segSize} height={bw}
                          fill={seg.color} rx={si === segments.length - 1 ? 2 : 0}
                          opacity={b.notYetActual ? 0.85 : 1}
                          stroke={b.notYetActual ? s.color : (subCount > 1 ? SEG_SEP : "none")}
                          strokeOpacity={b.notYetActual ? 0.55 : 1}
                          strokeWidth={b.notYetActual ? 1 : (subCount > 1 ? 0.9 : 0)}
                          strokeDasharray={b.notYetActual ? "3 3" : ""}
                          duration={900} delay={baseDelay + si * 50} />
                      ))}

                      <rect x={0} y={y - 2} width={W} height={bw + 4}
                        fill="transparent" style={{ cursor: "pointer" }}
                        onMouseEnter={(e) => handleBarEnter(e, b, i)}
                        onMouseMove={(e) => handleBarEnter(e, b, i)}
                        onMouseLeave={handleBarLeave}
                        onTouchStart={handleBarTouchStart}
                        onTouchEnd={(e) => handleBarTouchEnd(e, b, i)} />

                      {isProposed && (
                        <text x={pad.l + totSize + 6} y={y + bw / 2 + 4} textAnchor="start"
                          style={{ fontFamily: "var(--serif)", fontSize: 13, fill: "#fff" }}>
                          ৳{(b.total / 1000).toFixed(0)}k
                        </text>
                      )}
                    </g>
                  );
                } else {
                  // Desktop Vertical
                  const x = pad.l + i * step + (step - bw) / 2;
                  const tag = BUDGET.tagFor(b.fy);
                  return (
                    <g key={b.fy}>
                      {isActual && (
                        <rect x={x - 3} y={pad.t} width={bw + 6} height={innerH} fill={s.color} opacity="0.06" rx="3" />
                      )}
                      {segments.map((seg, si) => {
                        const segY = pad.t + innerH - seg.segStart - seg.segSize;
                        return (
                          <AnimatedRect key={si} x={x} y={segY} width={bw} height={seg.segSize}
                            fill={seg.color} rx={si === segments.length - 1 ? 2 : 0}
                            opacity={b.notYetActual ? 0.85 : 1}
                            stroke={b.notYetActual ? s.color : (subCount > 1 ? SEG_SEP : "none")}
                            strokeOpacity={b.notYetActual ? 0.55 : 1}
                            strokeWidth={b.notYetActual ? 1 : (subCount > 1 ? 0.9 : 0)}
                            strokeDasharray={b.notYetActual ? "3 3" : ""}
                            duration={900} delay={baseDelay + si * 50} />
                        );
                      })}
                      {/* Hover hit area */}
                      <rect x={x - 2} y={pad.t} width={bw + 4} height={innerH + pad.b}
                        fill="transparent" style={{ cursor: "pointer" }}
                        onMouseEnter={(e) => handleBarEnter(e, b, i)}
                        onMouseMove={(e) => handleBarEnter(e, b, i)}
                        onMouseLeave={handleBarLeave}
                        onTouchStart={handleBarTouchStart}
                        onTouchEnd={(e) => handleBarTouchEnd(e, b, i)} />
                      {showYearLabel(i, isProposed) && (
                        <text x={x + bw / 2} y={H - 20} textAnchor="middle" className="tick-label"
                          style={{ fill: b.notYetActual ? "#fff" : undefined, fontWeight: b.notYetActual ? 700 : 400, opacity: 1 }}>{b.fy}</text>
                      )}
                      {tag && (
                        <text x={x + bw / 2} y={tallestTopY - (tag.cls === "fy-proposed" ? 22 : 8)} textAnchor="middle"
                          className={"fy-tag-text " + tag.cls}
                          style={{ fontFamily: "var(--ui)", fontSize: 9, letterSpacing: "0.12em" }}>
                          {tag.label.toUpperCase()}
                        </text>
                      )}
                      {isProposed && (
                        <text x={x + bw / 2} y={tallestTopY - 38} textAnchor="middle"
                          style={{ fontFamily: "var(--serif)", fontSize: 15, fill: "#fff" }}>
                          ৳{(b.total / 1000).toFixed(0)}k
                        </text>
                      )}
                    </g>
                  );
                }
              })}

              {/* ── PERCENT VIEWS (GDP share / budget share): single-color bars ── */}
              {mode !== "abs" && pctBars.map((b, i) => {
                const baseDelay = i * 45;
                const isProposed = b.fy === BUDGET.proposed;
                const barSize = (b.pct / dispMax) * (isMobile ? innerW : innerH);
                const tag = BUDGET.tagFor(b.fy);

                if (isMobile) {
                  const y = pad.t + i * step + (step - bw) / 2;
                  return (
                    <g key={b.fy}>
                      <AnimatedRect axis="x" x={pad.l} y={y} width={barSize} height={bw}
                        fill={s.color} rx={2}
                        opacity={b.notYetActual ? 0.85 : 1}
                        stroke={b.notYetActual ? s.color : "none"}
                        strokeOpacity={b.notYetActual ? 0.55 : 0}
                        strokeDasharray={b.notYetActual ? "3 3" : ""}
                        duration={900} delay={baseDelay} />
                      <text x={pad.l - 8} y={y + bw / 2 + 4} textAnchor="end" className="tick-label"
                        style={{ fill: b.notYetActual ? "#fff" : undefined, fontWeight: b.notYetActual ? 700 : 400, opacity: 1, fontSize: 10 }}>{b.fy}</text>
                      {tag && (
                        <text x={pad.l + barSize + (isProposed ? 54 : 8)} y={y + bw / 2 + 3} textAnchor="start"
                          className={"fy-tag-text " + tag.cls}
                          style={{ fontFamily: "var(--ui)", fontSize: 8, letterSpacing: "0.08em" }}>
                          {tag.label.toUpperCase()}
                        </text>
                      )}
                      <rect x={0} y={y - 2} width={W} height={bw + 4}
                        fill="transparent" style={{ cursor: "pointer" }}
                        onMouseEnter={(e) => handleBarEnter(e, b, i)}
                        onMouseMove={(e) => handleBarEnter(e, b, i)}
                        onMouseLeave={handleBarLeave}
                        onTouchStart={handleBarTouchStart}
                        onTouchEnd={(e) => handleBarTouchEnd(e, b, i)} />
                      {isProposed && (
                        <text x={pad.l + barSize + 6} y={y + bw / 2 + 4} textAnchor="start"
                          style={{ fontFamily: "var(--serif)", fontSize: 13, fill: "#fff" }}>
                          {b.pct.toFixed(2)}%
                        </text>
                      )}
                    </g>
                  );
                } else {
                  // Desktop Vertical
                  const x = pad.l + i * step + (step - bw) / 2;
                  const barY = pad.t + innerH - barSize;
                  return (
                    <g key={b.fy}>
                      <AnimatedRect x={x} y={barY} width={bw} height={barSize}
                        fill={s.color} rx={2}
                        opacity={b.notYetActual ? 0.85 : 1}
                        stroke={b.notYetActual ? s.color : "none"}
                        strokeOpacity={b.notYetActual ? 0.55 : 0}
                        strokeDasharray={b.notYetActual ? "3 3" : ""}
                        duration={900} delay={baseDelay} />
                      {/* Hover hit area */}
                      <rect x={x - 2} y={pad.t} width={bw + 4} height={innerH + pad.b}
                        fill="transparent" style={{ cursor: "pointer" }}
                        onMouseEnter={(e) => handleBarEnter(e, b, i)}
                        onMouseMove={(e) => handleBarEnter(e, b, i)}
                        onMouseLeave={handleBarLeave}
                        onTouchStart={handleBarTouchStart}
                        onTouchEnd={(e) => handleBarTouchEnd(e, b, i)} />
                      {showYearLabel(i, isProposed) && (
                        <text x={x + bw / 2} y={H - 20} textAnchor="middle" className="tick-label"
                          style={{ fill: b.notYetActual ? "#fff" : undefined, fontWeight: b.notYetActual ? 700 : 400, opacity: 1 }}>{b.fy}</text>
                      )}
                      {tag && (
                        <text x={x + bw / 2} y={tallestTopY - (tag.cls === "fy-proposed" ? 22 : 8)} textAnchor="middle"
                          className={"fy-tag-text " + tag.cls}
                          style={{ fontFamily: "var(--ui)", fontSize: 9, letterSpacing: "0.12em" }}>
                          {tag.label.toUpperCase()}
                        </text>
                      )}
                      {isProposed && (
                        <text x={x + bw / 2} y={tallestTopY - 38} textAnchor="middle"
                          style={{ fontFamily: "var(--serif)", fontSize: 15, fill: "#fff" }}>
                          {b.pct.toFixed(2)}%
                        </text>
                      )}
                    </g>
                  );
                }
              })}
            </svg>

            {/* ── HTML TOOLTIP PORTAL ── */}
            {tooltip && tooltip.isMobile && window.ReactDOM
              ? window.ReactDOM.createPortal(tooltipEl, document.body)
              : tooltipEl
            }
          </div>

          {/* ── LEGEND ── */}
          <div className={"see-legend" + (subCount > 4 ? " see-legend-compact" : "")}>
            {mode === "abs" ? (
              <>
                {subNames.map((name, i) => (
                  <span key={i} className="ll"><span className="sw" style={{ background: subColors[i] }}></span>{name}</span>
                ))}
                <span className="ll" style={{ marginLeft: "auto" }}>
                  <span className="sw" style={{ background: "transparent", border: "1px dashed " + s.color }}></span>
                  {BUDGET.revised}–{BUDGET.proposed} · not yet actual
                </span>
              </>
            ) : (
              <>
                <span className="ll"><span className="sw" style={{ background: s.color }}></span>Total {s.name} as {mode === "gdp" ? "% of GDP" : "% of total budget"}</span>
                <span className="ll" style={{ marginLeft: "auto" }}>
                  <span className="sw" style={{ background: "transparent", border: "1px dashed " + s.color }}></span>
                  {BUDGET.revised}–{BUDGET.proposed} · not yet actual
                </span>
              </>
            )}
          </div>
        </div>

        <RelevantNews items={RELEVANT_NEWS.sector_grid} accent="#0185C6" />
      </div>
    </section>
  );
}

Object.assign(window, { Sparkline, SectorGridSection, ExpandedSection });
