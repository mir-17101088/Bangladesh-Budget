const { useState: useState2, useMemo: useMemo2, useRef: useRef2 } = React;

/* ============================================================
   TAKA NOTE — signature interactive
============================================================ */
function TakaSection() {
  const [active, setActive] = useState2("education");
  const [hover, setHover] = useState2(null);
  const expandRef = useRef2(null);
  const total = TAKA_SECTORS.reduce((a, s) => a + (s.actual || 0), 0); // ~100, Actual year
  const sector = TAKA_SECTORS.find(s => s.key === active);
  const actualSpan = fyToSpan(BUDGET.actual); // e.g. "FY 2023—24"

  const selectSector = (key, scroll) => {
    setActive(key);
    if (scroll && expandRef.current) {
      // wait one tick for the re-render so the chart is the new sector
      requestAnimationFrame(() => {
        const r = expandRef.current.getBoundingClientRect();
        const vh = window.innerHeight;
        const chartH = r.height;
        // Anchor the bar chart at the LOWER end of the viewport so the user
        // still sees part of the 100-taka note above it.
        // If the chart fits in the viewport, align its bottom near the
        // viewport bottom (with a small gap). Otherwise, fall back to
        // pinning the chart's top about 1/3 of the way down.
        let targetTop;
        if (chartH + 24 < vh) {
          targetTop = window.scrollY + r.bottom - vh + 24;
        } else {
          targetTop = window.scrollY + r.top - vh * 0.30;
        }
        window.scrollTo({ top: Math.max(0, targetTop), behavior: prefersReducedMotion() ? "auto" : "smooth" });
      });
    }
  };

  return (
    <section className="s s-taka" data-screen-label="02 Taka Note">
      <div className="wrap">
        <div className="section-head" style={{ textAlign: "center", margin: "0 auto 56px" }}>
          <span className="eyebrow" style={{ color: "#6fc7ee" }}>The signature view</span>
          <h2 style={{ marginBottom: 16 }}>Where did your ৳100 go?</h2>
          <p className="lede" style={{ margin: "0 auto", maxWidth: 620 }}>
            Hover or tap a sliver of the note to follow each sector's share of every taka the
            government actually spent in {actualSpan} — the most recent audited year.
          </p>
        </div>

        <div className="taka-stage">
          <img className="taka-img" src="assets/100_taka_note.jpg" alt="Bangladesh 100 Taka note"/>
          <div className="taka-overlay">
            {TAKA_SECTORS.map((s, idx) => {
              const w = (s.actual / total) * 100;
              const isActive = active === s.key;
              const isHover = hover === s.key;
              return (
                <div
                  key={s.key}
                  className={"taka-seg " + (isActive ? "active" : "")}
                  style={{ width: w + "%", background: s.color }}
                  role="button"
                  tabIndex={0}
                  aria-label={s.name + ": ৳" + s.actual + " of every ৳100 spent, " + BUDGET.actual}
                  aria-pressed={isActive}
                  onMouseEnter={() => setHover(s.key)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(s.key)}
                  onBlur={() => setHover(null)}
                  onClick={() => selectSector(s.key, true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectSector(s.key, true); }
                    else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                      e.preventDefault();
                      const ni = (idx + (e.key === "ArrowRight" ? 1 : -1) + TAKA_SECTORS.length) % TAKA_SECTORS.length;
                      selectSector(TAKA_SECTORS[ni].key, false);
                      const sib = e.currentTarget.parentNode.children[ni];
                      if (sib && sib.focus) sib.focus();
                    }
                  }}
                >
                  {(w > 4 || isHover || isActive) && (
                    <span className="seg-num">৳{s.actual}</span>
                  )}
                  {isHover && (
                    <div className="taka-tooltip">
                      <b>{s.name}</b>
                      <span className="t-amt" style={{ color: s.color }}>৳{s.actual}</span>
                      <span style={{ color: "#8B939F", fontSize: 11 }}>per ৳100 spent · {BUDGET.actual}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="taka-legend">
          {TAKA_SECTORS.map(s => (
            <button
              type="button"
              key={s.key}
              className={"chip " + (active === s.key ? "active" : "")}
              aria-pressed={active === s.key}
              onClick={() => selectSector(s.key, true)}
              onMouseEnter={() => setHover(s.key)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(s.key)}
              onBlur={() => setHover(null)}
            >
              <span className="sw" style={{ background: s.color }}></span>
              {s.name}
              <span className="chip-val">৳{s.actual}</span>
            </button>
          ))}
        </div>

        <div ref={expandRef} className="taka-expand glass" style={{ "--accent": sector.color }}>
          <div className="taka-expand-head">
            <div>
              <span className="eyebrow" style={{ color: sector.color }}>Sector trend · {BUDGET.years[0]} → {BUDGET.proposed}</span>
              <h3>{sector.name} — out of every ৳100</h3>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="cap">Actual {BUDGET.actual}</div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 40, color: sector.color, lineHeight: 1, marginTop: 4 }}>
                <CountUp value={sector.actual} decimals={1} prefix="৳" duration={1400}/>
              </div>
            </div>
          </div>

          <div className="taka-bars">
            {(() => {
              const present = BUDGET.years.map(fy => sector.valueAt(fy)).filter(v => v != null);
              const max = Math.max(...present) * 1.15;
              return BUDGET.years.map((fy, i) => {
                const v = sector.valueAt(fy);
                const h = (v / max) * 100;
                const status = BUDGET.statusOf(fy);   // actual | revised | proposed | historical
                const tag = BUDGET.tagFor(fy);         // {label, cls} | null
                const isActual = fy === BUDGET.actual;
                return (
                  <div key={fy} className={"taka-bar " + (isActual ? "active " : "") + status}>
                    {tag && <span className={"fy-tag " + tag.cls}>{tag.label}</span>}
                    {isActual && <span className="fy-actual-caption">Actual</span>}
                    <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
                      <div className="col grow-bar" style={{ "--target-h": h + "%", animationDelay: (i * 90) + "ms" }}>
                        <span className="val"><CountUp value={v} decimals={1} prefix="৳" duration={1100}/></span>
                      </div>
                    </div>
                    <div className="yr">{fy}</div>
                  </div>
                );
              });
            })()}
          </div>

          <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <span className="cap">Y-axis: Taka per ৳100 spent · {BUDGET.years[0]} → {BUDGET.proposed} · Source: Ministry of Finance</span>
            <span className="cap" style={{ color: sector.color }}>● Selected: {sector.name}</span>
          </div>
        </div>

        <RelevantNews items={RELEVANT_NEWS.taka} accent="#0185C6" />
      </div>
    </section>
  );
}

/* ============================================================
   GDP — stacked area / line
============================================================ */
function GDPSection() {
  const [mode, setMode] = useState2("area");
  const [hoverIdx, setHoverIdx] = useState2(null);
  const W = 720, H = 340, pad = { l: 44, r: 30, t: 36, b: 36 };
  // Render only years that have data (drops the null FY27 placeholder).
  const GDP = GDP_DATA.filter(d => typeof d.pct === "number" && isFinite(d.pct));
  const xs = (i) => pad.l + (i / (GDP.length - 1)) * (W - pad.l - pad.r);
  const allPct = GDP.map(d => d.pct);
  const yMin = Math.floor(Math.min(...allPct)) - 1;
  const yMax = Math.ceil(Math.max(...allPct)) + 1;
  const ys = (v) => pad.t + (1 - (v - yMin) / (yMax - yMin)) * (H - pad.t - pad.b);
  const fy09 = GDP[0];
  const last = GDP[GDP.length - 1];
  const peak = GDP.reduce((a, b) => b.pct > a.pct ? b : a, GDP[0]);
  const pandemicIdx = GDP.findIndex(d => d.fy === "FY20");
  const peakIdx = GDP.indexOf(peak);

  const pathLine = GDP.map((d, i) => (i ? "L" : "M") + xs(i) + " " + ys(d.pct)).join(" ");
  const pathArea = pathLine + " L" + xs(GDP.length - 1) + " " + (H - pad.b) + " L" + xs(0) + " " + (H - pad.b) + " Z";

  // sliding window of integer y-ticks
  const yTicks = [];
  for (let v = yMin; v <= yMax; v++) yTicks.push(v);

  // ───── viewport reveal animation ─────
  const [viewRef, inView] = useInView({ threshold: 0.18 });
  const lineRef = useRef2(null);
  const [draw, setDraw] = useState2(0);          // 0..1 path draw progress
  const [lineLen, setLineLen] = useState2(800);

  useEffect(() => {
    if (lineRef.current) {
      const L = lineRef.current.getTotalLength();
      setLineLen(L);
    }
  }, [pathLine]);

  useEffect(() => {
    if (!inView) return;
    if (prefersReducedMotion()) { setDraw(1); return; }
    let raf, t0 = null;
    const dur = 1800;
    const tick = (t) => {
      if (t0 === null) t0 = t;
      const k = Math.min(1, (t - t0) / dur);
      // ease out cubic
      const e = 1 - Math.pow(1 - k, 3);
      setDraw(e);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView]);

  // ───── hover interaction ─────
  const onMove = (evt) => {
    const svg = evt.currentTarget.ownerSVGElement || evt.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX; pt.y = evt.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const local = pt.matrixTransform(ctm.inverse());
    // nearest data index by x
    let best = 0, bd = Infinity;
    for (let i = 0; i < GDP.length; i++) {
      const d = Math.abs(local.x - xs(i));
      if (d < bd) { bd = d; best = i; }
    }
    setHoverIdx(best);
  };
  const onLeave = () => setHoverIdx(null);

  const hoverData = hoverIdx !== null ? GDP[hoverIdx] : null;

  return (
    <section className="s s-gdp" data-screen-label="03 GDP">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">Chapter 02 · The economy view</span>
          <h2>A growing slice of the economy.</h2>
          <p className="lede" style={{ marginTop: 18 }}>
            From {fy09.pct}% of GDP in {fy09.fy} to {peak.pct}% in {peak.fy} — the government's footprint has steadily widened.
          </p>
        </div>

        <div className="gdp-wrap">
          <div className="gdp-chart-wrap glass" ref={viewRef} style={{ position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <span className="cap">Budget as % of GDP · {fy09.fy} — {last.fy}</span>
              <div className="gdp-toggle">
                <button className={mode === "area" ? "active" : ""} onClick={() => setMode("area")}>Area</button>
                <button className={mode === "line" ? "active" : ""} onClick={() => setMode("line")}>Line</button>
              </div>
            </div>
            <svg viewBox={"0 0 " + W + " " + H} className="gdp-svg" preserveAspectRatio="none">
              <defs>
                <linearGradient id="gdpFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#0185C6" stopOpacity="0.7"/>
                  <stop offset="100%" stopColor="#0185C6" stopOpacity="0.0"/>
                </linearGradient>
                <linearGradient id="gdpLine" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#6fc7ee"/>
                  <stop offset="100%" stopColor="#fff"/>
                </linearGradient>
                <clipPath id="gdpReveal">
                  <rect x={0} y={0}
                        width={pad.l + (W - pad.l - pad.r) * draw}
                        height={H}/>
                </clipPath>
              </defs>

              {/* y gridlines */}
              {yTicks.map(v => (
                <g key={v}>
                  <line className="tick" x1={pad.l} x2={W - pad.r} y1={ys(v)} y2={ys(v)}/>
                  <text className="tick-label" x={pad.l - 8} y={ys(v) + 3} textAnchor="end">{v}%</text>
                </g>
              ))}

              {/* x labels — every other year so it doesn't crowd */}
              {GDP.map((d, i) => (
                i % 2 === 0 && (
                  <text key={d.fy} className="tick-label" x={xs(i)} y={H - 12} textAnchor="middle">{d.fy}</text>
                )
              ))}

              {/* inflection markers — stagger y when peak & pandemic are close */}
              {(() => {
                const close = Math.abs(peakIdx - pandemicIdx) <= 4;
                const pandemicY = pad.t + 14;
                const peakY = close ? pad.t + 32 : pad.t + 14;
                return (
                  <>
                    {pandemicIdx >= 0 && (
                      <g style={{ opacity: draw > 0.85 ? 1 : 0, transition: "opacity .5s ease" }}>
                        <line x1={xs(pandemicIdx)} x2={xs(pandemicIdx)} y1={pad.t} y2={H - pad.b} stroke="#FFEAA7" strokeDasharray="3 4" strokeOpacity="0.45"/>
                        <text x={xs(pandemicIdx) - 8} y={pandemicY} className="axis-label" fill="#FFEAA7" textAnchor="end">Pandemic FY20</text>
                      </g>
                    )}
                    <g style={{ opacity: draw > 0.95 ? 1 : 0, transition: "opacity .5s ease" }}>
                      <line x1={xs(peakIdx)} x2={xs(peakIdx)} y1={pad.t} y2={H - pad.b} stroke="#5fe093" strokeDasharray="3 4" strokeOpacity="0.45"/>
                      <text x={xs(peakIdx) + 8} y={peakY} className="axis-label" fill="#5fe093">Record {peak.fy}</text>
                    </g>
                  </>
                );
              })()}

              {/* area — revealed via clipPath sweep */}
              {mode === "area" && (
                <path d={pathArea} fill="url(#gdpFill)" clipPath="url(#gdpReveal)"/>
              )}

              {/* line — stroke-dashoffset reveal */}
              <path
                ref={lineRef}
                d={pathLine}
                fill="none"
                stroke="url(#gdpLine)"
                strokeWidth="2.5"
                strokeDasharray={lineLen}
                strokeDashoffset={lineLen * (1 - draw)}
                style={{ filter: "drop-shadow(0 2px 8px rgba(111,199,238,0.4))" }}
              />

              {/* points — fade-in with the sweep */}
              {GDP.map((d, i) => {
                const px = xs(i), py = ys(d.pct);
                const progress = i / (GDP.length - 1);
                const visible = draw > progress * 0.92;
                const isHover = hoverIdx === i;
                return (
                  <circle key={d.fy} cx={px} cy={py}
                          r={isHover ? 5.5 : 3.5}
                          fill="#fff"
                          stroke="#0185C6" strokeWidth={isHover ? 2 : 1.5}
                          style={{
                            opacity: visible ? 1 : 0,
                            transition: "opacity .25s ease, r .15s ease, stroke-width .15s ease",
                            transformOrigin: px + "px " + py + "px",
                            filter: isHover ? "drop-shadow(0 0 6px #6fc7ee)" : "none",
                          }}/>
                );
              })}

              {/* highlight peak */}
              <g style={{ opacity: draw > 0.95 ? 1 : 0, transition: "opacity .5s ease" }}>
                <circle cx={xs(peakIdx)} cy={ys(peak.pct)} r="7" fill="none" stroke="#5fe093" strokeWidth="1.5" className="gdp-peak-pulse"/>
                <text x={xs(peakIdx) - 10} y={ys(peak.pct) - 12} className="axis-label" fill="#5fe093" textAnchor="end">{peak.pct}%</text>
              </g>

              {/* status marker on the latest (proposed) point */}
              {(() => {
                const meta = STATUS_META[BUDGET.statusOf(last.fy)];
                if (!meta || !meta.tag) return null;
                return (
                  <text x={xs(GDP.length - 1)} y={ys(last.pct) - 14} textAnchor="end"
                        className={"fy-tag-text " + meta.cls}
                        style={{ fontFamily: "var(--ui)", fontSize: 10, letterSpacing: "0.12em" }}>
                    {meta.tag.toUpperCase()}
                  </text>
                );
              })()}

              {/* hover crosshair + label */}
              {hoverData && (
                <g pointerEvents="none">
                  <line x1={xs(hoverIdx)} x2={xs(hoverIdx)}
                        y1={pad.t} y2={H - pad.b}
                        stroke="#6fc7ee" strokeOpacity="0.55" strokeWidth="1" strokeDasharray="3 3"/>
                  <circle cx={xs(hoverIdx)} cy={ys(hoverData.pct)} r="7"
                          fill="none" stroke="#6fc7ee" strokeWidth="1.5"/>
                </g>
              )}

              {/* mouse capture rect — covers chart plot area */}
              <rect x={pad.l} y={pad.t}
                    width={W - pad.l - pad.r} height={H - pad.t - pad.b}
                    fill="transparent"
                    onMouseMove={onMove}
                    onMouseLeave={onLeave}
                    onTouchMove={(e) => {
                      const t = e.touches[0]; if (!t) return;
                      onMove({ clientX: t.clientX, clientY: t.clientY, currentTarget: e.currentTarget });
                    }}
                    style={{ cursor: "crosshair" }}/>
            </svg>

            {/* HTML tooltip — flip to the LEFT of the point when near the right edge */}
            {hoverData && (() => {
              const flipLeft = hoverIdx >= GDP.length - 4;
              const xPct = (xs(hoverIdx) / W) * 100;
              const yPct = (ys(hoverData.pct) / H) * 100;
              return (
                <div className={"gdp-tip " + (flipLeft ? "flip" : "")} style={{
                  left:  `calc(${xPct}% ${flipLeft ? "- 8px" : "+ 8px"})`,
                  top:   `calc(${yPct}% - 14px)`,
                }}>
                  <div className="gdp-tip-fy">{hoverData.fy}</div>
                  <div className="gdp-tip-pct">{hoverData.pct.toFixed(1)}<span>%</span></div>
                  <div className="gdp-tip-cap">of GDP</div>
                </div>
              );
            })()}
          </div>

          <div className="gdp-stat-card glass">
            <div>
              <span className="eyebrow" style={{ display: "block", marginBottom: 18 }}>From — to</span>
              <div style={{ fontFamily: "var(--serif)", fontSize: 26, color: "#D3D6DB", fontStyle: "italic" }}>{fy09.pct}% <span style={{color: "#8B939F"}}>{fy09.fy}</span></div>
              <div style={{ fontFamily: "var(--ui)", fontSize: 11, color: "#8B939F", margin: "8px 0", letterSpacing: "0.2em" }}>↓ {GDP_DATA.length - 1} YEARS</div>
              <div className="big"><CountUp value={last.pct} decimals={1} suffix="%" duration={1500}/></div>
              <div style={{ fontFamily: "var(--ui)", fontSize: 11, color: "#B0B5BE", marginTop: 8, letterSpacing: "0.1em" }}>{last.fy} · OF GDP</div>
              <div className="arrow">+<CountUp value={last.pct - fy09.pct} decimals={1}/> pp · +<CountUp value={((last.pct - fy09.pct) / fy09.pct) * 100} decimals={0}/>%</div>
            </div>
            <div style={{ paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 24 }}>
              <span className="body" style={{ fontStyle: "italic" }}>
                The Bangladeshi state has quietly captured a third more of national output in a decade and a half.
              </span>
            </div>
          </div>
        </div>

        <RelevantNews items={RELEVANT_NEWS.gdp} accent="#45B7D1" />
      </div>
    </section>
  );
}

Object.assign(window, { TakaSection, GDPSection });
