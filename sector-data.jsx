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
  "FY09", "FY10", "FY11", "FY12", "FY13", "FY14", "FY15",
  "FY16", "FY17", "FY18", "FY19", "FY20", "FY21", "FY22",
  // ── projected / mock ──
  "FY23", "FY24", "FY25", "FY26",
  "FY27", // ⟶ GO-LIVE FY27 (sector): add FY27:<number> to every SECTOR_VALUES entry + IMPL below
];

// ──────────────────────────────────────────────────────────────────────
// Per-sector annual totals in Crore Taka.
// To edit a single year's value, change the number under the matching FY key.
// ──────────────────────────────────────────────────────────────────────
const SECTOR_VALUES = {
  interest: {
    color: "#C60001", parent: "Interest",
    FY09: 15180, FY10: 14868, FY11: 15623, FY12: 20351, FY13: 23915, FY14: 28205,
    FY15: 30973, FY16: 33114, FY17: 35090, FY18: 41765, FY19: 49461, FY20: 58313,
    FY21: 70606, FY22: 77779,
    // mock — edit
    FY23: 92107, FY24: 114590, FY25: 121500, FY26: 122000, FY27: null,
  },
  publicsvc: {
    color: "#997B50", parent: "Public Services",
    FY09: 6881, FY10: 8250, FY11: 8081, FY12: 11050, FY13: 7948, FY14: 14521,
    FY15: 12288, FY16: 15240, FY17: 31303, FY18: 27862, FY19: 33004, FY20: 39291,
    FY21: 56581, FY22: 75511,
    // mock — edit
    FY23: 89707, FY24: 98662, FY25: 188450, FY26: 186088, FY27: null,
  },
  education: {
    color: "#0185C6", parent: "Education",
    FY09: 12098, FY10: 15904, FY11: 18803, FY12: 19107, FY13: 21284, FY14: 26629,
    FY15: 30290, FY16: 39906, FY17: 48641, FY18: 47572, FY19: 63242, FY20: 65967,
    FY21: 71925, FY22: 77143,
    // mock — edit
    FY23: 75429, FY24: 80290, FY25: 99114, FY26: 110657, FY27: null,
  },
  transport: {
    color: "#B0832B", parent: "Transport",
    FY09: 4205, FY10: 6623, FY11: 7049, FY12: 9455, FY13: 12480, FY14: 14244,
    FY15: 19046, FY16: 24104, FY17: 22899, FY18: 40076, FY19: 37833, FY20: 53743,
    FY21: 50218, FY22: 60200,
    // mock — edit
    FY23: 65047, FY24: 59171, FY25: 60500, FY26: 71344, FY27: null,
  },
  agri: {
    color: "#019933", parent: "Agriculture",
    FY09: 9557, FY10: 11147, FY11: 12957, FY12: 14671, FY13: 19687, FY14: 17277,
    FY15: 15926, FY16: 17877, FY17: 16893, FY18: 19126, FY19: 23600, FY20: 21977,
    FY21: 25759, FY22: 35803,
    // mock — edit
    FY23: 54309, FY24: 53137, FY25: 44568, FY26: 46268, FY27: null,
  },
  localgov: {
    color: "#96CEB4", parent: "Local Govt",
    FY09: 6897, FY10: 8460, FY11: 10206, FY12: 11050, FY13: 14147, FY14: 14466,
    FY15: 17831, FY16: 18593, FY17: 17913, FY18: 21573, FY19: 31491, FY20: 32390,
    FY21: 35484, FY22: 36944,
    // mock — edit
    FY23: 41116, FY24: 44500, FY25: 44770, FY26: 44895, FY27: null,
  },
  social: {
    color: "#45B7D1", parent: "Social Security",
    FY09: 7885, FY10: 6959, FY11: 7728, FY12: 8986, FY13: 10047, FY14: 11229,
    FY15: 11159, FY16: 15322, FY17: 16208, FY18: 18089, FY19: 23921, FY20: 24086,
    FY21: 26938, FY22: 32972,
    // mock — edit
    FY23: 37460, FY24: 39189, FY25: 42312, FY26: 45083, FY27: null,
  },
  defence: {
    color: "#7D0066", parent: "Defence",
    FY09: 6260, FY10: 8759, FY11: 11124, FY12: 12230, FY13: 12021, FY14: 13920,
    FY15: 17490, FY16: 20313, FY17: 23621, FY18: 21146, FY19: 29989, FY20: 34480,
    FY21: 35463, FY22: 35270,
    // mock — edit
    FY23: 31624, FY24: 34848, FY25: 39239, FY26: 40698, FY27: null,
  },
  energy: {
    color: "#FF6B35", parent: "Energy",
    FY09: 2550, FY10: 3469, FY11: 7233, FY12: 7969, FY13: 10280, FY14: 10504,
    FY15: 5894, FY16: 16375, FY17: 14620, FY18: 28562, FY19: 37188, FY20: 33132,
    FY21: 22840, FY22: 22754,
    // mock — edit
    FY23: 27793, FY24: 28376, FY25: 22705, FY26: 22520, FY27: null,
  },
  order: {
    color: "#FFEAA7", parent: "Public Order",
    FY09: 5684, FY10: 6582, FY11: 7815, FY12: 8737, FY13: 9655, FY14: 11759,
    FY15: 13158, FY16: 16452, FY17: 19686, FY18: 22052, FY19: 27022, FY20: 23430,
    FY21: 24414, FY22: 26195,
    // mock — edit
    FY23: 25793, FY24: 28698, FY25: 31711, FY26: 33542, FY27: null,
  },
  health: {
    color: "#4ECDC4", parent: "Health",
    FY09: 5104, FY10: 6271, FY11: 7287, FY12: 7667, FY13: 8549, FY14: 9384,
    FY15: 10417, FY16: 12605, FY17: 6621, FY18: 16839, FY19: 18677, FY20: 17532,
    FY21: 21647, FY22: 25028,
    // mock — edit
    FY23: 22521, FY24: 23726, FY25: 27923, FY26: 41908, FY27: null,
  },
  housing: {
    color: "#A8E6CF", parent: "Housing",
    FY09: 1373, FY10: 1249, FY11: 1325, FY12: 1336, FY13: 1695, FY14: 1965,
    FY15: 3861, FY16: 5005, FY17: 3456, FY18: 6018, FY19: 5496, FY20: 6419,
    FY21: 6935, FY22: 6525,
    // mock — edit
    FY23: 7744, FY24: 6543, FY25: 5382, FY26: 5111, FY27: null,
  },
  rec: {
    color: "#DDA0DD", parent: "Recreation",
    FY09: 924, FY10: 1029, FY11: 1557, FY12: 1473, FY13: 1698, FY14: 1811,
    FY15: 1862, FY16: 2389, FY17: 3240, FY18: 3084, FY19: 4454, FY20: 3757,
    FY21: 3844, FY22: 5137,
    // mock — edit
    FY23: 6751, FY24: 5451, FY25: 5464, FY26: 6540, FY27: null,
  },
  industry: {
    color: "#FF8C94", parent: "Industry",
    FY09: 849, FY10: 946, FY11: 1014, FY12: 1679, FY13: 2811, FY14: 2616,
    FY15: 2929, FY16: 2198, FY17: 2438, FY18: 2677, FY19: 3535, FY20: 3222,
    FY21: 3371, FY22: 3594,
    // mock — edit
    FY23: 3668, FY24: 4080, FY25: 3953, FY26: 4172, FY27: null,
  },
};

