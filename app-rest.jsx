/* ============================================================
   TREEMAP — simple slice-and-dice
============================================================ */
function buildTreemap(items, W, H) {
  // greedy squarified-ish: alternate slicing direction based on remaining aspect
  const total = items.reduce((a, b) => a + b.pct, 0);
  const result = [];
  let x = 0, y = 0, w = W, h = H;
  let row = [];
  let rowSum = 0;

  function emitRow(row, horizontal) {
    const sum = row.reduce((a, b) => a + b.pct, 0);
    if (horizontal) {
      const rowH = (sum / total) * H * (W / w); // unused; simplified below
    }
  }

  // Simpler: hand-coded slice with two big rows
  const sorted = [...items].sort((a, b) => b.pct - a.pct);
  const big = sorted.slice(0, 6);
  const rest = sorted.slice(6);
  const bigSum = big.reduce((a, b) => a + b.pct, 0);
  const restSum = rest.reduce((a, b) => a + b.pct, 0);
  let topH = (bigSum / (bigSum + restSum)) * H;
  topH = topH * 0.80; // Shrink top row slightly to give more room to lower departments
  const botH = H - topH;

  // top row of 6
  let cx = 0;
  big.forEach(it => {
    const cw = (it.pct / bigSum) * W;
    result.push({ ...it, x: cx, y: 0, w: cw, h: topH });
    cx += cw;
  });
  // bottom row of N — split into 2 sub-rows
  const halfIdx = Math.ceil(rest.length / 2);
  const rowA = rest.slice(0, halfIdx);
  const rowB = rest.slice(halfIdx);
  const rowASum = rowA.reduce((a, b) => a + b.pct, 0);
  const rowBSum = rowB.reduce((a, b) => a + b.pct, 0);
  const aH = ((rowASum / (rowASum + rowBSum)) * botH) * 0.85;
  const bH = botH - aH;

  cx = 0;
  rowA.forEach(it => {
    const cw = (it.pct / rowASum) * W;
    result.push({ ...it, x: cx, y: topH, w: cw, h: aH });
    cx += cw;
  });
  cx = 0;
  rowB.forEach(it => {
    const cw = (it.pct / rowBSum) * W;
    result.push({ ...it, x: cx, y: topH + aH, w: cw, h: bH });
    cx += cw;
  });

  return result;
}

