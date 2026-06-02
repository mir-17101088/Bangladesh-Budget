function PriceApp() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  return (
    <>
      <Nav active="Price Impact"/>
      <PriceHero/>
      <ItemSection kind="up" items={PRICIER}/>
      <ItemSection kind="down" items={CHEAPER}/>
      <TaxSection/>
      <SubsidySection/>
      <CalcSection/>
      <Footer/>

      <TweaksPanel title="Tweaks">
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

const priceRoot = ReactDOM.createRoot(document.getElementById("root"));
priceRoot.render(<PriceApp/>);
requestAnimationFrame(() => requestAnimationFrame(() => window.dispatchEvent(new Event("app:ready"))));