// Display names + ordering
const SECTOR_META = [
  { k: "interest", name: "Interest" },
  { k: "publicsvc", name: "Public Services" },
  { k: "education", name: "Education" },
  { k: "transport", name: "Transport" },
  { k: "agri", name: "Agriculture" },
  { k: "localgov", name: "Local Government" },
  { k: "social", name: "Social Security" },
  { k: "defence", name: "Defence" },
  { k: "energy", name: "Energy" },
  { k: "order", name: "Public Order" },
  { k: "health", name: "Health" },
  { k: "housing", name: "Housing" },
  { k: "rec", name: "Recreation & Culture" },
  { k: "industry", name: "Industry" },
];

// Years that have data across EVERY sector (drops the FY27 placeholder until filled).
const SECTOR_YEARS = FY_YEARS.filter(fy => Object.values(SECTOR_VALUES).every(v => typeof v[fy] === "number"));
const SECTOR_PROP = BUDGET.proposed;   // shared global state from app-data.jsx

// Derive the SECTORS array used by every chart on the page.
const SECTORS = SECTOR_META.map(m => {
  const v = SECTOR_VALUES[m.k];
  const valueAt = (fy) => v[fy];
  const propVal = v[SECTOR_PROP];
  const series = SECTOR_YEARS.map(fy => v[fy] / propVal); // normalized 0..(>=1) by proposed year
  return {
    k: m.k, name: m.name, color: v.color, parent: v.parent,
    fy09: v.FY09, fy22: v.FY22,
    values: v, valueAt,
    proposed: propVal,
    revised: v[BUDGET.revised],
    actual: v[BUDGET.actual],
    fy26: propVal, // alias: headline/proposed value — sector components read it widely
    series,
    growth: (propVal / v.FY09).toFixed(1) + "×",
    rise: 0, // Computed below using GDP_SECTOR_DATA
  };
});

function countRises(arr) {
  let c = 0;
  for (let i = 1; i < arr.length; i++) if (arr[i] > arr[i - 1]) c++;
  return c;
}

// ──────────────────────────────────────────────────────────────────────
// SUB-SECTOR BREAKDOWN DATA — parsed from CSV files in data/
// Each sector key maps to { names: string[], colors: string[], data: { [FY]: number[] } }
// FY09→FY24 are actuals. FY25/FY26 are HARDCODED estimates below (frozen from
// FY24's shape, scaled to each sector's total) — edit freely; nothing overwrites them.
// ⟶ GO-LIVE FY27 (sub-sectors): optional. Once SECTOR_VALUES.FY27 is set, the
//   Absolute view auto-fills FY27 from the latest known shape. To use real
//   figures, add `FY27: [...]` (same order/length as FY24) to a sector's `data`.
// ──────────────────────────────────────────────────────────────────────

