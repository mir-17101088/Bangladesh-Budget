const { useState: useStateSec, useMemo: useMemoSec } = React;

/* ============================================================
   SECTOR DEEP DIVE — DATA
   ------------------------------------------------------------
   EDIT THIS FILE to update the per-year totals.
   Each sector has a `values` map keyed by fiscal year FY09-FY26.
   FY23-FY26 are mock projections — replace as actuals are released.
============================================================ */

// Master fiscal-year range used by every chart on this page.
const FY_YEARS = [
  "FY09","FY10","FY11","FY12","FY13","FY14","FY15",
  "FY16","FY17","FY18","FY19","FY20","FY21","FY22",
  // ── projected / mock ──
  "FY23","FY24","FY25","FY26"
];

// ──────────────────────────────────────────────────────────────────────
// Per-sector annual totals in Crore Taka.
// To edit a single year's value, change the number under the matching FY key.
// ──────────────────────────────────────────────────────────────────────
const SECTOR_VALUES = {
  interest: {
    color: "#C60001", parent: "Interest",
    FY09:  15180, FY10:  19174, FY11:  23235, FY12:  31470, FY13:  43513, FY14:  41048,
    FY15:  55692, FY16:  53494, FY17:  50507, FY18:  63484, FY19:  72442, FY20:  88254,
    FY21:  78506, FY22: 105845,
    // mock — edit
    FY23: 121675, FY24: 146485, FY25: 166799, FY26: 157000,
  },
  publicsvc: {
    color: "#997B50", parent: "Public Services",
    FY09:   6881, FY10:   9544, FY11:  12886, FY12:  15399, FY13:  14085, FY14:  18769,
    FY15:  26112, FY16:  34492, FY17:  47380, FY18:  60577, FY19:  81008, FY20:  90429,
    FY21: 120932, FY22: 115001,
    // mock — edit
    FY23: 106086, FY24: 122814, FY25: 115369, FY26: 158400,
  },
  education: {
    color: "#0185C6", parent: "Education",
    FY09:  12098, FY10:  11113, FY11:  10661, FY12:  14629, FY13:  13747, FY14:  12785,
    FY15:  16441, FY16:  21196, FY17:  20709, FY18:  28773, FY19:  40667, FY20:  57014,
    FY21:  67836, FY22:  61337,
    // mock — edit
    FY23:  83228, FY24:  75564, FY25:  71723, FY26: 100600,
  },
  transport: {
    color: "#B0832B", parent: "Transport",
    FY09:   4205, FY10:   3894, FY11:   5535, FY12:   6529, FY13:   7526, FY14:   8601,
    FY15:  12133, FY16:  14022, FY17:  19657, FY18:  18141, FY19:  25105, FY20:  22772,
    FY21:  28763, FY22:  34487,
    // mock — edit
    FY23:  48262, FY24:  65468, FY25:  86659, FY26:  79100,
  },
  agri: {
    color: "#019933", parent: "Agriculture",
    FY09:   9557, FY10:  12712, FY11:  11164, FY12:  10331, FY13:  14167, FY14:  13617,
    FY15:  12067, FY16:  11862, FY17:  14193, FY18:  17723, FY19:  20661, FY20:  20035,
    FY21:  19717, FY22:  18426,
    // mock — edit
    FY23:  26346, FY24:  36492, FY25:  46912, FY26:  56200,
  },
  localgov: {
    color: "#96CEB4", parent: "Local Govt",
    FY09:   6897, FY10:   9490, FY11:  12890, FY12:  11697, FY13:  14040, FY14:  13792,
    FY15:  12481, FY16:  15615, FY17:  14655, FY18:  13236, FY19:  19064, FY20:  25586,
    FY21:  33616, FY22:  32241,
    // mock — edit
    FY23:  43000, FY24:  38378, FY25:  37892, FY26:  48600,
  },
  social: {
    color: "#45B7D1", parent: "Social Security",
    FY09:   7885, FY10:   7293, FY11:   7195, FY12:   9388, FY13:   9054, FY14:  11650,
    FY15:  14845, FY16:  19732, FY17:  24351, FY18:  23676, FY19:  33444, FY20:  43149,
    FY21:  39575, FY22:  39051,
    // mock — edit
    FY23:  58066, FY24:  55815, FY25:  53349, FY26:  51200,
  },
  defence: {
    color: "#7D0066", parent: "Defence",
    FY09:   6260, FY10:   7323, FY11:  10143, FY12:  13806, FY13:  15641, FY14:  21760,
    FY15:  27734, FY16:  33340, FY17:  45981, FY18:  41625, FY19:  38008, FY20:  45043,
    FY21:  55000, FY22:  51594,
    // mock — edit
    FY23:  58984, FY24:  51224, FY25:  48523, FY26:  42100,
  },
  energy: {
    color: "#FF6B35", parent: "Energy",
    FY09:   2550, FY10:   2541, FY11:   3486, FY12:   4199, FY13:   4199, FY14:   5754,
    FY15:   8522, FY16:   8495, FY17:  11247, FY18:  16377, FY19:  15281, FY20:  14983,
    FY21:  21122, FY22:  20679,
    // mock — edit
    FY23:  27414, FY24:  40109, FY25:  39501, FY26:  36900,
  },
  order: {
    color: "#FFEAA7", parent: "Public Order",
    FY09:   5684, FY10:   5180, FY11:   6767, FY12:   6611, FY13:   6410, FY14:   5760,
    FY15:   6885, FY16:   9705, FY17:   8565, FY18:  11575, FY19:  10714, FY20:  14527,
    FY21:  13572, FY22:  12227,
    // mock — edit
    FY23:  16850, FY24:  20083, FY25:  24967, FY26:  32800,
  },
  health: {
    color: "#4ECDC4", parent: "Health",
    FY09:   5104, FY10:   5029, FY11:   4878, FY12:   4855, FY13:   6348, FY14:   9265,
    FY15:   8888, FY16:   8573, FY17:  10355, FY18:   9358, FY19:   8613, FY20:  10709,
    FY21:   9836, FY22:  12955,
    // mock — edit
    FY23:  12573, FY24:  18094, FY25:  21062, FY26:  29900,
  },
  housing: {
    color: "#A8E6CF", parent: "Housing",
    FY09:   1373, FY10:   1604, FY11:   1868, FY12:   1777, FY13:   2345, FY14:   2207,
    FY15:   2902, FY16:   2879, FY17:   2761, FY18:   3697, FY19:   4234, FY20:   5566,
    FY21:   4881, FY22:   4557,
    // mock — edit
    FY23:   5195, FY24:   7487, FY25:  10778, FY26:  10400,
  },
  rec: {
    color: "#DDA0DD", parent: "Recreation",
    FY09:    924, FY10:    916, FY11:    906, FY12:   1097, FY13:   1430, FY14:   2021,
    FY15:   2440, FY16:   2342, FY17:   3307, FY18:   4625, FY19:   6730, FY20:   6426,
    FY21:   6191, FY22:   7775,
    // mock — edit
    FY23:   9705, FY24:   9680, FY25:   9317, FY26:   8700,
  },
  industry: {
    color: "#FF8C94", parent: "Industry",
    FY09:    849, FY10:    853, FY11:    901, FY12:    860, FY13:    872, FY14:    935,
    FY15:    935, FY16:    892, FY17:   1215, FY18:   1522, FY19:   2277, FY20:   3471,
    FY21:   4936, FY22:   4744,
    // mock — edit
    FY23:   4620, FY24:   4555, FY25:   4508, FY26:   4500,
  },
};

