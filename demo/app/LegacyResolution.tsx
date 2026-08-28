import { FUJI, type LegacyResolutionResult } from "@/lib/workbench";
import { shortenHex } from "@/lib/presentation.mjs";
import { ProvenanceLabel } from "./WorkbenchBits";

export function LegacyResolution({ loading, results }: { loading: boolean; results: readonly LegacyResolutionResult[] }) {
  return (
    <details className="legacy-proof">
      <summary>Historical schema 0 evidence</summary>
      <section aria-labelledby="legacy-proof-title">
      <div className="result-section-heading">
        <div>
          <p className="micro-label">FUJI REGISTRY LOOKUP</p>
          <h4 id="legacy-proof-title">Legacy builder record</h4>
        </div>
        <ProvenanceLabel tone="warning">prototype ABI</ProvenanceLabel>
      </div>
      <p className="legacy-note">
        Schema 0 carries only public builder codes. This lookup uses AVAX Impact’s Fuji-only
        <code> resolveLegacyBuilder</code> extension—not the pinned <code>ICodeRegistry</code> ABI.
      </p>
      {loading ? <p className="inline-status" role="status">Resolving against the pinned Fuji registry…</p> : null}
      {!loading && results.map((item) => (
        <article className="registry-record" key={item.code}>
          <div className="registry-record__top">
            <strong>{item.code}</strong>
            {item.resolution?.status === "registered-active" ? <ProvenanceLabel tone="safe">active record</ProvenanceLabel> : null}
            {item.resolution?.status === "registered-inactive" ? <ProvenanceLabel tone="warning">inactive record</ProvenanceLabel> : null}
            {item.resolution?.status === "unregistered" ? <ProvenanceLabel tone="warning">unregistered</ProvenanceLabel> : null}
            {item.error ? <ProvenanceLabel tone="warning">lookup unavailable</ProvenanceLabel> : null}
          </div>
          {item.resolution && "record" in item.resolution ? (
            <dl className="record-grid">
              <div><dt>Owner</dt><dd title={item.resolution.record.owner}>{shortenHex(item.resolution.record.owner)}</dd></div>
              <div><dt>Payout</dt><dd title={item.resolution.record.payoutAddress}>{shortenHex(item.resolution.record.payoutAddress)}</dd></div>
              <div><dt>Metadata</dt><dd>{item.resolution.record.metadataURI || "Not set"}</dd></div>
            </dl>
          ) : null}
          {item.error ? <p className="record-error">Registry proof could not be retrieved: {item.error}</p> : null}
        </article>
      ))}
      <a className="text-link" href={`${FUJI.explorerUrl}/address/${FUJI.historicalRegistryAddress}`} target="_blank" rel="noreferrer">
        Historical registry {shortenHex(FUJI.historicalRegistryAddress)} <span aria-hidden="true">↗</span>
      </a>
      </section>
    </details>
  );
}