function Treemap() {
  const [hover, setHover] = useState2(null);
  const [showCount, setShowCount] = useState2(15);
  const W = 1184, H = 580;
  // Ranked list is the legible/tappable representation of the same data.
  const tmList = useMemo2(() => [...TREEMAP].sort((a, b) => b.pct - a.pct), []);
  const cells = useMemo2(() => buildTreemap(tmList.slice(0, 15), W, H), [tmList]);
  const tmListMax = Math.max(...TREEMAP.map(t => t.pct));

  return (
    <section className="s s-treemap" data-screen-label="04 Treemap">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">Sector by sector</span>
          <h2>Every area, every taka</h2>
          <p className="lede" style={{ marginTop: 18, maxWidth: 720 }}>
            FY26's allocated ৳7,90,000 crore expenditure, sliced into the multiple ministries and divisions that consume it. Two single line items — debt interest and the Finance Division — already eat a quarter.
          </p>
        </div>

        <div className="tm-svg-wrap" style={{ marginBottom: "24px" }}>
          <svg viewBox={"0 0 " + W + " " + H} style={{ width: "100%", height: "auto", display: "block", borderRadius: 18, overflow: "hidden" }}>
            <defs>
              <filter id="cellShine">
                <feGaussianBlur stdDeviation="0.4" />
              </filter>
            </defs>
            {cells.map((c, i) => {
              const isHover = hover === i;
              const big = c.w * c.h > 18000;
              const med = c.w * c.h > 6000;
              const pad = big ? 14 : (med ? 10 : 6);
              const innerW = Math.max(0, c.w - pad * 2);

              // Robustly scale down font size based on the longest word to prevent mid-word letter breaks.
              const words = c.name.split(/[\s&\-]+/).filter(Boolean);
              const maxWordLen = words.length > 0 ? Math.max(...words.map(w => w.length)) : 10;
              // Assuming ~0.62em average character width for the UI font.
              const maxFitSize = Math.max(9, innerW / (maxWordLen * 0.62));
              const nameSize = big ? Math.min(16, maxFitSize) : med ? Math.min(12, maxFitSize) : Math.min(10, maxFitSize);

              return (
                <g key={i}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  style={{ cursor: "pointer" }}>
                  <rect x={c.x + 1.5} y={c.y + 1.5} width={c.w - 3} height={c.h - 3}
                    fill={c.c} rx="4"
                    style={{
                      opacity: isHover ? 0.85 : 0.6,
                      filter: isHover ? "brightness(1.25)" : "brightness(1)",
                      transition: "filter .2s, opacity .2s"
                    }} />
                  {/* gloss */}
                  <rect x={c.x + 1.5} y={c.y + 1.5} width={c.w - 3} height={c.h - 3}
                    fill="url(#tmGloss)" rx="4" pointerEvents="none" />
                  {/* dark bottom scrim for legibility */}
                  <rect x={c.x + 1.5} y={c.y + 1.5} width={c.w - 3} height={c.h - 3}
                    fill="url(#tmScrim)" rx="4" pointerEvents="none" />
                  {/* HTML text via foreignObject — wraps automatically */}
                  <foreignObject x={c.x + pad} y={c.y + pad}
                    width={innerW}
                    height={Math.max(0, c.h - pad * 2)}
                    pointerEvents="none">
                    <div className={"tm-fo " + (big ? "big" : med ? "med" : "sm")} style={{ fontFamily: "var(--ui)" }}>
                      <div className="tm-fo-name" style={{ fontSize: nameSize, fontFamily: "var(--ui)" }}>{c.name}</div>
                      <div className="tm-fo-pct" style={{ fontSize: nameSize * 0.8, opacity: 0.85, fontFamily: "var(--ui)" }}>{c.pct.toFixed(big ? 2 : 1)}%</div>
                    </div>
                  </foreignObject>
                </g>
              );
            })}
            <defs>
              <linearGradient id="tmGloss" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
                <stop offset="60%" stopColor="rgba(255,255,255,0)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0.18)" />
              </linearGradient>
              <linearGradient id="tmScrim" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="rgba(0,0,0,0)" />
                <stop offset="55%" stopColor="rgba(0,0,0,0)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0.45)" />
              </linearGradient>
            </defs>
          </svg>

        </div>

        {/* The ranked list is used on both mobile and desktop (for items > 15) */}
        <ol className="tm-list" aria-label="Departments by share of FY24 expenditure">
          {tmList.slice(0, showCount).map((c, i) => (
            <li key={i} className={"tm-list-row " + (i < 15 ? "tm-hide-desktop" : "")} style={{ "--c": c.c }}>
              <span className="tm-list-rank">{i + 1}</span>
              <div className="tm-list-body">
                <div className="tm-list-top">
                  <span className="tm-list-name">{c.name}</span>
                  <span className="tm-list-pct">{c.pct.toFixed(2)}%</span>
                </div>
                <div className="tm-list-track">
                  <div className="tm-list-bar" style={{ width: (c.pct / tmListMax) * 100 + "%" }}></div>
                </div>
                <span className="tm-list-parent">{c.parent}</span>
              </div>
            </li>
          ))}
        </ol>

        {tmList.length > 15 && (
          <div style={{ marginTop: 24, textAlign: "center" }}>
            <button className="tm-show-more-btn" onClick={() => setShowCount(showCount >= tmList.length ? 15 : showCount + 15)}>
              {showCount >= tmList.length ? "Show less" : "Show more"}
            </button>
          </div>
        )}



        <RelevantNews items={RELEVANT_NEWS.treemap} accent="#B0832B" />
      </div>
    </section>
  );
}

