function PriceApp() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  return (
    <>
      <Nav active="Budget Realities"/>
      <PriceHero/>
      <BudgetGdpRatioSection/>
      <TaxRevenueRatioSection/>
      <GaugesSection/>
      <DevOpGapSection/>
      <DebtSection/>
      <SubsidySection/>
      <Footer/>

      <TweaksPanel title="Tweaks">
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

const priceRoot = ReactDOM.createRoot(document.getElementById("root"));
priceRoot.render(<PriceApp/>);
requestAnimationFrame(() => requestAnimationFrame(() => window.dispatchEvent(new Event("app:ready"))));
