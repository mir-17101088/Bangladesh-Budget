/* ============================================================
   relevant-news.jsx
   ------------------------------------------------------------
   A per-section "Relevant News" container.

   ▶ HOW TO ADD ARTICLES
     Each section below (taka / gdp / treemap / debt) holds an
     ARRAY of articles. Add an object with a `url` and the box
     appears under that section. Leave the array empty ( [] )
     and the box stays hidden — nothing renders.

       taka: [
         { url: "https://www.thedailystar.net/....." },
       ],

   ▶ CAN THE TITLE / IMAGE BE FETCHED FROM THE LINK?
     Partly. A static site (no server) cannot reliably read an
     arbitrary news page because browsers block cross-site reads
     (CORS). To still offer "just paste a link", each card calls a
     free link-preview service (microlink.io) that returns the
     article's Open-Graph title, image, publisher and date.

       • If you give ONLY a url  → it auto-fetches title+image.
       • Anything you type by hand ALWAYS wins over the fetch.

     The auto-fetch is best-effort: the free tier is rate-limited
     (~50/day) and a few sites block it. For a published page the
     safest, instant, offline-proof option is to fill the fields
     in yourself:

       { url:    "https://…",
         title:  "What the FY2027 budget must prioritise",
         kicker: "Macro Mirror",            // small label above title
         source: "The Daily Star",
         date:   "Jun 1, 2026",
         image:  "https://…/photo.jpg" }    // optional cover image

   Clicking a card opens the real article in a new tab.
============================================================ */

const { useState: useRN, useEffect: useRNE } = React;

const NEWS_API_URLS = ["/api/news", "/api/news.php"]; // Try both endpoints

async function fetchRelevantNewsAPI() {
  for (const url of NEWS_API_URLS) {
    try {
      const r = await fetch(url, { headers: { Accept: "application/json" } });
      console.log(`[relevant-news] ${url} status:`, r.status);
      if (r.ok) {
        const text = await r.text();
        try {
          const j = JSON.parse(text);
          if (j && j.data) return j.data;
          console.log(`[relevant-news] ${url} ok but no .data:`, j);
        } catch (pe) {
          console.log(`[relevant-news] ${url} JSON parse error, response was:`, text.slice(0, 200));
        }
      }
    } catch (e) {
      console.log(`[relevant-news] ${url} fetch error:`, e.message);
    }
  }
  return [];
}

const RELEVANT_NEWS = {
  // Fallback: replaced at runtime when API data loads successfully.
  taka: [
    {
      url: "https://www.thedailystar.net/opinion/views/macro-mirror/news/what-the-fy2027-budget-must-prioritise-4188416",
      title: "What the FY2027 budget must prioritise",
      kicker: "Macro Mirror",
      source: "The Daily Star",
      date: "Jun 2, 2026",
      image: "news-images/budget_planning.jpg",
    },
    {
      url: "https://www.thedailystar.net/business/bangladesh-budget-2026-27/news/bangladeshs-budget-really-too-big-4189171",
      title: "Is Bangladesh's budget really too big?",
      kicker: "Bangladesh Budget 2026-27",
      source: "The Daily Star",
      date: "Jun 3, 2026",
      image: "news-images/good_budget.jpg",
    },
    {
      url: "https://www.thedailystar.net/business/economy/news/big-numbers-tight-choices-4177311",
      title: "Big in numbers, tight in choices",
      kicker: "Budget Special",
      source: "The Daily Star",
      date: "May 17, 2026",
      image: "news-images/budget.jpg",
    },
  ],
  gdp: [],
  treemap: [],
  debt: [],

  price_pricier: [],
  price_cheaper: [],
  price_tax: [],
  price_subsidy: [],
  price_calc: [],

  sector_grid: [],
  sector_heatmap: [],
  sector_rankings: [],
  sector_gauges: [],
};

function mapApiNewsItem(n) {
  return {
    url: n.link_url || "",
    title: n.title || "",
    kicker: n.subcategory || null,
    source: n.provider || "The Daily Star",
    date: n.created || null,
    image: n.image_landscape || n.image_url || null,
  };
}

function applyApiNewsToSections(rawList) {
  const items = (Array.isArray(rawList) ? rawList : [])
    .map(mapApiNewsItem)
    .filter((x) => x.url);

  if (items.length === 0) return;

  const buckets = {
    taka: items.slice(0, 3),          // first 3
    gdp: items.slice(3, 4),           // then 1
    debt: items.slice(4, 5),          // then 1
    sector_gauges: items.slice(5, 6), // last 1
  };

  Object.keys(buckets).forEach((k) => {
    if (!RELEVANT_NEWS[k]) return;
    RELEVANT_NEWS[k].splice(0, RELEVANT_NEWS[k].length, ...buckets[k]);
  });

  window.dispatchEvent(new Event("relevant-news:updated"));
}

function loadRelevantNews() {
  console.log("[relevant-news] loadRelevantNews() called");
  fetchRelevantNewsAPI()
    .then((list) => {
      console.log("[relevant-news] API response items:", list.length);
      applyApiNewsToSections(list);
    })
    .catch((e) => {
      console.error("[relevant-news] fetch error:", e);
    });
}

// Force immediate execution
(function() {
  if (typeof window !== 'undefined') {
    console.log("[relevant-news] module loaded, calling loadRelevantNews");
    loadRelevantNews();
  }
})();

/* ── helpers ─────────────────────────────────────────────── */
const RELNEWS_CACHE = new Map();