/* ============================================================
   DEBT — stacked bars
============================================================ */
function DebtSection() {
  const [tooltip, setTooltip] = React.useState(null);
  const chartContainerRef = React.useRef(null);
  const tooltipRef = React.useRef(null);
  const touchStartRef = React.useRef(null);

  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 640);
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [measuredW, setMeasuredW] = React.useState(0);
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
  }, [isMobile]);

  const handleBarEnter = (e, barData, barIndex) => {
    const container = chartContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const touch = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
    const clientX = touch ? touch.clientX : e.clientX;
    const clientY = touch ? touch.clientY : e.clientY;
    const currentIsMobile = window.innerWidth <= 640;

    setTooltip({
      x: clientX - rect.left,
      y: clientY - rect.top,
      bar: barData,
      isMobile: currentIsMobile,
    });
  };

  const handleBarLeave = () => {
    if (window.innerWidth > 640) {
      setTooltip(null);
    }
  };

  const TAP_SLOP = 12;
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
      e.preventDefault();
      handleBarEnter(e, barData, barIndex);
    }
  };

  React.useEffect(() => {
    const close = (e) => {
      if (tooltipRef.current && tooltipRef.current.contains(e.target)) return;
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

  const DEBT = INTEREST_DATA.filter(d => typeof d.d === "number" && typeof d.f === "number");
  const n = DEBT.length;
  const totals = DEBT.map(d => d.d + d.f);
  const maxV = Math.ceil(Math.max(...totals) * 1.18 / 10000) * 10000;

  const proposedFy = BUDGET.proposed;
  const proposedInterest = INTEREST_DATA.find(d => d.fy === proposedFy) || { d: 100000, f: 22000 };
  const proposedTotalInterest = (proposedInterest.d || 0) + (proposedInterest.f || 0);
  const proposedTotalBudget = window.TOTAL_BUDGET_BY_YEAR[proposedFy] || 1;
  const calculatedInterestPct = (proposedTotalInterest / proposedTotalBudget) * 100;

  const fy09 = INTEREST_DATA.find(d => d.fy === "FY09") || { d: 13839, f: 1341 };
  const d_mult = (proposedInterest.d / fy09.d).toFixed(1);
  const f_mult = (proposedInterest.f / fy09.f).toFixed(1);

  const fy11 = INTEREST_DATA.find(d => d.fy === "FY11") || { d: 14200, f: 1423 };
  const totalInt11 = fy11.d + fy11.f;
  const totalBud11 = window.TOTAL_BUDGET_BY_YEAR["FY11"] || 128268;
  const pct11 = (totalInt11 / totalBud11 * 100).toFixed(1);


  const fallbackW = isMobile
    ? Math.max(260, window.innerWidth - 64)
    : Math.min(1180, Math.max(360, window.innerWidth - 96));
  const W = measuredW > 0 ? measuredW : fallbackW;

  const H = isMobile
    ? n * 34 + 22 + 30
    : Math.round(Math.min(470, Math.max(380, W * 0.36)));

  const pad = isMobile
    ? { l: 46, r: 80, t: 22, b: 30 }
    : { l: 76, r: 30, t: 64, b: 40 };

  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const step = isMobile ? innerH / n : innerW / n;
  const bw = isMobile ? Math.min(step * 0.66, 26) : Math.min(step * 0.64, 46);

  const dataMax = Math.max(...totals);
  const dispMax = maxV;
  const tallestTopY = pad.t + innerH - (dataMax / dispMax) * innerH;

  const labelEvery = isMobile ? 1 : Math.max(1, Math.ceil(36 / step));
  const showYearLabel = (i, isProposed) => {
    if (isMobile || i === n - 1 || isProposed) return true;
    if (i % labelEvery !== 0) return false;
    return labelEvery === 1 || i <= n - 1 - labelEvery;
  };

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
      <div className="see-tooltip-row">
        <span className="see-tooltip-sw" style={{ background: "#4c1d95" }}></span>
        <span className="see-tooltip-name">Domestic</span>
        <span className="see-tooltip-val">৳{tooltip.bar.d.toLocaleString("en-IN")} cr</span>
      </div>
      <div className="see-tooltip-row">
        <span className="see-tooltip-sw" style={{ background: "#c084fc" }}></span>
        <span className="see-tooltip-name">Foreign</span>
        <span className="see-tooltip-val">৳{tooltip.bar.f.toLocaleString("en-IN")} cr</span>
      </div>
      <div className="see-tooltip-total">
        Total: ৳{(tooltip.bar.d + tooltip.bar.f).toLocaleString("en-IN")} cr
      </div>
    </div>
  ) : null;

  return (
    <section className="s s-debt" data-screen-label="05 Debt">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow" style={{ color: "#c084fc" }}>The debt story</span>
          <h2>Interest bill eating up a growing share of budget</h2>
        </div>

        <div className="debt-callout">
          <span className="big"><CountUp value={calculatedInterestPct} decimals={1} prefix="৳" duration={1600} /></span>
          <span className="txt">of every ৳100 in the {BUDGET.proposed} budget goes to paying interest</span>
        </div>

        <div className="debt-chart-wrap glass">
          <div className="debt-chart-head">
            <div>
              <span className="eyebrow" style={{ color: "#c084fc", display: "block" }}>Government interest payments · FY09 — {BUDGET.proposed}</span>
              <span className="cap" style={{ marginTop: 6, display: "block" }}>In crore Taka</span>
            </div>
            <div className="debt-legend">
              <span className="ll"><span className="sw" style={{ background: "#4c1d95" }}></span>Domestic</span>
              <span className="ll"><span className="sw" style={{ background: "#c084fc" }}></span>Foreign</span>
            </div>
          </div>

          <div className="debt-chart-inner" ref={chartContainerRef} style={{ position: "relative", minHeight: isMobile ? H : 'auto' }}>
            <svg className="see-chart" width={W} height={H} viewBox={"0 0 " + W + " " + H} style={{ width: W + "px", height: H + "px", display: "block", overflow: "visible" }}>
              <defs>
                <linearGradient id="domGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#7e22ce" />
                  <stop offset="100%" stopColor="#3b0764" />
                </linearGradient>
                <linearGradient id="forGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#d8b4fe" />
                  <stop offset="100%" stopColor="#9333ea" />
                </linearGradient>
                <linearGradient id="domGradH" x1="1" x2="0" y1="0" y2="0">
                  <stop offset="0%" stopColor="#7e22ce" />
                  <stop offset="100%" stopColor="#3b0764" />
                </linearGradient>
                <linearGradient id="forGradH" x1="1" x2="0" y1="0" y2="0">
                  <stop offset="0%" stopColor="#d8b4fe" />
                  <stop offset="100%" stopColor="#9333ea" />
                </linearGradient>
              </defs>

              {/* gridlines */}
              {[0, 0.25, 0.5, 0.75, 1.0].map(g => {
                const v = g * maxV;
                if (isMobile) {
                  const x = pad.l + g * innerW;
                  return (
                    <g key={g}>
                      <line x1={x} x2={x} y1={pad.t} y2={H - pad.b} stroke="rgba(255,255,255,0.06)" />
                      {g > 0 && <text x={x} y={H - pad.b + 18} textAnchor="middle" className="tick-label">
                        {((v / 1000) | 0)}k
                      </text>}
                    </g>
                  );
                } else {
                  const y = pad.t + (1 - g) * innerH;
                  return (
                    <g key={g}>
                      <line className="tick" x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke="rgba(255,255,255,0.06)" />
                      <text className="tick-label" x={pad.l - 10} y={y + 3} textAnchor="end">৳{(v / 1000) | 0}k cr</text>
                    </g>
                  );
                }
              })}

              {DEBT.map((d, i) => {
                const isProposed = d.fy === BUDGET.proposed;
                const isActual = d.fy === BUDGET.actual;
                const total = d.d + d.f;
                const delay = i * 40;
                const stMeta = STATUS_META[BUDGET.statusOf(d.fy)];
                const isPeak = total === Math.max(...totals);

                if (isMobile) {
                  const y = pad.t + i * step + (step - bw) / 2;
                  const domW = (d.d / maxV) * innerW;
                  const forW = (d.f / maxV) * innerW;
                  const totalW = domW + forW;

                  return (
                    <g key={d.fy}>
                      {isActual && <rect x={pad.l} y={y - 2} width={innerW + pad.r} height={bw + 4} fill="#c084fc" opacity="0.06" rx="3" />}
                      <text x={pad.l - 8} y={y + bw / 2 + 4} textAnchor="end" className="tick-label"
                        style={{ fill: isProposed ? "#c084fc" : undefined, opacity: isProposed ? 0.9 : 1, fontSize: 10 }}>{d.fy}</text>

                      <AnimatedRect axis="x" x={pad.l} y={y} width={domW} height={bw} fill="url(#domGradH)" duration={900} delay={delay} />
                      <AnimatedRect axis="x" x={pad.l + domW} y={y} width={forW} height={bw} fill="url(#forGradH)" rx="2" duration={900} delay={delay + 50} />

                      <rect x={0} y={y - 2} width={W} height={bw + 4}
                        fill="transparent" style={{ cursor: "pointer" }}
                        onMouseEnter={(e) => handleBarEnter(e, d, i)}
                        onMouseMove={(e) => handleBarEnter(e, d, i)}
                        onMouseLeave={handleBarLeave}
                        onTouchStart={handleBarTouchStart}
                        onTouchEnd={(e) => handleBarTouchEnd(e, d, i)} />

                      {isProposed && (
                        <text x={pad.l + totalW + 6} y={y + bw / 2 + 4} textAnchor="start"
                          style={{ fontFamily: "var(--serif)", fontSize: 13, fill: "#fff" }}>
                          ৳{(total / 1000).toFixed(0)}k
                        </text>
                      )}
                    </g>
                  );
                } else {
                  const x = pad.l + i * step + (step - bw) / 2;
                  const domH = (d.d / maxV) * innerH;
                  const forH = (d.f / maxV) * innerH;
                  const totalH = domH + forH;
                  const isLast = i === DEBT.length - 1;

                  return (
                    <g key={d.fy}>
                      {isActual && (
                        <rect x={x - 3} y={pad.t} width={bw + 6} height={innerH} fill="#c084fc" opacity="0.06" rx="3" />
                      )}

                      <AnimatedRect x={x} y={pad.t + innerH - domH} width={bw} height={domH} fill="url(#domGrad)" duration={900} delay={delay} />
                      <AnimatedRect x={x} y={pad.t + innerH - totalH} width={bw} height={forH} fill="url(#forGrad)" rx="2" duration={900} delay={delay + 50} />

                      <rect x={x - 2} y={pad.t} width={bw + 4} height={innerH + pad.b}
                        fill="transparent" style={{ cursor: "pointer" }}
                        onMouseEnter={(e) => handleBarEnter(e, d, i)}
                        onMouseMove={(e) => handleBarEnter(e, d, i)}
                        onMouseLeave={handleBarLeave}
                        onTouchStart={handleBarTouchStart}
                        onTouchEnd={(e) => handleBarTouchEnd(e, d, i)} />

                      {showYearLabel(i, isProposed) && (
                        <text x={x + bw / 2} y={H - 20} textAnchor="middle" className="tick-label"
                          style={{ fill: isProposed ? "#c084fc" : undefined, opacity: isProposed ? 0.9 : 1 }}>{d.fy}</text>
                      )}

                      {isLast && (
                        <g>
                          <text x={x + bw / 2} y={tallestTopY - 38} textAnchor="middle"
                            style={{ fontFamily: "var(--ui)", fontSize: 18, fill: "#fff", fontWeight: 600 }}>
                            Tk {(total / 1000).toFixed(0)}k cr
                          </text>
                        </g>
                      )}
                      {stMeta && (stMeta.word === "Allocation" || stMeta.word === "Revised") && (
                        <text x={x + bw / 2} y={tallestTopY - (stMeta.cls === "fy-proposed" ? 22 : 8)} textAnchor="middle"
                          className={"fy-tag-text " + stMeta.cls}
                          style={{ fontFamily: "var(--ui)", fontSize: 8, letterSpacing: "0.12em", fill: stMeta.cls === "fy-proposed" ? undefined : "#d8b4fe" }}>
                          {stMeta.word.toUpperCase()}
                        </text>
                      )}
                      {isPeak && !isLast && (
                        <text x={x + bw / 2} y={pad.t + innerH - totalH - 10} textAnchor="middle"
                          style={{ fontFamily: "var(--ui)", fontSize: 8, fill: "rgba(216,180,254,0.7)", letterSpacing: "0.12em" }}>৳{(total / 1000).toFixed(0)}k</text>
                      )}
                    </g>
                  );
                }
              })}

              {/* arrow callouts for foreign debt spikes */}
              {[{ fy: "FY18", text: "FOREIGN DEBT 2x" }, { fy: "FY23", text: "FOREIGN DEBT 2x" }].map(c => {
                const idx = DEBT.findIndex(d => d.fy === c.fy);
                if (idx === -1) return null;
                const d = DEBT[idx];
                const total = d.d + d.f;
                if (isMobile) {
                  const cy = pad.t + idx * step + step / 2;
                  const totalW = (total / maxV) * innerW;
                  const tx = pad.l + totalW;
                  return (
                    <g pointerEvents="none" key={c.fy}>
                      <line x1={tx + 8} y1={cy} x2={tx + 20} y2={cy} stroke="#d8b4fe" strokeDasharray="2 2" strokeWidth="1" />
                      <text x={tx + 24} y={cy + 3} textAnchor="start"
                        style={{ fontFamily: "var(--ui)", fontSize: 8, fill: "#d8b4fe", letterSpacing: "0.1em" }}>{c.text}</text>
                    </g>
                  );
                } else {
                  const cx = pad.l + idx * step + step / 2;
                  const totalH = (total / maxV) * innerH;
                  const barTop = pad.t + innerH - totalH;

                  // Dynamically find the height of the next bar to ensure the text clears it
                  const nextD = DEBT[idx + 1];
                  const nextTotal = nextD ? nextD.d + nextD.f : total;
                  const nextTotalH = (nextTotal / maxV) * innerH;
                  const nextBarTop = pad.t + innerH - nextTotalH;

                  const targetTop = Math.min(barTop, nextBarTop);

                  return (
                    <g pointerEvents="none" key={c.fy}>
                      <line x1={cx} y1={targetTop - 22} x2={cx} y2={barTop - 8} stroke="#d8b4fe" strokeDasharray="3 3" strokeWidth="1" />
                      <text x={cx} y={targetTop - 28} textAnchor="middle"
                        style={{ fontFamily: "var(--ui)", fontSize: 9, fill: "#d8b4fe", letterSpacing: "0.12em" }}>{c.text}</text>
                    </g>
                  );
                }
              })}
            </svg>

            {/* HTML TOOLTIP PORTAL */}
            {tooltip && tooltip.isMobile && window.ReactDOM
              ? window.ReactDOM.createPortal(tooltipEl, document.body)
              : tooltipEl
            }
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 20, marginTop: 32, paddingTop: 28, borderTop: "1px solid rgba(147,51,234,0.18)" }}>
            <Stat label={"Domestic, FY09 → " + BUDGET.proposed} big={d_mult + "×"} sub={`৳${(fy09.d / 1000).toFixed(1)}k → ৳${(proposedInterest.d / 1000).toFixed(0)}k cr`} />
            <Stat label={"Foreign, FY09 → " + BUDGET.proposed} big={f_mult + "×"} sub={`৳${(fy09.f / 1000).toFixed(1)}k → ৳${(proposedInterest.f / 1000).toFixed(0)}k cr`} />
            <Stat label={BUDGET.proposed + " share of every ৳100"} big={"৳" + calculatedInterestPct.toFixed(1)} sub={`up from ৳${pct11} in FY11`} />
          </div>
        </div>

      </div>
    </section>
  );
}

