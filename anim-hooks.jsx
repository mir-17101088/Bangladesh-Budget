/* ============================================================
   anim-hooks.jsx
   Tiny set of reusable React hooks + helpers for "feels alive"
   animations driven by IntersectionObserver.

   Exposes globally:
     - useInView(opts)  -> [ref, inView]
     - useCountUp(target, opts) -> { ref, display } where display
       is a string formatted via the provided formatter.
     - <CountUp value formatter prefix suffix decimals duration />
     - <AnimatedBar fillHeight ...rectProps />  for SVG bars (h grows)
============================================================ */

const { useState: useAS, useEffect: useAE, useRef: useAR, useMemo: useAM } = React;

// Easing: smooth out — cubic
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

// Respect the user's reduced-motion preference. Live-evaluated so it reacts if
// the OS setting changes mid-session. Exposed globally so every chart/animation
// in the other files can short-circuit to its final state instead of animating.
const __rmq = (typeof window !== "undefined" && window.matchMedia)
  ? window.matchMedia("(prefers-reduced-motion: reduce)")
  : { matches: false, addEventListener() {} };
function prefersReducedMotion() { return __rmq.matches; }
window.prefersReducedMotion = prefersReducedMotion;

function useInView(opts = {}) {
  const ref = useAR(null);
  const [inView, setInView] = useAS(false);
  const seen = useAR(false);

  useAE(() => {
    if (!ref.current) return;
    if (seen.current) return; // once-only
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting && !seen.current) {
          seen.current = true;
          setInView(true);
          io.disconnect();
        }
      }
    }, { threshold: opts.threshold ?? 0.18, rootMargin: opts.rootMargin ?? "0px 0px -8% 0px" });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  return [ref, inView];
}

function useCountUp(target, opts = {}) {
  const { duration = 1400, decimals = 0, start = 0, delay = 0 } = opts;
  const [ref, inView] = useInView(opts);
  const [value, setValue] = useAS(start);
  const targetRef = useAR(target);
  targetRef.current = target;

  useAE(() => {
    if (!inView) return;
    if (prefersReducedMotion()) { setValue(targetRef.current); return; }
    let rafId, started = null;
    const tick = (t) => {
      if (started === null) started = t;
      const elapsed = t - started - delay;
      if (elapsed < 0) { rafId = requestAnimationFrame(tick); return; }
      const k = Math.min(1, elapsed / duration);
      const eased = easeOutQuart(k);
      const v = start + (targetRef.current - start) * eased;
      setValue(v);
      if (k < 1) rafId = requestAnimationFrame(tick);
      else setValue(targetRef.current);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [inView]);

  // also re-animate from current value to target when target changes after animation
  useAE(() => {
    if (!inView) return;
    if (prefersReducedMotion()) { setValue(target); return; }
    let rafId, started = null;
    const from = value;
    const dest = target;
    const tick = (t) => {
      if (started === null) started = t;
      const k = Math.min(1, (t - started) / 500);
      setValue(from + (dest - from) * easeOutCubic(k));
      if (k < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target]); // eslint-disable-line

  const fixed = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
  return { ref, value, display: fixed, inView };
}

// Inline number element that counts up when in view.
// `format` lets you wrap (e.g. for currency, units, locale separators).
function CountUp({ value, decimals = 0, duration = 1400, format, prefix = "", suffix = "", className, style, locale = "en-IN", as: As = "span" }) {
  const { ref, value: v, display } = useCountUp(value, { decimals, duration });
  let out;
  if (format) out = format(v);
  else if (decimals > 0) out = v.toFixed(decimals);
  else out = Math.round(v).toLocaleString(locale);
  return <As ref={ref} className={className} style={style}>{prefix}{out}{suffix}</As>;
}

// Animated <rect> for SVG bar charts.
//   axis="y" (default): height grows 0→h, anchored at the bottom (vertical bars).
//   axis="x": width grows 0→w, anchored at the left (horizontal bars).
function AnimatedRect({ x, y, width, height, axis = "y", duration = 900, delay = 0, ...rest }) {
  const [ref, inView] = useInView({ threshold: 0.05 });
  const grows = axis === "x" ? width : height;
  const [size, setSize] = useAS(0);

  useAE(() => {
    if (!inView) return;
    if (prefersReducedMotion()) { setSize(grows); return; }
    let raf, started = null;
    const tick = (t) => {
      if (started === null) started = t;
      const elapsed = t - started - delay;
      if (elapsed < 0) { raf = requestAnimationFrame(tick); return; }
      const k = Math.min(1, elapsed / duration);
      setSize(easeOutCubic(k) * grows);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, grows]);

  if (axis === "x") {
    return <rect ref={ref} x={x} y={y} width={size} height={height} {...rest}/>;
  }
  return <rect ref={ref} x={x} y={y + (height - size)} width={width} height={size} {...rest}/>;
}

// CSS-driven bar grow for div-based bars. Adds class "in-view" once visible.
function useInViewClass(opts = {}) {
  const [ref, inView] = useInView(opts);
  return [ref, inView ? "in-view" : ""];
}

// Hook to fire a one-shot pulse class on a container when it enters view
function useChartReveal(opts = {}) {
  const [ref, inView] = useInView(opts);
  return [ref, inView];
}

Object.assign(window, {
  useInView, useCountUp, CountUp, AnimatedRect, useInViewClass, useChartReveal,
  easeOutCubic, easeOutQuart,
});
