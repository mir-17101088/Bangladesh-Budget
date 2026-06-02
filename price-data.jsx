const { useState: useStatePrice, useMemo: useMemoPrice } = React;

/* ============================================================
   PRICE IMPACT — data
============================================================ */
const PRICIER = [
  { name: "Cigarettes",         sub: "Supplementary duty",   icon: "smoke", duty: "+15% supplementary duty on premium tier", badge: "↑ 20%", spark: "Tier-3 retail: ৳165 → ৳198" },
  { name: "Imported Smartphones", sub: "Customs duty",       icon: "phone", duty: "+10% customs duty on units priced over ৳40,000", badge: "↑ 8–12%", spark: "Affects 60% of imported units" },
  { name: "Luxury Cars (>2000cc)", sub: "Customs duty",      icon: "car",   duty: "+15% supplementary duty; 250% total tax band", badge: "↑ 10–15%", spark: "Hits ~6,400 imports/yr" },
  { name: "Processed Food",     sub: "VAT",                  icon: "snack", duty: "+5% VAT on packaged snacks and confectionery", badge: "↑ 5–7%", spark: "Excludes baby food, edible oil" },
  { name: "Soft Drinks",        sub: "Supplementary duty",   icon: "soda",  duty: "+10% supplementary duty on carbonated beverages", badge: "↑ 10%", spark: "Sugar-free variants exempted" },
  { name: "Imported Cosmetics", sub: "Customs duty",         icon: "lip",   duty: "+10% customs duty on retail-pack cosmetics", badge: "↑ 8%", spark: "Local production gets ৳1.2k Cr push" },
];

const CHEAPER = [
  { name: "Local Textiles",       sub: "Source tax",         icon: "shirt", duty: "−5% source tax on RMG-linked fabric sales", badge: "↓ 3–5%", spark: "Saves ৳620 Cr/yr industry-wide" },
  { name: "Agri Machinery",       sub: "Duty exemption",     icon: "tractor", duty: "Full duty waiver on tractors, threshers, harvesters", badge: "↓ 10–15%", spark: "12 categories of equipment" },
  { name: "Solar Panels",         sub: "Duty waiver",        icon: "sun",   duty: "Complete customs + VAT waiver on PV modules", badge: "↓ 15–20%", spark: "Aligns with 30% renewable target" },
  { name: "Essential Medicines",  sub: "VAT reduction",      icon: "pill",  duty: "VAT cut from 5% to 0% on 32 essential drugs", badge: "↓ 5–8%", spark: "Hits insulin, paracetamol, antibiotics" },
  { name: "School Supplies",      sub: "Tax reduction",      icon: "book",  duty: "Reduced AIT on notebooks, pens, geometry kits", badge: "↓ 5%", spark: "Effective from Jul 2025" },
  { name: "Raw Materials (Steel)", sub: "Customs duty",      icon: "bar",   duty: "−5% customs on billet imports for re-rolling mills", badge: "↓ 3–5%", spark: "Construction sector boost" },
];

const TAX_REVENUE = [
  { name: "VAT",          pct: 37, amt: "৳1,68,000 Cr", color: "#0185C6" },
  { name: "Income Tax",   pct: 30, amt: "৳1,36,200 Cr", color: "#7D0066" },
  { name: "Customs",      pct: 15, amt: "৳68,100 Cr",   color: "#B0832B" },
  { name: "Excise",       pct: 8,  amt: "৳36,300 Cr",   color: "#019933" },
  { name: "Other NBR",    pct: 6,  amt: "৳27,200 Cr",   color: "#45B7D1" },
  { name: "Non-NBR",      pct: 4,  amt: "৳18,200 Cr",   color: "#FF6B35" },
];

