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
  const topH = (bigSum / (bigSum + restSum)) * H;
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
  const aH = (rowASum / (rowASum + rowBSum)) * botH;
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
  const W = 1184, H = 580;
  const cells = useMemo2(() => buildTreemap(TREEMAP, W, H), []);
  // Ranked list is the legible/tappable mobile representation of the same data.
  const tmList = useMemo2(() => [...TREEMAP].sort((a, b) => b.pct - a.pct), []);
  const tmListMax = Math.max(...TREEMAP.map(t => t.pct));

  return (
    <section className="s s-treemap" data-screen-label="04 Treemap">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">Chapter 03 · Department by department</span>
          <h2>Every department, every taka.</h2>
          <p className="lede" style={{ marginTop: 18, maxWidth: 720 }}>
            FY24's ৳6,11,392 crore expenditure, sliced into the multiple ministries and divisions that consume it. Two single line items — debt interest and the Finance Division — already eat a quarter.
          </p>
        </div>

        <div className="tm-svg-wrap">
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
              return (
                <g key={i}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  style={{ cursor: "pointer" }}>
                  <rect x={c.x + 1.5} y={c.y + 1.5} width={c.w - 3} height={c.h - 3}
                    fill={c.c} rx="4"
                    style={{
                      filter: isHover ? "brightness(1.25)" : "brightness(1)",
                      transition: "filter .2s"
                    }} />
                  {/* gloss */}
                  <rect x={c.x + 1.5} y={c.y + 1.5} width={c.w - 3} height={c.h - 3}
                    fill="url(#tmGloss)" rx="4" pointerEvents="none" />
                  {/* dark bottom scrim for legibility */}
                  <rect x={c.x + 1.5} y={c.y + 1.5} width={c.w - 3} height={c.h - 3}
                    fill="url(#tmScrim)" rx="4" pointerEvents="none" />
                  {/* HTML text via foreignObject — wraps automatically */}
                  <foreignObject x={c.x + pad} y={c.y + pad}
                    width={Math.max(0, c.w - pad * 2)}
                    height={Math.max(0, c.h - pad * 2)}
                    pointerEvents="none">
                    <div className={"tm-fo " + (big ? "big" : med ? "med" : "sm")}>
                      <div className="tm-fo-name">{c.name}</div>
                      {big && <div className="tm-fo-parent">{c.parent}</div>}
                      <div className="tm-fo-pct">{c.pct.toFixed(big ? 2 : 1)}%</div>
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

          {hover !== null && (
            <div className="glass" style={{
              position: "absolute", top: 20, right: 20,
              padding: "16px 20px", maxWidth: 260,
              borderColor: cells[hover].c + "66"
            }}>
              <div className="cap" style={{ color: cells[hover].c, marginBottom: 6 }}>{cells[hover].parent.toUpperCase()}</div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 22, marginBottom: 8 }}>{cells[hover].name}</div>
              <div style={{ fontFamily: "var(--ui)", fontSize: 32, fontWeight: 700, color: cells[hover].c }}>{cells[hover].pct.toFixed(2)}%</div>
              <div className="cap" style={{ marginTop: 6 }}>of FY24 total expenditure</div>
            </div>
          )}
        </div>

        {/* Mobile: the treemap shrinks its foreignObject labels to ~3px, so phones
            get a fully legible, tappable ranked-bar list of the same data instead. */}
        <ol className="tm-list" aria-label="Departments by share of FY24 expenditure">
          {tmList.map((c, i) => (
            <li key={i} className="tm-list-row" style={{ "--c": c.c }}>
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

        <div style={{ marginTop: 28, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <span className="cap">Each cell sized by share of FY24 expenditure ~ Top 20 shown</span>
          <span className="cap">Colored by parent sector</span>
        </div>

        <RelevantNews items={RELEVANT_NEWS.treemap} accent="#B0832B" />
      </div>
    </section>
  );
}

/* ============================================================
   DEBT — stacked bars
============================================================ */
function DebtSection() {
  const W = 1080, H = 420, pad = { l: 70, r: 30, t: 64, b: 44 };
  // Render only years with data (drops the null FY27 placeholder).
  const DEBT = INTEREST_DATA.filter(d => typeof d.d === "number" && typeof d.f === "number");
  const totals = DEBT.map(d => d.d + d.f);
  const maxV = Math.ceil(Math.max(...totals) * 1.18 / 10000) * 10000;
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const bw = innerW / DEBT.length * 0.62;
  const step = innerW / DEBT.length;

  return (
    <section className="s s-debt" data-screen-label="05 Debt">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow" style={{ color: "#ff5757" }}>Chapter 04 · The debt story</span>
          <h2>The Interest Bill.</h2>
        </div>

        <div className="debt-callout">
          <span className="big"><CountUp value={TAKA_SECTORS.find(s => s.key === "interest").proposed} decimals={1} prefix="৳" duration={1600} /></span>
          <span className="txt">of every ৳100 in the {BUDGET.proposed} budget goes to paying interest. In FY09, it was less than ৳11.</span>
        </div>

        <div className="debt-chart-wrap glass">
          <div className="debt-chart-head">
            <div>
              <span className="eyebrow" style={{ color: "#ff5757", display: "block" }}>Government interest payments · FY09 — {BUDGET.proposed}</span>
              <span className="cap" style={{ marginTop: 6, display: "block" }}>In Crore Taka</span>
            </div>
            <div className="debt-legend">
              <span className="ll"><span className="sw" style={{ background: "#7a0001" }}></span>Domestic</span>
              <span className="ll"><span className="sw" style={{ background: "#ff5757" }}></span>Foreign</span>
            </div>
          </div>

          <div className="chart-scroll">
            <svg viewBox={"0 0 " + W + " " + H} className="debt-svg" preserveAspectRatio="none">
              <defs>
                <linearGradient id="domGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#a00103" />
                  <stop offset="100%" stopColor="#4a0002" />
                </linearGradient>
                <linearGradient id="forGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#ff7676" />
                  <stop offset="100%" stopColor="#c63131" />
                </linearGradient>
              </defs>

              {/* y gridlines */}
              {[0, 0.25, 0.5, 0.75, 1.0].map(g => {
                const v = g * maxV;
                const y = pad.t + (1 - g) * innerH;
                return (
                  <g key={g}>
                    <line className="tick" x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke="rgba(255,255,255,0.06)" />
                    <text className="tick-label" x={pad.l - 10} y={y + 3} textAnchor="end">৳{(v / 1000) | 0}k Cr</text>
                  </g>
                );
              })}

              {DEBT.map((d, i) => {
                const x = pad.l + i * step + (step - bw) / 2;
                const total = d.d + d.f;
                const totalH = (total / maxV) * innerH;
                const domH = (d.d / maxV) * innerH;
                const forH = (d.f / maxV) * innerH;
                const isLast = i === DEBT.length - 1;
                const stMeta = STATUS_META[BUDGET.statusOf(d.fy)];
                const isPeak = total === Math.max(...totals);
                const delay = i * 60;
                return (
                  <g key={d.fy}>
                    <AnimatedRect x={x} y={pad.t + innerH - domH} width={bw} height={domH} fill="url(#domGrad)" rx="2" duration={1100} delay={delay} />
                    <AnimatedRect x={x} y={pad.t + innerH - totalH} width={bw} height={forH} fill="url(#forGrad)" rx="2" duration={1100} delay={delay + 80} />
                    <text x={x + bw / 2} y={H - 20} textAnchor="middle" className="tick-label">{d.fy}</text>
                    {isLast && (
                      <g>
                        <text x={x + bw / 2} y={pad.t + innerH - totalH - 14} textAnchor="middle"
                          style={{ fontFamily: "var(--serif)", fontSize: 18, fill: "#fff" }}>৳{(total / 1000).toFixed(1)}k Cr</text>
                        <text x={x + bw / 2} y={pad.t + innerH - totalH - 34} textAnchor="middle"
                          className={"fy-tag-text " + (stMeta ? stMeta.cls : "")}
                          style={{ fontFamily: "var(--ui)", fontSize: 10, letterSpacing: "0.16em", fill: stMeta && stMeta.cls === "fy-proposed" ? undefined : "#ff7676" }}>{d.fy} · {stMeta ? stMeta.word.toUpperCase() : ""}</text>
                      </g>
                    )}
                    {!isLast && BUDGET.statusOf(d.fy) === "revised" && (
                      <text x={x + bw / 2} y={pad.t + innerH - totalH - 12} textAnchor="middle"
                        className="fy-tag-text fy-revised"
                        style={{ fontFamily: "var(--ui)", fontSize: 9, letterSpacing: "0.14em" }}>REVISED</text>
                    )}
                    {isPeak && !isLast && (
                      <text x={x + bw / 2} y={pad.t + innerH - totalH - 10} textAnchor="middle"
                        style={{ fontFamily: "var(--ui)", fontSize: 10, fill: "rgba(255,118,118,0.7)", letterSpacing: "0.12em" }}>৳{(total / 1000).toFixed(0)}k</text>
                    )}
                  </g>
                );
              })}

              {/* arrow callout FY18 spike */}
              <g>
                <line x1={pad.l + 9 * step + step / 2} y1={pad.t + 110} x2={pad.l + 9 * step + step / 2} y2={pad.t + 150} stroke="#ff7676" strokeDasharray="3 3" strokeWidth="1" />
                <text x={pad.l + 9 * step + step / 2} y={pad.t + 102} textAnchor="middle"
                  style={{ fontFamily: "var(--ui)", fontSize: 10, fill: "#ff7676", letterSpacing: "0.12em" }}>FOREIGN DEBT 2x</text>
              </g>
            </svg>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginTop: 32, paddingTop: 28, borderTop: "1px solid rgba(198,0,1,0.18)" }}>
            <Stat label={"Domestic, FY09 → " + BUDGET.proposed} big="10.0×" sub="৳13.8k → ৳138k Cr" />
            <Stat label={"Foreign, FY09 → " + BUDGET.proposed} big="14.2×" sub="৳1.3k → ৳19k Cr" />
            <Stat label={BUDGET.proposed + " share of every ৳100"} big={"৳" + TAKA_SECTORS.find(s => s.key === "interest").proposed} sub="up from ৳11.4 in FY22" />
          </div>
        </div>

        <RelevantNews items={RELEVANT_NEWS.debt} accent="#ff5757" />
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
      <div style={{ fontFamily: "var(--serif)", fontSize: 36, color: "#ff7676", lineHeight: 1 }}>
        {num !== null
          ? <CountUp value={num} decimals={decimals} prefix={prefix} suffix={suffix} duration={1300} />
          : big}
      </div>
      <div style={{ fontFamily: "var(--ui)", fontSize: 12, color: "#8B939F", marginTop: 6 }}>{sub}</div>
    </div>
  );
}

/* ============================================================
   NEWS FEED
============================================================ */
function NewsSection() {
  return (
    <section className="s s-news" data-screen-label="06 News">
      <div className="wrap">
        <div className="section-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", maxWidth: "100%", marginBottom: 48 }}>
          <div>
            <span className="eyebrow">From the newsroom</span>
            <h2 style={{ marginTop: 16 }}>Latest Budget Coverage</h2>
          </div>
          <a style={{ fontFamily: "var(--ui)", fontSize: 13, color: "#6fc7ee", letterSpacing: "0.04em", borderBottom: "1px solid #6fc7ee", paddingBottom: 4, cursor: "pointer" }}>All Budget {BUDGET.proposed} stories →</a>
        </div>

        <div className="news-grid">
          {NEWS.map((n, i) => (
            <article key={i} className="news-card glass">
              <div className="news-thumb" style={{ "--c1": n.c1, "--c2": n.c2 }}>
                <div className="news-thumb-shape"></div>
                <div className="news-thumb-shape two"></div>
                <span style={{ fontFamily: "var(--serif)", fontSize: 72, color: "rgba(255,255,255,0.18)", fontStyle: "italic", position: "relative" }}>{i + 1}</span>
              </div>
              <div className="news-body">
                <div className="news-meta">
                  <span className="news-tag" style={{ "--tag": n.tagColor }}>{n.tag}</span>
                  <span className="news-date">{n.date}</span>
                </div>
                <div className="news-headline">{n.headline}</div>
                <div className="news-dek">{n.dek}</div>
                <div className="news-author">
                  <span>By {n.author}</span>
                  <span>{n.read}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   FOOTER
============================================================ */
function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="foot-top">
          <div className="foot-brand">
            <img src="assets/logo.svg" alt="The Daily Star" />
            <p>Budget at a Glance is an editorial visualization project from the Digital team — making fiscal policy legible, year on year.</p>
          </div>
          <div className="foot">
            <h4>Pages</h4>
            <ul><li>Home</li><li>Price Impact</li><li>Sector Deep Dive</li><li>Methodology</li></ul>
          </div>
          <div className="foot">
            <h4>Sources</h4>
            <ul><li>Ministry of Finance</li><li>Bangladesh Bureau of Statistics</li><li>Bangladesh Bank</li><li>Full budget document (PDF)</li></ul>
          </div>
          <div className="foot">
            <h4>Previous editions</h4>
            <ul>
              {[1, 2, 3].map(n => (
                <li key={n}>Budget FY{String(fyToYear(BUDGET.proposed) - n).slice(-2)}</li>
              ))}
              <li>Archive 2009 — 2022</li>
            </ul>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© 2026 The Daily Star · Data via Ministry of Finance, Bangladesh</span>
          <span>Designed & engineered by The Daily Star Digital Team</span>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, { Treemap, DebtSection, NewsSection, Footer });
