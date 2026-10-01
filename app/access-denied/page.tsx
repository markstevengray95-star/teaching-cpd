export default function AccessDeniedPage() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f5f7fb", color: "#172033", fontFamily: "system-ui" }}>
      <section style={{ width: "min(640px, 100%)", padding: 32, borderRadius: 24, background: "white", border: "1px solid #e1e5ed", boxShadow: "0 20px 55px rgba(31,45,72,.10)" }}>
        <span style={{ display: "inline-flex", padding: "6px 9px", borderRadius: 999, background: "#fff1e7", color: "#9a4a18", fontSize: 11, fontWeight: 900, letterSpacing: ".1em" }}>ACCESS CONTROL</span>
        <h1 style={{ margin: "16px 0 10px", fontSize: 34, letterSpacing: "-.035em" }}>You don’t have access to this area</h1>
        <p style={{ margin: 0, color: "#667084", lineHeight: 1.65 }}>Your signed-in school role does not include the permission required for this page. Changing the “Preview as” selector does not change your account permissions.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 24 }}>
          <a href="/dashboard" style={{ padding: "11px 15px", borderRadius: 11, background: "#172033", color: "white", textDecoration: "none", fontWeight: 800, fontSize: 13 }}>Return to dashboard</a>
          <a href="/develop" style={{ padding: "11px 15px", borderRadius: 11, border: "1px solid #d9deea", color: "#33405a", textDecoration: "none", fontWeight: 800, fontSize: 13 }}>Open my development</a>
        </div>
      </section>
    </main>
  );
}
