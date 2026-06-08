function SectorApp() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [active, setActive] = React.useState("defence");

  // Center the bar chart in the viewport whenever the sector changes (not on first mount)
  const expandRef = React.useRef(null);
  const didMount = React.useRef(false);
  const scrollToChart = React.useCallback(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!expandRef.current) return;
      const chart  = expandRef.current.querySelector(".see-chart");
      const legend = expandRef.current.querySelector(".see-legend");
      if (!chart) return;
      const navH = 76; // sticky nav (68) + a little breathing room
      const vh = window.innerHeight;
      const top    = chart.getBoundingClientRect().top + window.scrollY;
      const bottom = (legend || chart).getBoundingClientRect().bottom + window.scrollY;
      const regionH = bottom - top;
      const avail = vh - navH;
      let targetTop;
      if (regionH <= avail) {
        targetTop = top - navH - (avail - regionH) / 2;
      } else {
        targetTop = top - navH - 8;
      }
      window.scrollTo({ top: Math.max(0, targetTop), behavior: prefersReducedMotion() ? "auto" : "smooth" });
    }));
  }, []);

  React.useEffect(() => {
    if (!didMount.current) { didMount.current = true; return; }
    scrollToChart();
  }, [active, scrollToChart]);

  const handleSetActive = React.useCallback((k) => {
    if (active === k) {
      scrollToChart();
    } else {
      setActive(k);
    }
  }, [active, scrollToChart]);

  return (
    <>
      <Nav active="Sector Deep Dive"/>
      <SectorHero setActive={handleSetActive}/>
      <SectorGridSection active={active} setActive={handleSetActive}/>
      <div ref={expandRef}><ExpandedSection active={active}/></div>
      <HeatmapSection/>
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
            options={["Home", "Sector Deep Dive", "Budget Realities"]}
            onChange={v => setTweak("activeNav", v)}/>
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

const sectorRoot = ReactDOM.createRoot(document.getElementById("root"));
sectorRoot.render(<SectorApp/>);
requestAnimationFrame(() => requestAnimationFrame(() => window.dispatchEvent(new Event("app:ready"))));
