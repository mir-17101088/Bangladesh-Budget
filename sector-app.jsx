function SectorApp() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [active, setActive] = React.useState("defence");

  // Center the bar chart in the viewport whenever the sector changes (not on first mount)
  const expandRef = React.useRef(null);
  const didMount = React.useRef(false);
  React.useEffect(() => {
    if (!didMount.current) { didMount.current = true; return; }
    // Two frames so the new sector's chart has fully laid out (its aspect-ratio
    // height is resolved) before we measure — a single frame can read a
    // pre-layout height and under-scroll, forcing a manual nudge.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!expandRef.current) return;
      const chart  = expandRef.current.querySelector(".see-chart");
      const legend = expandRef.current.querySelector(".see-legend");
      if (!chart) return;
      const navH = 76; // sticky nav (68) + a little breathing room
      const vh = window.innerHeight;
      // Reveal the whole chart AND its legend — users read them as one unit.
      const top    = chart.getBoundingClientRect().top + window.scrollY;
      const bottom = (legend || chart).getBoundingClientRect().bottom + window.scrollY;
      const regionH = bottom - top;
      const avail = vh - navH;
      let targetTop;
      if (regionH <= avail) {
        // Fits below the nav — centre it so symmetric margins absorb any
        // sub-pixel/scrollbar rounding (the old zero-margin bottom anchor
        // clipped the legend and forced a manual nudge-scroll).
        targetTop = top - navH - (avail - regionH) / 2;
      } else {
        // Taller than the viewport — pin the chart top just under the nav.
        targetTop = top - navH - 8;
      }
      window.scrollTo({ top: Math.max(0, targetTop), behavior: prefersReducedMotion() ? "auto" : "smooth" });
    }));
  }, [active]);

  return (
    <>
      <Nav active="Sector Deep Dive"/>
      <SectorHero/>
      <SectorGridSection active={active} setActive={setActive}/>
      <div ref={expandRef}><ExpandedSection active={active}/></div>
      <HeatmapSection/>
      <RankingsSection/>
      <GaugesSection/>
      <Footer/>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Expanded sector">
          <TweakSelect label="Active sector"
            value={active}
            options={SECTORS.map(s => s.k)}
            onChange={v => setActive(v)}/>
        </TweakSection>
        <TweakSection label="Navigation">
          <TweakRadio label="Active page"
            value={tweaks.activeNav}
            options={["Home", "Price Impact", "Sector Deep Dive"]}
            onChange={v => setTweak("activeNav", v)}/>
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

const sectorRoot = ReactDOM.createRoot(document.getElementById("root"));
sectorRoot.render(<SectorApp/>);
requestAnimationFrame(() => requestAnimationFrame(() => window.dispatchEvent(new Event("app:ready"))));