const SUBSIDY = [
  { fy: "FY22", v: 5.8, future: false },
  { fy: "FY23", v: 8.4, future: false, delta: "+45%" },
  { fy: "FY24", v: 8.4, future: false, delta: "flat" },
  { fy: "FY25", v: 11.0, future: false, delta: "+31%" },
  { fy: "FY26", v: 11.5, future: true },
];

const HOUSEHOLD = [
  { name: "Housing & rent",   pct: 28, color: "#0185C6" },
  { name: "Food & groceries", pct: 25, color: "#019933" },
  { name: "Transport",        pct: 12, color: "#B0832B" },
  { name: "Utilities",        pct: 10, color: "#FF6B35" },
  { name: "Education",        pct: 9,  color: "#7D0066" },
  { name: "Healthcare",       pct: 7,  color: "#4ECDC4" },
  { name: "Tax & VAT",        pct: 6,  color: "#C60001" },
  { name: "Savings",          pct: 3,  color: "#96CEB4" },
];

/* ============================================================
   PAGE HERO
============================================================ */
function PriceHero() {
  return (
    <section className="page-hero" data-screen-label="01 Page Hero">
      <div className="wrap">
        <div className="crumb">
          <span>Budget at a Glance</span><span style={{ color: "var(--g7)"}}>·</span><b>Chapter 02</b>
        </div>
        <h1>What gets pricier, <em>what gets cheaper</em>.</h1>
        <p className="dek">
          Every fiscal year rewrites a household's monthly bill. Here are the line items that
          FY26 raises and lowers — and a calculator to estimate where your own ৳100 goes.
        </p>
        <div className="page-hero-stats">
          <div className="phs-cell red">
            <div className="l">Items pricier</div>
            <div className="n"><CountUp value={6}/></div>
            <div className="s">duties up · supplementary, VAT, customs</div>
          </div>
          <div className="phs-cell green">
            <div className="l">Items cheaper</div>
            <div className="n"><CountUp value={6}/></div>
            <div className="s">duty cuts · exemptions · waivers</div>
          </div>
          <div className="phs-cell">
            <div className="l">Tax revenue target</div>
            <div className="n">৳<CountUp value={4.54} decimals={2}/>L Cr</div>
            <div className="s">NBR + non-NBR · 57% of budget</div>
          </div>
          <div className="phs-cell">
            <div className="l">Subsidy bill</div>
            <div className="n">৳<CountUp value={11.5} decimals={1}/></div>
            <div className="s">per ৳100 spent · 2× since FY22</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   ITEM ICONS — simple sealed glyphs
============================================================ */
function ItemIcon({ kind, color }) {
  const c = color || "currentColor";
  const props = { width: 28, height: 28, viewBox: "0 0 24 24", fill: "none", stroke: c, strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (kind) {
    case "smoke":   return <svg {...props}><rect x="3" y="11" width="14" height="4" rx="0.5"/><path d="M17 11h2v4h-2"/><path d="M5 8c0-2 2-2 2-4M9 8c0-2 2-2 2-4"/></svg>;
    case "phone":   return <svg {...props}><rect x="6" y="3" width="12" height="18" rx="2"/><circle cx="12" cy="18" r="0.6" fill={c}/></svg>;
    case "car":     return <svg {...props}><path d="M3 14h18l-2-5H5l-2 5z"/><path d="M3 14v4M21 14v4"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/></svg>;
    case "snack":   return <svg {...props}><path d="M5 7h14l-1.5 12h-11L5 7z"/><path d="M9 11v5M12 11v5M15 11v5"/></svg>;
    case "soda":    return <svg {...props}><path d="M7 4h10l-1 16H8L7 4z"/><path d="M8 8h8M10 4V2M14 4V2"/></svg>;
    case "lip":     return <svg {...props}><path d="M7 10c1-3 3-3 5-1 2-2 4-2 5 1l-2 8H9l-2-8z"/><path d="M11 14h2"/></svg>;
    case "shirt":   return <svg {...props}><path d="M7 4l-3 4 2 2v10h12V10l2-2-3-4-3 2c-1 1-3 1-4 0L7 4z"/></svg>;
    case "tractor": return <svg {...props}><circle cx="7" cy="17" r="3"/><circle cx="17" cy="17" r="2"/><path d="M4 13V8h7l2 4h6v5"/><path d="M11 8V5h3"/></svg>;
    case "sun":     return <svg {...props}><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"/></svg>;
    case "pill":    return <svg {...props}><rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-25 12 12)"/><path d="M9 8l4 8" transform="rotate(-25 12 12)"/></svg>;
    case "book":    return <svg {...props}><path d="M4 4h7v16H4z"/><path d="M11 4h9v16h-9"/><path d="M11 8h6M11 12h6"/></svg>;
    case "bar":     return <svg {...props}><rect x="3" y="10" width="18" height="4" rx="0.5"/><path d="M6 10V8M10 10V8M14 10V8M18 10V8"/></svg>;
    default: return null;
  }
}

/* ============================================================
   PRICIER + CHEAPER sections
============================================================ */
function ItemSection({ kind, items }) {
  const up = kind === "up";
  const PREVIEW = 6;
  const [expanded, setExpanded] = React.useState(false);
  const hasMore = items.length > PREVIEW;
  const visible = !hasMore || expanded ? items : items.slice(0, PREVIEW);
  const accent = up ? "#ff7676" : "#5fe093";
  return (
    <section className={"s " + (up ? "s-pricier" : "s-cheaper")} data-screen-label={(up ? "02" : "03") + " " + (up ? "Pricier" : "Cheaper")}>
      <div className="wrap">
        <div className="titleblock">
          <div className={"arrow " + (up ? "up" : "down")}>
            {up ? "↑" : "↓"}
          </div>
          <div className="text">
            <span className="eyebrow" style={{ color: accent }}>
              {up ? "Chapter 02 · Up the slope" : "Chapter 03 · Down the slope"}
            </span>
            <h2>
              What got {up ? <span className="acc-red">pricier</span> : <span className="acc-grn">cheaper</span>}.
            </h2>
            <p className="dek">
              {up
                ? "Six items in the FY26 schedule now carry heavier duties — most absorbed by importers and retailers, the rest passed through to shelf prices within weeks."
                : "Six categories see reduced duties or full waivers — designed to support local industry, agriculture, renewable energy, and essential consumption."}
            </p>
          </div>
        </div>

        <div className="item-grid">
          {visible.map((it, i) => (
            <article key={i} className={"item-card " + (up ? "up" : "down")}>
              <div className="item-icon"><ItemIcon kind={it.icon} color={accent}/></div>
              <div className="item-name">{it.name}</div>
              <div className="item-sub">{it.sub}</div>
              <div className="item-duty">{it.duty}</div>
              <div className="item-foot">
                <span className={"item-badge " + (up ? "up" : "down")}>{it.badge}</span>
                <span className="item-spark">{it.spark}</span>
              </div>
            </article>
          ))}
        </div>

        {hasMore && (
          <div className="see-more-wrap">
            <button
              className={"see-more " + (up ? "up" : "down")}
              onClick={() => setExpanded(v => !v)}
              aria-expanded={expanded}>
              <span className="see-more-label">
                {expanded
                  ? "Show fewer items"
                  : "Show " + (items.length - PREVIEW) + " more item" + (items.length - PREVIEW === 1 ? "" : "s")}
              </span>
              <span className={"see-more-chev " + (expanded ? "up" : "")}>↓</span>
            </button>
          </div>
        )}

        <RelevantNews items={RELEVANT_NEWS[up ? "price_pricier" : "price_cheaper"]} accent={accent} />
      </div>
    </section>
  );
}

Object.assign(window, { PRICIER, CHEAPER, TAX_REVENUE, SUBSIDY, HOUSEHOLD, PriceHero, ItemSection, ItemIcon });
