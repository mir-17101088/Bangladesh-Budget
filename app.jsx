function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  return (
    <>
      <Nav active={tweaks.activeNav}/>
      {PRELAUNCH ? <PreLaunchHero/> : <Hero tweaks={tweaks}/>}
      <TakaSection/>
      <GDPSection/>
      <Treemap/>
      <DebtSection/>
      <NewsSection/>
      <Footer/>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Hero">
          <TweakText label="Main number" value={tweaks.heroNumber} onChange={v => setTweak("heroNumber", v)}/>
          <TweakText label="Unit" value={tweaks.heroUnit} onChange={v => setTweak("heroUnit", v)}/>
          <TweakText label="Delta badge" value={tweaks.heroDelta} onChange={v => setTweak("heroDelta", v)}/>
          <TweakToggle label="Show stats strip" value={tweaks.showStrip} onChange={v => setTweak("showStrip", v)}/>
        </TweakSection>
        <TweakSection label="Navigation">
          <TweakRadio label="Active page"
            value={tweaks.activeNav}
            options={["Home", "Sector Deep Dive", "Price Impact"]}
            onChange={v => setTweak("activeNav", v)}/>
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App/>);
requestAnimationFrame(() => requestAnimationFrame(() => window.dispatchEvent(new Event("app:ready"))));