function _parseNum(s) {
  if (s == null || s === "") return 0;
  return parseInt(String(s).replace(/,/g, "").replace(/"/g, "").trim(), 10) || 0;
}

const SUB_SECTOR_RAW = {
  defence: {
    names: ["Defence Ministry", "Other Services", "Armed Forces Division"],
    colors: ["#7D0066", "#a8338d", "#d066b8"],
    data: {
      FY09: [6124, 136, 0], FY10: [8590, 169, 0], FY11: [10917, 207, 0],
      FY12: [12002, 216, 12], FY13: [11787, 222, 12], FY14: [13659, 248, 13],
      FY15: [17206, 259, 25], FY16: [19929, 359, 25], FY17: [22734, 857, 30],
      FY18: [20295, 827, 24], FY19: [28505, 1450, 34], FY20: [33120, 1323, 37],
      FY21: [33877, 1549, 37], FY22: [33239, 1979, 52], FY23: [29860, 1730, 34],
      FY24: [33067, 1747, 34],
      FY25: [37380, 1816, 43], FY26: [38728, 1923, 47],
    }
  },
  interest: {
    names: ["Domestic", "Foreign"],
    colors: ["#C60001", "#ff4d4d"],
    data: {
      FY09: [13839, 1341], FY10: [13497, 1371], FY11: [14200, 1423],
      FY12: [18803, 1548], FY13: [22322, 1593], FY14: [26601, 1604],
      FY15: [29436, 1537], FY16: [31468, 1646], FY17: [33249, 1841],
      FY18: [38160, 3605], FY19: [46015, 3446], FY20: [53995, 4318],
      FY21: [66319, 4287], FY22: [73225, 4554], FY23: [82670, 9437],
      FY24: [99606, 14984],
      FY25: [99500, 22000], FY26: [100000, 22000],
    }
  },
  agri: {
    names: ["Agriculture Ministry", "Fisheries & Livestock", "Environment, Forest & Climate Change Ministry", "Land Ministry", "Water Resources Ministry"],
    colors: ["#019933", "#33b359", "#66cc80", "#0d7a3a", "#4ddb8a"],
    data: {
      FY09: [6977, 508, 226, 385, 1461], FY10: [7350, 635, 820, 504, 1838],
      FY11: [8438, 774, 1116, 589, 2040], FY12: [9760, 933, 1235, 609, 2134],
      FY13: [14822, 901, 862, 621, 2481], FY14: [12075, 1006, 789, 664, 2743],
      FY15: [10345, 1144, 883, 712, 2842], FY16: [10738, 1567, 908, 1029, 3635],
      FY17: [7608, 1637, 1675, 1337, 4636], FY18: [9238, 1514, 718, 1630, 6026],
      FY19: [12174, 1661, 820, 1392, 7553], FY20: [11533, 1762, 828, 1251, 6603],
      FY21: [12926, 2707, 901, 1407, 7818], FY22: [21326, 2483, 1051, 1543, 9400],
      FY23: [33810, 3637, 1357, 1949, 13556], FY24: [31969, 3605, 1850, 1600, 14113],
      FY25: [24696, 3858, 1323, 2007, 12684], FY26: [27224, 3392, 2144, 2304, 11204],
    }
  },
  education: {
    names: ["Primary & Mass Education Ministry", "Secondary & Higher Education Division", "Science & Technology Ministry", "Information & Communication Technology Division", "Technical & Madrasa Education Division"],
    colors: ["#0185C6", "#33a0d6", "#66bbe6", "#0269a0", "#99d5f0"],
    data: {
      FY09: [5331, 6538, 229, 0, 0], FY10: [6838, 8712, 354, 0, 0],
      FY11: [8304, 10079, 420, 0, 0], FY12: [8157, 10579, 280, 91, 0],
      FY13: [9413, 11334, 355, 182, 0], FY14: [10957, 14131, 745, 796, 0],
      FY15: [11875, 16126, 1373, 916, 0], FY16: [16224, 21590, 1137, 955, 0],
      FY17: [17197, 21711, 4061, 1312, 4360], FY18: [18345, 20143, 2691, 1608, 4785],
      FY19: [19916, 24460, 12390, 1251, 5225], FY20: [20461, 25869, 12680, 909, 6048],
      FY21: [23211, 29613, 11587, 859, 6655], FY22: [23463, 28971, 15070, 1642, 7997],
      FY23: [23815, 30496, 11623, 1727, 7768], FY24: [26231, 32276, 11208, 2292, 8283],
      FY25: [35123, 39234, 12799, 2004, 9954], FY26: [35403, 47563, 12869, 2144, 12678],
    }
  },
  energy: {
    names: ["Energy & Mineral Resources Division", "Power Division"],
    colors: ["#FF6B35", "#ff9966"],
    data: {
      FY09: [241, 2309], FY10: [1367, 2102], FY11: [1200, 6033],
      FY12: [715, 7254], FY13: [1435, 8845], FY14: [1909, 8595],
      FY15: [1191, 4703], FY16: [1102, 15273], FY17: [1151, 13469],
      FY18: [1013, 27549], FY19: [4738, 32450], FY20: [3672, 29460],
      FY21: [1457, 21383], FY22: [1513, 21241], FY23: [2829, 24964],
      FY24: [1230, 27146],
      FY25: [1054, 21651], FY26: [2178, 20342],
    }
  },
  health: {
    names: ["Health Services Division", "Medical Education & Family Welfare Division"],
    colors: ["#4ECDC4", "#88e0da"],
    data: {
      FY09: [5104, 0], FY10: [6271, 0], FY11: [7287, 0],
      FY12: [7667, 0], FY13: [8549, 0], FY14: [9384, 0],
      FY15: [10417, 0], FY16: [12605, 0], FY17: [3644, 2977],
      FY18: [13036, 3803], FY19: [14693, 3984], FY20: [13811, 3721],
      FY21: [17185, 4462], FY22: [20502, 4526], FY23: [17663, 4858],
      FY24: [18942, 4784],
      FY25: [21116, 6807], FY26: [31022, 10886],
    }
  },
  housing: {
    names: ["Housing & Public Works Ministry"],
    colors: ["#A8E6CF"],
    data: {
      FY09: [1373], FY10: [1249], FY11: [1325], FY12: [1336],
      FY13: [1695], FY14: [1965], FY15: [3861], FY16: [5005],
      FY17: [3456], FY18: [6018], FY19: [5496], FY20: [6419],
      FY21: [6935], FY22: [6525], FY23: [7744], FY24: [6543],
      FY25: [5382], FY26: [5111],
    }
  },
  industry: {
    names: ["Industries Ministry", "Textiles & Jute Ministry", "Commerce Ministry", "Labour & Employment Ministry", "Expatriates' Welfare & Overseas Employment Ministry"],
    colors: ["#FF8C94", "#ffb3b8", "#e66670", "#cc4d58", "#ff6673"],
    data: {
      FY09: [486, 83, 156, 62, 62], FY10: [453, 107, 120, 133, 133],
      FY11: [399, 142, 179, 147, 147], FY12: [899, 168, 268, 172, 172],
      FY13: [1757, 222, 200, 316, 316], FY14: [1455, 227, 244, 345, 345],
      FY15: [1443, 212, 314, 480, 480], FY16: [690, 275, 433, 400, 400],
      FY17: [745, 704, 265, 362, 362], FY18: [1305, 415, 161, 398, 398],
      FY19: [1409, 714, 440, 486, 486], FY20: [1555, 494, 303, 435, 435],
      FY21: [1524, 453, 324, 535, 535], FY22: [2135, 558, 252, 237, 412],
      FY23: [2030, 480, 340, 330, 488], FY24: [2510, 449, 351, 244, 526],
      FY25: [1499, 498, 470, 346, 1140], FY26: [1891, 480, 608, 438, 755],
    }
  },
  localgov: {
    names: ["Local Government Division", "Rural development & Cooperative Division", "Ctg Hill Tracts Ministry"],
    colors: ["#96CEB4", "#b8e0cc", "#6db893"],
    data: {
      FY09: [5938, 427, 532], FY10: [7653, 377, 430], FY11: [9037, 630, 539],
      FY12: [9442, 1034, 574], FY13: [12314, 1256, 577], FY14: [12399, 1494, 573],
      FY15: [15561, 1587, 683], FY16: [16389, 1460, 744], FY17: [15388, 1619, 906],
      FY18: [18622, 2162, 789], FY19: [27973, 2208, 1310], FY20: [29361, 1864, 1165],
      FY21: [32211, 2264, 1009], FY22: [33913, 1770, 1261], FY23: [38606, 1208, 1302],
      FY24: [42003, 1183, 1314],
      FY25: [42357, 1109, 1304], FY26: [42433, 1100, 1362],
    }
  },
  order: {
    names: ["Law & Justice Division", "Supreme Court", "Public Security Division", "ACC", "Legislative and Parliamentary Affairs Division", "Security Services Division"],
    colors: ["#FFEAA7", "#ffe080", "#ffd54f", "#e6c84d", "#ccb343", "#b39e3a"],
    data: {
      FY09: [317, 35, 5309, 23, 0, 0], FY10: [404, 53, 6097, 23, 5, 0],
      FY11: [510, 76, 7191, 28, 10, 0], FY12: [612, 90, 7988, 32, 15, 0],
      FY13: [657, 94, 8859, 36, 9, 0], FY14: [787, 102, 10811, 46, 13, 0],
      FY15: [878, 112, 12096, 61, 11, 0], FY16: [1060, 136, 15167, 74, 15, 0],
      FY17: [1286, 117, 16387, 90, 22, 1784], FY18: [1401, 165, 18043, 25, 87, 2331],
      FY19: [1363, 196, 21595, 30, 114, 3724], FY20: [1227, 181, 19372, 29, 106, 2515],
      FY21: [1232, 169, 20150, 32, 87, 2744], FY22: [1352, 199, 21449, 101, 32, 3062],
      FY23: [1322, 186, 21273, 121, 31, 2860], FY24: [1344, 230, 23560, 129, 36, 3399],
      FY25: [1922, 242, 25634, 164, 52, 3697], FY26: [2015, 250, 27001, 191, 47, 4038],
    }
  },
  rec: {
    names: ["Information & Broadcasting Ministry", "Cultural Affairs Ministry", "Religious Affairs Ministry", "Youth & Sports Ministry"],
    colors: ["#DDA0DD", "#c77dc7", "#e6b8e6", "#b366b3"],
    data: {
      FY09: [466, 124, 180, 154], FY10: [369, 125, 256, 279],
      FY11: [429, 226, 253, 649], FY12: [406, 198, 258, 611],
      FY13: [453, 169, 313, 763], FY14: [520, 226, 319, 746],
      FY15: [556, 295, 380, 631], FY16: [667, 373, 515, 834],
      FY17: [1383, 325, 599, 933], FY18: [790, 384, 877, 1033],
      FY19: [909, 605, 1482, 1458], FY20: [754, 421, 1237, 1345],
      FY21: [814, 468, 1770, 792], FY22: [976, 556, 2465, 1140],
      FY23: [1326, 618, 3363, 1444], FY24: [934, 730, 2542, 1245],
      FY25: [1198, 742, 1943, 1581], FY26: [1110, 824, 2183, 2423],
    }
  },
  social: {
    names: ["Social Welfare Ministry", "Women & Children's Affairs Ministry", "Liberation War Affairs Ministry", "Food Ministry", "Disaster Management & Relief Ministry"],
    colors: ["#45B7D1", "#6dc9de", "#95dbeb", "#2e9ab3", "#1a8099"],
    data: {
      FY09: [965, 1232, 163, 5525, 0], FY10: [1263, 1211, 309, 353, 3823],
      FY11: [1759, 1055, 483, 1194, 3237], FY12: [1905, 1111, 565, 1122, 4283],
      FY13: [1983, 1309, 703, 814, 5238], FY14: [2093, 1373, 1102, 919, 5742],
      FY15: [2727, 1458, 1474, 743, 4757], FY16: [3241, 1690, 2338, 1269, 6784],
      FY17: [4123, 2088, 2913, 344, 6740], FY18: [4747, 2433, 1748, 5748, 3413],
      FY19: [5468, 3331, 3710, 7925, 3487], FY20: [6671, 1609, 4120, 7758, 3928],
      FY21: [7593, 3589, 3894, 7988, 3874], FY22: [8717, 3892, 6407, 5309, 8647],
      FY23: [9463, 4228, 7845, 5014, 10910], FY24: [11044, 4902, 6976, 6415, 9852],
      FY25: [12177, 5040, 7122, 7862, 10111], FY26: [13991, 5078, 7330, 8322, 10362],
    }
  },
  transport: {
    names: ["Road Transport & Highways Division", "Railway Ministry", "Shipping Ministry", "Civil Aviation & Tourism Ministry", "Posts & Telecommunication Division", "Bridges Division"],
    colors: ["#B0832B", "#c9a04e", "#e0bd72", "#967020", "#7d5d18", "#dbb34a"],
    data: {
      FY09: [3555, 0, 185, 33, 432, 0], FY10: [4828, 0, 297, 593, 574, 331],
      FY11: [5584, 0, 454, 49, 577, 385], FY12: [7278, 1, 447, 111, 1200, 418],
      FY13: [5369, 4557, 741, 56, 972, 785], FY14: [5560, 4462, 796, 274, 1085, 2067],
      FY15: [6223, 4970, 898, 137, 1519, 5299], FY16: [8900, 6016, 1526, 289, 2076, 5297],
      FY17: [10497, 3489, 2356, 494, 2294, 3769], FY18: [19298, 12406, 2982, 364, 1784, 3242],
      FY19: [23517, 741, 4157, 999, 2102, 6317], FY20: [23580, 14916, 3366, 3218, 1978, 6685],
      FY21: [26321, 11967, 3899, 2755, 1333, 3943], FY22: [29851, 14801, 4141, 4369, 1467, 5571],
      FY23: [30920, 14703, 4684, 5157, 2636, 6947], FY24: [24217, 14256, 5825, 4786, 2599, 7488],
      FY25: [24059, 14564, 8785, 4878, 2359, 5855], FY26: [38496, 11944, 10279, 2455, 2148, 6022],
    }
  },
  publicsvc: {
    names: ["President's Office", "Bangladesh Parliament", "PMO", "Cabinet Division", "EC Secretariat", "Public Administration Ministry", "PSC", "Finance Division", "IRD", "Financial Institutions Division", "ERD", "Planning Division", "IMED", "Statistics", "Foreign Affairs Ministry", "Tax Ombudsman"],
    colors: [
      "#997B50", "#b3955e", "#cc af6c", "#8a6e47", "#7a623e",
      "#a88960", "#c4a47a", "#d4b88e", "#bfa070", "#a08050",
      "#e0c89a", "#c8a870", "#b09058", "#988040", "#806830",
      "#e8d0a8"
    ],
    data: {
      FY09: [7, 34, 186, 14, 437, 703, 12, 4034, 873, 0, 71, 154, 25, 0, 330, 1],
      FY10: [8, 66, 204, 22, 126, 733, 19, 5169, 936, 93, 121, 196, 40, 0, 516, 1],
      FY11: [10, 100, 462, 26, 462, 979, 26, 3937, 908, 110, 134, 76, 60, 273, 517, 1],
      FY12: [11, 120, 417, 42, 192, 962, 25, 7174, 984, 100, 132, 72, 49, 168, 602, 0],
      FY13: [11, 145, 446, 29, 221, 958, 39, 3771, 1056, 161, 133, 68, 49, 241, 620, 0],
      FY14: [12, 151, 606, 27, 982, 1026, 30, 9177, 1057, 371, 141, 58, 67, 183, 633, 0],
      FY15: [14, 180, 666, 31, 325, 1193, 30, 7466, 1196, 73, 155, 105, 85, 196, 573, 0],
      FY16: [20, 197, 1203, 44, 999, 1673, 41, 7944, 1532, 131, 222, 147, 112, 285, 690, 0],
      FY17: [21, 231, 1128, 50, 632, 1694, 49, 22837, 1281, 1766, 260, 149, 65, 341, 799, 0],
      FY18: [22, 237, 4181, 62, 415, 1788, 72, 16845, 897, 1558, 101, 186, 75, 496, 927, 0],
      FY19: [21, 225, 2553, 82, 3279, 2145, 82, 19241, 1372, 1754, 118, 239, 139, 621, 1133, 0],
      FY20: [19, 216, 3252, 135, 1890, 2026, 91, 26342, 1438, 2131, 293, 120, 116, 342, 880, 0],
      FY21: [19, 228, 3215, 113, 1091, 2076, 68, 41944, 1597, 4535, 305, 175, 149, 313, 753, 0],
      FY22: [21, 229, 3861, 120, 1659, 2684, 85, 57787, 1722, 4898, 418, 135, 199, 1453, 240, 0],
      FY23: [21, 250, 3460, 87, 878, 2495, 97, 75978, 1591, 2909, 329, 146, 185, 285, 996, 0],
      FY24: [24, 258, 2867, 69, 4190, 3997, 106, 79328, 1592, 2912, 1348, 119, 209, 482, 1161, 0],
      FY25: [31, 154, 3058, 111, 1142, 4146, 172, 143251, 2216, 4154, 835, 26692, 189, 702, 1597, 0], FY26: [34, 232, 3556, 116, 2956, 4899, 149, 153655, 3126, 3521, 584, 10906, 183, 467, 1704, 0],
    }
  },
};

// Fix publicsvc colors (remove accidental space)
SUB_SECTOR_RAW.publicsvc.colors = [
  "#997B50", "#b3955e", "#ccaf6c", "#8a6e47", "#7a623e",
  "#a88960", "#c4a47a", "#d4b88e", "#bfa070", "#a08050",
  "#e0c89a", "#c8a870", "#b09058", "#988040", "#806830",
  "#e8d0a8"
];

// ── FY25/FY26 sub-sector breakdowns are HARDCODED inline above. ──
// Safety net for FUTURE years (e.g. FY27): if a sector has a total in
// SECTOR_VALUES but no explicit sub-sector array yet, fill it from the latest
// known breakdown scaled to that total — so the Absolute view always renders the
// proposed year. An explicit `FY27: [...]` array always takes precedence
// (this loop never overwrites a year that already has data).
Object.keys(SUB_SECTOR_RAW).forEach(k => {
  const raw = SUB_SECTOR_RAW[k];
  let shape = null;
  SECTOR_YEARS.forEach(fy => {
    if (raw.data[fy]) { shape = raw.data[fy]; return; }   // explicit/hardcoded — keep
    const total = SECTOR_VALUES[k]?.[fy];
    if (!shape || typeof total !== "number") return;
    const shapeTotal = shape.reduce((a, b) => a + b, 0);
    if (shapeTotal === 0) return;
    raw.data[fy] = shape.map(v => Math.round((v / shapeTotal) * total));
  });
});

// ── Public Services: group into top N + "Others" for chart readability ──
const _PS_TOP_N = 5;

function _buildGroupedPublicSvc() {
  const raw = SUB_SECTOR_RAW.publicsvc;
  // Rank sub-sectors by their FY24 value
  const indices = raw.names.map((n, i) => ({ name: n, idx: i, val: raw.data.FY24[i] }));
  indices.sort((a, b) => b.val - a.val);
  const topIndices = indices.slice(0, _PS_TOP_N).map(x => x.idx);
  const otherIndices = indices.slice(_PS_TOP_N).map(x => x.idx);

  const names = topIndices.map(i => raw.names[i]);
  names.push("Others");
  const colors = topIndices.map(i => raw.colors[i]);
  colors.push("#c8b898"); // muted for Others

  const data = {};
  SECTOR_YEARS.forEach(fy => {
    const fyData = raw.data[fy];
    if (!fyData) return;
    const vals = topIndices.map(i => fyData[i] || 0);
    vals.push(otherIndices.reduce((sum, i) => sum + (fyData[i] || 0), 0));
    data[fy] = vals;
  });

  return { names, colors, data };
}

const SUB_SECTOR_GROUPED_PUBLICSVC = _buildGroupedPublicSvc();

// ── Master accessor: returns the display-ready sub-sector config for a given sector key ──
function getSubSectorConfig(sectorKey) {
  if (sectorKey === "publicsvc") return SUB_SECTOR_GROUPED_PUBLICSVC;
  return SUB_SECTOR_RAW[sectorKey] || null;
}

// ──────────────────────────────────────────────────────────────────────
// GDP% data — FY09→FY24 from "as % of GDP.csv". FY25/FY26 are HARDCODED
// estimates (each sector's FY24 %-of-GDP continued along its total trend) —
// edit freely. Maps sector key → { [FY]: { total: number, pct: number } }.
// ⟶ GO-LIVE FY27 (% of GDP): add `FY27: { total: <Cr>, pct: <%> }` to each
//   sector below so the "% of GDP" view renders FY27 (the view omits any year
//   without an entry, so partial data never breaks the chart).
// ──────────────────────────────────────────────────────────────────────
const GDP_SECTOR_MAP = {
  publicsvc: "Public services",
  localgov: "Local govt",
  defence: "DEFENCE",
  order: "Public order and safety",
  education: "Education and technology",
  health: "Health",
  social: "Social Security and welfare",
  housing: "Min of Housing",
  rec: "Recreation and cultural affairs",
  energy: "Fuel and energy",
  agri: "Agriculture",
  industry: "Industry and economic services",
  transport: "Transport and communication",
  interest: "Interest",
};

// Sector → { FY: pct }  from the "as % of GDP" CSV
const GDP_SECTOR_DATA = {};
const _gdpRaw = {
  publicsvc: {
    FY09: { total: 6881, pct: 1.12 }, FY10: { total: 8250, pct: 1.19 }, FY11: { total: 8081, pct: 1.03 },
    FY12: { total: 11050, pct: 1.21 }, FY13: { total: 7948, pct: 0.77 }, FY14: { total: 14521, pct: 1.23 },
    FY15: { total: 12288, pct: 0.81 }, FY16: { total: 15240, pct: 0.88 }, FY17: { total: 31303, pct: 1.60 },
    FY18: { total: 27862, pct: 1.24 }, FY19: { total: 33004, pct: 1.30 }, FY20: { total: 39291, pct: 1.41 },
    FY21: { total: 56581, pct: 1.78 }, FY22: { total: 75511, pct: 1.90 }, FY23: { total: 89707, pct: 2.02 },
    FY24: { total: 98662, pct: 1.97 },
    FY25: { total: 188450, pct: 3.42 }, FY26: { total: 186088, pct: 2.10 },
  },
  localgov: {
    FY09: { total: 6897, pct: 1.12 }, FY10: { total: 8460, pct: 1.23 }, FY11: { total: 10206, pct: 1.30 },
    FY12: { total: 11050, pct: 1.21 }, FY13: { total: 14147, pct: 1.36 }, FY14: { total: 14466, pct: 1.22 },
    FY15: { total: 17831, pct: 1.18 }, FY16: { total: 18593, pct: 1.08 }, FY17: { total: 17913, pct: 0.92 },
    FY18: { total: 21573, pct: 0.96 }, FY19: { total: 31491, pct: 1.24 }, FY20: { total: 32390, pct: 1.16 },
    FY21: { total: 35484, pct: 1.12 }, FY22: { total: 36944, pct: 0.93 }, FY23: { total: 41116, pct: 0.93 },
    FY24: { total: 44500, pct: 0.89 },
    FY25: { total: 44770, pct: 0.81 }, FY26: { total: 44895, pct: 0.93 },
  },
  defence: {
    FY09: { total: 6260, pct: 1.02 }, FY10: { total: 8759, pct: 1.27 }, FY11: { total: 11124, pct: 1.41 },
    FY12: { total: 12230, pct: 1.34 }, FY13: { total: 12021, pct: 1.16 }, FY14: { total: 13920, pct: 1.18 },
    FY15: { total: 17490, pct: 1.16 }, FY16: { total: 20313, pct: 1.17 }, FY17: { total: 23621, pct: 1.21 },
    FY18: { total: 21146, pct: 0.94 }, FY19: { total: 29989, pct: 1.18 }, FY20: { total: 34480, pct: 1.23 },
    FY21: { total: 35463, pct: 1.12 }, FY22: { total: 35270, pct: 0.89 }, FY23: { total: 31624, pct: 0.71 },
    FY24: { total: 34848, pct: 0.70 },
    FY25: { total: 39239, pct: 0.71 }, FY26: { total: 40698, pct: 0.48 },
  },
  order: {
    FY09: { total: 5684, pct: 0.92 }, FY10: { total: 6582, pct: 0.95 }, FY11: { total: 7815, pct: 0.99 },
    FY12: { total: 8737, pct: 0.96 }, FY13: { total: 9655, pct: 0.93 }, FY14: { total: 11759, pct: 1.00 },
    FY15: { total: 13158, pct: 0.87 }, FY16: { total: 16452, pct: 0.95 }, FY17: { total: 19686, pct: 1.01 },
    FY18: { total: 22052, pct: 0.99 }, FY19: { total: 27022, pct: 1.07 }, FY20: { total: 23430, pct: 0.84 },
    FY21: { total: 24414, pct: 0.77 }, FY22: { total: 26195, pct: 0.66 }, FY23: { total: 25793, pct: 0.58 },
    FY24: { total: 25940, pct: 0.52 },
    FY25: { total: 31711, pct: 0.58 }, FY26: { total: 33542, pct: 0.70 },
  },
  education: {
    FY09: { total: 12098, pct: 1.97 }, FY10: { total: 15904, pct: 2.30 }, FY11: { total: 18803, pct: 2.39 },
    FY12: { total: 19107, pct: 2.09 }, FY13: { total: 21284, pct: 2.05 }, FY14: { total: 26629, pct: 2.25 },
    FY15: { total: 30290, pct: 2.00 }, FY16: { total: 39906, pct: 2.31 }, FY17: { total: 48641, pct: 2.49 },
    FY18: { total: 47572, pct: 2.13 }, FY19: { total: 63242, pct: 2.49 }, FY20: { total: 65967, pct: 2.36 },
    FY21: { total: 71925, pct: 2.27 }, FY22: { total: 77143, pct: 1.94 }, FY23: { total: 75429, pct: 1.70 },
    FY24: { total: 80290, pct: 1.60 },
    FY25: { total: 99114, pct: 1.80 }, FY26: { total: 110657, pct: 1.76 },
  },
  health: {
    FY09: { total: 5104, pct: 0.83 }, FY10: { total: 6271, pct: 0.91 }, FY11: { total: 7287, pct: 0.93 },
    FY12: { total: 7667, pct: 0.84 }, FY13: { total: 8549, pct: 0.82 }, FY14: { total: 9384, pct: 0.79 },
    FY15: { total: 10417, pct: 0.69 }, FY16: { total: 12605, pct: 0.73 }, FY17: { total: 6621, pct: 0.34 },
    FY18: { total: 16839, pct: 0.75 }, FY19: { total: 18677, pct: 0.74 }, FY20: { total: 17532, pct: 0.63 },
    FY21: { total: 21647, pct: 0.68 }, FY22: { total: 25028, pct: 0.63 }, FY23: { total: 22521, pct: 0.51 },
    FY24: { total: 23726, pct: 0.47 },
    FY25: { total: 27923, pct: 0.51 }, FY26: { total: 41908, pct: 0.63 },
  },
  social: {
    FY09: { total: 7885, pct: 1.28 }, FY10: { total: 6959, pct: 1.01 }, FY11: { total: 7728, pct: 0.98 },
    FY12: { total: 8986, pct: 0.98 }, FY13: { total: 10047, pct: 0.97 }, FY14: { total: 11229, pct: 0.95 },
    FY15: { total: 11159, pct: 0.74 }, FY16: { total: 15322, pct: 0.89 }, FY17: { total: 16208, pct: 0.83 },
    FY18: { total: 18089, pct: 0.81 }, FY19: { total: 23921, pct: 0.94 }, FY20: { total: 24086, pct: 0.86 },
    FY21: { total: 26938, pct: 0.85 }, FY22: { total: 32972, pct: 0.83 }, FY23: { total: 37460, pct: 0.84 },
    FY24: { total: 39189, pct: 0.78 },
    FY25: { total: 42312, pct: 0.77 }, FY26: { total: 45083, pct: 0.61 },
  },
  housing: {
    FY09: { total: 1373, pct: 0.22 }, FY10: { total: 1249, pct: 0.18 }, FY11: { total: 1325, pct: 0.17 },
    FY12: { total: 1336, pct: 0.15 }, FY13: { total: 1695, pct: 0.16 }, FY14: { total: 1965, pct: 0.17 },
    FY15: { total: 3861, pct: 0.26 }, FY16: { total: 5005, pct: 0.29 }, FY17: { total: 3456, pct: 0.18 },
    FY18: { total: 6018, pct: 0.27 }, FY19: { total: 5496, pct: 0.22 }, FY20: { total: 6419, pct: 0.23 },
    FY21: { total: 6935, pct: 0.22 }, FY22: { total: 6525, pct: 0.16 }, FY23: { total: 7744, pct: 0.17 },
    FY24: { total: 6543, pct: 0.13 },
    FY25: { total: 5382, pct: 0.10 }, FY26: { total: 5111, pct: 0.15 },
  },
  rec: {
    FY09: { total: 924, pct: 0.15 }, FY10: { total: 1029, pct: 0.15 }, FY11: { total: 1557, pct: 0.20 },
    FY12: { total: 1473, pct: 0.16 }, FY13: { total: 1698, pct: 0.16 }, FY14: { total: 1811, pct: 0.15 },
    FY15: { total: 1862, pct: 0.12 }, FY16: { total: 2389, pct: 0.14 }, FY17: { total: 3240, pct: 0.17 },
    FY18: { total: 3084, pct: 0.14 }, FY19: { total: 4454, pct: 0.18 }, FY20: { total: 3757, pct: 0.13 },
    FY21: { total: 3844, pct: 0.12 }, FY22: { total: 5137, pct: 0.13 }, FY23: { total: 6751, pct: 0.15 },
    FY24: { total: 5451, pct: 0.11 },
    FY25: { total: 5464, pct: 0.10 }, FY26: { total: 6540, pct: 0.08 },
  },
  energy: {
    FY09: { total: 2550, pct: 0.41 }, FY10: { total: 3469, pct: 0.50 }, FY11: { total: 7233, pct: 0.92 },
    FY12: { total: 7969, pct: 0.87 }, FY13: { total: 10280, pct: 0.99 }, FY14: { total: 10504, pct: 0.89 },
    FY15: { total: 5894, pct: 0.39 }, FY16: { total: 16375, pct: 0.95 }, FY17: { total: 14620, pct: 0.75 },
    FY18: { total: 28562, pct: 1.28 }, FY19: { total: 37188, pct: 1.47 }, FY20: { total: 33132, pct: 1.18 },
    FY21: { total: 22840, pct: 0.72 }, FY22: { total: 22754, pct: 0.57 }, FY23: { total: 27793, pct: 0.63 },
    FY24: { total: 28376, pct: 0.57 },
    FY25: { total: 22705, pct: 0.41 }, FY26: { total: 22520, pct: 0.43 },
  },
  agri: {
    FY09: { total: 9557, pct: 1.55 }, FY10: { total: 11147, pct: 1.61 }, FY11: { total: 12957, pct: 1.65 },
    FY12: { total: 14671, pct: 1.60 }, FY13: { total: 19687, pct: 1.90 }, FY14: { total: 17277, pct: 1.46 },
    FY15: { total: 15926, pct: 1.05 }, FY16: { total: 17877, pct: 1.03 }, FY17: { total: 16893, pct: 0.86 },
    FY18: { total: 19126, pct: 0.85 }, FY19: { total: 23600, pct: 0.93 }, FY20: { total: 21977, pct: 0.79 },
    FY21: { total: 25759, pct: 0.81 }, FY22: { total: 35803, pct: 0.90 }, FY23: { total: 54309, pct: 1.22 },
    FY24: { total: 53137, pct: 1.06 },
    FY25: { total: 44568, pct: 0.81 }, FY26: { total: 46268, pct: 1.35 },
  },
  industry: {
    FY09: { total: 849, pct: 0.14 }, FY10: { total: 946, pct: 0.14 }, FY11: { total: 1014, pct: 0.13 },
    FY12: { total: 1679, pct: 0.18 }, FY13: { total: 2811, pct: 0.27 }, FY14: { total: 2616, pct: 0.22 },
    FY15: { total: 2929, pct: 0.19 }, FY16: { total: 2198, pct: 0.13 }, FY17: { total: 2438, pct: 0.12 },
    FY18: { total: 2677, pct: 0.12 }, FY19: { total: 3535, pct: 0.14 }, FY20: { total: 3222, pct: 0.12 },
    FY21: { total: 3371, pct: 0.11 }, FY22: { total: 3594, pct: 0.09 }, FY23: { total: 3668, pct: 0.08 },
    FY24: { total: 4080, pct: 0.08 },
    FY25: { total: 3953, pct: 0.07 }, FY26: { total: 4172, pct: 0.07 },
  },
  transport: {
    FY09: { total: 4205, pct: 0.68 }, FY10: { total: 6623, pct: 0.96 }, FY11: { total: 7049, pct: 0.90 },
    FY12: { total: 9455, pct: 1.03 }, FY13: { total: 12480, pct: 1.20 }, FY14: { total: 14244, pct: 1.21 },
    FY15: { total: 19046, pct: 1.26 }, FY16: { total: 24104, pct: 1.39 }, FY17: { total: 22899, pct: 1.17 },
    FY18: { total: 40076, pct: 1.79 }, FY19: { total: 37833, pct: 1.49 }, FY20: { total: 53743, pct: 1.92 },
    FY21: { total: 50218, pct: 1.58 }, FY22: { total: 60200, pct: 1.52 }, FY23: { total: 65047, pct: 1.47 },
    FY24: { total: 59171, pct: 1.18 },
    FY25: { total: 60500, pct: 1.10 }, FY26: { total: 71344, pct: 1.18 },
  },
  interest: {
    FY09: { total: 15180, pct: 2.47 }, FY10: { total: 14868, pct: 2.15 }, FY11: { total: 15623, pct: 1.98 },
    FY12: { total: 20351, pct: 2.22 }, FY13: { total: 23915, pct: 2.30 }, FY14: { total: 28205, pct: 2.39 },
    FY15: { total: 30973, pct: 2.05 }, FY16: { total: 33114, pct: 1.91 }, FY17: { total: 35090, pct: 1.79 },
    FY18: { total: 41765, pct: 1.87 }, FY19: { total: 49461, pct: 1.95 }, FY20: { total: 58313, pct: 2.09 },
    FY21: { total: 70606, pct: 2.23 }, FY22: { total: 77779, pct: 1.96 }, FY23: { total: 92107, pct: 2.07 },
    FY24: { total: 114590, pct: 2.29 },
    FY25: { total: 121500, pct: 2.21 }, FY26: { total: 122000, pct: 2.03 },
  },
};
Object.assign(GDP_SECTOR_DATA, _gdpRaw);

// ──────────────────────────────────────────────────────────────────────
// % OF TOTAL BUDGET data — from "as % of total budget.csv".
// Each year's share = a sector's annual total ÷ that year's TOTAL BUDGET
// (the CSV's final column). Deriving it from SECTOR_VALUES (same totals the
// Absolute view uses) keeps the two views perfectly consistent and reproduces
// the CSV's percentages exactly. Shape mirrors GDP_SECTOR_DATA:
//   sector key → { [FY]: { total, pct } }.
// ⟶ GO-LIVE FY27 (% of budget): add `FY27: <total budget in Cr>` below once the
//   proposed-year total budget is known. The view omits any year missing from
//   this map, so partial data never breaks the chart.
// ──────────────────────────────────────────────────────────────────────
const BUDGET_SHARE_SECTOR_DATA = {};
Object.keys(SECTOR_VALUES).forEach(k => {
  const perYear = {};
  FY_YEARS.forEach(fy => {
    const val = SECTOR_VALUES[k][fy];
    const tot = TOTAL_BUDGET_BY_YEAR[fy];
    if (typeof val === "number" && typeof tot === "number" && tot > 0) {
      perYear[fy] = { total: val, pct: (val / tot) * 100 };
    }
  });
  BUDGET_SHARE_SECTOR_DATA[k] = perYear;
});

// Re-calculate stats for each sector
SECTORS.forEach(s => {
  const gdpArr = SECTOR_YEARS.map(fy => GDP_SECTOR_DATA[s.k]?.[fy]?.pct ?? 0);
  const absArr = SECTOR_YEARS.map(fy => SECTOR_VALUES[s.k]?.[fy] ?? 0);

  s.riseGdp = countRises(gdpArr);
  s.riseAbs = countRises(absArr);
  s.rise = s.riseGdp; // Heatmap sort uses this by default

  s.gdpProposed = GDP_SECTOR_DATA[s.k]?.[BUDGET.proposed]?.pct ?? 0;
  s.gdp09 = GDP_SECTOR_DATA[s.k]?.['FY09']?.pct ?? 0;
  s.gdpGrowth = (s.gdpProposed - s.gdp09).toFixed(2);

  s.peakYearGdp = SECTOR_YEARS[gdpArr.indexOf(Math.max(...gdpArr))];
  s.peakYearAbs = SECTOR_YEARS[absArr.indexOf(Math.max(...absArr))];

  // % of total budget stats (mirror the GDP-share stats)
  const budArr = SECTOR_YEARS.map(fy => BUDGET_SHARE_SECTOR_DATA[s.k]?.[fy]?.pct ?? 0);
  s.riseBud = countRises(budArr);
  s.budProposed = BUDGET_SHARE_SECTOR_DATA[s.k]?.[BUDGET.proposed]?.pct ?? 0;
  s.bud09 = BUDGET_SHARE_SECTOR_DATA[s.k]?.['FY09']?.pct ?? 0;
  s.budGrowth = (s.budProposed - s.bud09).toFixed(2);
  s.peakYearBud = SECTOR_YEARS[budArr.indexOf(Math.max(...budArr))];
});

// Keep the old DEFENCE_STACK alias for backward compat (unused but safe)
const DEFENCE_STACK = SECTOR_YEARS.map(fy => {
  const cfg = getSubSectorConfig("defence");
  const d = cfg.data[fy] || [0, 0, 0];
  return { fy, mininstry: d[0], other: d[1], armed: d[2] };
});

// ──────────────────────────────────────────────────────────────────────
// Top 15 departments (proposed-year snapshot — edit values directly)
// ⟶ GO-LIVE FY27 (sector): DEPTS is a single proposed-year snapshot. On go-live,
// replace these 15 amounts/pcts with the new proposed-year (FY27) figures.
// ──────────────────────────────────────────────────────────────────────
const DEPTS = [

  { name: "Finance Division", amt: 153655, pct: 25.13, parent: "Public Services", color: "#997B50" },
  { name: "Domestic Interest", amt: 100000, pct: 16.36, parent: "Interest", color: "#C60001" },
  { name: "Secondary & Higher Education Division", amt: 47563, pct: 7.78, parent: "Education", color: "#0185C6" },
  { name: "Local Government Division", amt: 42433, pct: 6.94, parent: "Local Government", color: "#96CEB4" },
  { name: "Defence Ministry", amt: 38728, pct: 6.33, parent: "Defence", color: "#7D0066" },
  { name: "Road Transport & Highways Division", amt: 38496, pct: 6.30, parent: "Transport", color: "#B0832B" },
  { name: "Primary & Mass Education Ministry", amt: 35403, pct: 5.79, parent: "Education", color: "#0185C6" },
  { name: "Health Services Division", amt: 31022, pct: 5.07, parent: "Health", color: "#4ECDC4" },
  { name: "Agriculture Ministry", amt: 27224, pct: 4.45, parent: "Agriculture", color: "#019933" },
  { name: "Public Security Division", amt: 27001, pct: 4.42, parent: "Public Order", color: "#FFEAA7" },
  //{ name: "Foreign Interest", amt: 22000, pct: 3.60, parent: "Interest", color: "#C60001" },
  //{ name: "Power Division", amt: 20342, pct: 3.33, parent: "Energy", color: "#FF6B35" },
  //{ name: "Primary & Mass Edu", amt: 13991, pct: 2.29, parent: "Education", color: "#0185C6" },
  //{ name: "Social Welfare", amt: 13991, pct: 2.29, parent: "Social Security", color: "#45B7D1" },

  //{ name: "Min of Education", amt: 50800, pct: 5.44, parent: "Education", color: "#0185C6" },






  //{ name: "Bridges Division", amt: 19600, pct: 2.10, parent: "Transport", color: "#B0832B" },
  //{ name: "Disaster Mgmt", amt: 17700, pct: 1.90, parent: "Social Security", color: "#45B7D1" },

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
  { fy: "FY27", v: null }, // ⟶ GO-LIVE FY27: implementation %
];

// Rise/fall heatmap pattern derived from real values
function patternFor(_unused, key) {
  const arr = SECTOR_YEARS.map(fy => GDP_SECTOR_DATA[key]?.[fy]?.pct ?? 0);
  return arr.slice(1).map((v, i) => v >= arr[i] ? "up" : "dn");
}

Object.assign(window, {
  SECTORS, FY_YEARS, SECTOR_YEARS, DEFENCE_STACK, DEPTS, IMPL, patternFor, SECTOR_VALUES,
  getSubSectorConfig, GDP_SECTOR_DATA, SUB_SECTOR_RAW,
  BUDGET_SHARE_SECTOR_DATA,
});
