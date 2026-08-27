import { InspectPanel } from "./InspectPanel";
import { PreflightPanel } from "./PreflightPanel";
import { ProvenanceLabel } from "./WorkbenchBits";

const REPOSITORY_URL = "https://github.com/0xArayy/avax-impact";

export function DecoderDemo() {
  return (
    <main id="main-content">
      <a className="skip-link" href="#workbench">Skip to workbench</a>
      <div className="ambient-grid" aria-hidden="true" />
      <header className="site-header shell">
        <a className="brand" href="#top" aria-label="AVAX Impact workbench home">
          <span className="brand-mark" aria-hidden="true">A</span>
          <span>AVAX Impact</span>
          <small>Builder Attribution SDK</small>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#inspect">Inspect</a>
          <a href="#preflight">Preflight</a>
          <a href="https://github.com/0xArayy/avax-impact/blob/main/docs/attribution-format.md" target="_blank" rel="noreferrer">Protocol docs</a>
          <a className="nav-cta" href={REPOSITORY_URL} target="_blank" rel="noreferrer">Source ↗</a>
        </nav>
      </header>

      <section className="hero shell" id="top">
        <div className="hero__status">
          <span className="live-dot" aria-hidden="true" />
          <span>Live Fuji explorer and preflight</span>
          <span className="hero__chain">C-Chain · 43113</span>
        </div>
        <h1>Know what the transaction <em>declares</em> before you trust it.</h1>
        <div className="hero__footer">
          <p>
            Inspect AVAX Impact attribution and compare original and attributed calls—using the shared SDK,
            a pinned Fuji network, and no signing surface.
          </p>
          <div className="hero__provenance" aria-label="Workbench guarantees">
            <ProvenanceLabel tone="safe">Fuji only</ProvenanceLabel>
            <ProvenanceLabel>public data</ProvenanceLabel>
            <ProvenanceLabel>zero private keys</ProvenanceLabel>
          </div>
        </div>
      </section>

      <section className="trust-rail" aria-label="Trust and provenance summary">
        <div className="shell trust-rail__grid">
          <div><span>Network scope</span><strong>Avalanche Fuji only</strong></div>
          <div><span>Decode source</span><strong>@avax-impact/sdk</strong></div>
          <div><span>Default format</span><strong>Schema 1 · pinned ERC-8021 draft</strong></div>
          <div><span>Security meaning</span><strong>Metadata, never authorization</strong></div>
        </div>
      </section>

      <div className="workbench shell" id="workbench">
        <div id="inspect"><InspectPanel /></div>
        <div className="connector" aria-hidden="true"><span>inspect</span><i /><span>preflight</span></div>
        <div id="preflight"><PreflightPanel /></div>
      </div>

      <section className="trust-boundary shell" aria-labelledby="trust-title">
        <div>
          <p className="step-label">READ THIS FIRST</p>
          <h2 id="trust-title">Declared metadata.<br />Not cryptographic provenance.</h2>
        </div>
        <div className="trust-boundary__copy">
          <p>Builder codes and attribution suffixes are public and copyable. A successful decode or registry lookup does not prove authorship, authorization, endorsement, or payment eligibility.</p>
          <ul>
            <li><span aria-hidden="true">✓</span> Use it for analytics and ecosystem attribution.</li>
            <li><span aria-hidden="true">×</span> Do not use it for access control or security decisions.</li>
          </ul>
        </div>
      </section>

      <footer className="shell">
        <div><span className="brand-mark" aria-hidden="true">A</span><span>AVAX Impact · open attribution infrastructure</span></div>
        <p>Live Fuji evidence · No wallet connection · No transaction submission</p>
        <a href={REPOSITORY_URL} target="_blank" rel="noreferrer">GitHub ↗</a>
      </footer>
    </main>
  );
}