/* Where your local article images live. Drop image files into this
   folder and, in the article entry, set  image: "my-photo.jpg"
   (just the file name) — it resolves to news-images/my-photo.jpg.
   A full https:// URL or a path that already contains "/" is used as-is. */
const NEWS_IMAGE_BASE = "news-images/";

function relnewsResolveImage(img) {
  if (!img) return null;
  if (/^(https?:)?\/\//.test(img) || img.startsWith("/") || img.startsWith("data:")) return img; // absolute URL / root path
  if (img.includes("/")) return img;            // caller already gave a path
  return NEWS_IMAGE_BASE + img;                  // bare file name → images folder
}

function relnewsHost(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); }
  catch { return (url || "").replace(/^https?:\/\//, "").split("/")[0]; }
}
function relnewsTitleFromUrl(url) {
  try {
    const slug = new URL(url).pathname.split("/").filter(Boolean).pop() || "";
    return decodeURIComponent(slug)
      .replace(/-\d+$/, "")
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, c => c.toUpperCase());
  } catch { return url; }
}
function relnewsFormatDate(d) {
  if (!d) return null;
  const t = Date.parse(d);
  if (isNaN(t)) return d; // already human-readable — pass through
  return new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* Best-effort link preview. Manual fields always take precedence;
   anything missing is filled from microlink.io when reachable. */
function useLinkPreview(item) {
  const seed = {
    title: item.title || relnewsTitleFromUrl(item.url),
    image: item.image || null,
    source: item.source || relnewsHost(item.url),
    date: item.date || null,
    kicker: item.kicker || null,
  };
  const needFetch = !item.title || !item.image || !item.date;
  const [data, setData] = useRN(seed);
  // only show a skeleton when we have literally nothing to print yet
  const [loading, setLoading] = useRN(needFetch && !item.title);

  useRNE(() => {
    if (!needFetch) return;
    let alive = true;

    const apply = (f) => {
      setData({
        title: item.title || f.title || relnewsTitleFromUrl(item.url),
        image: item.image || f.image || null,
        source: item.source || f.source || relnewsHost(item.url),
        date: item.date || f.date || null,
        kicker: item.kicker || f.kicker || null,
      });
      setLoading(false);
    };

    if (RELNEWS_CACHE.has(item.url)) { apply(RELNEWS_CACHE.get(item.url)); return; }

    fetch("https://api.microlink.io/?url=" + encodeURIComponent(item.url))
      .then(r => r.json())
      .then(j => {
        if (!alive) return;
        const md = (j && j.data) || {};
        const f = {
          title: md.title || null,
          image: (md.image && md.image.url) || (md.logo && md.logo.url) || null,
          source: md.publisher || null,
          date: md.date || null,
          kicker: null,
        };
        RELNEWS_CACHE.set(item.url, f);
        apply(f);
      })
      .catch(() => { if (alive) setLoading(false); });

    return () => { alive = false; };
  }, [item.url]);

  return { ...data, loading };
}

/* ── single article card ─────────────────────────────────── */
function RelNewsCard({ item, accent }) {
  const p = useLinkPreview(item);
  const host = relnewsHost(item.url);
  const date = relnewsFormatDate(p.date);
  const [imgOk, setImgOk] = useRN(true);
  const imgSrc = relnewsResolveImage(p.image);
  const showImg = imgSrc && imgOk;

  return (
    <a
      className="relnews-card"
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ "--accent": accent }}
    >
      <div className={"relnews-thumb" + (showImg ? " has-img" : "")}>
        {showImg
          ? <img src={imgSrc} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setImgOk(false)} />
          : (<><span className="relnews-thumb-glyph">৳</span>
            <span className="relnews-thumb-ring"></span></>)}
        <span className="relnews-ext" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7M9 7h8v8" /></svg>
        </span>
      </div>
      <div className="relnews-body">
        <div className="relnews-meta">
          <span className="relnews-source">{p.kicker || p.source || host}</span>
          {date && <><span className="relnews-dot"></span><span className="relnews-date">{date}</span></>}
        </div>
        {p.loading
          ? <div className="relnews-title"><span className="relnews-skel w90"></span><span className="relnews-skel w60"></span></div>
          : <div className="relnews-title">{p.title}</div>}
        <div className="relnews-foot">
          <span className="relnews-host">{host}</span>
          <span className="relnews-read">Read article →</span>
        </div>
      </div>
    </a>
  );
}

/* ── container — renders nothing when empty ──────────────── */

function RelevantNews({ items, accent = "#0185C6", label = "Read more" }) {
  const [, force] = useRN(0);

  useRNE(() => {
    const onUpdate = () => force((v) => v + 1);
    window.addEventListener("relevant-news:updated", onUpdate);
    return () => window.removeEventListener("relevant-news:updated", onUpdate);
  }, []);

  if (!items || items.length === 0) return null;
  const one = items.length === 1;
  return (
    <div className={"relnews" + (one ? " one" : "")} style={{ "--accent": accent }}>
      <div className="relnews-head">
        <span className="relnews-kicker">
          <span className="relnews-bar"></span>
          {label}
        </span>
        <span className="relnews-count">{items.length} {items.length === 1 ? "article" : "articles"}</span>
      </div>
      <div className="relnews-grid">
        {items.map((it, i) => <RelNewsCard key={(it.url || "") + i} item={it} accent={accent} />)}
      </div>
    </div>
  );
}

Object.assign(window, { RELEVANT_NEWS, RelevantNews });
