export default function OfflinePage() {
  return <main className="stagePage offlinePage">
    <section className="stageCard offlineCard">
      <span className="eyebrow">OFFLINE MODE</span>
      <h1>You’re currently offline.</h1>
      <p>The CPD Hub has paused cloud saves, live-session participation and Supabase-backed records until your connection returns.</p>
      <div className="stageList">
        <div className="stageRow"><div className="stageRowMain"><strong>Safe behaviour</strong><span>No new reflection, progress or attendance data is treated as saved while offline.</span></div></div>
        <div className="stageRow"><div className="stageRowMain"><strong>Installed app shell</strong><span>Previously cached static app assets can still load where available.</span></div></div>
        <div className="stageRow"><div className="stageRowMain"><strong>Resume normally</strong><span>Reconnect, then return to the page you were using and continue.</span></div></div>
      </div>
      <div className="stageHeroActions"><a className="primary phaseLinkButton" href="/">Try CPD Hub</a><a className="secondary phaseLinkButton" href="/accessibility">Accessibility settings</a></div>
    </section>
  </main>;
}
