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
            it spends — tax revenue alone is <strong style={{ color: "#fff", fontWeight: 600 }}>63.2%</strong>.
            The rest is borrowed. Tap <em style={{ fontStyle: "italic", color: "#3FD3B8" }}>Tax Revenue (NBR)</em> to see how the taxman raises his share.
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
                <CountUp value={center.value / 100000} decimals={2} prefix="৳" suffix="L" duration={900} />
              </div>
              <div className="u">Crore</div>
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
            Power, fertiliser, and food subsidies are the three big drivers. From ৳5.8 of every ৳100 in FY22, the share climbed to ৳11.0 in FY25 — and is projected higher still.
          </p>
        </div>

        <div className="sub-chart-wrap glass">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 36, flexWrap: "wrap", gap: 12 }}>
            <span className="cap">Subsidies & incentives · Taka per ৳100 of expenditure</span>
            <div style={{ display: "flex", gap: 18, fontFamily: "var(--ui)", fontSize: 11, color: "var(--g3)", letterSpacing: "0.04em" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 14, height: 10, background: "linear-gradient(180deg, #B0832B, #6d501a)", borderRadius: 2 }}></span>Actual / historical
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 14, height: 10, background: "repeating-linear-gradient(135deg, rgba(176,131,43,0.4) 0 4px, rgba(176,131,43,0.1) 4px 8px)", borderRadius: 2, border: "1px dashed rgba(176,131,43,0.6)" }}></span>Revised / Proposed
              </span>
            </div>
          </div>

          <div className="sub-bars">
            {SUB.map((s, i) => {
              const h = (s.v / max) * 100;
              const status = BUDGET.statusOf(s.fy);
              const notYetActual = status === "revised" || status === "proposed";
              const tag = BUDGET.tagFor(s.fy);
              const isActual = s.fy === BUDGET.actual;
              return (
                <div key={i} className={"sub-bar " + (notYetActual ? "future " : "") + (isActual ? "active " : "") + status}>
                  {tag && <span className={"fy-tag " + tag.cls}>{tag.label}</span>}
                  <div className="colw">
                    <div className="col grow-bar" style={{ "--target-h": h + "%", animationDelay: (i * 110) + "ms" }}>
                      <span className="v">{notYetActual ? "~৳" : "৳"}<CountUp value={s.v} decimals={1} duration={1200} /></span>
                      {s.delta && <span className="delta">{s.delta}</span>}
                    </div>
                  </div>
                  <div className="yr">{s.fy}{notYetActual ? " · " + status : ""}</div>
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

Object.assign(window, { ResourceDonut, LegendRow, TaxSection, SubsidySection });