// Display names + ordering
const SECTOR_META = [
  { k: "interest",  name: "Interest" },
  { k: "publicsvc", name: "Public Services" },
  { k: "education", name: "Education & Tech" },
  { k: "transport", name: "Transport" },
  { k: "agri",      name: "Agriculture" },
  { k: "localgov",  name: "Local Govt" },
  { k: "social",    name: "Social Security" },
  { k: "defence",   name: "Defence" },
  { k: "energy",    name: "Fuel & Energy" },
  { k: "order",     name: "Public Order" },
  { k: "health",    name: "Health" },
  { k: "housing",   name: "Housing" },
  { k: "rec",       name: "Recreation" },
  { k: "industry",  name: "Industry" },
];

// Derive the SECTORS array used by every chart on the page.
const SECTORS = SECTOR_META.map(m => {
  const v = SECTOR_VALUES[m.k];
  const fy09 = v.FY09;
  const fy26 = v.FY26;
  const fy22 = v.FY22;
  const series = FY_YEARS.map(fy => v[fy] / fy26); // normalized 0..(>=1)
  return {
    k: m.k, name: m.name, color: v.color, parent: v.parent,
    fy09, fy22, fy26,
    values: v,
    series,
    growth: (fy26 / fy09).toFixed(1) + "×",
    rise: countRises(FY_YEARS.map(fy => v[fy])),
  };
});