function Stat({ label, big, sub }) {
  // Try to parse a number out of the "big" prop so we can animate it
  const m = (big || "").match(/([\d.]+)/);
  const num = m ? parseFloat(m[1]) : null;
  const prefix = num !== null ? big.slice(0, big.indexOf(m[1])) : "";
  const suffix = num !== null ? big.slice(big.indexOf(m[1]) + m[1].length) : "";
  const decimals = m && m[1].includes(".") ? (m[1].split(".")[1].length) : 0;
  return (
    <div>
      <div className="cap" style={{ marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: "var(--serif)", fontSize: 36, color: "#d8b4fe", lineHeight: 1 }}>
        {num !== null
          ? <CountUp value={num} decimals={decimals} prefix={prefix} suffix={suffix} duration={1300} />
          : big}
      </div>
      <div style={{ fontFamily: "var(--ui)", fontSize: 12, color: "#8B939F", marginTop: 6 }}>{sub}</div>
    </div>
  );
}

function HomeNewsCard({ n, index }) {
  const [item, setItem] = React.useState({ ...n });

  React.useEffect(() => {
    // If the API feed has changed, resync item state
    setItem({ ...n });
  }, [n]);

  React.useEffect(() => {
    if (n.image || item.image || item.loading || !n.url) return;

    setItem(prev => ({ ...prev, loading: true }));
    const eUrl = encodeURIComponent(n.url);
    fetch(`https://api.microlink.io?url=${eUrl}&filter=image,title,publisher,date`)
      .then(r => r.json())
      .then(res => {
        if (res.status === "success" && res.data) {
          const fetchedImage = res.data.image?.url;
          setItem(prev => ({
            ...prev,
            image: fetchedImage || prev.image,
            loading: false
          }));
        } else {
          setItem(prev => ({ ...prev, loading: false }));
        }
      })
      .catch(e => {
        setItem(prev => ({ ...prev, loading: false }));
      });
  }, [n.url, n.image, item.image, item.loading]);

  const cardContent = (
    <>
      <div className="news-thumb" style={{ "--c1": item.c1, "--c2": item.c2 }}>
        {item.image ? (
          <img src={item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
        ) : (
          <>
            <div className="news-thumb-shape"></div>
            <div className="news-thumb-shape two"></div>
            <span style={{ fontFamily: "var(--serif)", fontSize: 72, color: "rgba(255,255,255,0.18)", fontStyle: "italic", position: "relative" }}>{index + 1}</span>
          </>
        )}
      </div>
      <div className="news-body">
        <div className="news-meta">
          <span className="news-tag" style={{ "--tag": item.tagColor }}>{item.tag}</span>
          <span className="news-date">{item.date}</span>
        </div>
        <div className="news-headline">{item.headline}</div>
        <div className="news-dek">{item.dek}</div>
        <div className="news-author">
          <span>By {item.author}</span>
          <span>{item.read}</span>
        </div>
      </div>
    </>
  );

  return item.url ? (
    <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit", display: "block" }} className="news-card glass">
      {cardContent}
    </a>
  ) : (
    <article className="news-card glass">
      {cardContent}
    </article>
  );
}

/* ============================================================
   NEWS FEED
============================================================ */
function NewsSection() {
  const [, force] = React.useState(0);
  const [showCount, setShowCount] = React.useState(6);
  const visibleNews = NEWS.slice(4);

  React.useEffect(() => {
    const onUpdate = () => force((v) => v + 1);
    window.addEventListener("news-feed:updated", onUpdate);
    return () => window.removeEventListener("news-feed:updated", onUpdate);
  }, []);

  return (
    <section className="s s-news" data-screen-label="06 News">
      <div className="wrap">
        <div className="section-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", maxWidth: "100%", marginBottom: 48 }}>
          <div>
            <span className="eyebrow">From the newsroom</span>
            <h2 style={{ marginTop: 16 }}>Latest Budget Coverage</h2>
          </div>
          <a href="https://www.thedailystar.net/business/bangladesh-budget-2026-27" target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--ui)", fontSize: 13, color: "#6fc7ee", letterSpacing: "0.04em", borderBottom: "1px solid #6fc7ee", paddingBottom: 4, cursor: "pointer", textDecoration: "none" }}>All Budget {BUDGET.proposed} stories →</a>
        </div>

        <div className="news-grid">
          {visibleNews.slice(0, showCount).map((n, i) => (
            <HomeNewsCard key={i} n={n} index={i} />
          ))}
        </div>

        {visibleNews.length > 6 && (
          <div style={{ marginTop: 40, textAlign: "center" }}>
            <button
              onClick={() => setShowCount(showCount >= visibleNews.length ? 6 : visibleNews.length)}
              style={{
                fontFamily: "var(--ui)",
                fontSize: 14,
                fontWeight: 600,
                color: "#fff",
                background: "linear-gradient(135deg, #0185C6, #005A8C)",
                border: "1px solid rgba(1, 133, 198, 0.4)",
                borderRadius: 999,
                padding: "14px 36px",
                cursor: "pointer",
                boxShadow: "0 8px 24px -8px rgba(1, 133, 198, 0.6), inset 0 1px 1px rgba(255,255,255,0.2)",
                transition: "all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)",
                letterSpacing: "0.04em",
                textTransform: "uppercase"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 12px 32px -8px rgba(1, 133, 198, 0.8), inset 0 1px 1px rgba(255,255,255,0.3)";
                e.currentTarget.style.filter = "brightness(1.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "0 8px 24px -8px rgba(1, 133, 198, 0.6), inset 0 1px 1px rgba(255,255,255,0.2)";
                e.currentTarget.style.filter = "none";
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = "translateY(1px)";
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
              }}
            >
              {showCount >= visibleNews.length ? "Show less" : "Show more"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/* ============================================================
   FOOTER
============================================================ */
function BackToTop() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const toggleVisible = () => {
      if (window.scrollY > 300) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };
    toggleVisible(); // Check immediately on mount
    window.addEventListener('scroll', toggleVisible, { passive: true });
    return () => window.removeEventListener('scroll', toggleVisible);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <>
      <style>{`
        .b2t {
          position: fixed;
          bottom: 40px;
          right: 40px;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02)), rgba(20, 25, 35, 0.4);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.15);
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 99999;
          opacity: 0;
          pointer-events: none;
          transform: translateY(20px) scale(0.9);
          transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .b2t.vis {
          opacity: 1;
          pointer-events: auto;
          transform: translateY(0) scale(1);
        }
        .b2t:hover {
          background: linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05)), rgba(30, 35, 45, 0.5);
          border-color: rgba(111,199,238,0.5);
          transform: translateY(-4px) scale(1.05);
          box-shadow: 0 12px 40px rgba(0,0,0,0.5), 0 0 20px rgba(111,199,238,0.2);
          color: #6fc7ee;
        }
        @media (max-width: 640px) {
          .b2t { bottom: 24px; right: 24px; width: 44px; height: 44px; }
          body:has(.see-tooltip) .b2t,
          body:has(.taka-tooltip) .b2t,
          body:has(.gdp-tip) .b2t {
            opacity: 0 !important;
            pointer-events: none !important;
            transform: translateY(20px) scale(0.9) !important;
          }
        }
      `}</style>
      <button
        onClick={scrollToTop}
        className={`b2t ${visible ? 'vis' : ''}`}
        aria-label="Back to top"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </button>
    </>
  );
}

function Footer() {
  const isLocal = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
  let basePath = window.location.pathname;
  basePath = basePath.replace(/(?:index\.html|budget-realities\.html|sector-deep-dive\.html)$/, "");
  basePath = basePath.replace(/(?:budget-realities|sector-deep-dive)\/$/, "");
  if (!basePath.endsWith("/")) basePath += "/";

  const routes = isLocal
    ? {
        home: basePath,
        sector: basePath + "sector-deep-dive/",
        realities: basePath + "budget-realities/",
      }
    : {
        home: "/",
        sector: "/sector-deep-dive",
        realities: "/budget-realities",
      };

  return (
    <footer>
      <BackToTop />
      <div className="wrap">
        <div className="foot-top" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '40px' }}>
          <div className="foot-brand" style={{ flex: '1 1 300px', maxWidth: '400px' }}>
            <a href="https://www.thedailystar.net/" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginBottom: '8px' }}>
              <img src="assets/logo.svg" alt="The Daily Star" style={{ height: '32px', filter: 'brightness(0) invert(1)' }} />
            </a>
            <p style={{ marginTop: '16px', lineHeight: 1.6 }}>Budget at a Glance is an editorial visualization project from The Daily Star — making fiscal policy legible, year on year.</p>
          </div>
          <div className="foot" style={{ flex: '0 1 auto', minWidth: '200px' }}>
            <h4 style={{ marginBottom: '20px' }}>Pages</h4>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><a href={routes.home} style={{ display: 'block' }}>Home</a></li>
              <li><a href={routes.sector} style={{ display: 'block' }}>Sector Deep Dive</a></li>
              <li><a href={routes.realities} style={{ display: 'block' }}>Budget Realities</a></li>
            </ul>
          </div>
        </div>
        <div className="foot-bottom" style={{ marginTop: '56px', flexWrap: 'wrap', gap: '16px' }}>
          <span>© 2026 The Daily Star · Data via Ministry of Finance, Bangladesh</span>
          <span>Designed & Engineered by The Daily Star</span>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, { Treemap, DebtSection, NewsSection, Footer });
