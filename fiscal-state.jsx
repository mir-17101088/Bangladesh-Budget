/* ============================================================
   fiscal-state.jsx
   Single source of truth for fiscal-year STATUS.
   Pure helpers — no data, no DOM. Runs in the browser (globals)
   and in Node (module.exports) so the logic is unit-testable.

   Status roles are positional on the ordered list of years that
   CURRENTLY HAVE DATA:
     proposed = newest year with data        (years[last])
     revised  = the year before               (years[last-1])
     actual   = two years before (headline)   (years[last-2])
     historical = everything older
   Populate a new trailing year (FY27) and every role shifts
   forward by one — automatically.
============================================================ */

// "FY26" -> 2026 (the calendar year the fiscal year ends in)
function fyToYear(fy) {
  const m = String(fy).match(/(\d{2,4})$/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return n < 100 ? 2000 + n : n;
}

// "FY26" -> "FY 2025—26" (Bangladesh fiscal year spans Jul..Jun)
function fyToSpan(fy) {
  const end = fyToYear(fy);
  if (end == null) return String(fy);
  return "FY " + (end - 1) + "—" + String(end).slice(-2);
}

// Display metadata per status.
const STATUS_META = {
  actual:   { word: "Actual",   cls: "fy-actual",   tag: null },
  revised:  { word: "Revised",  cls: "fy-revised",  tag: "Revised" },
  proposed: { word: "Allocation", cls: "fy-proposed", tag: "Allocation" },
};

// A value is "present" only if it is a finite number.
function __present(v) { return typeof v === "number" && isFinite(v); }

// Index-aligned arrays: year i is present iff every series has a present value
// at index i. Stops at the first absent year (drops trailing gaps like FY27).
function presentFromSeries(fyLabels, seriesList) {
  const out = [];
  for (let i = 0; i < fyLabels.length; i++) {
    const ok = seriesList.length > 0 && seriesList.every((s) => __present(s[i]));
    if (!ok) break;
    out.push(fyLabels[i]);
  }
  return out;
}

// [{fy, ...}] records, present iff the chosen value key is present.
function presentFromRecords(records, valueKey) {
  const out = [];
  for (const r of records) {
    if (!r || !__present(r[valueKey])) break;
    out.push(r.fy);
  }
  return out;
}

// { FY09:.., FY27:null } map across a known ordered label list.
function presentFromMap(map, fyLabels) {
  const out = [];
  for (const fy of fyLabels) {
    if (!map || !__present(map[fy])) break;
    out.push(fy);
  }
  return out;
}

// Core: given the ordered present years, return the state object.
function computeFiscalState(presentYears) {
  const years = Array.isArray(presentYears) ? presentYears.slice() : [];
  const n = years.length;
  const proposed = n >= 1 ? years[n - 1] : null;
  const revised = n >= 2 ? years[n - 2] : null;
  const actual = n >= 3 ? years[n - 3] : null;

  const roleByFy = {};
  years.forEach((fy) => { roleByFy[fy] = "historical"; });
  if (actual) roleByFy[actual] = "actual";
  if (revised) roleByFy[revised] = "revised";
  if (proposed) roleByFy[proposed] = "proposed";

  function statusOf(fy) {
    if (roleByFy[fy]) return roleByFy[fy];
    if (proposed && fyToYear(fy) > fyToYear(proposed)) return "future";
    return "historical";
  }
  function tagFor(fy) {
    const meta = STATUS_META[statusOf(fy)];
    return meta && meta.tag ? { label: meta.tag, cls: meta.cls } : null;
  }
  function indexOf(fy) { return years.indexOf(fy); }

  return { years, proposed, revised, actual, statusOf, tagFor, indexOf };
}

// ── dual export: Node (tests) + browser (app globals) ──
const __FISCAL_EXPORTS = {
  fyToYear, fyToSpan, STATUS_META,
  presentFromSeries, presentFromRecords, presentFromMap, computeFiscalState,
};
if (typeof module !== "undefined" && module.exports) module.exports = __FISCAL_EXPORTS;
if (typeof window !== "undefined") Object.assign(window, __FISCAL_EXPORTS);