function countRises(arr) {
  let c = 0;
  for (let i = 1; i < arr.length; i++) if (arr[i] > arr[i - 1]) c++;
  return c;
}

// Defence stacked sub-sectors (synthesized proportional split for the deep-dive chart)
const DEFENCE_STACK = FY_YEARS.map(fy => {
  const tot = SECTOR_VALUES.defence[fy];
  return { fy, mininstry: Math.round(tot * 0.55), other: Math.round(tot * 0.25), armed: Math.round(tot * 0.20) };
});

// ──────────────────────────────────────────────────────────────────────
// Top 15 departments (FY26 snapshot — edit values directly)
// ──────────────────────────────────────────────────────────────────────
const DEPTS = [
  { name: "Domestic Interest",   amt: 138000, pct: 14.73, parent: "Interest", color: "#C60001" },
  { name: "Finance Division",    amt: 126500, pct: 13.54, parent: "Public Services", color: "#997B50" },
  { name: "LG & Rural Dev",      amt:  64300, pct:  6.88, parent: "Local Govt", color: "#96CEB4" },
  { name: "Agri Ministry",       amt:  54200, pct:  5.80, parent: "Agriculture", color: "#019933" },
  { name: "Roads & Railways",    amt:  51500, pct:  5.51, parent: "Transport", color: "#B0832B" },
  { name: "Min of Education",    amt:  50800, pct:  5.44, parent: "Education", color: "#0185C6" },
  { name: "Defence Ministry",    amt:  49700, pct:  5.32, parent: "Defence", color: "#7D0066" },
  { name: "Power Division",      amt:  42100, pct:  4.51, parent: "Energy", color: "#FF6B35" },
  { name: "Primary & Mass Edu",  amt:  39700, pct:  4.24, parent: "Education", color: "#0185C6" },
  { name: "Home Affairs",        amt:  35400, pct:  3.79, parent: "Public Order", color: "#FFEAA7" },
  { name: "Health Services",     amt:  33800, pct:  3.62, parent: "Health", color: "#4ECDC4" },
  { name: "Social Welfare",      amt:  29900, pct:  3.20, parent: "Social Security", color: "#45B7D1" },
  { name: "Bridges Division",    amt:  19600, pct:  2.10, parent: "Transport", color: "#B0832B" },
  { name: "Disaster Mgmt",       amt:  17700, pct:  1.90, parent: "Social Security", color: "#45B7D1" },
  { name: "Foreign Interest",    amt:  19000, pct:  1.68, parent: "Interest", color: "#C60001" },
];

// ──────────────────────────────────────────────────────────────────────
// Implementation rates (%) FY09 → FY26
// ──────────────────────────────────────────────────────────────────────
const IMPL = [
  { fy: "FY09", v: 88.1 }, { fy: "FY10", v: 89.3 }, { fy: "FY11", v: 97.0 },
  { fy: "FY12", v: 92.4 }, { fy: "FY13", v: 90.8 }, { fy: "FY14", v: 84.6 },
  { fy: "FY15", v: 81.6 }, { fy: "FY16", v: 80.8 }, { fy: "FY17", v: 79.1 },
  { fy: "FY18", v: 80.4 }, { fy: "FY19", v: 84.1 }, { fy: "FY20", v: 80.3 },
  { fy: "FY21", v: 81.0 }, { fy: "FY22", v: 85.8 }, { fy: "FY23", v: 97.4 },
  // ── projected / mock ──
  { fy: "FY24", v: 88.0 }, { fy: "FY25", v: 86.5 }, { fy: "FY26", v: 89.0 },
];

// Rise/fall heatmap pattern derived from real values
function patternFor(_unused, key) {
  const arr = FY_YEARS.map(fy => SECTOR_VALUES[key]?.[fy] ?? 0);
  return arr.slice(1).map((v, i) => v >= arr[i] ? "up" : "dn");
}

Object.assign(window, {
  SECTORS, FY_YEARS, DEFENCE_STACK, DEPTS, IMPL, patternFor, SECTOR_VALUES
});
